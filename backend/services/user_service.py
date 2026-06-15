from sqlalchemy import select
from sqlalchemy.sql import func
from datetime import datetime, timezone

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
                "isPhrase": v.is_phrase,
                "phonetic": v.phonetic,
                "pos": v.pos,
                "mean": v.mean,
                "trans": v.trans,
                "added": v.added_at.isoformat() if isinstance(v.added_at, datetime) else v.added_at,
                "example": v.example,
                "exampleTrans": v.example_trans,
                "mastery": v.mastery,
                "masteryScore": v.mastery_score,
                "lastReviewedAt": v.last_reviewed_at.isoformat() if isinstance(v.last_reviewed_at, datetime) else v.last_reviewed_at,
                "reviewCount": v.review_count,
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
                "titleZh": v.title_zh or None,
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
                "titleZh": v.title_zh or None,
                "duration": v.duration,
                "level": v.level,
                "thumb": v.thumb,
                "tag": v.tag,
                "progress": wh.progress,
                "lastWatched": wh.last_watched,
            })
        return history


async def get_vocabulary(user_id: int, ids: list[str] | None = None) -> list[dict]:
    session_factory = _get_async_session()
    async with session_factory() as session:
        query = select(Vocabulary).where(Vocabulary.user_id == user_id)
        if ids:
            query = query.where(Vocabulary.id.in_(ids))
        # 按 added_at 倒序排列，最新添加的在前
        query = query.order_by(Vocabulary.added_at.desc().nullslast())
        result = await session.execute(query)
        vocab = []
        for v in result.scalars().all():
            vocab.append({
                "id": v.id,
                "word": v.word,
                "isPhrase": v.is_phrase,
                "phonetic": v.phonetic,
                "pos": v.pos,
                "mean": v.mean,
                "trans": v.trans,
                "added": v.added_at.isoformat() if isinstance(v.added_at, datetime) else v.added_at,
                "example": v.example,
                "exampleTrans": v.example_trans,
                "mastery": v.mastery,
                "masteryScore": v.mastery_score,
                "lastReviewedAt": v.last_reviewed_at.isoformat() if isinstance(v.last_reviewed_at, datetime) else v.last_reviewed_at,
                "reviewCount": v.review_count,
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
                "mastery": existing.mastery,
                "lastReviewedAt": existing.last_reviewed_at.isoformat() if isinstance(existing.last_reviewed_at, datetime) else existing.last_reviewed_at,
                "reviewCount": existing.review_count,
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
            "mastery": 1,
            "lastReviewedAt": None,
            "reviewCount": 0,
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
            vocab.is_phrase = word_data.get("isPhrase", False) or vocab.is_phrase
            vocab.added_at = datetime.now(timezone.utc)
            await session.commit()
            return True

        import uuid
        vid = f"w{uuid.uuid4().hex[:8]}"

        vocab = Vocabulary(
            id=vid,
            user_id=user_id,
            word=word_data.get("word", ""),
            is_phrase=word_data.get("isPhrase", False),
            phonetic=word_data.get("phonetic"),
            pos=word_data.get("pos"),
            mean=word_data.get("mean"),
            trans=word_data.get("trans"),
            example=word_data.get("example"),
            example_trans=word_data.get("exampleTrans"),
            added_at=datetime.now(timezone.utc),
        )
        session.add(vocab)
        await session.commit()
        return True


# ==================== 掌握度算法 ====================

def _calc_mastery_delta(
    direction: int,          # 1 = 熟悉, -1 = 陌生
    current_score: float,
    days_since_last_review: float,
    review_count: int,
) -> float:
    """
    基于多维因素的加权掌握度变化量算法。

    因素:
    - direction: 熟悉(+1) 还是 陌生(-1)
    - current_score: 当前浮点分数 (1.0 ~ 5.0)
    - days_since_last_review: 上次复习距今天数
    - review_count: 累计复习次数

    设计思路:
    1. 基础步长: 0.35 (足够敏感但不过激)
    2. 时间衰减因子: 上次复习越久远，这次反馈权重越高
       - 熟悉且间隔久 → 更大加分（真正记住了）
       - 陌生且间隔久 → 更大减分（确实忘了）
    3. 稳定性因子: review_count 越多，单次变动越小（更稳定）
    4. 边界阻尼: 接近边界时变动幅度减小，防止抖动
    """
    base_step = 0.35

    # 时间因子: 0 ~ 1, 7天达到最大值
    time_factor = min(1.0, days_since_last_review / 7.0)

    # 稳定性因子: 0 ~ 1, 10次复习后趋于稳定
    stability = min(1.0, review_count / 10.0)

    # 边界阻尼: 接近 1 或 5 时缩小步长
    edge_damping = 1.0
    if current_score <= 1.5:
        edge_damping = 0.5 + (current_score - 1.0)  # 0.5~1.0
    elif current_score >= 4.5:
        edge_damping = 1.0 - (current_score - 4.5)  # 1.0~0.5

    if direction > 0:
        # 熟悉: 时间越久+稳定性越高 → 加分越多
        delta = base_step * (1.0 + 0.6 * time_factor + 0.3 * stability) * edge_damping
    else:
        # 陌生: 时间越久 → 减分越多; 但有稳定性缓冲
        delta = base_step * (1.0 + 0.8 * time_factor) * (1.0 - 0.3 * stability) * edge_damping

    return delta


async def update_mastery(user_id: int, vocab_id: str, direction: int) -> dict | None:
    """
    更新单词掌握度。direction: 1=熟悉, -1=陌生。
    返回更新后的 { mastery, masteryScore, reviewCount }
    """
    from datetime import datetime as dt, timezone as tz

    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(Vocabulary).where(
                Vocabulary.id == vocab_id,
                Vocabulary.user_id == user_id,
            )
        )
        vocab = result.scalars().first()
        if vocab is None:
            return None

        now = dt.now(tz.utc)
        days_since = 0.0
        if isinstance(vocab.last_reviewed_at, dt):
            days_since = (now - vocab.last_reviewed_at.replace(tzinfo=tz.utc)).total_seconds() / 86400.0
        elif isinstance(vocab.added_at, dt):
            days_since = (now - vocab.added_at.replace(tzinfo=tz.utc)).total_seconds() / 86400.0

        delta_score = _calc_mastery_delta(
            direction=direction,
            current_score=vocab.mastery_score,
            days_since_last_review=days_since,
            review_count=vocab.review_count,
        )

        if direction > 0:
            new_score = min(5.0, vocab.mastery_score + delta_score)
        else:
            new_score = max(1.0, vocab.mastery_score - delta_score)

        new_mastery = max(1, min(5, round(new_score)))

        vocab.mastery_score = new_score
        vocab.mastery = new_mastery
        vocab.last_reviewed_at = now
        vocab.review_count = vocab.review_count + 1

        await session.commit()

        return {
            "mastery": new_mastery,
            "masteryScore": round(new_score, 2),
            "reviewCount": vocab.review_count,
        }


async def get_recommended_vocab(user_id: int, limit: int = 20) -> list[dict]:
    """
    智能推荐需要复习的单词。

    优先级公式: priority = (6 - mastery) * 3.0 + overdue_days * 1.0
    - mastery 越低 → 越需要复习
    - 上次复习越久 / 从未复习 → 越需要复习
    """
    from datetime import datetime as dt, timezone as tz

    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(Vocabulary).where(Vocabulary.user_id == user_id)
        )
        all_vocab = result.scalars().all()

        now = dt.now(tz.utc)
        scored = []
        for v in all_vocab:
            # 计算 overdue_days
            if isinstance(v.last_reviewed_at, dt):
                ref = v.last_reviewed_at.replace(tzinfo=tz.utc)
            elif isinstance(v.added_at, dt):
                ref = v.added_at.replace(tzinfo=tz.utc)
            else:
                ref = now

            overdue_days = (now - ref).total_seconds() / 86400.0

            priority = (6 - v.mastery) * 3.0 + overdue_days * 1.0
            scored.append((priority, v))

        # 按优先级降序排列
        scored.sort(key=lambda x: x[0], reverse=True)

        # 取 top N
        top = scored[:limit]
        result_list = []
        for _, v in top:
            result_list.append({
                "id": v.id,
                "word": v.word,
                "isPhrase": v.is_phrase,
                "phonetic": v.phonetic,
                "pos": v.pos,
                "mean": v.mean,
                "trans": v.trans,
                "added": v.added_at.isoformat() if isinstance(v.added_at, datetime) else v.added_at,
                "example": v.example,
                "exampleTrans": v.example_trans,
                "mastery": v.mastery,
                "masteryScore": v.mastery_score,
                "lastReviewedAt": v.last_reviewed_at.isoformat() if isinstance(v.last_reviewed_at, datetime) else v.last_reviewed_at,
                "reviewCount": v.review_count,
            })
        return result_list


