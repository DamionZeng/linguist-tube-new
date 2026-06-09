from sqlalchemy import String, Integer, Text, ForeignKey, DateTime, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class Vocabulary(Base):
    __tablename__ = "vocabulary"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    word: Mapped[str] = mapped_column(String(100), nullable=False)
    is_phrase: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    phonetic: Mapped[str] = mapped_column(String(100), nullable=True)
    pos: Mapped[str] = mapped_column(String(20), nullable=True)
    mean: Mapped[str] = mapped_column(Text, nullable=True)
    trans: Mapped[str] = mapped_column(Text, nullable=True)
    example: Mapped[str] = mapped_column(Text, nullable=True)
    example_trans: Mapped[str] = mapped_column(Text, nullable=True)
    added_at = mapped_column(DateTime(timezone=True), nullable=True)
    mastery: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    mastery_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    last_reviewed_at = mapped_column(DateTime(timezone=True), nullable=True)
    review_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)