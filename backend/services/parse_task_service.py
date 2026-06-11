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
    """查询任务列表 (按用户筛选)"""
    session_factory = _get_async_session()
    async with session_factory() as session:
        query = select(ParseTask).where(ParseTask.username == username).order_by(ParseTask.created_at.desc())
        count_query = select(func.count(ParseTask.id)).where(ParseTask.username == username)

        if status:
            query = query.where(ParseTask.status == status)
            count_query = count_query.where(ParseTask.status == status)

        total_result = await session.execute(count_query)
        total = total_result.scalar() or 0

        result = await session.execute(query.offset(offset).limit(limit))
        tasks = result.scalars().all()

    items = [_task_to_dict(t) for t in tasks]
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
