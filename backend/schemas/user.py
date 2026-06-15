from pydantic import BaseModel


class VocabItem(BaseModel):
    id: str
    word: str
    isPhrase: bool = False
    phonetic: str | None = None
    pos: str | None = None
    mean: str | None = None
    trans: str | None = None
    added: str | None = None
    example: str | None = None
    exampleTrans: str | None = None
    mastery: int = 1
    masteryScore: float = 1.0
    lastReviewedAt: str | None = None
    reviewCount: int = 0


class HistoryItem(BaseModel):
    id: str
    title: str
    titleZh: str | None = None
    duration: str | None = None
    level: str | None = None
    thumb: str | None = None
    tag: str | None = None
    progress: int = 0
    lastWatched: str | None = None


class LibraryStats(BaseModel):
    streak: int = 0
    words: int = 0
    sentences: int = 0
    hours: float = 0.0


class LibraryData(BaseModel):
    vocab: list[VocabItem]
    history: list[HistoryItem]
    stats: LibraryStats


class LibraryResponse(BaseModel):
    code: int = 200
    data: LibraryData
    message: str = "success"


class HistoryResponse(BaseModel):
    code: int = 200
    data: list[HistoryItem]
    message: str = "success"


class VocabListResponse(BaseModel):
    code: int = 200
    data: list[VocabItem]
    message: str = "success"


class WordDetail(BaseModel):
    word: str
    phonetic: str | None = None
    trans: str | None = None
    pos: str | None = None
    mean: str | None = None
    example: str | None = None
    exampleTrans: str | None = None
    isSaved: bool = False
    mastery: int = 1
    lastReviewedAt: str | None = None
    reviewCount: int = 0


class WordDetailResponse(BaseModel):
    code: int = 200
    data: WordDetail
    message: str = "success"


class AddVocabRequest(BaseModel):
    word: str
    isPhrase: bool = False
    phonetic: str | None = None
    trans: str | None = None
    pos: str | None = None
    mean: str | None = None
    example: str | None = None
    exampleTrans: str | None = None


class BatchDeleteVocabRequest(BaseModel):
    ids: list[str]


class BoolResponse(BaseModel):
    code: int = 200
    data: bool
    message: str = "success"


class CheckInItem(BaseModel):
    date: str
    videoId: str | None = None


class CheckInResponse(BaseModel):
    code: int = 200
    data: list[CheckInItem]
    message: str = "success"


class CheckInRequest(BaseModel):
    videoId: str


class CheckInVideoItem(BaseModel):
    id: str
    title: str
    titleZh: str | None = None
    duration: str | None = None
    level: str | None = None
    thumb: str | None = None
    tag: str | None = None


class CheckInDateResponse(BaseModel):
    code: int = 200
    data: list[CheckInVideoItem]
    message: str = "success"


class CheckInStatusResponse(BaseModel):
    code: int = 200
    data: bool
    message: str = "success"


class SaveHistoryRequest(BaseModel):
    videoId: str
    progress: int
    lastWatched: str


class SaveHistoryResponse(BaseModel):
    code: int = 200
    data: bool
    message: str = "success"


class UpdateMasteryRequest(BaseModel):
    direction: int  # 1 = familiar (熟悉), -1 = unfamiliar (陌生)


class UpdateMasteryResponse(BaseModel):
    code: int = 200
    data: dict  # { mastery: int, masteryScore: float, reviewCount: int }
    message: str = "success"


class VocabRecommendResponse(BaseModel):
    code: int = 200
    data: list[VocabItem]
    message: str = "success"