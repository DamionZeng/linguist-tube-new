import json
import re

from sqlalchemy import select, func

from core.database import _get_async_session
from models.category import Category
from models.video import Video
from models.carousel import CarouselItem

DEFAULT_PAGE_SIZE = 50

# 时长区间定义 (单位: 秒)
DURATION_RANGES: dict[str, tuple[int | None, int | None]] = {
    "short": (0, 300),       # < 5 分钟
    "medium": (300, 900),    # 5-15 分钟
    "long": (900, 1800),     # 15-30 分钟
    "extended": (1800, None), # > 30 分钟
}


def _parse_duration(duration_str: str | None) -> int | None:
    """将时长字符串 'MM:SS' 或 'HH:MM:SS' 转为秒数"""
    if not duration_str:
        return None
    parts = duration_str.strip().split(":")
    try:
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(float(parts[1]))
        elif len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(float(parts[2]))
    except (ValueError, IndexError):
        return None
    return None


def _match_duration(duration_str: str | None, duration_range: str) -> bool:
    """判断时长是否在指定区间内"""
    seconds = _parse_duration(duration_str)
    if seconds is None:
        return False
    r = DURATION_RANGES.get(duration_range)
    if not r:
        return True
    lo, hi = r
    if lo is not None and seconds < lo:
        return False
    if hi is not None and seconds >= hi:
        return False
    return True


async def get_explore_data(
    offset: int = 0,
    limit: int = DEFAULT_PAGE_SIZE,
    category: str | None = None,
    source_type: str | None = None,
    level: str | None = None,
    duration_range: str | None = None,
) -> dict:
    """获取探索页数据，videos 支持分页、分类、等级和时长筛选。"""
    session_factory = _get_async_session()
    async with session_factory() as session:
        # 分类列表（通常很少，不分页）
        cat_result = await session.execute(select(Category).order_by(Category.id))
        categories = ["All"] + [c.name for c in cat_result.scalars().all()]

        # 构建视频查询（分类、等级可在 SQL 层筛选，时长在 Python 层筛选）
        vid_query = select(Video)
        if category and category != "All":
            vid_query = vid_query.where(Video.category == category)
        if source_type:
            vid_query = vid_query.where(Video.source_type == source_type)
        if level and level != "All":
            vid_query = vid_query.where(Video.level == level)

        # 先查出所有匹配分类/等级/来源的视频
        vid_result = await session.execute(
            vid_query.order_by(Video.sort_order, Video.id)
        )
        all_videos = list(vid_result.scalars().all())

        # 时长筛选（Python 层）
        if duration_range and duration_range != "All":
            all_videos = [
                v for v in all_videos
                if _match_duration(v.duration, duration_range)
            ]

        total = len(all_videos)

        # 分页
        paged = all_videos[offset:offset + limit]
        videos = []
        for v in paged:
            videos.append({
                "id": v.id,
                "title": v.title,
                "titleZh": v.title_zh or None,
                "duration": v.duration,
                "level": v.level,
                "thumb": v.thumb,
                "tag": v.tag,
                "category": v.category,
                "isVipOnly": v.is_vip_only,
            })

        # 轮播（通常很少，不分页）— title/desc 取自关联的 videos 表
        car_result = await session.execute(
            select(CarouselItem, Video.title, Video.title_zh, Video.description, Video.description_zh)
            .outerjoin(Video, CarouselItem.video_id == Video.id)
            .order_by(CarouselItem.sort_order, CarouselItem.id)
        )
        carousel = []
        for c, v_title, v_title_zh, v_desc, v_desc_zh in car_result.all():
            carousel.append({
                "id": c.id,
                "title": v_title or c.title,
                "titleZh": v_title_zh or c.title_zh or None,
                "subtitle": c.subtitle,
                "desc": v_desc or c.desc,
                "descZh": v_desc_zh or c.desc_zh or None,
                "image": c.image,
                "tag": c.tag,
            })

        return {
            "categories": categories,
            "videos": videos,
            "carousel": carousel,
            "total": total,
            "hasMore": (offset + limit) < total,
        }