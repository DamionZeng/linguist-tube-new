from sqlalchemy import select, or_

from core.database import _get_async_session
from models.video import Video, Transcript
from models.vocabulary import Vocabulary
from models.watch_history import WatchHistory
from models.favorite_video import FavoriteVideo
from models.favorite_sentence import FavoriteSentence


async def search(query: str, scope: str, user_id: int | None = None) -> list[dict]:
    if not query or not query.strip():
        return []

    q = query.strip()
    results: list[dict] = []
    session_factory = _get_async_session()

    async with session_factory() as session:
        if scope in ("all", "explore"):
            video_result = await session.execute(
                select(Video)
                .where(
                    or_(
                        Video.title.ilike(f"%{q}%"),
                        Video.tag.ilike(f"%{q}%"),
                    )
                )
                .order_by(Video.sort_order)
            )
            for v in video_result.scalars().all():
                results.append({
                    "type": "video",
                    "id": v.id,
                    "title": v.title,
                    "subtitle": f"Duration: {v.duration or 'N/A'} • Level: {v.level or 'Unknown'}",
                    "thumb": v.thumb or "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80",
                    "time": None,
                    "videoId": v.id,
                })

            transcript_result = await session.execute(
                select(Transcript, Video)
                .join(Video, Transcript.video_id == Video.id)
                .where(
                    or_(
                        Transcript.en_text.ilike(f"%{q}%"),
                        Transcript.zh_text.ilike(f"%{q}%"),
                    )
                )
                .order_by(Video.sort_order, Transcript.sort_order)
            )
            for t, v in transcript_result.all():
                results.append({
                    "type": "transcript",
                    "id": t.id,
                    "title": t.en_text,
                    "subtitle": t.zh_text,
                    "thumb": v.thumb or "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80",
                    "time": t.start_time,
                    "videoId": v.id,
                })

        if scope in ("all", "history") and user_id is not None:
            hist_result = await session.execute(
                select(WatchHistory, Video)
                .join(Video, WatchHistory.video_id == Video.id)
                .where(
                    WatchHistory.user_id == user_id,
                    or_(
                        Video.title.ilike(f"%{q}%"),
                        Video.tag.ilike(f"%{q}%"),
                    )
                )
                .order_by(WatchHistory.updated_at.desc())
            )
            for wh, v in hist_result.all():
                results.append({
                    "type": "video",
                    "id": v.id,
                    "title": v.title,
                    "subtitle": f"Progress: {wh.progress}% • {wh.last_watched or ''}",
                    "thumb": v.thumb or "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80",
                    "time": None,
                    "videoId": v.id,
                })

        if scope in ("all", "favorites") and user_id is not None:
            fav_vid_result = await session.execute(
                select(FavoriteVideo, Video)
                .join(Video, FavoriteVideo.video_id == Video.id)
                .where(
                    FavoriteVideo.user_id == user_id,
                    or_(
                        Video.title.ilike(f"%{q}%"),
                        Video.tag.ilike(f"%{q}%"),
                    )
                )
                .order_by(FavoriteVideo.created_at.desc())
            )
            for fv, v in fav_vid_result.all():
                results.append({
                    "type": "video",
                    "id": v.id,
                    "title": v.title,
                    "subtitle": f"Duration: {v.duration or 'N/A'} • Level: {v.level or 'Unknown'}",
                    "thumb": v.thumb or "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80",
                    "time": None,
                    "videoId": v.id,
                })

            fav_sent_result = await session.execute(
                select(FavoriteSentence)
                .where(
                    FavoriteSentence.user_id == user_id,
                    or_(
                        FavoriteSentence.en_text.ilike(f"%{q}%"),
                        FavoriteSentence.zh_text.ilike(f"%{q}%"),
                    )
                )
                .order_by(FavoriteSentence.created_at.desc())
            )
            for s in fav_sent_result.scalars().all():
                results.append({
                    "type": "sentence",
                    "id": s.id,
                    "title": s.en_text,
                    "subtitle": s.zh_text,
                    "thumb": None,
                    "time": s.time,
                    "videoId": None,
                })

        if scope in ("all", "vocab") and user_id is not None:
            vocab_result = await session.execute(
                select(Vocabulary)
                .where(
                    Vocabulary.user_id == user_id,
                    or_(
                        Vocabulary.word.ilike(f"%{q}%"),
                        Vocabulary.trans.ilike(f"%{q}%"),
                        Vocabulary.mean.ilike(f"%{q}%"),
                    )
                )
                .order_by(Vocabulary.id)
            )
            for w in vocab_result.scalars().all():
                results.append({
                    "type": "vocab",
                    "id": w.id,
                    "title": w.word,
                    "subtitle": f"{w.pos} {w.trans}",
                    "thumb": None,
                    "time": None,
                    "videoId": None,
                })

    return results
