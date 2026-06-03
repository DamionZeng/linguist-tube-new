"""管理后台服务：删除视频及相关数据。"""

import logging

from sqlalchemy import select, delete

from core.database import _get_async_session
from core.r2 import delete_file as _r2_delete_file, _get_client, _bucket
from models.video import Video, Transcript
from models.check_in import CheckIn
from models.watch_history import WatchHistory
from models.favorite_video import FavoriteVideo
from models.favorite_sentence import FavoriteSentence
from models.carousel import CarouselItem
from models.registration_key import RegistrationKey

logger = logging.getLogger(__name__)


async def delete_video_by_id(video_id: str) -> dict:
    """删除视频及其所有关联数据，包括数据库记录和 R2 存储文件。

    删除内容包括：
    - R2: 视频文件、封面图
    - 数据库: check_ins, watch_history, favorite_videos,
      favorite_sentences, carousel_items, transcripts, video
    """
    session_factory = _get_async_session()
    deleted = {
        "video_id": video_id,
        "r2_files": [],
        "db_records": {},
    }

    async with session_factory() as session:
        # 1. 查找视频记录
        result = await session.execute(select(Video).where(Video.id == video_id))
        video = result.scalar_one_or_none()

        if video is None:
            return {"found": False, "video_id": video_id, "message": "视频不存在"}

        video_title = video.title
        video_url = video.video_url
        thumb_url = video.thumb

        # 2. 删除 R2 文件 (在删除数据库记录之前进行，以便获取 URL)
        r2_deleted = 0
        # 删除视频文件
        if video_url:
            try:
                _r2_delete_file(video_url)
                deleted["r2_files"].append(video_url)
                r2_deleted += 1
            except Exception as e:
                logger.warning(f"删除 R2 视频文件失败 {video_url}: {e}")

        # 删除封面 (尝试多种扩展名)
        if thumb_url and not thumb_url.startswith("http"):
            thumb_url = None  # 本地路径不处理
        if thumb_url:
            try:
                _r2_delete_file(thumb_url)
                deleted["r2_files"].append(thumb_url)
                r2_deleted += 1
            except Exception as e:
                logger.warning(f"删除 R2 封面失败 {thumb_url}: {e}")

        # 额外尝试常见扩展名的 R2 文件 (防止 thumb_url 为空或格式不对)
        client = _get_client()
        bucket = _bucket()
        for ext in ("jpg", "webp"):
            key = f"thumbnails/{video_id}.{ext}"
            try:
                client.delete_object(Bucket=bucket, Key=key)
                deleted["r2_files"].append(key)
                r2_deleted += 1
            except Exception:
                pass
        for ext in ("mp4", "webm"):
            key = f"videos/{video_id}.{ext}"
            try:
                client.delete_object(Bucket=bucket, Key=key)
                if key not in deleted["r2_files"]:
                    deleted["r2_files"].append(key)
                    r2_deleted += 1
            except Exception:
                pass

        # 3. 按外键依赖顺序删除数据库记录
        # CarouselItem (video_id FK nullable)
        carousel_result = await session.execute(
            delete(CarouselItem).where(CarouselItem.video_id == video_id)
        )
        deleted["db_records"]["carousel_items"] = carousel_result.rowcount

        # CheckIn (video_id FK nullable)
        checkin_result = await session.execute(
            delete(CheckIn).where(CheckIn.video_id == video_id)
        )
        deleted["db_records"]["check_ins"] = checkin_result.rowcount

        # WatchHistory
        history_result = await session.execute(
            delete(WatchHistory).where(WatchHistory.video_id == video_id)
        )
        deleted["db_records"]["watch_history"] = history_result.rowcount

        # FavoriteVideo
        fav_vid_result = await session.execute(
            delete(FavoriteVideo).where(FavoriteVideo.video_id == video_id)
        )
        deleted["db_records"]["favorite_videos"] = fav_vid_result.rowcount

        # FavoriteSentence (通过 video_title 关联)
        if video_title:
            fav_sent_result = await session.execute(
                delete(FavoriteSentence).where(FavoriteSentence.video_title == video_title)
            )
            deleted["db_records"]["favorite_sentences"] = fav_sent_result.rowcount

        # Transcript
        trans_result = await session.execute(
            delete(Transcript).where(Transcript.video_id == video_id)
        )
        deleted["db_records"]["transcripts"] = trans_result.rowcount

        # Video (最后删除)
        video_result = await session.execute(
            delete(Video).where(Video.id == video_id)
        )
        deleted["db_records"]["video"] = video_result.rowcount

        await session.commit()

    total_db = sum(deleted["db_records"].values())
    deleted["summary"] = f"删除完成: R2 文件 {r2_deleted} 个, 数据库记录 {total_db} 条"

    logger.info(f"视频 {video_id} 删除完成: {deleted['summary']}")
    return {"found": True, **deleted}


