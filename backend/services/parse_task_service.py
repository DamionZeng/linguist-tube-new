"""
Parse Task Service - 直接操作数据库 (查询/列表/删除)。
提交和重试由前端直接调用 video-parser-api，不经过主后端。
"""

import json
import logging
from typing import Optional

from sqlalchemy import select, func

from core.database import _get_async_session
from models.parse_task import ParseTask

logger = logging.getLogger(__name__)


def _task_to_dict(task: ParseTask) -> dict:
    """将 ParseTask ORM 对象转为字典"""
    data = {
        "task_id": task.id,
        "username": task.username,
        "youtube_url": task.youtube_url,
        "download": task.download,
        "quality": task.quality,
        "status": task.status,
        "progress": task.progress,
        "current_step": task.current_step or 0,
        "video_id": task.video_id,
        "error": task.error,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "started_at": task.started_at.isoformat() if task.started_at else None,
        "finished_at": task.finished_at.isoformat() if task.finished_at else None,
    }
    if task.result_json:
        try:
            data["result"] = json.loads(task.result_json)
        except json.JSONDecodeError:
            data["result"] = None
    return data


async def get_parse_task(task_id: str) -> Optional[dict]:
    """查询单个任务"""
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(ParseTask).where(ParseTask.id == task_id)
        )
        task = result.scalar_one_or_none()
        if not task:
            return None
        return _task_to_dict(task)


async def list_parse_tasks(username: str, status: Optional[str] = None, limit: int = 20, offset: int = 0) -> dict:
    """查询任务列表 (按用户筛选)，pending 任务附带队列位置"""
    session_factory = _get_async_session()
    async with session_factory() as session:
        query = select(ParseTask).where(ParseTask.username == username).order_by(ParseTask.created_at.desc())
        count_query = select(func.count(ParseTask.id)).where(ParseTask.username == username)

        if status:
            # 支持逗号分隔的多状态筛选，如 "pending,processing"
            status_list = [s.strip() for s in status.split(",")]
            if len(status_list) == 1:
                query = query.where(ParseTask.status == status_list[0])
                count_query = count_query.where(ParseTask.status == status_list[0])
            else:
                query = query.where(ParseTask.status.in_(status_list))
                count_query = count_query.where(ParseTask.status.in_(status_list))

        total_result = await session.execute(count_query)
        total = total_result.scalar() or 0

        result = await session.execute(query.offset(offset).limit(limit))
        tasks = result.scalars().all()

        # 计算队列位置：仅 pending 任务，前面有多少个 pending 任务（不含 processing，因为 processing 已在执行）
        pending_task_ids = [t.id for t in tasks if t.status == "pending"]
        queue_map: dict[str, int] = {}
        if pending_task_ids:
            # 查询该用户所有 pending 任务，按 created_at 排序
            queue_query = (
                select(ParseTask.id, ParseTask.created_at)
                .where(ParseTask.username == username, ParseTask.status == "pending")
                .order_by(ParseTask.created_at.asc())
            )
            queue_result = await session.execute(queue_query)
            queue_rows = queue_result.all()
            for idx, (tid, _) in enumerate(queue_rows):
                if tid in pending_task_ids:
                    queue_map[tid] = idx

    items = []
    for t in tasks:
        d = _task_to_dict(t)
        d["queue_position"] = queue_map.get(t.id)
        items.append(d)
    return {"total": total, "items": items}


async def delete_parse_task(task_id: str) -> bool:
    """删除任务"""
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(ParseTask).where(ParseTask.id == task_id)
        )
        task = result.scalar_one_or_none()
        if not task:
            return False
        await session.delete(task)
        await session.commit()
        return True
