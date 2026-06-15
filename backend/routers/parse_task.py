from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from schemas.parse_task import (
    ParseTaskStatusResponse,
    ParseTaskListResponse,
    BoolResponse,
)
from services.parse_task_service import (
    get_parse_task,
    list_parse_tasks,
    delete_parse_task,
)
from core.deps import get_required_user
from models.user import User

router = APIRouter(prefix="/api/parse-tasks", tags=["parse-tasks"])


@router.get("/{task_id}", response_model=ParseTaskStatusResponse)
async def get_task(task_id: str, user: User = Depends(get_required_user)):
    """查询任务状态"""
    data = await get_parse_task(task_id)
    if not data:
        raise HTTPException(status_code=404, detail="任务不存在")
    if user.role != "admin" and data["username"] != user.username:
        raise HTTPException(status_code=404, detail="任务不存在")
    return {"code": 200, "data": data, "message": "success"}


@router.get("", response_model=ParseTaskListResponse)
async def list_tasks(
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_required_user),
):
    """查询任务列表 (按当前用户筛选)"""
    data = await list_parse_tasks(
        username=user.username,
        status=status,
        limit=limit,
        offset=offset,
    )
    return {"code": 200, "data": data, "message": "success"}


@router.delete("/{task_id}", response_model=BoolResponse)
async def delete_task(task_id: str, user: User = Depends(get_required_user)):
    """删除任务"""
    data = await get_parse_task(task_id)
    if not data:
        raise HTTPException(status_code=404, detail="任务不存在")
    if user.role != "admin" and data["username"] != user.username:
        raise HTTPException(status_code=404, detail="任务不存在")
    if data["status"] == "processing":
        raise HTTPException(status_code=400, detail="无法删除正在处理中的任务")

    await delete_parse_task(task_id)
    return {"code": 200, "data": True, "message": "任务已删除"}
