from pydantic import BaseModel


class ExploreVideoItem(BaseModel):
    id: str
    title: str
    duration: str | None = None
    level: str | None = None
    thumb: str | None = None
    tag: str | None = None
    isVipOnly: bool = False


class ExploreCarouselItem(BaseModel):
    id: str
    title: str
    subtitle: str | None = None
    desc: str | None = None
    image: str | None = None
    tag: str | None = None


class ExploreResponse(BaseModel):
    code: int = 200
    data: "ExploreData"
    message: str = "success"


class ExploreData(BaseModel):
    categories: list[str]
    videos: list[ExploreVideoItem]
    carousel: list[ExploreCarouselItem]