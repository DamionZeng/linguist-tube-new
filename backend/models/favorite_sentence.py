from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class FavoriteSentence(Base):
    __tablename__ = "favorite_sentences"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    en_text: Mapped[str] = mapped_column(Text, nullable=False)
    zh_text: Mapped[str] = mapped_column(Text, nullable=False)
    video_title: Mapped[str] = mapped_column(String(255), nullable=True)
    time: Mapped[str] = mapped_column(String(10), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())