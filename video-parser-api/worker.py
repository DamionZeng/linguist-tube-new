"""
任务队列 Worker — 可靠的异步任务调度器。

特性:
  - 启动时恢复孤儿任务 (processing 但心跳超时 → pending)
  - 独立超时监控 (Worker 内部定时检查，不依赖前端轮询)
  - 心跳机制 (heartbeat_at)，精准判断 Worker 是否存活
  - 原子任务抢占 (SELECT ... FOR UPDATE SKIP LOCKED)
  - 可配置并发数 (max_concurrent_tasks，默认 1)
  - 支持断点续传
"""

import asyncio
import json
import logging
import traceback
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select, update, or_

from config import get_settings
from database import _get_async_session
from models import ParseTask
from service import parse_and_import

logger = logging.getLogger(__name__)

POLL_INTERVAL = 2  # 无任务时轮询间隔 (秒)
TIMEOUT_CHECK_INTERVAL = 30  # 超时检查间隔 (秒)

_worker_running = False
_processing_tasks: set[str] = set()  # 当前 Worker 实例正在处理的任务 ID


# ═══════════════════════════════════════════════════
#  公开 API
# ═══════════════════════════════════════════════════

async def start_worker():
    """启动后台 Worker。

    启动流程:
      1. 恢复孤儿任务 (上一次异常退出遗留的 processing 任务)
      2. 启动独立超时监控协程
      3. 启动心跳更新协程
      4. 启动 N 个 Worker 协程 (N = max_concurrent_tasks)
    """
    global _worker_running
    if _worker_running:
        logger.warning("Worker 已在运行，跳过重复启动")
        return
    _worker_running = True

    settings = get_settings()
    max_concurrent = max(settings.max_concurrent_tasks, 1)

    # 1. 恢复孤儿任务
    await _recover_orphans()

    # 2. 独立超时监控
    asyncio.create_task(_timeout_monitor())

    # 3. 心跳更新
    asyncio.create_task(_heartbeat_updater())

    # 4. 启动 Worker 协程
    for i in range(max_concurrent):
        asyncio.create_task(_worker_loop(i))

    logger.info(f"Worker 已启动 (max_concurrent={max_concurrent}, timeout={settings.task_timeout_minutes}min)")


async def stop_worker():
    """停止 Worker"""
    global _worker_running
    _worker_running = False
    logger.info("Worker 已停止")


async def update_task_progress(task_id: str, progress: str, step: int = 0, step_data: Optional[dict] = None):
    """更新任务进度和步骤数据 (供 service.py 调用)"""
    session_factory = _get_async_session()
    async with session_factory() as session:
        values = {"progress": progress}
        if step > 0:
            values["current_step"] = step
        if step_data is not None:
            try:
                values["step_data"] = json.dumps(step_data, ensure_ascii=False, default=str)
            except (TypeError, ValueError):
                pass
        await session.execute(
            update(ParseTask)
            .where(ParseTask.id == task_id)
            .values(**values)
        )
        await session.commit()


# ═══════════════════════════════════════════════════
#  启动恢复
# ═══════════════════════════════════════════════════

async def _recover_orphans():
    """启动时恢复孤儿任务 — 将心跳超时的 processing 任务重置为 pending"""
    settings = get_settings()
    threshold = datetime.utcnow() - timedelta(minutes=settings.task_timeout_minutes)

    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(ParseTask.id)
            .where(
                ParseTask.status == "processing",
                or_(
                    ParseTask.heartbeat_at < threshold,
                    ParseTask.heartbeat_at == None,
                ),
            )
        )
        orphan_ids = [row[0] for row in result.all()]

        if orphan_ids:
            for oid in orphan_ids:
                logger.warning(f"[Task:{oid}] 孤儿任务恢复 → pending")
                await session.execute(
                    update(ParseTask)
                    .where(ParseTask.id == oid)
                    .values(
                        status="pending",
                        progress="等待处理...",
                        error=None,
                        heartbeat_at=None,
                    )
                )
            await session.commit()
            logger.info(f"启动恢复完成: {len(orphan_ids)} 个孤儿任务 → pending")


# ═══════════════════════════════════════════════════
#  独立超时监控
# ═══════════════════════════════════════════════════

async def _timeout_monitor():
    """独立的后台超时监控 — 每 30 秒检查一次，将心跳超时的 processing 任务标记为失败"""
    while _worker_running:
        try:
            await _check_timeout_tasks()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"超时监控异常: {e}", exc_info=True)
        await asyncio.sleep(TIMEOUT_CHECK_INTERVAL)


async def _check_timeout_tasks():
    """标记心跳超时的 processing 任务为失败"""
    settings = get_settings()
    threshold = datetime.utcnow() - timedelta(minutes=settings.task_timeout_minutes)

    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(ParseTask.id)
            .where(
                ParseTask.status == "processing",
                or_(
                    ParseTask.heartbeat_at < threshold,
                    ParseTask.heartbeat_at == None,
                ),
            )
        )
        timed_out_ids = [row[0] for row in result.all()]

        if timed_out_ids:
            for tid in timed_out_ids:
                logger.warning(f"[Task:{tid}] 心跳超时 ({settings.task_timeout_minutes}min) → failed")
                await session.execute(
                    update(ParseTask)
                    .where(ParseTask.id == tid)
                    .values(
                        status="failed",
                        progress="超时",
                        error=f"Worker 心跳超时 (>{settings.task_timeout_minutes}分钟)，自动标记失败",
                        finished_at=datetime.utcnow(),
                    )
                )
            await session.commit()


