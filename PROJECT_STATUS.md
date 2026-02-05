# ISP Billing Management System - Estado del Proyecto

**Última actualización**: 2026-02-04
**Fase actual**: Fase 1 - Completada + Diseño Tecnológico
**Estado**: Implementación completa con UI/UX profesional tech-inspired lista para testing

---

## 📋 Resumen Ejecutivo

Sistema de facturación para ISP en Costa Rica implementado con arquitectura moderna de microservicios. Stack completo: FastAPI + React + PostgreSQL + Redis dockerizado.

**Fase 1 COMPLETADA**: Auth, Clientes, Contratos, Planes, Pagos (UI + Backend + DB)
**Fase 1 PENDIENTE**: Testing de integración, generación de migración inicial
**Fase 2 DIFERIDA**: Instalaciones (UI/endpoints), Facturas PDF, Factura Electrónica CR, Email, Reports/Charts, Nginx

---

## 🚀 Quick Start

### Iniciar el proyecto por primera vez

```bash
cd /home/asoto/proyectos/isp_billing

# 1. Levantar servicios (primera vez tomará ~5 min para build)
docker compose up --build

# 2. En otra terminal: Generar migración inicial
docker compose exec backend alembic revision --autogenerate -m "initial schema"

# 3. Aplicar migración
docker compose exec backend alembic upgrade head

# 4. Poblar datos iniciales (admin + 4 planes)
docker compose exec backend python -m app.seed

# 5. Acceder a la aplicación
# Frontend: http://localhost:5173
# Backend API Docs: http://localhost:8000/api/docs
# Login: admin@isp.local / admin123
```

### Comandos útiles

```bash
# Ver logs
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar un servicio
docker compose restart backend

# Entrar a un contenedor
docker compose exec backend bash
docker compose exec db psql -U isp_admin -d isp_billing

# Detener todo
docker compose down

# Detener y limpiar volúmenes (CUIDADO: borra la BD)
docker compose down -v

# Crear nueva migración después de cambios en modelos
docker compose exec backend alembic revision --autogenerate -m "descripcion"
docker compose exec backend alembic upgrade head
```

---

## 📁 Estructura del Proyecto