async def delete_vocabulary(user_id: int, vocab_id: str) -> bool:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(Vocabulary).where(
                Vocabulary.id == vocab_id,
                Vocabulary.user_id == user_id,
            )
        )
        vocab = result.scalars().first()
        if vocab is None:
            return False
        await session.delete(vocab)
        await session.commit()
        return True


async def batch_delete_vocabulary(user_id: int, vocab_ids: list[str]) -> bool:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(Vocabulary).where(
                Vocabulary.id.in_(vocab_ids),
                Vocabulary.user_id == user_id,
            )
        )
        for vocab in result.scalars().all():
            await session.delete(vocab)
        await session.commit()
        return True


async def get_checkins(user_id: int) -> list[dict]:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(CheckIn)
            .where(CheckIn.user_id == user_id)
            .order_by(CheckIn.check_in_date)
        )
        return [{"date": c.check_in_date, "videoId": c.video_id} for c in result.scalars().all()]


async def get_checkins_by_date(user_id: int, date_str: str) -> list[dict]:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(CheckIn, Video)
            .join(Video, CheckIn.video_id == Video.id)
            .where(CheckIn.user_id == user_id, CheckIn.check_in_date == date_str)
            .order_by(CheckIn.id)
        )
        videos = []
        for ci, v in result.all():
            videos.append({
                "id": v.id,
                "title": v.title,
                "titleZh": v.title_zh or None,
                "duration": v.duration,
                "level": v.level,
                "thumb": v.thumb,
                "tag": v.tag,
            })
        return videos


async def is_video_checked_in(user_id: int, video_id: str, date_str: str) -> bool:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(CheckIn).where(
                CheckIn.user_id == user_id,
                CheckIn.video_id == video_id,
                CheckIn.check_in_date == date_str,
            )
        )
        return result.scalar_one_or_none() is not None


async def add_checkin(user_id: int, date_str: str, video_id: str) -> bool:
    session_factory = _get_async_session()
    async with session_factory() as session:
        existing = await session.execute(
            select(CheckIn).where(
                CheckIn.user_id == user_id,
                CheckIn.check_in_date == date_str,
                CheckIn.video_id == video_id,
            )
        )
        if existing.scalar_one_or_none() is not None:
            return True

        checkin = CheckIn(user_id=user_id, check_in_date=date_str, video_id=video_id)
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