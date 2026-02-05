from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user, oauth2_scheme
from app.models.usuario import Usuario
from app.schemas.auth import RefreshRequest, TokenResponse
from app.schemas.common import MessageResponse
from app.schemas.usuario import UsuarioResponse
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    return await auth_service.login(db, form_data.username, form_data.password)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.refresh_tokens(db, data.refresh_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: Usuario = Depends(get_current_active_user),
    token: str = Depends(oauth2_scheme),
):
    await auth_service.logout(str(current_user.id), token)
    return MessageResponse(message="Sesión cerrada exitosamente")


@router.get("/me", response_model=UsuarioResponse)
async def me(current_user: Usuario = Depends(get_current_active_user)):
    return current_user
