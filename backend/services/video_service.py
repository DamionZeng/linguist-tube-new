import json

from sqlalchemy import select, func, and_, or_

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

        # 单条 SQL 同时获取：总数、当前视频位置、下一个视频 id
        # 相比原先 3 次串行查询，节省 2 次数据库往返
        sort_order = video.sort_order or 0
        # 用 subquery 拿下一个视频 id（限制 1 条）
        next_subq = (
            select(Video.id)
            .where(
                or_(
                    Video.sort_order > sort_order,
                    and_(Video.sort_order == sort_order, Video.id > video_id),
                )
            )
            .order_by(Video.sort_order, Video.id)
            .limit(1)
            .scalar_subquery()
        )
        agg_result = await session.execute(
            select(
                func.count(Video.id).label("total"),
                func.count(Video.id).filter(
                    or_(
                        Video.sort_order < sort_order,
                        and_(Video.sort_order == sort_order, Video.id < video_id),
                    )
                ).label("vid_index_base"),
                next_subq.label("next_video_id"),
            )
        )
        row = agg_result.one()
        total = row.total
        vid_index = (row.vid_index_base or 0) + 1
        next_video_id = row.next_video_id

        return {
            "id": video.id,
            "title": video.title,
            "titleZh": video.title_zh or None,
            "descZh": video.description_zh or None,
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