from pydantic import BaseModel


class SentenceItem(BaseModel):
    id: str
    en: str
    zh: str
    videoTitle: str | None = None
    time: str | None = None


class FavoriteVideoItem(BaseModel):
    id: str
    title: str
    duration: str | None = None
    level: str | None = None
    thumb: str | None = None
    tag: str | None = None
    isVipOnly: bool = False


class FavoritesData(BaseModel):
    videos: list[FavoriteVideoItem]
    sentences: list[SentenceItem]


class FavoritesResponse(BaseModel):
    code: int = 200
    data: FavoritesData
    message: str = "success"


class AddSentenceRequest(BaseModel):
    en: str
    zh: str
    videoTitle: str | None = None
    time: str | None = None


class FavVideosResponse(BaseModel):
    code: int = 200
    data: list[FavoriteVideoItem]
    message: str = "success"


class BoolResponse(BaseModel):
    code: int = 200
    data: bool
    message: str = "success"