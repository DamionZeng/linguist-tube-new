from datetime import datetime, timedelta

from sqlalchemy import select

from core.database import _get_async_session
from core.security import hash_password, verify_password, create_access_token
from models.user import User
from models.registration_key import RegistrationKey


class AuthError(Exception):
    pass


def _compute_vip_expires_at(vip_duration_days: int | None) -> datetime | None:
    """根据 VIP 时长天数计算到期时间。None 表示终生 VIP。"""
    if vip_duration_days is None:
        return None  # 终生 VIP
    return datetime.utcnow() + timedelta(days=vip_duration_days)


async def _validate_key(session, key: str) -> RegistrationKey:
    """验证卡密是否有效，返回 RegistrationKey 记录。"""
    result = await session.execute(
        select(RegistrationKey).where(RegistrationKey.key == key)
    )
    key_record = result.scalar_one_or_none()

    if key_record is None:
        raise AuthError("Invalid registration key")

    if key_record.is_used:
        raise AuthError("This registration key has already been used")

    if key_record.expires_at < datetime.utcnow():
        raise AuthError("This registration key has expired")

    return key_record


async def login(username: str, password: str) -> dict:
    session_factory = _get_async_session()
    async with session_factory() as session:
        result = await session.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()

        if user is None or not verify_password(password, user.password_hash):
            raise AuthError("Invalid username or password")

        # 检查限时 VIP 是否已过期，自动降级
        if user.role == "vip" and user.vip_expires_at is not None:
            if user.vip_expires_at < datetime.utcnow():
                user.role = "user"
                user.vip_expires_at = None
                await session.commit()

        token = create_access_token({"sub": str(user.id), "role": user.role})

        return {
            "username": user.username,
            "role": user.role,
            "vip_expires_at": user.vip_expires_at.isoformat() if user.vip_expires_at else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
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
        key_record = await _validate_key(session, invite_key)

        # 3. 计算 VIP 到期时间
        vip_expires_at = _compute_vip_expires_at(key_record.vip_duration_days)

        # 4. 创建用户
        password_hash = hash_password(password)
        user = User(
            username=username,
            password_hash=password_hash,
            role="vip",
            vip_expires_at=vip_expires_at,
        )
        session.add(user)

        # 5. 标记卡密为已使用
        key_record.is_used = True
        await session.flush()
        key_record.used_by = user.id

        await session.commit()
        await session.refresh(user)

        # 6. 自动登录返回 token
        token = create_access_token({"sub": str(user.id), "role": user.role})

        return {
            "username": user.username,
            "role": user.role,
            "vip_expires_at": user.vip_expires_at.isoformat() if user.vip_expires_at else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "token": token,
        }


async def redeem_key(user_id: int, key: str) -> dict:
    """已注册用户使用卡密升级/续费 VIP。"""
    session_factory = _get_async_session()
    async with session_factory() as session:
        # 1. 查找用户
        result = await session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise AuthError("User not found")

        # 2. 查找并验证卡密
        key_record = await _validate_key(session, key)

        # 3. 计算新的 VIP 到期时间
        if key_record.vip_duration_days is None:
            # 终生 VIP 卡密 → 直接设为终生
            user.vip_expires_at = None
        else:
            # 限时卡密 → 叠加/延长 VIP 时间
            now = datetime.utcnow()
            if user.role == "vip":
                # 已是 VIP：从当前到期时间或现在开始叠加
                base = user.vip_expires_at if user.vip_expires_at and user.vip_expires_at > now else now
                user.vip_expires_at = base + timedelta(days=key_record.vip_duration_days)
            else:
                # 非 VIP：从现在开始计算
                user.vip_expires_at = now + timedelta(days=key_record.vip_duration_days)

        user.role = "vip"

        # 4. 标记卡密为已使用
        key_record.is_used = True
        await session.flush()
        key_record.used_by = user.id

        await session.commit()
        await session.refresh(user)

        token = create_access_token({"sub": str(user.id), "role": user.role})

        return {
            "username": user.username,
            "role": user.role,
            "vip_expires_at": user.vip_expires_at.isoformat() if user.vip_expires_at else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "token": token,
        }