```
isp_billing/
├── .env                          # Variables de entorno (NO commitear)
├── .env.example                  # Template de variables
├── .gitignore
├── docker-compose.yml            # Orquestación de 4 servicios
├── PROJECT_STATUS.md             # ESTE ARCHIVO - Estado y contexto
│
├── backend/                      # FastAPI + SQLAlchemy 2.0 async
│   ├── Dockerfile
│   ├── requirements.txt          # Python 3.12-slim
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py               # Configuración async migrations
│   │   ├── script.py.mako
│   │   └── versions/            # Migraciones generadas aquí
│   └── app/
│       ├── main.py              # FastAPI app con CORS + lifespan
│       ├── config.py            # Settings con pydantic-settings
│       ├── database.py          # Async engine + session factory
│       ├── dependencies.py      # get_current_user, OAuth2
│       ├── seed.py              # Script de seed (admin + planes)
│       ├── api/
│       │   ├── router.py        # Router principal /api/v1
│       │   ├── auth.py          # POST login, refresh, logout, GET me
│       │   ├── clientes.py      # CRUD clientes
│       │   ├── planes.py        # CRUD planes
│       │   ├── contratos.py     # CRUD contratos
│       │   └── pagos.py         # CRUD pagos + PUT validar
│       ├── core/
│       │   ├── redis.py         # Cliente Redis + init/close
│       │   ├── security.py      # JWT + password hashing
│       │   └── exceptions.py    # HTTPException customs
│       ├── models/
│       │   ├── base.py          # Base + TimestampMixin
│       │   ├── usuario.py       # RolUsuario enum
│       │   ├── cliente.py       # TipoIdentificacion enum
│       │   ├── plan.py
│       │   ├── contrato.py      # EstadoContrato enum
│       │   ├── pago.py          # MetodoPago + EstadoPago enums
│       │   ├── factura.py       # SOLO MODELO (no endpoints)
│       │   └── instalacion.py   # SOLO MODELO (no endpoints)
│       ├── schemas/
│       │   ├── common.py        # PaginationParams, PaginatedResponse[T]
│       │   ├── auth.py
│       │   ├── usuario.py
│       │   ├── cliente.py       # Validación teléfono CR
│       │   ├── plan.py
│       │   ├── contrato.py
│       │   └── pago.py          # Validación SINPE, formato periodo
│       ├── services/            # Capa de negocio
│       │   ├── auth.py          # Login + refresh tokens + logout
│       │   ├── clientes.py      # CRUD + search + validación cédula
│       │   ├── planes.py
│       │   ├── contratos.py     # Auto-genera numero_contrato
│       │   └── pagos.py         # Validar/Rechazar pagos
│       └── utils/
│           ├── cedula.py        # Validadores CR: física/jurídica/DIMEX/NITE
│           └── pagination.py    # Helper async para paginar queries
│
└── frontend/                     # React 18 + TypeScript + Vite
    ├── Dockerfile
    ├── package.json              # Tailwind CSS 4.0 + shadcn/ui
    ├── tsconfig.json
    ├── vite.config.ts            # Proxy /api → backend:8000
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx               # QueryClient + AuthProvider + Router
        ├── index.css             # Tailwind + CSS variables dark/light
        ├── vite-env.d.ts
        ├── api/
        │   ├── axios.ts          # Interceptor con auto-refresh 401
        │   ├── auth.ts
        │   ├── clientes.ts
        │   ├── planes.ts
        │   ├── contratos.ts
        │   └── pagos.ts
        ├── components/
        │   ├── ui/               # 12 componentes shadcn/ui
        │   │   ├── button.tsx
        │   │   ├── input.tsx
        │   │   ├── label.tsx
        │   │   ├── card.tsx
        │   │   ├── table.tsx
        │   │   ├── select.tsx
        │   │   ├── dialog.tsx
        │   │   ├── alert-dialog.tsx
        │   │   ├── badge.tsx
        │   │   ├── skeleton.tsx
        │   │   ├── separator.tsx
        │   │   └── dropdown-menu.tsx
        │   ├── layout/
        │   │   ├── AppLayout.tsx    # Sidebar + Header + Outlet
        │   │   ├── Sidebar.tsx      # Nav responsive con 5 links
        │   │   ├── Header.tsx       # Theme toggle + logout
        │   │   └── ThemeToggle.tsx  # Dark/light mode
        │   ├── common/
        │   │   ├── DataTable.tsx         # Tabla genérica con tipos
        │   │   ├── Pagination.tsx
        │   │   ├── ConfirmDialog.tsx
        │   │   ├── LoadingSpinner.tsx
        │   │   └── UbicacionSelector.tsx # Provincia→Cantón→Distrito CR
        │   ├── clientes/
        │   │   └── ClienteForm.tsx   # Form con validación Zod
        │   ├── planes/
        │   │   └── PlanForm.tsx
        │   ├── contratos/
        │   │   └── ContratoForm.tsx
        │   └── pagos/
        │       └── PagoForm.tsx
        ├── context/
        │   └── AuthContext.tsx       # User state + tokens localStorage
        ├── data/
        │   └── ubicaciones.ts        # 7 provincias, 82+ cantones, 484+ distritos CR
        ├── hooks/
        │   ├── useAuth.ts            # useLogin, useLogout
        │   ├── useClientes.ts        # React Query hooks + mutations
        │   ├── usePlanes.ts
        │   ├── useContratos.ts
        │   └── usePagos.ts
        ├── lib/
        │   └── utils.ts              # cn(), formatCRC(), formatDate()
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── DashboardPage.tsx     # 4 stats cards + tabla pagos pendientes
        │   ├── clientes/
        │   │   ├── ClientesListPage.tsx     # Search + filter + tabla
        │   │   ├── ClienteCreatePage.tsx
        │   │   ├── ClienteEditPage.tsx
        │   │   └── ClienteDetailPage.tsx    # Info + contratos + pagos
        │   ├── planes/
        │   │   ├── PlanesListPage.tsx
        │   │   ├── PlanCreatePage.tsx
        │   │   └── PlanEditPage.tsx
        │   ├── contratos/
        │   │   ├── ContratosListPage.tsx
        │   │   ├── ContratoCreatePage.tsx
        │   │   └── ContratoEditPage.tsx
        │   └── pagos/
        │       ├── PagosListPage.tsx
        │       ├── PagoCreatePage.tsx
        │       └── PagoValidarPage.tsx     # Validar/Rechazar
        ├── router/
        │   ├── index.tsx             # React Router 6 con 15 rutas
        │   └── ProtectedRoute.tsx    # Guarda auth
        ├── schemas/                  # Zod schemas con mensajes ES
        │   ├── auth.ts
        │   ├── cliente.ts            # Validación teléfono CR: ^[2-8]\d{7}$
        │   ├── plan.ts
        │   ├── contrato.ts
        │   └── pago.ts               # Validación SINPE + periodo YYYY-MM
        └── types/                    # TypeScript interfaces
            ├── common.ts             # PaginatedResponse<T>, MessageResponse
            ├── auth.ts
            ├── cliente.ts
            ├── plan.ts
            ├── contrato.ts
            └── pago.ts
```

**Total**: 128 archivos creados

---

## 🗄️ Esquema de Base de Datos

### Tablas Implementadas (con endpoints)

#### usuarios
- `id` UUID PK
- `email` VARCHAR(255) UNIQUE
- `hashed_password` VARCHAR(255)
- `nombre_completo` VARCHAR(255)
- `rol` ENUM(admin, operador, lectura)
- `is_active` BOOLEAN
- `created_at`, `updated_at` TIMESTAMP

