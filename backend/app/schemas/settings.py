from pydantic import BaseModel, Field
from datetime import datetime


class SettingsBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=100)
    company_logo: str | None = None
    razon_social: str | None = None
    cedula_juridica: str | None = None
    telefono: str | None = None
    email: str | None = None
    direccion: str | None = None


class SettingsUpdate(BaseModel):
    company_name: str | None = Field(None, min_length=1, max_length=100)
    company_logo: str | None = None
    razon_social: str | None = None
    cedula_juridica: str | None = None
    telefono: str | None = None
    email: str | None = None
    direccion: str | None = None


class SettingsResponse(SettingsBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
