from fastapi import APIRouter, Depends, Query, HTTPException

from schemas.search import SearchResponse
from services.search_service import search
from core.deps import get_current_user
from models.user import User

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search", response_model=SearchResponse)
async def search_endpoint(
    q: str = Query(..., min_length=1, description="Search query"),
    scope: str = Query("all", description="Search scope: all, explore, history, favorites, vocab"),
    user: User | None = Depends(get_current_user),
):
    valid_scopes = {"all", "explore", "history", "favorites", "vocab"}
    if scope not in valid_scopes:
        scope = "all"

    if scope in ("history", "favorites", "vocab") and user is None:
        raise HTTPException(status_code=401, detail="Authentication required for this search scope")

    if scope == "vocab" and user is not None and user.role != "vip":
        raise HTTPException(status_code=403, detail="VIP membership required for vocabulary search")

    user_id = user.id if user else None
    data = await search(q, scope, user_id)
    return {"code": 200, "data": data, "message": "success"}
