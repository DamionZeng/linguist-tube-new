import json

from sqlalchemy import select

from core.database import _get_async_session
from models.category import Category
from models.video import Video
from models.carousel import CarouselItem


async def get_explore_data() -> dict:
    session_factory = _get_async_session()
    async with session_factory() as session:
        cat_result = await session.execute(select(Category).order_by(Category.id))
        categories = ["All"] + [c.name for c in cat_result.scalars().all()]

        vid_result = await session.execute(
            select(Video).order_by(Video.sort_order, Video.id)
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

        return {"categories": categories, "videos": videos, "carousel": carousel}