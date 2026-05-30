from pydantic import BaseModel


class PhraseItem(BaseModel):
    p_cn: str
    p_content: str


class HwdItem(BaseModel):
    hwd: str | None = None
    tran: str | None = None
    word: str | None = None


class RelWordGroup(BaseModel):
    Hwds: list[HwdItem]
    Pos: str


class SentenceItem(BaseModel):
    s_cn: str
    s_content: str


class SynonymGroup(BaseModel):
    Hwds: list[HwdItem]
    pos: str
    tran: str


class TranslationItem(BaseModel):
    pos: str
    tran_cn: str


class WordData(BaseModel):
    bookId: str | None = None
    phrases: list[PhraseItem] = []
    relWords: list[RelWordGroup] = []
    sentences: list[SentenceItem] = []
    synonyms: list[SynonymGroup] = []
    translations: list[TranslationItem] = []
    ukphone: str | None = None
    ukspeech: str | None = None
    usphone: str | None = None
    usspeech: str | None = None
    word: str


class WordLookupResponse(BaseModel):
    code: int = 200
    data: WordData
    message: str = "success"
