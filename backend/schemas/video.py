from pydantic import BaseModel


class HighlightItem(BaseModel):
    word: str
    color: str


class TranscriptItem(BaseModel):
    id: str
    startTime: str
    endTime: str
    en: str
    zh: str
    highlights: list[HighlightItem] = []
    isFavorite: bool = False


class VideoInfoData(BaseModel):
    id: str
    title: str
    thumbnail: str | None = None
    videoUrl: str | None = None
    duration: str | None = None
    index: int = 1
    total: int = 1
    isVipOnly: bool = False


class VideoInfoResponse(BaseModel):
    code: int = 200
    data: VideoInfoData
    message: str = "success"


class TranscriptListResponse(BaseModel):
    code: int = 200
    data: list[TranscriptItem]
    message: str = "success"


class ToggleResponse(BaseModel):
    code: int = 200
    data: bool
    message: str = "success"