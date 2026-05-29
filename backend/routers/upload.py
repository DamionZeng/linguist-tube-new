import os

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select

from core.database import _get_async_session
from core.deps import get_required_user
from core.r2 import (
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    MAX_IMAGE_SIZE,
    MAX_VIDEO_SIZE,
    upload_thumbnail,
    upload_video_file,
    upload_file,
)
from models.user import User
from models.video import Video
from schemas.upload import UploadResponse

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/thumbnail", response_model=UploadResponse)
async def upload_thumbnail_endpoint(
    file: UploadFile = File(...),
    video_id: str = Form(...),
    user: User = Depends(get_required_user),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only jpg/png/webp images are allowed")

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5MB")

    ext = _get_ext(file.filename, "webp")
    url = upload_thumbnail(video_id, content, file.content_type or "image/webp", ext)

    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(select(Video).where(Video.id == video_id))
        video = result.scalar_one_or_none()
        if video is not None:
            video.thumb = url
            await session.commit()

    return {"code": 200, "data": {"url": url}, "message": "success"}


@router.post("/video", response_model=UploadResponse)
async def upload_video_endpoint(
    file: UploadFile = File(...),
    video_id: str = Form(...),
    user: User = Depends(get_required_user),
):
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=400, detail="Only mp4/webm videos are allowed")

    content = await file.read()
    if len(content) > MAX_VIDEO_SIZE:
        raise HTTPException(status_code=400, detail="Video must be under 500MB")

    ext = _get_ext(file.filename, "mp4")
    url = upload_video_file(video_id, content, file.content_type or "video/mp4", ext)

    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(select(Video).where(Video.id == video_id))
        video = result.scalar_one_or_none()
        if video is not None:
            video.video_url = url
            await session.commit()

    return {"code": 200, "data": {"url": url}, "message": "success"}


@router.post("/carousel", response_model=UploadResponse)
async def upload_carousel_endpoint(
    file: UploadFile = File(...),
    user: User = Depends(get_required_user),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only jpg/png/webp images are allowed")

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5MB")

    ext = _get_ext(file.filename, "webp")
    url = upload_file("carousel", content, file.content_type or "image/webp", ext)

    return {"code": 200, "data": {"url": url}, "message": "success"}


def _get_ext(filename: str | None, fallback: str) -> str:
    if filename is None:
        return fallback
    dot = filename.rfind(".")
    return filename[dot + 1:].lower() if dot >= 0 else fallback