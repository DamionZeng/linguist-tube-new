from sqlalchemy import String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class CheckIn(Base):
    __tablename__ = "check_ins"
    __table_args__ = (
        UniqueConstraint("user_id", "check_in_date", "video_id", name="uq_user_checkin_date_video"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    check_in_date: Mapped[str] = mapped_column(String(10), nullable=False)
    video_id: Mapped[str | None] = mapped_column(String(50), ForeignKey("videos.id"), nullable=True)
