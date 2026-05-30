from sqlalchemy import select
from sqlalchemy.sql import func

from core.database import _get_async_session
from models.user import User
from models.video import Video
from models.vocabulary import Vocabulary
from models.watch_history import WatchHistory
from models.favorite_sentence import FavoriteSentence
from models.favorite_video import FavoriteVideo
from models.check_in import CheckIn


def _parse_duration_to_seconds(duration_str: str | None) -> int:
    if not duration_str:
        return 0
    parts = duration_str.strip().split(":")
    try:
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    except (ValueError, TypeError):
        return 0
    return 0


async def get_library_data(user_id: int) -> dict:
    session_factory = _get_async_session()
    async with session_factory() as session:
        vocab_result = await session.execute(
            select(Vocabulary)
            .where(Vocabulary.user_id == user_id)
            .order_by(Vocabulary.id)
            .limit(3)
        )
        vocab = []
        for v in vocab_result.scalars().all():
            vocab.append({
                "id": v.id,
                "word": v.word,
                "phonetic": v.phonetic,
                "pos": v.pos,
                "mean": v.mean,
                "trans": v.trans,
                "added": v.added_at,
                "example": v.example,
                "exampleTrans": v.example_trans,
            })

        total_watched_seconds = 0
        hist_result = await session.execute(
            select(WatchHistory, Video)
            .join(Video, WatchHistory.video_id == Video.id)
            .where(WatchHistory.user_id == user_id)
            .order_by(WatchHistory.updated_at.desc())
        )
        history = []
        for wh, v in hist_result.all():
            history.append({
                "id": v.id,
                "title": v.title,
                "duration": v.duration,
                "level": v.level,
                "thumb": v.thumb,
                "tag": v.tag,
                "progress": wh.progress,
                "lastWatched": wh.last_watched,
            })
            total_watched_seconds += int(
                _parse_duration_to_seconds(v.duration) * wh.progress / 100
            )

        words_count_result = await session.execute(
            select(func.count()).select_from(Vocabulary).where(Vocabulary.user_id == user_id)
        )
        words_count = words_count_result.scalar() or 0

        sentences_count_result = await session.execute(
            select(func.count()).select_from(FavoriteSentence).where(FavoriteSentence.user_id == user_id)
        )
        sentences_count = sentences_count_result.scalar() or 0

        fav_videos_count_result = await session.execute(
            select(func.count()).select_from(FavoriteVideo).where(FavoriteVideo.user_id == user_id)
        )
        fav_videos_count = fav_videos_count_result.scalar() or 0
        total_favorites = sentences_count + fav_videos_count

        checkin_result = await session.execute(
            select(func.count()).select_from(CheckIn).where(CheckIn.user_id == user_id)
        )
        streak = checkin_result.scalar() or 0
        hours = round(total_watched_seconds / 3600, 1)

        return {
            "vocab": vocab,
            "history": history,
            "stats": {
                "streak": streak,
                "words": words_count,
                "sentences": total_favorites,
                "hours": hours,
            },
        }


async def get_history(user_id: int) -> list[dict]:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(WatchHistory, Video)
            .join(Video, WatchHistory.video_id == Video.id)
            .where(WatchHistory.user_id == user_id)
            .order_by(WatchHistory.updated_at.desc())
        )
        history = []
        for wh, v in result.all():
            history.append({
                "id": v.id,
                "title": v.title,
                "duration": v.duration,
                "level": v.level,
                "thumb": v.thumb,
                "tag": v.tag,
                "progress": wh.progress,
                "lastWatched": wh.last_watched,
            })
        return history


async def get_vocabulary(user_id: int) -> list[dict]:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(Vocabulary)
            .where(Vocabulary.user_id == user_id)
            .order_by(Vocabulary.id)
        )
        vocab = []
        for v in result.scalars().all():
            vocab.append({
                "id": v.id,
                "word": v.word,
                "phonetic": v.phonetic,
                "pos": v.pos,
                "mean": v.mean,
                "trans": v.trans,
                "added": v.added_at,
                "example": v.example,
                "exampleTrans": v.example_trans,
            })
        return vocab


async def get_word_detail(word: str, user_id: int) -> dict:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(Vocabulary).where(
                Vocabulary.user_id == user_id,
                Vocabulary.word == word,
            ).limit(1)
        )
        existing = result.scalars().first()

        if existing is not None:
            return {
                "word": existing.word,
                "phonetic": existing.phonetic,
                "trans": existing.trans,
                "pos": existing.pos,
                "mean": existing.mean,
                "example": existing.example,
                "exampleTrans": existing.example_trans,
                "isSaved": True,
            }

        return {
            "word": word,
            "phonetic": f"/{word}/",
            "trans": "n. 未知词汇",
            "pos": "n.",
            "mean": "未知词汇",
            "example": f"This is an example for {word}.",
            "exampleTrans": "这是一个例句。",
            "isSaved": False,
        }


async def add_vocabulary(user_id: int, word_data: dict) -> bool:
    session_factory = _get_async_session()
    async with session_factory() as session:
        existing = await session.execute(
            select(Vocabulary).where(
                Vocabulary.user_id == user_id,
                Vocabulary.word == word_data.get("word", ""),
            ).limit(1)
        )
        vocab = existing.scalars().first()

        if vocab is not None:
            vocab.phonetic = word_data.get("phonetic") or vocab.phonetic
            vocab.pos = word_data.get("pos") or vocab.pos
            vocab.mean = word_data.get("mean") or vocab.mean
            vocab.trans = word_data.get("trans") or vocab.trans
            vocab.example = word_data.get("example") or vocab.example
            vocab.example_trans = word_data.get("exampleTrans") or vocab.example_trans
            vocab.added_at = "Just now"
            await session.commit()
            return True

        import uuid
        vid = f"w{uuid.uuid4().hex[:8]}"

        vocab = Vocabulary(
            id=vid,
            user_id=user_id,
            word=word_data.get("word", ""),
            phonetic=word_data.get("phonetic"),
            pos=word_data.get("pos"),
            mean=word_data.get("mean"),
            trans=word_data.get("trans"),
            example=word_data.get("example"),
            example_trans=word_data.get("exampleTrans"),
            added_at="Just now",
        )
        session.add(vocab)
        await session.commit()
        return True


async def get_checkins(user_id: int) -> list[str]:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(CheckIn)
            .where(CheckIn.user_id == user_id)
            .order_by(CheckIn.check_in_date)
        )
        return [c.check_in_date for c in result.scalars().all()]


async def add_checkin(user_id: int, date_str: str) -> bool:
    session_factory = _get_async_session()
    async with session_factory() as session:
        existing = await session.execute(
            select(CheckIn).where(
                CheckIn.user_id == user_id,
                CheckIn.check_in_date == date_str,
            )
        )
        if existing.scalar_one_or_none() is not None:
            return True

        checkin = CheckIn(user_id=user_id, check_in_date=date_str)
        session.add(checkin)
        await session.commit()
        return True


async def save_history(user_id: int, video_id: str, progress: int, last_watched: str) -> bool:
    session_factory = _get_async_session()
    async with session_factory() as session:
        existing = await session.execute(
            select(WatchHistory).where(
                WatchHistory.user_id == user_id,
                WatchHistory.video_id == video_id,
            )
        )
        wh = existing.scalar_one_or_none()

        if wh is not None:
            wh.progress = progress
            wh.last_watched = last_watched
        else:
            wh = WatchHistory(
                user_id=user_id,
                video_id=video_id,
                progress=progress,
                last_watched=last_watched,
            )
            session.add(wh)

        await session.commit()
        return True