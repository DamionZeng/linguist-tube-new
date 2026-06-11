from sqlalchemy import String, Boolean, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from database import Base


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    title_zh: Mapped[str] = mapped_column(String(255), nullable=True)
    duration: Mapped[str] = mapped_column(String(20), nullable=True)
    level: Mapped[str] = mapped_column(String(20), nullable=True)
    thumb: Mapped[str] = mapped_column(Text, nullable=True)
    tag: Mapped[str] = mapped_column(String(255), nullable=True)
    is_vip_only: Mapped[bool] = mapped_column(Boolean, default=False)
    video_url: Mapped[str] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    video_id: Mapped[str] = mapped_column(String(50), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    description_zh: Mapped[str] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=True)
    source_type: Mapped[str] = mapped_column(String(20), nullable=True, default="platform")

    transcripts = relationship("Transcript", back_populates="video")


class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    video_id: Mapped[str] = mapped_column(String(50), ForeignKey("videos.id"), nullable=False)
    start_time: Mapped[str] = mapped_column(String(20), nullable=False)
    end_time: Mapped[str] = mapped_column(String(20), nullable=False)
    en_text: Mapped[str] = mapped_column(Text, nullable=False)
    zh_text: Mapped[str] = mapped_column(Text, nullable=False)
    highlights_json: Mapped[str] = mapped_column(Text, nullable=True)
    words_json: Mapped[str] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    video = relationship("Video", back_populates="transcripts")


class ParseTask(Base):
    __tablename__ = "parse_tasks"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    youtube_url: Mapped[str] = mapped_column(Text, nullable=False)
    download: Mapped[bool] = mapped_column(Boolean, default=False)
    quality: Mapped[str] = mapped_column(String(20), nullable=True)
    # pending / processing / completed / failed
    status: Mapped[str] = mapped_column(String(20), default="pending")
    # 当前步骤描述
    progress: Mapped[str] = mapped_column(String(255), nullable=True)
    # 当前步骤编号 (用于断点续传)
    current_step: Mapped[int] = mapped_column(Integer, default=0)
    # 步骤中间数据 JSON (用于断点续传)
    step_data: Mapped[str] = mapped_column(Text, nullable=True)
    # 完成后的视频 ID
    video_id: Mapped[str] = mapped_column(String(50), nullable=True)
    # 结果 JSON
    result_json: Mapped[str] = mapped_column(Text, nullable=True)
    # 错误信息
    error: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    finished_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