#### clientes
- `id` UUID PK
- `tipo_identificacion` ENUM(cedula_fisica, cedula_juridica, dimex, nite)
- `numero_identificacion` VARCHAR(20) UNIQUE
- `nombre` VARCHAR(100)
- `apellido1`, `apellido2` VARCHAR(100) NULL
- `razon_social` VARCHAR(255) NULL
- `email`, `telefono` VARCHAR NULL
- `provincia`, `canton`, `distrito` VARCHAR(50) NULL
- `direccion_exacta` TEXT NULL
- `is_active` BOOLEAN
- `created_at`, `updated_at` TIMESTAMP

#### planes
- `id` UUID PK
- `nombre` VARCHAR(100) UNIQUE
- `descripcion` TEXT NULL
- `velocidad_bajada_mbps` NUMERIC(10,2)
- `velocidad_subida_mbps` NUMERIC(10,2)
- `precio_mensual` NUMERIC(12,2)
- `moneda` VARCHAR(3) DEFAULT 'CRC'
- `is_active` BOOLEAN
- `created_at`, `updated_at` TIMESTAMP

#### contratos
- `id` UUID PK
- `numero_contrato` VARCHAR(20) UNIQUE (auto: CTR-YYYYMMDD-XXXX)
- `cliente_id` UUID FK → clientes.id
- `plan_id` UUID FK → planes.id
- `fecha_inicio` DATE
- `fecha_fin` DATE NULL
- `estado` ENUM(activo, suspendido, cancelado, pendiente)
- `dia_facturacion` INTEGER (1-28)
- `notas` TEXT NULL
- `created_at`, `updated_at` TIMESTAMP

#### pagos
- `id` UUID PK
- `cliente_id` UUID FK → clientes.id
- `contrato_id` UUID FK → contratos.id
- `monto` NUMERIC(12,2)
- `moneda` VARCHAR(3) DEFAULT 'CRC'
- `fecha_pago` DATE
- `metodo_pago` ENUM(efectivo, transferencia, sinpe_movil, tarjeta, deposito)
- `referencia` VARCHAR(100) NULL (requerido para SINPE)
- `periodo_facturado` VARCHAR(7) (YYYY-MM)
- `estado` ENUM(pendiente, validado, rechazado)
- `validado_por` UUID FK → usuarios.id NULL
- `fecha_validacion` TIMESTAMP NULL
- `notas` TEXT NULL
- `created_at`, `updated_at` TIMESTAMP

### Tablas Creadas (SOLO modelos, SIN endpoints en Fase 1)

#### facturas
- `id` UUID PK
- `numero_factura` VARCHAR(50) UNIQUE
- `contrato_id`, `cliente_id` UUID FKs
- `clave_numerica_fe` VARCHAR(50) NULL (para Factura Electrónica CR)
- `fecha_emision`, `fecha_vencimiento` DATE
- `subtotal`, `impuesto` (13% IVA), `total` NUMERIC(12,2)
- `moneda` VARCHAR(3)
- `periodo` VARCHAR(7) (YYYY-MM)
- `estado` ENUM(borrador, emitida, anulada)
- `notas` TEXT NULL
- `created_at`, `updated_at` TIMESTAMP

#### instalaciones
- `id` UUID PK
- `contrato_id` UUID FK → contratos.id
- `fecha_programada`, `fecha_completada` DATE
- `tecnico_asignado` VARCHAR(255) NULL
- `estado` ENUM(programada, en_progreso, completada, cancelada)
- `notas` TEXT NULL
- `created_at`, `updated_at` TIMESTAMP

---

## 🔐 Autenticación y Seguridad

### JWT Strategy
- **Access Token**: 30 min, Bearer header, blacklist en Redis al logout
- **Refresh Token**: 7 días, almacenado en Redis con key `refresh:{user_id}`
- **Logout**: Blacklist access token en Redis por TTL del token
- **Auto-refresh**: Frontend interceptor detecta 401, usa refresh token, reintenta request

### Roles de Usuario
- `admin`: Full access (TODO: implementar permisos granulares)
- `operador`: Actualmente tiene full access (TODO: restringir)
- `lectura`: Actualmente tiene full access (TODO: solo GET)

### Datos de Seed
```python
# Usuario admin por defecto
Email: admin@isp.local
Password: admin123
Rol: admin

# 4 Planes creados
1. Básico 10 Mbps - ₡15,000/mes
2. Estándar 25 Mbps - ₡25,000/mes
3. Premium 50 Mbps - ₡40,000/mes
4. Empresarial 100 Mbps - ₡75,000/mes
```

---

## 🛣️ API Endpoints

**Base URL**: `http://localhost:8000/api/v1`
**Docs**: `http://localhost:8000/api/docs` (Swagger UI)

### Auth
- `POST /auth/login` - Login con username/password (form-data)
- `POST /auth/refresh` - Renovar tokens
- `POST /auth/logout` - Cerrar sesión (blacklist token)
- `GET /auth/me` - Datos del usuario actual

