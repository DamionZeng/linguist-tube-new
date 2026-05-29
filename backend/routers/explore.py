from fastapi import APIRouter

from schemas.explore import ExploreResponse
from services.explore_service import get_explore_data

router = APIRouter(prefix="/api", tags=["explore"])


@router.get("/explore", response_model=ExploreResponse)
async def explore():
    data = await get_explore_data()
    return {"code": 200, "data": data, "message": "success"}