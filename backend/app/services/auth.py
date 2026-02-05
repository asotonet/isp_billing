from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import UnauthorizedError
from app.core.redis import get_redis
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.models.usuario import Usuario
from app.schemas.auth import TokenResponse


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Usuario:
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        raise UnauthorizedError("Credenciales inválidas")
    if not user.is_active:
        raise UnauthorizedError("Usuario inactivo")
    return user


async def login(db: AsyncSession, email: str, password: str) -> TokenResponse:
    user = await authenticate_user(db, email, password)
    token_data = {"sub": str(user.id), "email": user.email, "rol": user.rol.value}

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Store refresh token in Redis
    redis = get_redis()
    await redis.setex(
        f"refresh:{str(user.id)}",
        settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        refresh_token,
    )

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


async def refresh_tokens(db: AsyncSession, refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise UnauthorizedError("Refresh token inválido")

    user_id = payload.get("sub")
    redis = get_redis()
    stored_token = await redis.get(f"refresh:{user_id}")
    if stored_token != refresh_token:
        raise UnauthorizedError("Refresh token inválido o expirado")

    result = await db.execute(
        select(Usuario).where(Usuario.id == user_id, Usuario.is_active.is_(True))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedError("Usuario no encontrado")

    token_data = {"sub": str(user.id), "email": user.email, "rol": user.rol.value}
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)

    await redis.setex(
        f"refresh:{str(user.id)}",
        settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        new_refresh,
    )

    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


async def logout(user_id: str, access_token: str) -> None:
    redis = get_redis()
    # Blacklist the access token
    await redis.setex(
        f"blacklist:{access_token}",
        settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "1",
    )
    # Remove refresh token
    await redis.delete(f"refresh:{user_id}")
