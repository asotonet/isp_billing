# 🌐 ISP Billing Management System

<div align="center">

![Status](https://img.shields.io/badge/Status-Ready%20for%20Testing-success)
![Phase](https://img.shields.io/badge/Phase-1%20Complete-blue)
![Design](https://img.shields.io/badge/Design-Professional-purple)

**Sistema moderno de facturación y gestión para ISPs en Costa Rica**

[Características](#-características) • [Quick Start](#-quick-start) • [Documentación](#-documentación) • [Tecnologías](#-stack-tecnológico)

</div>

---

## 📋 Descripción

Sistema completo de facturación y gestión para proveedores de internet (ISPs) desarrollado específicamente para Costa Rica. Incluye gestión de clientes, contratos, planes, pagos, y está preparado para integración con Factura Electrónica de Hacienda.

### ✨ Características Principales

- 👥 **Gestión de Clientes**: CRUD completo con validación de cédulas costarricenses
- 📄 **Contratos**: Auto-generación de números, estados, días de facturación
- 📡 **Planes**: Configuración de velocidades y precios flexibles
- 💳 **Pagos**: Registro, validación, soporte para SINPE Móvil
- 🔐 **Autenticación**: JWT con refresh tokens y blacklist en Redis
- 🎨 **UI Profesional**: Diseño moderno con shadcn/ui y Tailwind CSS 4.0
- 🌙 **Dark Mode**: Tema oscuro completo con transiciones suaves
- 📱 **Responsive**: Diseño mobile-first totalmente adaptable
- 🇨🇷 **Costa Rica First**: Ubicaciones completas (7 provincias, 82+ cantones, 484+ distritos)

---

## 🚀 Quick Start

### Prerrequisitos
- Docker & Docker Compose
- Git

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd isp_billing

# 2. Levantar servicios
docker compose up --build

# 3. En otra terminal: Generar migración inicial
docker compose exec backend alembic revision --autogenerate -m "initial schema"

# 4. Aplicar migración
docker compose exec backend alembic upgrade head

# 5. Poblar datos iniciales
docker compose exec backend python -m app.seed

# 6. Acceder
# Frontend: http://localhost:5173
# API Docs: http://localhost:8000/api/docs
# Login: admin@isp.local / admin123
```

---

## 🛠️ Stack Tecnológico

### Backend
- **FastAPI** - Framework async moderno
- **SQLAlchemy 2.0** - ORM con soporte async
- **PostgreSQL 15** - Base de datos principal
- **Redis 7** - Cache y gestión de sesiones
- **Alembic** - Migraciones de BD
- **Pydantic v2** - Validación de datos

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite 6** - Build tool ultrarrápido
- **Tailwind CSS 4.0** - Utility-first CSS
- **shadcn/ui** - Componentes de alta calidad
- **TanStack Query** - Data fetching y cache
- **React Hook Form + Zod** - Formularios con validación

### DevOps
- **Docker Compose** - Orquestación de servicios
- **GitHub Actions** (TODO) - CI/CD
- **Nginx** (TODO) - Reverse proxy

---

## 📚 Documentación

### Documentos Principales

| Documento | Descripción |
|-----------|-------------|
| **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** | 📊 Estado completo del proyecto, arquitectura, progreso y próximos pasos |
| **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** | 🎨 Sistema de diseño: colores, componentes, animaciones y patrones |
| **[.env.example](./.env.example)** | ⚙️ Variables de entorno necesarias |

### Estructura del Proyecto

```
isp_billing/
├── backend/                 # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/            # Endpoints REST
│   │   ├── core/           # Redis, security, exceptions
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helpers
│   ├── alembic/            # DB migrations
│   └── Dockerfile
│
├── frontend/                # React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/        # shadcn/ui components
│   │   │   ├── layout/    # Sidebar, Header
│   │   │   └── common/    # DataTable, Pagination
│   │   ├── pages/         # Páginas principales
│   │   ├── hooks/         # React Query hooks
│   │   ├── api/           # Axios + interceptors
│   │   └── types/         # TypeScript types
│   └── Dockerfile
│
├── docker-compose.yml       # Orquestación
├── PROJECT_STATUS.md        # Documentación principal
└── DESIGN_SYSTEM.md        # Guía de diseño
```

---

## 🎨 Capturas de Pantalla

### Login
Split-screen moderno con branding y gradientes

### Dashboard
Stats cards con gradientes únicos y animaciones

### Gestión de Clientes
Búsqueda en tiempo real, filtros y paginación

### Dark Mode
Tema oscuro completo con palette purple/violet

---

## 🗺️ Roadmap

### ✅ Fase 1 - Completada
- Core CRUD (Clientes, Planes, Contratos, Pagos)
- Autenticación JWT completa
- UI profesional con shadcn/ui
- Sistema de diseño completo

### 🔄 Fase 2 - Próxima
- [ ] Instalaciones (UI + endpoints)
- [ ] Facturas PDF con ReportLab
- [ ] Integración Factura Electrónica CR (Hacienda API)
- [ ] Envío de emails (SMTP)
- [ ] Reportes y gráficas
- [ ] Nginx en producción

### 🚀 Fase 3 - Futuro
- [ ] Panel de métricas (Grafana)
- [ ] Webhooks para integraciones
- [ ] App móvil (React Native)
- [ ] Portal del cliente
- [ ] Pasarela de pagos

---

## 🤝 Contribuir

Este proyecto está en desarrollo activo. Para contribuir:

1. Fork el proyecto
2. Crea una rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código

- **Backend**: Black (formatter), isort, mypy
- **Frontend**: ESLint + Prettier
- **Commits**: Conventional Commits
- **Tests**: Pytest (backend), Vitest (frontend) - TODO

---

## 📝 Notas Importantes

### Credenciales por Defecto
```
Email: admin@isp.local
Password: admin123
```
⚠️ **Cambiar en producción**

### Variables de Entorno
Copiar `.env.example` a `.env` y ajustar según necesidad.

### Base de Datos
- Puerto PostgreSQL: 5432
- Puerto Redis: 6379
- Datos en volúmenes Docker (persistentes)

---

## 📞 Soporte

Para preguntas, issues o sugerencias:

1. Revisa **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** para estado actual y limitaciones conocidas
2. Consulta **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** para guía de diseño
3. Abre un issue en GitHub con detalles completos

---

## 📄 Licencia

[MIT](LICENSE) - Libre para uso comercial y personal

---

## 🙏 Agradecimientos

- [FastAPI](https://fastapi.tiangolo.com/) por el framework backend
- [shadcn/ui](https://ui.shadcn.com/) por los componentes de UI
- [Tailwind CSS](https://tailwindcss.com/) por el sistema de diseño
- [Lucide](https://lucide.dev/) por los íconos

---

<div align="center">

**Desarrollado para ISPs en Costa Rica 🇨🇷**

[⬆ Volver arriba](#-isp-billing-management-system)

</div>
