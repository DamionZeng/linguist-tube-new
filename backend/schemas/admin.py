from pydantic import BaseModel


class DeleteVideoResponse(BaseModel):
    code: int = 200
    data: dict
    message: str = "success"


class BatchDeleteRequest(BaseModel):
    video_ids: list[str]


class BatchDeleteResponse(BaseModel):
    code: int = 200
    data: dict
    message: str = "success"


class PromoteCarouselRequest(BaseModel):
    subtitle: str | None = None


class PromoteCarouselResponse(BaseModel):
    code: int = 200
    data: dict
    message: str = "success"


class GenerateKeyRequest(BaseModel):
    days_valid: int = 365
    vip_duration_days: int | None = None  # None = 终生VIP, 具体天数 = 限时VIP


class GenerateKeyResponse(BaseModel):
    code: int = 200
    data: dict
    message: str = "success"