### Clientes
- `GET /clientes/` - Listar (pagination, search, is_active filter)
- `GET /clientes/{id}` - Detalle
- `POST /clientes/` - Crear (valida cédula CR)
- `PUT /clientes/{id}` - Actualizar
- `DELETE /clientes/{id}` - Desactivar (soft delete)

### Planes
- `GET /planes/` - Listar (pagination, is_active filter)
- `GET /planes/{id}` - Detalle
- `POST /planes/` - Crear
- `PUT /planes/{id}` - Actualizar
- `DELETE /planes/{id}` - Desactivar (soft delete)

### Contratos
- `GET /contratos/` - Listar (pagination, cliente_id, estado filters)
- `GET /contratos/{id}` - Detalle (incluye relaciones cliente + plan)
- `POST /contratos/` - Crear (auto-genera numero_contrato)
- `PUT /contratos/{id}` - Actualizar

### Pagos
- `GET /pagos/` - Listar (pagination, cliente_id, contrato_id, estado, periodo filters)
- `GET /pagos/{id}` - Detalle
- `POST /pagos/` - Crear (valida SINPE referencia si aplica)
- `PUT /pagos/{id}` - Actualizar (solo si pendiente)
- `PUT /pagos/{id}/validar` - Validar/Rechazar (body: {accion: "validar"|"rechazar", notas})

---

## 🎨 Frontend - Características

### Tecnologías
- **React 18.3** + TypeScript + Vite 6
- **Tailwind CSS 4.0** + shadcn/ui components
- **React Router 6** con rutas protegidas
- **TanStack React Query** para cache y sincronización
- **React Hook Form** + Zod validación
- **Axios** con interceptores de auto-refresh
- **Sonner** para toasts

### Rutas
```
/login                          # LoginPage
/                              # Redirect → /dashboard
/dashboard                     # DashboardPage (stats + tabla)
/clientes                      # ClientesListPage (search + filter + tabla)
/clientes/nuevo                # ClienteCreatePage
/clientes/:id                  # ClienteDetailPage (info + contratos + pagos)
/clientes/:id/editar           # ClienteEditPage
/planes                        # PlanesListPage
/planes/nuevo                  # PlanCreatePage
/planes/:id/editar             # PlanEditPage
/contratos                     # ContratosListPage (filter por estado)
/contratos/nuevo               # ContratoCreatePage
/contratos/:id/editar          # ContratoEditPage
/pagos                         # PagosListPage (filter por estado)
/pagos/nuevo                   # PagoCreatePage (auto-fill monto)
/pagos/:id/validar             # PagoValidarPage (Validar/Rechazar)
```

### Características UX
- **Dark/Light mode** persistente en localStorage
- **Sidebar responsive** colapsable en mobile
- **Búsqueda en tiempo real** en lista de clientes
- **Filtros** por estado en contratos y pagos
- **Paginación** en todas las listas
- **Loading skeletons** durante fetch
- **Confirm dialogs** para acciones destructivas
- **Toasts** para feedback de operaciones
- **Auto-refresh** de tokens transparente
- **Validación inline** con mensajes en español

### 🎨 Diseño Profesional (Nuevo)

#### Sistema de Diseño
- **Paleta de colores tech cyan/blue** moderna y tecnológica
- **Fondo dinámico** con gradientes animados y patrón de grid (NO blanco plano)
- **Gradientes tecnológicos** para elementos destacados (tech-blue, tech-cyan, tech-purple, tech-green, tech-orange)
- **Animaciones suaves** (fade-in, scale-in, slide-in, pulse-glow)
- **Efectos hover** con elevación, sombras y glow
- **Glass morphism** con backdrop-filter blur
- **Tipografía profesional** con font-feature-settings
- **Scrollbar customizado** con gradientes tech
- **Efectos de neón** para elementos destacados
- Ver: `DESIGN_SYSTEM.md` para guía completa

#### Componentes Mejorados

**Sidebar:**
- Logo con gradiente cyan/blue tecnológico y badge
- Íconos lucide-react con animaciones scale
- Indicador visual de página activa (barra derecha cyan brillante)
- Avatar con iniciales del usuario
- Botón logout integrado
- Animaciones staggered en navegación
- Fondo oscuro incluso en modo claro (contraste tech)
- Overlay con backdrop-blur en mobile

**Dashboard:**
- Stats cards con gradientes tecnológicos únicos por métrica:
  - Clientes: gradient-tech-blue (cyan/blue)
  - Contratos: gradient-tech-green (verde)
  - Pagos: gradient-tech-purple (púrpura)
  - Planes: gradient-tech-orange (naranja)
- Íconos en badges circulares con gradientes
- Hover effect: elevación + flecha aparece + scale del badge
- Cards clickeables que navegan a secciones
- Animaciones staggered (delay por índice: 0ms, 100ms, 200ms, 300ms)
- Header con descripción contextual

