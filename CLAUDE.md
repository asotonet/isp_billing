# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ISP Billing Management System for Costa Rica - a full-stack application with FastAPI backend, React frontend, PostgreSQL database, and Redis for session management. The system handles clients, contracts, plans, payments, and is designed for integration with Costa Rica's electronic invoicing system.

**Default credentials**: `admin@isp.local` / `admin123`

## Essential Commands

### First-Time Setup
```bash
# Copy environment variables
cp .env.example .env

# Start all services
docker compose up --build

# In another terminal - Generate initial database migration
docker compose exec backend alembic revision --autogenerate -m "initial schema"

# Apply migration
docker compose exec backend alembic upgrade head

# Seed database (creates admin user + 4 sample plans)
docker compose exec backend python -m app.seed
```

### Development Workflow
```bash
# Start services (hot reload enabled)
docker compose up

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart specific service
docker compose restart backend

# Stop all services
docker compose down

# Stop and remove volumes (destroys database!)
docker compose down -v
```

### Database Operations
```bash
# Create new migration after model changes
docker compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker compose exec backend alembic upgrade head

# Rollback one migration
docker compose exec backend alembic downgrade -1

# Access PostgreSQL directly
docker compose exec db psql -U isp_admin -d isp_billing

# Inside psql:
# \dt                    - List tables
# \d table_name          - Describe table
# SELECT * FROM usuarios; - Query
```

### Backend Development
```bash
# Access backend container
docker compose exec backend bash

# Run Python REPL with app context
docker compose exec backend python

# View SQL queries (change echo=False to echo=True in backend/app/database.py)

# Access API documentation
# http://localhost:8000/api/docs (Swagger UI)
# http://localhost:8000/api/openapi.json (OpenAPI spec)
```

### Frontend Development
```bash
# Access frontend container
docker compose exec frontend sh

# Frontend runs on http://localhost:5173
# Vite dev server with hot reload

# TypeScript check
docker compose exec frontend npm run build
```

### Redis Operations
```bash
# Access Redis CLI
docker compose exec redis redis-cli

# Common commands:
# KEYS *                 - List all keys
# GET key_name           - Get value
# DEL key_name           - Delete key
# FLUSHALL               - Clear all data (use with caution)
```

## Architecture Overview

### Backend (FastAPI + SQLAlchemy Async)

**Three-Layer Architecture**:
1. **API Layer** (`backend/app/api/`) - Thin route handlers, validation, response formatting
2. **Service Layer** (`backend/app/services/`) - Business logic, orchestration, data validation
3. **Data Layer** (`backend/app/models/`) - SQLAlchemy models, database schema

**Key Patterns**:
- **Async Throughout**: SQLAlchemy 2.0 with asyncpg for non-blocking I/O
- **Service Layer Pattern**: All business logic lives in services, routes are thin
- **Generic Pagination**: `PaginatedResponse[T]` reusable across all list endpoints
- **Soft Delete**: `is_active` flag on clientes and planes to preserve referential integrity
- **UUID Primary Keys**: All models use UUID for security

**Authentication Flow**:
```
1. Login (POST /auth/login) → Returns access_token + refresh_token
2. Access token stored in Redis blacklist on logout
3. Refresh token stored in Redis with 7-day TTL
4. Frontend auto-refreshes on 401 using axios interceptor
5. All protected routes use get_current_user dependency
```

**Database Session Management**:
- `get_db()` dependency provides async session
- Auto-commits on success, rolls back on exception
- Use `async with async_session() as session:` for scripts/seeds

### Frontend (React + TypeScript + TanStack Query)

**Data Flow**:
```
Component → React Query Hook → API Function → Axios (with interceptors) → Backend
                ↓
         Cache + State Management
```

**Key Patterns**:
- **React Query for Server State**: All data fetching, caching, and synchronization
- **Zod for Validation**: Single source of truth for forms and runtime validation
- **shadcn/ui Components**: Copy-paste components in `src/components/ui/`
- **Service Pattern**: API functions in `src/api/`, hooks in `src/hooks/`

**Authentication Flow**:
```
1. AuthContext manages user state globally
2. Tokens stored in localStorage (access_token, refresh_token)
3. axios interceptor attaches Bearer token to all requests
4. On 401: Auto-refresh with queue to prevent race conditions
5. ProtectedRoute guards routes, redirects to /login if unauthenticated
```

**Routing Structure**:
- `/login` - Public route
- All other routes wrapped in `<ProtectedRoute>`
- Layout with Sidebar + Header for authenticated routes
- React Router 6 with nested routes

### Database Schema (PostgreSQL 15)

**Core Entities with Endpoints**:
- `usuarios` - User accounts, JWT authentication
- `clientes` - Customers (física/jurídica/dimex/nite identification)
- `planes` - Internet plans (speeds, pricing)
- `contratos` - Contracts linking clients to plans (auto-generated número_contrato: CTR-YYYYMMDD-XXXX)
- `pagos` - Payments with validation workflow

**Models Without Endpoints (Phase 2)**:
- `facturas` - Invoices (ready for Hacienda integration)
- `instalaciones` - Installation scheduling

