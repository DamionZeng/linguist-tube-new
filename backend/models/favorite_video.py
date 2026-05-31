from sqlalchemy import String, Integer, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class FavoriteVideo(Base):
    __tablename__ = "favorite_videos"
    __table_args__ = (
        UniqueConstraint("user_id", "video_id", name="uq_user_video"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    video_id: Mapped[str] = mapped_column(String(50), ForeignKey("videos.id"), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())