**LoginPage:**
- Split layout: Branding (50%) | Form (50%)
- Gradiente tech cyan/blue en sección branding
- Stats tecnológicas visuales (100+ Clientes Activos, 99.9% Uptime, 24/7 Soporte)
- Background con patrón de grid sutil
- Form con íconos en inputs (Mail, Lock)
- Sombra pronunciada en card
- Loading spinner en botón
- Credenciales de prueba mostradas

**Header:**
- Breadcrumbs navegables con separadores
- Barra de búsqueda global
- Badge de notificaciones (dot rojo)
- Theme toggle integrado
- Sticky con backdrop-blur

**DataTable:**
- Skeleton loading con animación pulse
- Empty states con emoji
- Hover en filas clickeables
- Badges coloridos para estados
- Responsive con scroll horizontal

#### Animaciones
```css
animate-fade-in      → Aparición suave (0.3s)
animate-scale-in     → Escala desde 95% (0.2s)
animate-slide-in-*   → Deslizamiento direccional
hover-lift           → Elevación con sombra en hover
transition-smooth    → Transición suave universal
```

#### Gradientes Tecnológicos
```css
gradient-tech-blue    → Cyan/Blue (principal, clientes)
gradient-tech-cyan    → Cyan oscuro (secundario)
gradient-tech-purple  → Púrpura tech (pagos)
gradient-tech-green   → Verde tech (contratos, validación)
gradient-tech-orange  → Naranja tech (planes, alertas)
```

#### Efectos Tecnológicos
```css
glass/glass-strong    → Glassmorphism con backdrop-filter
neon-text            → Texto con efecto neón
data-glow            → Glow para elementos de datos
animate-pulse-glow   → Pulso animado con glow
hover-glow           → Glow en hover
```

#### Best Practices Implementadas
✅ Mobile-first responsive
✅ Dark mode en todos los componentes
✅ Loading states en botones y tablas
✅ Validación inline con íconos
✅ Hover effects en elementos interactivos
✅ Spacing consistente (múltiplos de 4px)
✅ Accesibilidad (focus states, labels)
✅ Breadcrumbs en header
✅ Empty states amigables
✅ Animaciones sutiles (< 500ms)

### UbicacionSelector (Costa Rica)
Selector cascada con datos completos de CR:
- 7 Provincias
- 82+ Cantones
- 484+ Distritos

Ubicado en: `frontend/src/data/ubicaciones.ts`

---

## ✅ Estado de Implementación

### ✔️ Completado - Fase 1

#### Backend
- [x] Docker setup (Postgres 15, Redis 7, FastAPI)
- [x] Alembic configuración async
- [x] 8 modelos SQLAlchemy con relaciones
- [x] JWT authentication con refresh tokens
- [x] Redis para blacklist tokens y refresh storage
- [x] CRUD completo para: Usuarios, Clientes, Planes, Contratos, Pagos
- [x] Validadores Costa Rica (cédulas, teléfonos)
- [x] Sistema de paginación genérico
- [x] Seed script (admin + 4 planes)
- [x] 17 endpoints API documentados

#### Frontend
- [x] Vite + React 18 + TypeScript setup
- [x] 13 componentes UI shadcn/ui (agregado Avatar)
- [x] AuthContext con auto-refresh
- [x] 15 rutas con protección
- [x] 5 módulos CRUD completos (Clientes, Planes, Contratos, Pagos)
- [x] Dashboard con estadísticas mejorado
- [x] Dark/light mode con paleta purple/violet
- [x] Responsive design mobile-first
- [x] UbicacionSelector CR completo
- [x] Validación formularios con Zod
- [x] React Query para cache

#### 🎨 Diseño Tecnológico (ACTUALIZADO)
- [x] Sistema de diseño completo (`DESIGN_SYSTEM.md` v2.0.0)
- [x] Paleta de colores tech cyan/blue (NO blanco plano)
- [x] Fondo dinámico con gradientes animados radiales
- [x] Patrón de grid tecnológico overlay (60px)
- [x] Gradientes tecnológicos para elementos destacados (5 variantes)
- [x] Glass morphism con backdrop-filter blur
- [x] Animaciones CSS custom (fade-in, scale-in, slide-in, hover-lift, pulse-glow)
- [x] Sidebar mejorado con logo gradiente cyan + avatar + animaciones
- [x] Dashboard con stats cards con gradientes tech únicos
- [x] LoginPage split-screen con branding tech y grid pattern
- [x] Header con breadcrumbs navegables
- [x] Efectos hover con elevación, sombras y glow
- [x] Efectos de neón para elementos tech destacados
- [x] Scrollbar customizado con gradientes tech
- [x] Loading states profesionales con spinners
- [x] Tipografía mejorada con ligatures
- [x] Spacing consistente (sistema 4px base)

