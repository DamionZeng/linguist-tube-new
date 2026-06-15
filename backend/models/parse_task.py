from sqlalchemy import String, Boolean, Integer, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class ParseTask(Base):
    __tablename__ = "parse_tasks"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    youtube_url: Mapped[str] = mapped_column(Text, nullable=False)
    download: Mapped[bool] = mapped_column(Boolean, default=False)
    quality: Mapped[str] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    progress: Mapped[str] = mapped_column(String(255), nullable=True)
    current_step: Mapped[int] = mapped_column(Integer, default=0)
    step_data: Mapped[str] = mapped_column(Text, nullable=True)
    video_id: Mapped[str] = mapped_column(String(50), nullable=True)
    result_json: Mapped[str] = mapped_column(Text, nullable=True)
    error: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime, nullable=True)
    started_at: Mapped[str] = mapped_column(DateTime, nullable=True)
    finished_at: Mapped[str] = mapped_column(DateTime, nullable=True)
    heartbeat_at: Mapped[str] = mapped_column(DateTime, nullable=True)
