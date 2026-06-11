from pydantic import BaseModel
from typing import Optional


class ParseTaskItem(BaseModel):
    task_id: str
    username: str
    youtube_url: str
    download: bool
    quality: Optional[str] = None
    status: str
    progress: Optional[str] = None
    current_step: int = 0
    video_id: Optional[str] = None
    error: Optional[str] = None
    result: Optional[dict] = None
    created_at: Optional[str] = None
    started_at: Optional[str] = None
    finished_at: Optional[str] = None


class ParseTaskListData(BaseModel):
    total: int
    items: list[ParseTaskItem]


class ParseTaskStatusResponse(BaseModel):
    code: int = 200
    data: ParseTaskItem
    message: str = "success"


class ParseTaskListResponse(BaseModel):
    code: int = 200
    data: ParseTaskListData
    message: str = "success"


class BoolResponse(BaseModel):
    code: int = 200
    data: bool
    message: str = "success"