**Foreign Key Relationships**:
```
contratos → clientes (many-to-one)
contratos → planes (many-to-one)
pagos → clientes (many-to-one)
pagos → contratos (many-to-one)
pagos → usuarios (validado_por, many-to-one, nullable)
facturas → contratos (many-to-one)
facturas → clientes (many-to-one)
instalaciones → contratos (many-to-one)
```

### Redis Usage

**Keys**:
- `refresh:{user_id}` - Refresh token (7-day TTL)
- `blacklist:{access_token}` - Revoked access tokens (30-min TTL)

### Costa Rica-Specific Features

**Validations**:
- Cédula física: 9 digits (basic validation in `backend/app/utils/cedula.py`)
- Cédula jurídica: Starts with 3
- DIMEX: 11-12 digits
- Phone numbers: 8 digits, starts with 2-8 (regex: `^[2-8][0-9]{7}$`)
- SINPE payment: `referencia` field required

**Geographic Data**:
- `frontend/src/data/ubicaciones.ts` contains complete CR territorial division
- 7 provincias, 82+ cantones, 484+ distritos
- Cascading selects in `UbicacionSelector` component

## Design System

**Color Scheme** (Tech-Inspired Cyan/Blue):
- Light mode: Subtle gray background `hsl(220 25% 97%)` with animated gradients and grid pattern (NO flat white)
- Dark mode: Deep navy `hsl(222 47% 11%)` with bright cyan accents
- Primary: Cyan/Blue tech colors
- See `DESIGN_SYSTEM.md` for complete guide

**CSS Architecture**:
- Tailwind CSS 4.0 with CSS variables for theming
- Custom animations: fade-in, scale-in, slide-in, hover-lift, pulse-glow
- Tech gradients: `gradient-tech-blue`, `gradient-tech-cyan`, `gradient-tech-purple`, etc.
- Glass morphism effects with backdrop-filter
- Dynamic backgrounds with radial gradients and grid overlay

**Component Patterns**:
- All shadcn/ui components in `frontend/src/components/ui/`
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- Dark mode via ThemeProvider with localStorage persistence
- Mobile-first responsive design

## Adding New Features

### Backend: New Entity
1. Create model in `backend/app/models/{entity}.py`
2. Create Pydantic schemas in `backend/app/schemas/{entity}.py`
3. Create service in `backend/app/services/{entity}.py`
4. Create router in `backend/app/api/{entity}.py`
5. Include router in `backend/app/api/router.py`
6. Generate migration: `docker compose exec backend alembic revision --autogenerate -m "add_{entity}"`
7. Apply migration: `docker compose exec backend alembic upgrade head`

### Frontend: New Module
1. Create TypeScript types in `frontend/src/types/{entity}.ts`
2. Create Zod schemas in `frontend/src/schemas/{entity}.ts`
3. Create API functions in `frontend/src/api/{entity}.ts`
4. Create React Query hooks in `frontend/src/hooks/use{Entity}.ts`
5. Create components in `frontend/src/components/{entity}/`
6. Create pages in `frontend/src/pages/{entity}/`
7. Add routes in `frontend/src/router/index.tsx`

## Important Files

- **`PROJECT_STATUS.md`** - Comprehensive project status, architecture decisions, implementation checklist, and changelog
- **`DESIGN_SYSTEM.md`** - Complete design guide with colors, components, animations, and code examples
- **`README.md`** - Quick start, features, and roadmap
- **`.env.example`** - Environment variables template
- **`docker-compose.yml`** - Service orchestration (4 services: db, redis, backend, frontend)

## Current Limitations

- **No role-based permissions**: All authenticated users have full access (TODO: implement in dependencies.py)
- **No tests**: Zero test coverage
- **Basic cédula validation**: Doesn't validate check digit
- **No rate limiting**: API vulnerable to abuse
- **Hardcoded seed admin**: Email/password in seed.py (should use env vars)
- **localStorage for tokens**: XSS vulnerability trade-off for simpler UX vs httpOnly cookies

## Phase 2 (Deferred)

Features with models created but no endpoints/UI:
- Instalaciones (installation scheduling)
- Facturas (PDF generation + Costa Rica electronic invoicing integration)
- Email notifications
- Reports and charts
- Nginx reverse proxy configuration
- Monitoring and metrics

## Debugging

**View SQL Queries**: In `backend/app/database.py`, change `echo=False` to `echo=True`

**Network Requests**: Browser DevTools → Network tab

**React Query DevTools**: Already configured in development mode

**Common Issues**:
- Migration conflicts: Delete `backend/alembic/versions/*.py`, drop database, recreate
- Frontend build errors: Delete `node_modules`, rebuild container
- Redis connection issues: Check `docker compose logs redis`
- Token errors: Clear localStorage in browser, re-login

## URLs

- Frontend: http://localhost:5173
- Backend API Docs: http://localhost:8000/api/docs
- Backend Health: http://localhost:8000/api/health
- PostgreSQL: localhost:5432
- Redis: localhost:6379
