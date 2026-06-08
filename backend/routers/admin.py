import logging

from fastapi import APIRouter, HTTPException

from schemas.admin import (
    DeleteVideoResponse, BatchDeleteRequest, BatchDeleteResponse,
    PromoteCarouselRequest, PromoteCarouselResponse,
    GenerateKeyRequest, GenerateKeyResponse,
)
from services.admin_service import (
    delete_video_by_id, delete_video_batch, promote_to_carousel,
    generate_registration_key,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.delete("/video/{video_id}", response_model=DeleteVideoResponse)
async def delete_video(video_id: str):
    result = await delete_video_by_id(video_id)
    if not result.get("found"):
        raise HTTPException(status_code=404, detail=result.get("message", "视频不存在"))
    return {"code": 200, "data": result, "message": result.get("summary", "success")}


@router.post("/videos/batch-delete", response_model=BatchDeleteResponse)
async def batch_delete_videos(body: BatchDeleteRequest):
    result = await delete_video_batch(body.video_ids)
    return {"code": 200, "data": result, "message": f"删除 {result['success']}/{result['total']} 个成功"}


@router.post("/video/{video_id}/carousel", response_model=PromoteCarouselResponse)
async def promote_video_carousel(video_id: str, body: PromoteCarouselRequest | None = None):
    subtitle = body.subtitle if body else None
    result = await promote_to_carousel(video_id, subtitle)
    if not result.get("found"):
        raise HTTPException(status_code=404, detail=result.get("message", "视频不存在"))
    return {"code": 200, "data": result, "message": result.get("message", "success")}


@router.post("/keys/generate", response_model=GenerateKeyResponse)
async def generate_key(body: GenerateKeyRequest | None = None):
    days = body.days_valid if body else 365
    vip_days = body.vip_duration_days if body else None
    result = await generate_registration_key(days, vip_days)
    vip_type = "终生" if vip_days is None else f"{vip_days}天"
    return {"code": 200, "data": result, "message": f"卡密已生成，VIP类型: {vip_type}"}
