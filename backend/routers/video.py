from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from schemas.video import VideoInfoResponse, TranscriptListResponse, ToggleResponse
from services.video_service import get_video_info, get_transcripts, toggle_favorite_transcript
from core.deps import get_current_user, get_required_user
from models.user import User

router = APIRouter(prefix="/api/video", tags=["video"])

# 视频信息和字幕数据变化不频繁，缓存 5 分钟
_CACHE_HEADERS = {"Cache-Control": "public, max-age=300, s-maxage=300"}


@router.get("/{video_id}/info", response_model=VideoInfoResponse)
async def video_info(video_id: str):
    data = await get_video_info(video_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Video not found")
    return JSONResponse(
        content={"code": 200, "data": data, "message": "success"},
        headers=_CACHE_HEADERS,
    )


@router.get("/{video_id}/transcripts", response_model=TranscriptListResponse)
async def video_transcripts(
    video_id: str,
    user: User | None = Depends(get_current_user),
):
    user_id = user.id if user else None
    data = await get_transcripts(video_id, user_id=user_id)
    return JSONResponse(
        content={"code": 200, "data": data, "message": "success"},
        headers=_CACHE_HEADERS,
    )


@router.put("/transcript/{transcript_id}/favorite", response_model=ToggleResponse)
async def fav_transcript(
    transcript_id: str,
    user: User = Depends(get_required_user),
):
    result = await toggle_favorite_transcript(transcript_id, user.id)
    return {"code": 200, "data": result, "message": "success"}