async def promote_to_carousel(video_id: str, subtitle: str | None = None) -> dict:
    """将视频提升到轮播图。

    取视频的 id、title、thumb、tag，创建 CarouselItem。
    如果已存在则跳过。
    """
    session_factory = _get_async_session()
    async with session_factory() as session:
        # 查找视频
        result = await session.execute(select(Video).where(Video.id == video_id))
        video = result.scalar_one_or_none()

        if video is None:
            return {"found": False, "video_id": video_id, "message": "视频不存在"}

        # 检查轮播图是否已存在
        exist_result = await session.execute(
            select(CarouselItem).where(CarouselItem.id == video_id)
        )
        if exist_result.scalar_one_or_none():
            return {"found": True, "video_id": video_id, "message": "已在轮播图中", "action": "skip"}

        # 获取最大 sort_order
        max_order_result = await session.execute(
            select(CarouselItem.sort_order).order_by(CarouselItem.sort_order.desc()).limit(1)
        )
        max_order = max_order_result.scalar() or 0

        carousel = CarouselItem(
            id=video.id,
            title=video.title,
            subtitle=subtitle or "",
            desc=video.description or "",
            image=video.thumb or "",
            tag=video.tag or "",
            video_id=video.id,
            sort_order=max_order + 1,
        )
        session.add(carousel)
        await session.commit()

    logger.info(f"视频 {video_id} 已提升到轮播图")
    return {"found": True, "video_id": video_id, "message": "已添加到轮播图", "action": "added"}


async def delete_video_batch(video_ids: list[str]) -> dict:
    """批量删除视频。"""
    results = []
    success_count = 0
    fail_count = 0
    not_found_count = 0

    for vid in video_ids:
        try:
            r = await delete_video_by_id(vid)
            if r.get("found"):
                success_count += 1
            else:
                not_found_count += 1
            results.append({"video_id": vid, **r})
        except Exception as e:
            fail_count += 1
            results.append({"video_id": vid, "found": False, "error": str(e)})

    return {
        "total": len(video_ids),
        "success": success_count,
        "not_found": not_found_count,
        "failed": fail_count,
        "results": results,
    }


async def generate_registration_key(days_valid: int = 365) -> dict:
    """生成一个随机注册卡密。"""
    import secrets
    import string
    from datetime import datetime, timedelta

    # 生成 16 位随机码: 前缀 VIP + 时间戳 + 随机字符
    alphabet = string.ascii_uppercase + string.digits
    random_part = "".join(secrets.choice(alphabet) for _ in range(12))
    key = f"VIP-{random_part}"

    expires_at = datetime.utcnow() + timedelta(days=days_valid)

    session_factory = _get_async_session()
    async with session_factory() as session:
        registration_key = RegistrationKey(key=key, expires_at=expires_at)
        session.add(registration_key)
        await session.commit()

    logger.info(f"生成新卡密: {key}, 有效期 {days_valid} 天")
    return {
        "key": key,
        "expires_at": expires_at.isoformat(),
        "days_valid": days_valid,
    }
