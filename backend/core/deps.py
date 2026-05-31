from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.security import decode_access_token
from core.database import _get_async_session
from models.user import User

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
) -> User | None:
    if credentials is None:
        return None

    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        return None

    user_id_str = payload.get("sub")
    if user_id_str is None:
        return None

    session_factory = _get_async_session()
    async with session_factory() as session:
        from sqlalchemy import select

        result = await session.execute(select(User).where(User.id == int(user_id_str)))
        user = result.scalar_one_or_none()
        return user


async def get_required_user(
    user: User | None = Depends(get_current_user),
) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user