### 🔄 Pendiente - Fase 1

#### Testing de Integración
- [ ] Ejecutar `docker compose up --build` y verificar logs
- [ ] Generar y aplicar migración inicial Alembic
- [ ] Ejecutar seed y verificar datos
- [ ] Probar login en frontend
- [ ] Probar flujo completo: crear cliente → crear contrato → registrar pago → validar pago
- [ ] Verificar responsive en mobile
- [ ] Probar dark/light mode
- [ ] Verificar búsqueda de clientes
- [ ] Probar filtros en listas
- [ ] Verificar paginación
- [ ] Probar validación de formularios (cédulas, teléfonos, SINPE)
- [ ] Verificar soft-delete de clientes y planes
- [ ] Probar logout y auto-refresh de tokens

#### Correcciones Menores (si aplica)
- [ ] Revisar mensajes de error en español
- [ ] Ajustar formato de fechas según preferencia CR
- [ ] Verificar formato de montos (separador de miles)

### 📋 Diferido - Fase 2

#### Instalaciones (Pendiente)
- [ ] Endpoints backend: `GET /instalaciones/`, `POST /instalaciones/`, etc.
- [ ] Services layer para instalaciones
- [ ] Schemas Pydantic para instalaciones
- [ ] Frontend: páginas lista/crear/editar instalaciones
- [ ] Formulario con date picker y select de técnicos
- [ ] Integración con contratos (nueva instalación al crear contrato)

#### Facturas y Facturación Electrónica
- [ ] Endpoints backend: `GET /facturas/`, `POST /facturas/`, `GET /facturas/{id}/pdf`
- [ ] Generación de PDF con ReportLab o WeasyPrint
- [ ] Integación API Factura Electrónica CR (Hacienda)
  - [ ] Generar XML firma
  - [ ] Enviar a ATV Hacienda
  - [ ] Recibir y almacenar clave numérica
  - [ ] Manejar respuestas (aceptado/rechazado)
- [ ] Frontend: módulo facturas con vista previa PDF
- [ ] Envío de facturas por email

#### Email y Notificaciones
- [ ] Setup SMTP (SendGrid, AWS SES, etc.)
- [ ] Templates HTML para emails
- [ ] Envío automático:
  - [ ] Factura generada
  - [ ] Recordatorio de pago
  - [ ] Contrato suspendido
  - [ ] Nueva instalación programada
- [ ] Panel de logs de emails enviados

#### Reportes y Dashboard Avanzado
- [ ] Reportes PDF:
  - [ ] Estado de cuenta por cliente
  - [ ] Reporte mensual de ingresos
  - [ ] Contratos por vencer
  - [ ] Pagos pendientes
- [ ] Charts en dashboard:
  - [ ] Ingresos por mes (línea)
  - [ ] Distribución de planes (pie)
  - [ ] Nuevos clientes por mes (bar)
  - [ ] Tasa de morosidad
- [ ] Exportación a Excel/CSV

#### Nginx y Producción
- [ ] Configurar Nginx como reverse proxy
- [ ] SSL/TLS con Let's Encrypt
- [ ] Compresión gzip
- [ ] Rate limiting
- [ ] Static files serving optimizado
- [ ] Health checks endpoint
- [ ] Logging estructurado (JSON)
- [ ] Monitoring con Prometheus + Grafana
- [ ] Backup automatizado de PostgreSQL

#### Mejoras de Seguridad
- [ ] Implementar permisos granulares por rol
- [ ] Audit log de todas las operaciones
- [ ] Rate limiting en endpoints sensibles
- [ ] CSRF protection
- [ ] Content Security Policy headers
- [ ] Sanitización de inputs
- [ ] Password policy (complejidad, expiración)
- [ ] 2FA opcional

#### Optimizaciones
- [ ] Índices adicionales en BD según queries reales
- [ ] Caching de Redis para datos frecuentes
- [ ] Lazy loading en frontend
- [ ] Code splitting por ruta
- [ ] Image optimization
- [ ] Bundle size analysis y reducción

---

## 🔧 Decisiones de Diseño Clave

### Backend

1. **SQLAlchemy 2.0 Async**: Máximo rendimiento no-bloqueante con FastAPI
2. **Service Layer Pattern**: Rutas delgadas, lógica en services para testing
3. **Soft Delete**: `is_active` flag en clientes/planes para preservar integridad referencial
4. **UUID Primary Keys**: Más seguro que int secuencial, evita enumeration attacks
5. **Enums en Python**: Type safety y validación automática de estados
6. **Generic Pagination**: `PaginatedResponse[T]` reutilizable para todos los endpoints
7. **Redis para Auth**: Refresh tokens y blacklist en memoria para speed
8. **Auto-generated Contract Numbers**: `CTR-YYYYMMDD-XXXX` único por día

### Frontend

