from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.settings import Settings
from app.schemas.settings import SettingsUpdate


async def get_settings(db: AsyncSession) -> Settings:
    """
    Get application settings. If no settings exist, create default settings.
    """
    result = await db.execute(select(Settings).limit(1))
    settings = result.scalar_one_or_none()

    if not settings:
        # Create default settings if none exist
        settings = Settings(
            company_name="ISP Billing",
            razon_social=None,
            cedula_juridica=None,
            telefono=None,
            email=None,
            direccion=None,
            company_logo=None,
        )
        db.add(settings)
        await db.flush()
        await db.refresh(settings)

    return settings


async def update_settings(db: AsyncSession, data: SettingsUpdate) -> Settings:
    """
    Update application settings. Only one settings record should exist.
    """
    settings = await get_settings(db)

    # Update only provided fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)

    await db.flush()
    await db.refresh(settings)
    return settings
