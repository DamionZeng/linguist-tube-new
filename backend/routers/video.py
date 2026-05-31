from fastapi import APIRouter, Depends

from schemas.video import VideoInfoResponse, TranscriptListResponse, ToggleResponse
from services.video_service import get_video_info, get_transcripts, toggle_favorite_transcript
from core.deps import get_current_user, get_required_user
from models.user import User

router = APIRouter(prefix="/api/video", tags=["video"])


@router.get("/{video_id}/info", response_model=VideoInfoResponse)
async def video_info(video_id: str):
    data = await get_video_info(video_id)
    if data is None:
        return {"code": 404, "data": None, "message": "Video not found"}
    return {"code": 200, "data": data, "message": "success"}


@router.get("/{video_id}/transcripts", response_model=TranscriptListResponse)
async def video_transcripts(
    video_id: str,
    user: User | None = Depends(get_current_user),
):
    user_id = user.id if user else None
    data = await get_transcripts(video_id, user_id=user_id)
    return {"code": 200, "data": data, "message": "success"}


@router.put("/transcript/{transcript_id}/favorite", response_model=ToggleResponse)
async def fav_transcript(
    transcript_id: str,
    user: User = Depends(get_required_user),
):
    result = await toggle_favorite_transcript(transcript_id, user.id)
    return {"code": 200, "data": result, "message": "success"}