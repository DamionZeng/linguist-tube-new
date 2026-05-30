from datetime import datetime

import aiohttp
from sqlalchemy import select

from core.database import _get_async_session
from models.word_cache import WordCache

EXTERNAL_API_URL = "https://v2.xxapi.cn/api/englishwords"


async def lookup_word(word: str) -> dict:
    word_lower = word.strip().lower()
    if not word_lower:
        return None

    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(WordCache).where(WordCache.word == word_lower)
        )
        cached = result.scalar_one_or_none()

        if cached is not None:
            return cached.data

        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as client:
                async with client.get(EXTERNAL_API_URL, params={"word": word_lower}) as resp:
                    resp.raise_for_status()
                    api_result = await resp.json()
        except Exception:
            return None

        if api_result.get("code") != 200 or not api_result.get("data"):
            return None

        word_data = api_result["data"]

        cache_entry = WordCache(
            word=word_lower,
            data=word_data,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(cache_entry)
        await session.commit()

        return word_data
