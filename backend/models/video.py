from sqlalchemy import String, Boolean, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    duration: Mapped[str] = mapped_column(String(20), nullable=True)
    level: Mapped[str] = mapped_column(String(20), nullable=True)
    thumb: Mapped[str] = mapped_column(Text, nullable=True)
    tag: Mapped[str] = mapped_column(String(50), nullable=True)
    is_vip_only: Mapped[bool] = mapped_column(Boolean, default=False)
    video_url: Mapped[str] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    transcripts = relationship("Transcript", back_populates="video")


class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    video_id: Mapped[str] = mapped_column(String(50), ForeignKey("videos.id"), nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)
    en_text: Mapped[str] = mapped_column(Text, nullable=False)
    zh_text: Mapped[str] = mapped_column(Text, nullable=False)
    highlights_json: Mapped[str] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    video = relationship("Video", back_populates="transcripts")