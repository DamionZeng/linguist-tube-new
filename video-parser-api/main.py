"""
Video Parser API - 独立的 YouTube 视频解析 API

仅保留:
  - POST /api/tasks        提交任务
  - POST /api/tasks/{id}/retry  重试任务 (断点续传)
  - GET  /api/health       健康检查

查询/列表/删除由主后端直接操作数据库，不经过此 API。
"""

import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select

from database import init_db, dispose_engine, _get_async_session
from models import ParseTask
from worker import start_worker, stop_worker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("初始化数据库...")
    await init_db()
    logger.info("启动后台 Worker...")
    await start_worker()
    yield
    logger.info("停止后台 Worker...")
    await stop_worker()
    logger.info("关闭数据库连接...")
    await dispose_engine()


app = FastAPI(
    title="Video Parser API",
    description="YouTube 视频解析 API - 任务队列模式，后台顺序处理，支持断点续传",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────  请求/响应模型  ─────────────────────

class TaskSubmitRequest(BaseModel):
    url: str = Field(..., description="YouTube 视频 URL")
    username: str = Field(..., description="提交用户名")
    download: bool = Field(False, description="是否下载视频到 R2")
    quality: Optional[str] = Field(None, description="视频画质，仅 download=True 时生效")


# ─────────────────────  API 端点  ─────────────────────

@app.post("/api/tasks")
async def submit_task(req: TaskSubmitRequest):
    """提交视频解析任务"""
    task_id = f"task_{uuid.uuid4().hex[:12]}"

    session_factory = _get_async_session()
    async with session_factory() as session:
        task = ParseTask(
            id=task_id,
            username=req.username,
            youtube_url=req.url,
            download=req.download,
            quality=req.quality,
            status="pending",
            progress="等待处理...",
            current_step=0,
            created_at=datetime.utcnow(),
        )
        session.add(task)
        await session.commit()

    logger.info(f"任务已提交: {task_id} - user={req.username} - {req.url}")

    return {
        "code": 200,
        "message": "任务已提交",
        "data": {
            "task_id": task_id,
            "status": "pending",
            "progress": "等待处理...",
        },
    }


@app.post("/api/tasks/{task_id}/retry")
async def retry_task(task_id: str):
    """
    重试失败的任务 (断点续传)。
    保留 current_step 和 step_data，从上次失败的步骤继续。
    """
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(ParseTask).where(ParseTask.id == task_id)
        )
        task = result.scalar_one_or_none()

        if not task:
            raise HTTPException(status_code=404, detail=f"任务不存在: {task_id}")

        if task.status != "failed":
            raise HTTPException(status_code=400, detail="只能重试失败的任务")

        # 保留 current_step 和 step_data，实现断点续传
        task.status = "pending"
        task.progress = f"等待重试 (从 Step {task.current_step or 0} 继续)..."
        task.error = None
        task.finished_at = None
        await session.commit()

        resume_info = f", 从 Step {task.current_step} 继续" if task.current_step else ""
        logger.info(f"任务重试: {task_id}{resume_info}")

    return {
        "code": 200,
        "message": "任务已重新加入队列",
        "data": {
            "task_id": task_id,
            "status": "pending",
            "resume_step": task.current_step or 0,
        },
    }


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    from config import get_settings

    settings = get_settings()
    uvicorn.run(app, host="0.0.0.0", port=settings.port)
