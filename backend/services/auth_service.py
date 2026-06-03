from datetime import datetime

from sqlalchemy import select

from core.database import _get_async_session
from core.security import hash_password, verify_password, create_access_token
from models.user import User
from models.registration_key import RegistrationKey


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


async def register(username: str, password: str, invite_key: str) -> dict:
    session_factory = _get_async_session()
    async with session_factory() as session:
        # 1. 检查用户名是否已存在
        existing = await session.execute(
            select(User).where(User.username == username)
        )
        if existing.scalar_one_or_none():
            raise AuthError("Username already exists")

        # 2. 查找并验证卡密
        key_result = await session.execute(
            select(RegistrationKey).where(RegistrationKey.key == invite_key)
        )
        key_record = key_result.scalar_one_or_none()

        if key_record is None:
            raise AuthError("Invalid registration key")

        if key_record.is_used:
            raise AuthError("This registration key has already been used")

        if key_record.expires_at < datetime.utcnow():
            raise AuthError("This registration key has expired")

        # 3. 创建用户 (有效卡密 → VIP)
        password_hash = hash_password(password)
        user = User(username=username, password_hash=password_hash, role="vip")
        session.add(user)

        # 4. 标记卡密为已使用
        key_record.is_used = True

        await session.commit()
        await session.refresh(user)

        # 5. 自动登录返回 token
        token = create_access_token({"sub": str(user.id), "role": user.role})

        return {
            "username": user.username,
            "role": user.role,
            "token": token,
        }