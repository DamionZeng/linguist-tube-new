from pydantic import BaseModel


class SearchResult(BaseModel):
    type: str
    id: str
    title: str
    subtitle: str | None = None
    thumb: str | None = None
    time: str | None = None
    videoId: str | None = None


class SearchResponse(BaseModel):
    code: int = 200
    data: list[SearchResult]
    message: str = "success"
