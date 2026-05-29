from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class CarouselItem(Base):
    __tablename__ = "carousel_items"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subtitle: Mapped[str] = mapped_column(String(255), nullable=True)
    desc: Mapped[str] = mapped_column(Text, nullable=True)
    image: Mapped[str] = mapped_column(Text, nullable=True)
    tag: Mapped[str] = mapped_column(String(50), nullable=True)
    video_id: Mapped[str] = mapped_column(String(50), ForeignKey("videos.id"), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)