# ═══════════════════════════════════════════════════
#  心跳更新
# ═══════════════════════════════════════════════════

async def _heartbeat_updater():
    """定期更新所有正在处理任务的 heartbeat_at，证明 Worker 存活"""
    settings = get_settings()
    while _worker_running:
        try:
            if _processing_tasks:
                session_factory = _get_async_session()
                async with session_factory() as session:
                    await session.execute(
                        update(ParseTask)
                        .where(ParseTask.id.in_(_processing_tasks))
                        .values(heartbeat_at=datetime.utcnow())
                    )
                    await session.commit()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"心跳更新异常: {e}", exc_info=True)
        await asyncio.sleep(settings.heartbeat_interval)


# ═══════════════════════════════════════════════════
#  Worker 协程
# ═══════════════════════════════════════════════════

async def _worker_loop(worker_id: int):
    """Worker 主循环 — 持续从队列抢占任务并处理"""
    logger.info(f"Worker-{worker_id} 启动")
    while _worker_running:
        try:
            task_id = await _claim_next_pending_task()
            if task_id:
                _processing_tasks.add(task_id)
                try:
                    session_factory = _get_async_session()
                    async with session_factory() as session:
                        result = await session.execute(
                            select(ParseTask).where(ParseTask.id == task_id)
                        )
                        task = result.scalar_one()
                    await _process_task(task)
                finally:
                    _processing_tasks.discard(task_id)
            else:
                # 没有待处理任务，等待后重试
                await asyncio.sleep(POLL_INTERVAL)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Worker-{worker_id} 异常: {e}", exc_info=True)
            await asyncio.sleep(POLL_INTERVAL)
    logger.info(f"Worker-{worker_id} 已停止")


async def _claim_next_pending_task() -> int | None:
    """原子抢占 — SELECT ... FOR UPDATE SKIP LOCKED 确保多 Worker 不冲突"""
    session_factory = _get_async_session()
    async with session_factory() as session:
        async with session.begin():
            # FOR UPDATE SKIP LOCKED: 锁定行 + 跳过已被其他事务锁定的行
            result = await session.execute(
                select(ParseTask.id)
                .where(ParseTask.status == "pending")
                .order_by(ParseTask.created_at.asc())
                .limit(1)
                .with_for_update(skip_locked=True)
            )
            row = result.scalar_one_or_none()
            if not row:
                return None

            target_id = row
            now = datetime.utcnow()
            await session.execute(
                update(ParseTask)
                .where(ParseTask.id == target_id)
                .values(
                    status="processing",
                    started_at=now,
                    heartbeat_at=now,
                )
            )
        # session.begin() 退出时自动 commit，释放行锁
        return target_id


# ═══════════════════════════════════════════════════
#  任务处理
# ═══════════════════════════════════════════════════

async def _process_task(task: ParseTask):
    """处理单个任务，支持断点续传"""
    task_id = task.id
    logger.info(f"[Task:{task_id}] 开始处理 - {task.youtube_url}")

    # 解析断点续传数据
    resume_step = task.current_step or 0
    cached_data = None
    if task.step_data:
        try:
            cached_data = json.loads(task.step_data)
        except json.JSONDecodeError:
            cached_data = None

    if resume_step > 0 and cached_data:
        logger.info(f"[Task:{task_id}] 断点续传: 从 Step {resume_step} 继续")

    # 更新进度文字 (status 已在 claim 时设为 processing)
    session_factory = _get_async_session()
    async with session_factory() as session:
        await session.execute(
            update(ParseTask)
            .where(ParseTask.id == task_id)
            .values(
                progress="初始化..." if resume_step == 0 else f"从 Step {resume_step} 继续...",
                started_at=datetime.utcnow() if resume_step == 0 else task.started_at,
            )
        )
        await session.commit()

    try:
        # 执行解析 (内部会更新 progress 和 step_data)
        result = await parse_and_import(
            youtube_url=task.youtube_url,
            download=task.download,
            quality=task.quality,
            task_id=task_id,
            resume_step=resume_step,
            cached_data=cached_data,
        )

        # 标记为 completed
        async with session_factory() as session:
            await session.execute(
                update(ParseTask)
                .where(ParseTask.id == task_id)
                .values(
                    status="completed",
                    progress="完成",
                    current_step=8,
                    video_id=result.get("video_id"),
                    result_json=json.dumps(result, ensure_ascii=False),
                    finished_at=datetime.utcnow(),
                )
            )
            await session.commit()

        logger.info(f"[Task:{task_id}] 处理完成 - video_id={result.get('video_id')}")

    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        logger.error(f"[Task:{task_id}] 处理失败: {error_msg}", exc_info=True)

        async with session_factory() as session:
            await session.execute(
                update(ParseTask)
                .where(ParseTask.id == task_id)
                .values(
                    status="failed",
                    progress="失败",
                    error=error_msg,
                    finished_at=datetime.utcnow(),
                )
            )
            await session.commit()
