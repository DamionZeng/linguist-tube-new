from sqlalchemy import select

from core.database import _get_async_session
from core.security import verify_password, create_access_token
from models.user import User


class AuthError(Exception):
    pass


async def login(username: str, password: str) -> dict:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()

        if user is None or not verify_password(password, user.password_hash):
            raise AuthError("Invalid username or password")

        token = create_access_token({"sub": str(user.id), "role": user.role})

        return {
            "username": user.username,
            "role": user.role,
            "token": token,
        }