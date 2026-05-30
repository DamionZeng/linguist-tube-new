from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import inspect, text

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


_TYPE_MAP = {
    "String": "VARCHAR",
    "Text": "TEXT",
    "Boolean": "BOOLEAN",
    "Integer": "INTEGER",
    "Float": "FLOAT",
    "BigInteger": "BIGINT",
    "Date": "DATE",
    "DateTime": "TIMESTAMP",
    "Time": "TIME",
    "Numeric": "NUMERIC",
    "LargeBinary": "BYTEA",
    "JSON": "JSONB",
}


def _column_to_sql_type(col) -> str:
    col_type = type(col.type).__name__
    sql_type = _TYPE_MAP.get(col_type, "TEXT")
    if col_type == "String" and hasattr(col.type, "length") and col.type.length:
        sql_type = f"VARCHAR({col.type.length})"
    return sql_type


async def _auto_migrate(conn):
    tables_in_db = set()
    result = await conn.execute(text(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public'"
    ))
    for row in result:
        tables_in_db.add(row[0])

    for table_name, table_obj in Base.metadata.tables.items():
        if table_name not in tables_in_db:
            continue

        cols_in_db = set()
        result = await conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = :table"
        ), {"table": table_name})
        for row in result:
            cols_in_db.add(row[0])

        for col_name, col_obj in table_obj.columns.items():
            if col_name in cols_in_db:
                continue

            sql_type = _column_to_sql_type(col_obj)
            parts = [f"ALTER TABLE {table_name} ADD COLUMN {col_name} {sql_type}"]

            if col_obj.nullable or col_obj.default is not None:
                pass
            else:
                if not col_obj.primary_key:
                    parts[0] += " NOT NULL"

            if col_obj.server_default is not None:
                parts[0] += f" DEFAULT {col_obj.server_default.arg}"
            elif col_obj.default is not None and hasattr(col_obj.default, "arg"):
                default_val = col_obj.default.arg
                if isinstance(default_val, bool):
                    parts[0] += f" DEFAULT {'true' if default_val else 'false'}"
                elif isinstance(default_val, (int, float)):
                    parts[0] += f" DEFAULT {default_val}"
                elif isinstance(default_val, str):
                    parts[0] += f" DEFAULT '{default_val}'"

            stmt = parts[0]
            print(f"  [Auto-Migrate] {stmt}")
            await conn.execute(text(stmt))


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
        await _auto_migrate(conn)
