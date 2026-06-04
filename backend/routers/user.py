from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from schemas.user import (
    LibraryResponse, HistoryResponse, VocabListResponse,
    WordDetailResponse, AddVocabRequest, BatchDeleteVocabRequest, BoolResponse, CheckInResponse,
    CheckInRequest, CheckInDateResponse, CheckInStatusResponse,
    SaveHistoryRequest, SaveHistoryResponse,
)
from services.user_service import (
    get_library_data, get_history, get_vocabulary,
    get_word_detail, add_vocabulary, delete_vocabulary, batch_delete_vocabulary,
    get_checkins, add_checkin,
    get_checkins_by_date, is_video_checked_in,
    save_history,
)
from core.deps import get_required_user
from models.user import User

router = APIRouter(prefix="/api", tags=["user"])


@router.get("/library", response_model=LibraryResponse)
async def library(user: User = Depends(get_required_user)):
    data = await get_library_data(user.id)
    return {"code": 200, "data": data, "message": "success"}


@router.get("/history", response_model=HistoryResponse)
async def history(user: User = Depends(get_required_user)):
    data = await get_history(user.id)
    return {"code": 200, "data": data, "message": "success"}


@router.get("/vocabulary", response_model=VocabListResponse)
async def vocabulary(user: User = Depends(get_required_user)):
    if user.role != "vip":
        return JSONResponse(
            status_code=403,
            content={"code": 403, "data": None, "message": "VIP membership required"},
        )
    data = await get_vocabulary(user.id)
    return {"code": 200, "data": data, "message": "success"}


@router.get("/vocabulary/{word}", response_model=WordDetailResponse)
async def word_detail(word: str, user: User = Depends(get_required_user)):
    data = await get_word_detail(word, user.id)
    return {"code": 200, "data": data, "message": "success"}


@router.post("/vocabulary", response_model=BoolResponse)
async def add_vocab(request: AddVocabRequest, user: User = Depends(get_required_user)):
    result = await add_vocabulary(user.id, request.model_dump())
    return {"code": 200, "data": result, "message": "success"}


@router.delete("/vocabulary/{vocab_id}", response_model=BoolResponse)
async def delete_vocab(vocab_id: str, user: User = Depends(get_required_user)):
    result = await delete_vocabulary(user.id, vocab_id)
    return {"code": 200, "data": result, "message": "success"}


@router.post("/vocabulary/batch-delete", response_model=BoolResponse)
async def batch_delete_vocab(request: BatchDeleteVocabRequest, user: User = Depends(get_required_user)):
    result = await batch_delete_vocabulary(user.id, request.ids)
    return {"code": 200, "data": result, "message": "success"}


@router.get("/checkin", response_model=CheckInResponse)
async def checkin_list(user: User = Depends(get_required_user)):
    data = await get_checkins(user.id)
    return {"code": 200, "data": data, "message": "success"}


@router.get("/checkin/status", response_model=CheckInStatusResponse)
async def checkin_status(video_id: str = Query(..., alias="videoId"), user: User = Depends(get_required_user)):
    from datetime import date as date_mod
    today = date_mod.date.today().isoformat()
    result = await is_video_checked_in(user.id, video_id, today)
    return {"code": 200, "data": result, "message": "success"}


@router.get("/checkin/{date}", response_model=CheckInDateResponse)
async def checkin_by_date(date: str, user: User = Depends(get_required_user)):
    data = await get_checkins_by_date(user.id, date)
    return {"code": 200, "data": data, "message": "success"}


@router.post("/checkin", response_model=BoolResponse)
async def checkin_add(request: CheckInRequest, user: User = Depends(get_required_user)):
    from datetime import date
    today = date.today().isoformat()
    result = await add_checkin(user.id, today, request.videoId)
    return {"code": 200, "data": result, "message": "success"}


@router.post("/history", response_model=SaveHistoryResponse)
async def save_watch_history(request: SaveHistoryRequest, user: User = Depends(get_required_user)):
    result = await save_history(user.id, request.videoId, request.progress, request.lastWatched)
    return {"code": 200, "data": result, "message": "success"}