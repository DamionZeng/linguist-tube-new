from fastapi import APIRouter, Query

from schemas.explore import ExploreResponse
from services.explore_service import get_explore_data, DEFAULT_PAGE_SIZE

router = APIRouter(prefix="/api", tags=["explore"])


@router.get("/explore", response_model=ExploreResponse)
async def explore(
    offset: int = Query(0, ge=0),
    limit: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=100),
    category: str | None = Query(None),
):
    data = await get_explore_data(offset=offset, limit=limit, category=category)
    return {"code": 200, "data": data, "message": "success"}