from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class Vocabulary(Base):
    __tablename__ = "vocabulary"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    word: Mapped[str] = mapped_column(String(100), nullable=False)
    phonetic: Mapped[str] = mapped_column(String(100), nullable=True)
    pos: Mapped[str] = mapped_column(String(20), nullable=True)
    mean: Mapped[str] = mapped_column(Text, nullable=True)
    trans: Mapped[str] = mapped_column(Text, nullable=True)
    example: Mapped[str] = mapped_column(Text, nullable=True)
    example_trans: Mapped[str] = mapped_column(Text, nullable=True)
    added_at: Mapped[str] = mapped_column(String(50), nullable=True)