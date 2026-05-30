from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from core.config import get_settings


class Base(DeclarativeBase):
    pass


_engine = None
_async_session = None


def _get_engine():
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(
            settings.database_url,
            echo=False,
            pool_size=10,
            max_overflow=20,
            connect_args={"ssl": "require"},
        )
    return _engine


def _get_async_session():
    global _async_session
    if _async_session is None:
        _async_session = async_sessionmaker(
            _get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _async_session


async def get_db() -> AsyncSession:
    session_factory = _get_async_session()
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    from models.user import User  # noqa
    from models.video import Video, Transcript  # noqa
    from models.category import Category  # noqa
    from models.carousel import CarouselItem  # noqa
    from models.watch_history import WatchHistory  # noqa
    from models.vocabulary import Vocabulary  # noqa
    from models.favorite_sentence import FavoriteSentence  # noqa
    from models.favorite_video import FavoriteVideo  # noqa
    from models.check_in import CheckIn  # noqa
    from models.word_cache import WordCache  # noqa

    async with _get_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)