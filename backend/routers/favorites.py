from fastapi import APIRouter, Depends

from schemas.favorites import (
    FavoritesResponse, AddSentenceRequest, BoolResponse, FavVideosResponse,
)
from services.favorites_service import (
    get_favorites, add_favorite_sentence, get_favorite_videos, toggle_favorite_video,
    remove_favorite_sentence,
)
from core.deps import get_required_user
from models.user import User

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.get("", response_model=FavoritesResponse)
async def favorites(user: User = Depends(get_required_user)):
    data = await get_favorites(user.id)
    return {"code": 200, "data": data, "message": "success"}


@router.post("/sentence", response_model=BoolResponse)
async def add_sentence(request: AddSentenceRequest, user: User = Depends(get_required_user)):
    result = await add_favorite_sentence(user.id, request.model_dump())
    return {"code": 200, "data": result, "message": "success"}


@router.get("/videos", response_model=FavVideosResponse)
async def fav_videos(user: User = Depends(get_required_user)):
    data = await get_favorite_videos(user.id)
    return {"code": 200, "data": data, "message": "success"}


@router.post("/videos/{video_id}/toggle", response_model=BoolResponse)
async def toggle_video(video_id: str, user: User = Depends(get_required_user)):
    result = await toggle_favorite_video(user.id, video_id)
    return {"code": 200, "data": result, "message": "success"}


@router.delete("/sentence/{sentence_id}", response_model=BoolResponse)
async def remove_sentence(sentence_id: str, user: User = Depends(get_required_user)):
    result = await remove_favorite_sentence(user.id, sentence_id)
    return {"code": 200, "data": result, "message": "success"}