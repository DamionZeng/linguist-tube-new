import json

from sqlalchemy import select

from core.database import _get_async_session
from models.video import Video, Transcript
from models.favorite_sentence import FavoriteSentence


def _format_word_timestamp(seconds: float) -> str:
    """将秒数转为 MM:SS.sss 格式。"""
    minutes = int(seconds // 60)
    secs = seconds % 60
    return f"{minutes:02d}:{secs:06.3f}"


def _convert_words_format(words: dict) -> dict:
    """将 words_json 中的词级时间戳从浮点秒转为 MM:SS.sss 格式。"""
    converted = {}
    for lang in ("en", "zh"):
        word_list = words.get(lang)
        if word_list:
            converted[lang] = [
                {
                    "text": w["text"],
                    "start": _format_word_timestamp(w["start"]),
                    "end": _format_word_timestamp(w["end"]),
                }
                for w in word_list
            ]
    return converted


async def get_video_info(video_id: str) -> dict | None:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(select(Video).where(Video.id == video_id))
        video = result.scalar_one_or_none()
        if video is None:
            return None

        total_result = await session.execute(select(Video))
        total = len(total_result.scalars().all())

        vid_index = 1
        next_video_id = None
        all_videos = (
            await session.execute(select(Video).order_by(Video.sort_order, Video.id))
        ).scalars().all()
        for i, v in enumerate(all_videos, 1):
            if v.id == video_id:
                vid_index = i
                # Get next video in order
                if i < len(all_videos):
                    next_video_id = all_videos[i].id
                break

        return {
            "id": video.id,
            "title": video.title,
            "thumbnail": video.thumb,
            "videoUrl": video.video_url,
            "duration": video.duration,
            "index": vid_index,
            "total": total,
            "isVipOnly": video.is_vip_only,
            "nextVideoId": next_video_id,
        }


async def get_transcripts(video_id: str, user_id: int | None = None) -> list[dict]:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(Transcript)
            .where(Transcript.video_id == video_id)
            .order_by(Transcript.sort_order, Transcript.id)
        )
        transcripts = result.scalars().all()

        fav_sentence_ids: set[str] = set()
        if user_id is not None:
            fav_result = await session.execute(
                select(FavoriteSentence).where(
                    FavoriteSentence.user_id == user_id
                )
            )
            for fs in fav_result.scalars().all():
                fav_sentence_ids.add(fs.id)

        items = []
        for t in transcripts:
            highlights = []
            if t.highlights_json:
                try:
                    highlights = json.loads(t.highlights_json)
                except (json.JSONDecodeError, TypeError):
                    pass

            words = {}
            if t.words_json:
                try:
                    raw_words = json.loads(t.words_json)
                    words = _convert_words_format(raw_words)
                except (json.JSONDecodeError, TypeError):
                    pass

            items.append({
                "id": t.id,
                "startTime": t.start_time,
                "endTime": t.end_time,
                "en": t.en_text,
                "zh": t.zh_text,
                "highlights": highlights,
                "words": words,
                "isFavorite": t.id in fav_sentence_ids,
            })

        return items


async def toggle_favorite_transcript(transcript_id: str, user_id: int) -> bool:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(Transcript).where(Transcript.id == transcript_id)
        )
        transcript = result.scalar_one_or_none()
        if transcript is None:
            return False

        vid_result = await session.execute(
            select(Video).where(Video.id == transcript.video_id)
        )
        video = vid_result.scalar_one_or_none()
        video_title = video.title if video else "Unknown"

        existing = await session.execute(
            select(FavoriteSentence).where(
                FavoriteSentence.id == transcript_id,
                FavoriteSentence.user_id == user_id,
            )
        )
        fav = existing.scalar_one_or_none()

        if fav is not None:
            await session.delete(fav)
            await session.commit()
            return True

        new_fav = FavoriteSentence(
            id=transcript_id,
            user_id=user_id,
            en_text=transcript.en_text,
            zh_text=transcript.zh_text,
            video_title=video_title,
            time=transcript.start_time,
        )
        session.add(new_fav)
        await session.commit()
        return True