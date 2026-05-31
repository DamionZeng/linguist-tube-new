from fastapi import APIRouter, HTTPException

from schemas.word import WordLookupResponse
from services.word_service import lookup_word

router = APIRouter(prefix="/api", tags=["word"])


@router.get("/word/{word}", response_model=WordLookupResponse)
async def word_lookup(word: str):
    data = await lookup_word(word)
    if data is None:
        raise HTTPException(status_code=404, detail="Word not found")
    return {"code": 200, "data": data, "message": "success"}
