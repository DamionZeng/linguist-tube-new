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


class GenerateKeyResponse(BaseModel):
    code: int = 200
    data: dict
    message: str = "success"