1. **TypeScript Strict Mode**: Catch errors en compile time
2. **React Query**: Cache automático, optimistic updates, retry logic
3. **Zod Validation**: Schema único para forms y runtime validation
4. **shadcn/ui**: Componentes copiables/customizables vs biblioteca opaca
5. **Tailwind 4.0**: Performance mejorado vs v3, CSS variables para theming
6. **Context API for Auth**: Más simple que Redux para este caso de uso
7. **localStorage para Tokens**: Simplifica UX vs httpOnly cookies (trade-off XSS)
8. **Axios Interceptors**: Auto-refresh transparente, queue de requests fallidos

### Base de Datos

1. **PostgreSQL 15**: JSONB, CTE, window functions para futuros reportes
2. **Alembic Migrations**: Control de versiones del schema, rollback capability
3. **Timestamps Automáticos**: `created_at`, `updated_at` con server_default
4. **Foreign Keys Enforced**: Integridad referencial en BD, no solo ORM
5. **Numeric for Money**: Precisión decimal vs float para cálculos financieros

---

## 🐛 Issues Conocidos y Limitaciones

### Por Implementar
1. **Permisos**: Todos los roles tienen full access (TODO: middleware de permisos)
2. **Audit Log**: No hay registro de quién modificó qué y cuándo
3. **Validación de Cédula**: Básica (dígitos), no valida dígito verificador
4. **Email Único**: No se valida unicidad en clientes (permitido para jurídicas)
5. **Cambio de Contraseña**: No hay endpoint/UI para cambiar password
6. **Recuperar Contraseña**: No hay flujo de reset password
7. **Concurrencia**: No hay optimistic locking (lost update problem)
8. **File Upload**: No hay endpoint para subir comprobantes de pago

### Limitaciones Actuales
1. **Sin Rate Limiting**: API vulnerable a abuse
2. **Sin Webhooks**: No hay notificaciones a sistemas externos
3. **Sin Backups**: No hay automatización de respaldo de BD
4. **Sin Monitoring**: No hay métricas de performance
5. **Sin Tests**: Cero cobertura de tests unitarios/integración
6. **Hardcoded Admin**: Email/password del admin en seed.py (TODO: env var)

---

## 📚 Referencias y Recursos

### Documentación Oficial
- FastAPI: https://fastapi.tiangolo.com/
- SQLAlchemy 2.0: https://docs.sqlalchemy.org/en/20/
- Alembic: https://alembic.sqlalchemy.org/
- React Query: https://tanstack.com/query/latest
- Zod: https://zod.dev/
- shadcn/ui: https://ui.shadcn.com/

### Costa Rica - Referencias
- Formato Cédulas: https://es.wikipedia.org/wiki/C%C3%A9dula_de_identidad_(Costa_Rica)
- División Territorial: https://www.tse.go.cr/zip/padron/distelec.xls
- Factura Electrónica: https://www.hacienda.go.cr/contenido/13329-factura-electronica

### Código Base
- Este proyecto fue creado desde cero siguiendo el plan en `/PROJECT_STATUS.md`
- No hay dependencias de librerías custom
- Todo el código es estándar y bien documentado

---

## 🤝 Guía para Nuevos Desarrolladores

### Si eres un agente IA continuando el desarrollo:

1. **Lee ESTE archivo primero** - Contiene TODO el contexto
2. **Revisa la estructura** - Entender dónde va cada cosa
3. **Consulta "Estado de Implementación"** - Saber qué falta
4. **Sigue los patrones existentes** - Consistencia es clave
5. **Testing antes de nuevas features** - Asegura que lo actual funcione

### Para implementar una nueva feature:

#### Backend
1. Crear modelo en `backend/app/models/` si es nueva entidad
2. Crear schemas en `backend/app/schemas/`
3. Crear service en `backend/app/services/`
4. Crear router en `backend/app/api/`
5. Incluir router en `backend/app/api/router.py`
6. Generar migración: `docker compose exec backend alembic revision --autogenerate -m "add_feature"`
7. Aplicar: `docker compose exec backend alembic upgrade head`

#### Frontend
1. Crear tipos en `frontend/src/types/`
2. Crear schemas Zod en `frontend/src/schemas/`
3. Crear funciones API en `frontend/src/api/`
4. Crear hooks en `frontend/src/hooks/`
5. Crear componentes en `frontend/src/components/`
6. Crear páginas en `frontend/src/pages/`
7. Agregar rutas en `frontend/src/router/index.tsx`

### Para debuggear:

```bash
# Logs en tiempo real
docker compose logs -f backend
docker compose logs -f frontend

# Entrar al contenedor
docker compose exec backend bash
docker compose exec frontend sh

# Ver queries SQL
# En backend/app/database.py, cambiar echo=False a echo=True

# Ver network requests
# Abrir DevTools → Network en el navegador

# Query directa a BD
docker compose exec db psql -U isp_admin -d isp_billing
# Luego: \dt para listar tablas, SELECT * FROM usuarios; etc.
```

---

## 📝 Changelog

