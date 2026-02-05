# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-05

### Added

#### Backend - Role-Based Access Control (RBAC)
- **Dynamic permissions system** stored in database (`role_permissions` table)
- **5 user roles** with granular permissions:
  - `ADMIN`: Full system access, can manage all modules
  - `OPERADOR`: Can manage clients, contracts, plans, and payments
  - `TECNICO`: Can manage installations, read-only for clients/contracts
  - `AUDITOR`: Read-only access to all modules
  - `SOPORTE`: Can manage payments, read-only for other modules
- **Permission caching** (1-hour TTL) for optimal performance
- **40 default permissions** (5 roles × 8 modules) automatically initialized on startup
- `require_permission()` dependency factory for granular route-level access control
- Role permissions REST API with bulk update endpoint
- Automatic permission initialization on app startup (with graceful error handling)

#### Backend - User Management
- Complete user CRUD API (`/api/v1/usuarios/`)
- User filtering by role and active status
- Password hashing with bcrypt
- User activation/deactivation (soft delete)
- Role assignment and modification

#### Backend - Enhanced Installation Module
- `instalaciones` table with temporary client data storage (`temp_*` fields)
- Support for pre-contract installations (nullable `contrato_id`)
- Installation number generation (`INS-YYYYMMDD-XXXX` format)
- PDF request document support (`pdf_solicitud_path`)
- Installation state machine: solicitud → programada → en_progreso → completada/cancelada

#### Backend - Contract Enhancements
- `pdf_firmado_path` field for storing signed installation PDFs
- Support for digital contract workflow

#### Frontend - Roles Management
- **Permission matrix UI** for visual role/module permission management
- Read/write toggle controls per role per module
- Bulk save functionality with optimistic UI updates
- Restore defaults option
- Real-time permission synchronization

#### Frontend - User Management
- User list page with pagination and filtering
- User creation form with role selection
- User edit page with password update option
- Role badge component with color-coding
- Active/inactive status indicators

#### Frontend - Permission System
- `usePermissions` hook for checking user access
- `RoleProtectedRoute` component for route-level protection
- Permission-based UI controls (conditional create/edit buttons)
- Sidebar filtering based on user permissions
- Dynamic navigation based on role access

#### Frontend - UI Components
- Checkbox component (Radix UI)
- Role badge component with semantic colors
- User form with validation (Zod schemas)
- Permission matrix with interactive toggles

#### Database
- Single comprehensive initial migration (`4114a08f3d6b`)
- 8 core tables: usuarios, role_permissions, clientes, planes, contratos, instalaciones, pagos, facturas
- 7 PostgreSQL ENUM types with normalized values
- Complete foreign key relationships
- Proper indexes on frequently queried columns
- Server-side defaults for timestamps and boolean fields

#### Infrastructure
- VERSION file for centralized version management
- Consolidated migration system for clean deployments
- Migration backup system for safety

### Changed

#### Backend
- Updated `RolUsuario` enum from 3 roles to 5 roles
- Normalized all enum values to lowercase for consistency
- Enhanced `Instalacion` model with 12 temporary client data fields
- Modified authentication dependencies to use dynamic permissions
- Updated all API routes with role-based permission checks

#### Frontend
- Updated routing to use `RoleProtectedRoute` for protected pages
- Modified all list pages to conditionally show create/edit buttons
- Enhanced sidebar to filter links based on user permissions
- Updated authentication context to include permission helpers
- Added React Router v7 future flag (`v7_startTransition`)

#### Database
- Consolidated 8 migrations into 1 comprehensive initial migration
- Fixed `estadoinstalacion` enum corruption (mixed uppercase/lowercase)
- Normalized `rolusuario` enum values to lowercase
- Added indexes for performance optimization

### Fixed
- **Enum corruption**: Fixed mixed-case values in `estadoinstalacion` enum
- **Migration conflicts**: Eliminated circular dependencies between migrations
- **Permission bypass**: Closed security gap where all roles could access all modules
- **React Router warning**: Added `v7_startTransition` future flag
- **Authentication flow**: Fixed role validation in protected routes
- **UI inconsistencies**: Standardized button visibility based on permissions

### Security
- Implemented granular role-based access control at API level
- Added permission validation middleware for all protected endpoints
- Implemented read-only enforcement for AUDITOR role
- Added write permission restrictions for TECNICO and SOPORTE roles
- Secured role management endpoints (ADMIN-only access)

### Performance
- Implemented in-memory permission caching (1-hour TTL)
- Reduced database queries for permission checks
- Optimized permission matrix loading with bulk fetch

### Developer Experience
- Single initial migration for clean fresh deployments
- Comprehensive migration with all schema definitions
- Clear role permission matrix for understanding access control
- Well-documented enum types and constraints
- Consistent naming conventions across frontend/backend

### Database Schema
```
Tables: 8
- usuarios (with 5 roles)
- role_permissions (40 default entries)
- clientes
- planes
- contratos (with pdf_firmado_path)
- instalaciones (enhanced with temp_* fields)
- pagos
- facturas

Enums: 7
- tipoidentificacion, rolusuario, estadocontrato, estadofactura
- estadoinstalacion, metodopago, estadopago

Indexes: 8 unique indexes for optimal query performance
Foreign Keys: 9 relationships ensuring referential integrity
```

### Migration Notes
- **Fresh installations**: Use `alembic upgrade head`
- **Existing databases**: Use `alembic stamp head` to mark as current
- **Backup available**: Original migrations backed up in `versions_backup_*/`

### API Endpoints Added
- `GET /api/v1/role-permissions/matrix` - Get full permission matrix
- `GET /api/v1/role-permissions/` - List all permissions
- `POST /api/v1/role-permissions/` - Create permission
- `PUT /api/v1/role-permissions/{id}` - Update permission
- `POST /api/v1/role-permissions/bulk-update` - Bulk update permissions
- `POST /api/v1/role-permissions/initialize` - Initialize default permissions
- `GET /api/v1/usuarios/` - List users (with filters)
- `POST /api/v1/usuarios/` - Create user
- `GET /api/v1/usuarios/{id}` - Get user details
- `PUT /api/v1/usuarios/{id}` - Update user
- `DELETE /api/v1/usuarios/{id}` - Deactivate user

### Known Limitations
- Permission changes require user re-login to take effect (cache TTL: 1 hour)
- No audit log for permission changes (planned for v1.1.0)
- No role hierarchy or inheritance (planned for v1.2.0)

### Contributors
- Development: asoto
- AI Assistant: Claude Sonnet 4.5

---

## [Unreleased]

### Planned for v1.1.0
- Audit log for permission and role changes
- User activity tracking
- Permission change notifications
- Real-time permission updates (WebSocket)

### Planned for v1.2.0
- Role hierarchy and inheritance
- Custom role creation
- Permission templates
- Role cloning functionality

---

[1.0.0]: https://github.com/asotonet/isp_billing/releases/tag/v1.0.0
