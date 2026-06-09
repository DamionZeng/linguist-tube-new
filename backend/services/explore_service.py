import json

from sqlalchemy import select, func

from core.database import _get_async_session
from models.category import Category
from models.video import Video
from models.carousel import CarouselItem

DEFAULT_PAGE_SIZE = 50


async def get_explore_data(
    offset: int = 0,
    limit: int = DEFAULT_PAGE_SIZE,
    category: str | None = None,
) -> dict:
    """获取探索页数据，videos 支持分页和分类筛选。"""
    session_factory = _get_async_session()
    async with session_factory() as session:
        # 分类列表（通常很少，不分页）
        cat_result = await session.execute(select(Category).order_by(Category.id))
        categories = ["All"] + [c.name for c in cat_result.scalars().all()]

        # 构建视频查询（支持分类筛选）
        vid_query = select(Video)
        count_query = select(func.count(Video.id))
        if category and category != "All":
            vid_query = vid_query.where(Video.category == category)
            count_query = count_query.where(Video.category == category)

        # 视频总数
        total_result = await session.execute(count_query)
        total = total_result.scalar_one()

        # 视频分页查询
        vid_result = await session.execute(
            vid_query
            .order_by(Video.sort_order, Video.id)
            .offset(offset)
            .limit(limit)
        )
        videos = []
        for v in vid_result.scalars().all():
            videos.append({
                "id": v.id,
                "title": v.title,
                "duration": v.duration,
                "level": v.level,
                "thumb": v.thumb,
                "tag": v.tag,
                "category": v.category,
                "isVipOnly": v.is_vip_only,
            })

        # 轮播（通常很少，不分页）
        car_result = await session.execute(
            select(CarouselItem).order_by(CarouselItem.sort_order, CarouselItem.id)
        )
        carousel = []
        for c in car_result.scalars().all():
            carousel.append({
                "id": c.id,
                "title": c.title,
                "subtitle": c.subtitle,
                "desc": c.desc,
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