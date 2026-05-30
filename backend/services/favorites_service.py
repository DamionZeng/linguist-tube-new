from sqlalchemy import select

from core.database import _get_async_session
from models.video import Video
from models.favorite_sentence import FavoriteSentence
from models.favorite_video import FavoriteVideo


async def get_favorites(user_id: int) -> dict:
    session_factory = _get_async_session()
    async with session_factory() as session:
        fav_vid_result = await session.execute(
            select(FavoriteVideo, Video)
            .join(Video, FavoriteVideo.video_id == Video.id)
            .where(FavoriteVideo.user_id == user_id)
            .order_by(FavoriteVideo.created_at.desc())
        )
        videos = []
        for fv, v in fav_vid_result.all():
            videos.append({
                "id": v.id,
                "title": v.title,
                "duration": v.duration,
                "level": v.level,
                "thumb": v.thumb,
                "tag": v.tag,
                "isVipOnly": v.is_vip_only,
            })

        sent_result = await session.execute(
            select(FavoriteSentence)
            .where(FavoriteSentence.user_id == user_id)
            .order_by(FavoriteSentence.created_at.desc())
        )
        sentences = []
        for s in sent_result.scalars().all():
            sentences.append({
                "id": s.id,
                "en": s.en_text,
                "zh": s.zh_text,
                "videoTitle": s.video_title,
                "time": s.time,
            })

        return {"videos": videos, "sentences": sentences}


async def add_favorite_sentence(user_id: int, sentence: dict) -> bool:
    session_factory = _get_async_session()
    async with session_factory() as session:
        import uuid
        sid = f"s{uuid.uuid4().hex[:8]}"

        fav = FavoriteSentence(
            id=sid,
            user_id=user_id,
            en_text=sentence.get("en", ""),
            zh_text=sentence.get("zh", ""),
            video_title=sentence.get("videoTitle"),
            time=sentence.get("time"),
        )
        session.add(fav)
        await session.commit()
        return True


async def get_favorite_videos(user_id: int) -> list[dict]:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(FavoriteVideo, Video)
            .join(Video, FavoriteVideo.video_id == Video.id)
            .where(FavoriteVideo.user_id == user_id)
            .order_by(FavoriteVideo.created_at.desc())
        )
        videos = []
        for fv, v in result.all():
            videos.append({
                "id": v.id,
                "title": v.title,
                "duration": v.duration,
                "level": v.level,
                "thumb": v.thumb,
                "tag": v.tag,
                "isVipOnly": v.is_vip_only,
            })
        return videos


async def toggle_favorite_video(user_id: int, video_id: str) -> bool:
    session_factory = _get_async_session()
    async with session_factory() as session:
        existing = await session.execute(
            select(FavoriteVideo).where(
                FavoriteVideo.user_id == user_id,
                FavoriteVideo.video_id == video_id,
            )
        )
        fav = existing.scalar_one_or_none()

        if fav is not None:
            await session.delete(fav)
            await session.commit()
            return True

        new_fav = FavoriteVideo(user_id=user_id, video_id=video_id)
        session.add(new_fav)
        await session.commit()
        return True


async def remove_favorite_sentence(user_id: int, sentence_id: str) -> bool:
    session_factory = _get_async_session()
    async with session_factory() as session:
        existing = await session.execute(
            select(FavoriteSentence).where(
                FavoriteSentence.user_id == user_id,
                FavoriteSentence.id == sentence_id,
            )
        )
        sentence = existing.scalar_one_or_none()

        if sentence is not None:
            await session.delete(sentence)
            await session.commit()
            return True

        return False