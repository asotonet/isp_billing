"""Seed script: creates default admin user and sample plans."""

import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.plan import Plan
from app.models.usuario import RolUsuario, Usuario


async def seed():
    async with async_session() as session:
        await seed_admin(session)
        await seed_plans(session)
        await session.commit()
    print("Seed completado exitosamente.")


async def seed_admin(session: AsyncSession):
    result = await session.execute(select(Usuario).where(Usuario.email == "admin@isp.local"))
    if result.scalar_one_or_none():
        print("Admin ya existe, omitiendo.")
        return

    from passlib.context import CryptContext

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    admin = Usuario(
        email="admin@isp.local",
        hashed_password=pwd_context.hash("admin123"),
        nombre_completo="Administrador",
        rol=RolUsuario.ADMIN,
        is_active=True,
    )
    session.add(admin)
    print("Admin creado: admin@isp.local / admin123")


async def seed_plans(session: AsyncSession):
    result = await session.execute(select(Plan).limit(1))
    if result.scalar_one_or_none():
        print("Planes ya existen, omitiendo.")
        return

    planes = [
        Plan(
            nombre="Básico 10 Mbps",
            descripcion="Plan básico residencial",
            velocidad_bajada_mbps=10,
            velocidad_subida_mbps=5,
            precio_mensual=15000,
            moneda="CRC",
        ),
        Plan(
            nombre="Estándar 25 Mbps",
            descripcion="Plan estándar residencial",
            velocidad_bajada_mbps=25,
            velocidad_subida_mbps=10,
            precio_mensual=25000,
            moneda="CRC",
        ),
        Plan(
            nombre="Premium 50 Mbps",
            descripcion="Plan premium residencial",
            velocidad_bajada_mbps=50,
            velocidad_subida_mbps=25,
            precio_mensual=40000,
            moneda="CRC",
        ),
        Plan(
            nombre="Empresarial 100 Mbps",
            descripcion="Plan empresarial con IP fija",
            velocidad_bajada_mbps=100,
            velocidad_subida_mbps=50,
            precio_mensual=75000,
            moneda="CRC",
        ),
    ]
    session.add_all(planes)
    print(f"{len(planes)} planes creados.")


if __name__ == "__main__":
    asyncio.run(seed())
