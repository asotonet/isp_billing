from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.settings import SettingsResponse, SettingsUpdate
from app.services import settings as settings_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Get application settings.
    """
    settings = await settings_service.get_settings(db)
    return settings


@router.put("", response_model=SettingsResponse)
async def update_settings(
    data: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Update application settings.
    Only admins should be able to update settings (enforced by RBAC).
    """
    settings = await settings_service.update_settings(db, data)
    return settings