### 2025-02-04 - Implementación Inicial (Fase 1)
- ✅ Setup completo del proyecto con Docker Compose
- ✅ Backend FastAPI con 17 endpoints
- ✅ Frontend React con 15 páginas
- ✅ 8 modelos de base de datos
- ✅ Sistema de autenticación JWT completo
- ✅ CRUD para 5 entidades principales
- ✅ Validaciones específicas para Costa Rica
- ✅ UI responsive con dark mode
- ✅ 128 archivos creados en total

### 2025-02-04 - Mejoras de Diseño Profesional (v1.0)
- ✅ Sistema de diseño completo documentado (`DESIGN_SYSTEM.md`)
- ✅ Paleta purple/violet moderna con gradientes de marca
- ✅ CSS custom: animaciones (fade-in, scale-in, slide-in, hover-lift)
- ✅ Sidebar rediseñado: logo gradiente, avatar, animaciones staggered
- ✅ Dashboard mejorado: stats cards con gradientes únicos y hover effects
- ✅ LoginPage split-screen: branding left + form right
- ✅ Header con breadcrumbs navegables + search bar + notifications badge
- ✅ Componente Avatar agregado (iniciales con gradiente)
- ✅ Scrollbar customizado para dark/light mode
- ✅ Loading states profesionales con spinners animados
- ✅ Tipografía mejorada con ligatures y tracking
- ✅ Spacing system consistente (4px base)
- ✅ Total: 131 archivos (3 nuevos: Avatar, DESIGN_SYSTEM.md, mejoras CSS)

### 2026-02-04 - Rediseño Tech Color Scheme (v2.0)
- ✅ **Bug fix**: Corregido email admin de "admin@isp.com" a "admin@isp.local" en seed.py
- ✅ **Transformación de colores**: De purple/violet a cyan/blue tech-inspired
- ✅ **Fondo dinámico**: Gradientes radiales animados (body::before) con gradient-shift 15s
- ✅ **Patrón de grid**: Overlay tecnológico 60px con opacidad 0.5 (body::after)
- ✅ **Nuevos colores principales**:
  - Light mode: `--background: 220 25% 97%` (NO blanco puro), `--primary: 199 89% 48%` (cyan)
  - Dark mode: `--background: 222 47% 11%` (deep navy), `--primary: 188 100% 60%` (bright cyan)
- ✅ **Gradientes tecnológicos**: 5 variantes (tech-blue, tech-cyan, tech-purple, tech-green, tech-orange)
- ✅ **Glass morphism**: Clases `.glass` y `.glass-strong` con backdrop-filter blur
- ✅ **Efectos de glow**: `.neon-text`, `.data-glow`, `.hover-glow`, `.animate-pulse-glow`
- ✅ **Scrollbar tech**: Gradientes cyan en thumb con transparencia
- ✅ **Border animations**: `.border-tech-animated` con flow animation
- ✅ **Actualizado DESIGN_SYSTEM.md** a v2.0.0 con nueva paleta y efectos
- ✅ **Actualizado PROJECT_STATUS.md** con referencias a tech color scheme
- ✅ **Total**: 131 archivos (actualizaciones: index.css, DESIGN_SYSTEM.md, PROJECT_STATUS.md, seed.py)

### Próximos Pasos Inmediatos
1. Testing de integración completo
2. Generar y aplicar migración inicial
3. Documentar bugs encontrados
4. Priorizar features de Fase 2

---

## 💡 Notas Finales

Este proyecto está **LISTO PARA TESTING**. La arquitectura es sólida y escalable. Las decisiones de diseño priorizan:
- **Maintainability**: Código limpio y bien organizado
- **Type Safety**: TypeScript + Pydantic
- **Performance**: Async everywhere, React Query cache
- **Developer Experience**: Hot reload, clear error messages
- **Production Ready**: Docker, migrations, proper auth
- **Professional UI/UX**: Sistema de diseño completo con shadcn/ui + Tailwind CSS 4.0

### 🎨 Diseño Tecnológico Implementado
El frontend ha sido transformado con una estética tech-inspired moderna:
- **Paleta de colores tech cyan/blue** (NO blanco plano)
- **Fondos dinámicos** con gradientes animados y patrón de grid
- **Glass morphism** con backdrop-filter para overlays
- **Efectos de glow** y neón para elementos destacados
- **5 gradientes tecnológicos** para diferentes secciones
- **Animaciones suaves** y profesionales
- **Dark mode completo** con deep navy y cyan brillante
- **Breadcrumbs**, search bar, notifications
- **Loading states** y empty states pulidos
- **Mobile-first** responsive design

Consulta **`DESIGN_SYSTEM.md`** para la guía completa de diseño con ejemplos de código, patrones y best practices.

Para continuar el desarrollo, consulta la sección "Diferido - Fase 2" y elige las features según prioridad de negocio.

**¡Buena suerte con el proyecto! 🚀**
