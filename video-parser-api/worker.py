"""
任务队列 Worker。

后台单线程顺序处理 parse_tasks 表中 status=pending 的任务。
支持断点续传：失败重试时从上次失败的步骤继续。
"""

import asyncio
import json
import logging
import traceback
from datetime import datetime
from typing import Optional

from sqlalchemy import select, update

from database import _get_async_session
from models import ParseTask
from service import parse_and_import

logger = logging.getLogger(__name__)

# 轮询间隔 (秒)
POLL_INTERVAL = 2

_worker_running = False


async def start_worker():
    """启动后台 Worker，持续轮询处理任务"""
    global _worker_running
    if _worker_running:
        logger.warning("Worker 已在运行，跳过重复启动")
        return
    _worker_running = True
    logger.info("任务队列 Worker 已启动")
    asyncio.create_task(_worker_loop())


async def stop_worker():
    """停止 Worker"""
    global _worker_running
    _worker_running = False
    logger.info("任务队列 Worker 已停止")


async def _worker_loop():
    """Worker 主循环：轮询 pending 任务并顺序执行"""
    while _worker_running:
        try:
            task = await _fetch_next_pending_task()
            if task:
                await _process_task(task)
            else:
                await asyncio.sleep(POLL_INTERVAL)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Worker 异常: {e}", exc_info=True)
            await asyncio.sleep(POLL_INTERVAL)


async def _fetch_next_pending_task() -> ParseTask | None:
    """获取下一个 pending 任务 (按 created_at 排序)"""
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(ParseTask)
            .where(ParseTask.status == "pending")
            .order_by(ParseTask.created_at.asc())
            .limit(1)
        )
        return result.scalar_one_or_none()


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

    session_factory = _get_async_session()

    # 标记为 processing
    async with session_factory() as session:
        await session.execute(
            update(ParseTask)
            .where(ParseTask.id == task_id)
            .values(
                status="processing",
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


async def update_task_progress(task_id: str, progress: str, step: int = 0, step_data: Optional[dict] = None):
    """更新任务进度和步骤数据 (供 service.py 调用)"""
    session_factory = _get_async_session()
    async with session_factory() as session:
        values = {"progress": progress}
        if step > 0:
            values["current_step"] = step
        if step_data is not None:
            # 序列化时处理不可 JSON 化的类型
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


from typing import Optional
