# Sistema de Diseño - ISP Billing

## 🎨 Filosofía de Diseño

Este proyecto implementa un sistema de diseño profesional y moderno utilizando **shadcn/ui** + **Tailwind CSS 4.0**, siguiendo las mejores prácticas de diseño UI/UX.

---

## 🌈 Paleta de Colores

### Tema Claro (Tech-Inspired)
- **Primary**: Cyan/Blue (#0ea5e9) - HSL: 199 89% 48% - Tecnología y modernidad
- **Background**: Subtle Gray (#f0f4f8) - HSL: 220 25% 97% - Con gradiente animado y patrón de grid
- **Background Secondary**: Light Gray (#eff3f7) - HSL: 220 20% 95%
- **Foreground**: Dark Navy (#13202e) - HSL: 222 47% 11%
- **Muted**: Light Gray (#eef2f6) - HSL: 210 40% 96%
- **Border**: Subtle Gray (#d9e2ec) - HSL: 214 32% 91%

### Tema Oscuro (Deep Blue/Cyan)
- **Primary**: Bright Cyan (#22d3ee) - HSL: 188 100% 60% - Alta visibilidad
- **Background**: Deep Navy (#13202e) - HSL: 222 47% 11% - Con gradientes sutiles
- **Background Secondary**: Dark Slate (#212d3a) - HSL: 217 32% 14%
- **Foreground**: Off White (#f5f8fa) - HSL: 210 40% 98%
- **Muted**: Dark Gray (#2d3947) - HSL: 217 32% 18%
- **Border**: Darker Gray (#333f4d) - HSL: 217 32% 20%

### Gradientes Tecnológicos
```css
.gradient-tech-blue {
  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
}
.gradient-tech-cyan {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
}
.gradient-tech-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
}
.gradient-tech-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
.gradient-tech-orange {
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
}
```

### Efectos de Fondo Dinámicos
```css
/* Gradiente animado de fondo */
body::before {
  background:
    radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, hsl(var(--chart-3) / 0.05) 0%, transparent 50%),
    radial-gradient(circle at 40% 20%, hsl(var(--chart-2) / 0.03) 0%, transparent 50%);
  animation: gradient-shift 15s ease infinite;
}

/* Patrón de grid tecnológico */
body::after {
  background-image:
    linear-gradient(hsl(var(--primary) / 0.03) 1px, transparent 1px),
    linear-gradient(90deg, hsl(var(--primary) / 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.5;
}
```

### Efectos Glass Morphism
```css
.glass {
  background: hsl(var(--card) / 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid hsl(var(--border) / 0.5);
}

.glass-strong {
  background: hsl(var(--card) / 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid hsl(var(--border) / 0.7);
}
```

### Efectos de Glow Tecnológicos
```css
/* Texto con efecto neón */
.neon-text {
  text-shadow:
    0 0 10px hsl(var(--primary)),
    0 0 20px hsl(var(--primary) / 0.5),
    0 0 30px hsl(var(--primary) / 0.3);
}

/* Glow en elementos de datos */
.data-glow {
  box-shadow:
    0 0 20px hsl(var(--primary) / 0.2),
    inset 0 0 20px hsl(var(--primary) / 0.1);
}

/* Pulso de glow animado */
.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

---

## ✨ Animaciones

### Keyframes Disponibles
- **fade-in**: Aparición suave
- **scale-in**: Escala desde 95% con fade
- **slide-in-top/bottom/left**: Deslizamiento direccional
- **hover-lift**: Elevación con sombra en hover

### Uso
```tsx
<div className="animate-fade-in">Contenido</div>
<Card className="hover-lift">Card elevable</Card>
<div className="animate-scale-in" style={{ animationDelay: '100ms' }}>
  Animación con delay
</div>
```

---

## 🧩 Componentes Principales

### 1. Sidebar
**Características:**
- Logo con gradiente cyan/blue tecnológico
- Navegación con íconos lucide-react
- Indicador visual de página activa (barra derecha cyan brillante)
- Avatar con iniciales del usuario
- Animaciones de hover y scale
- Fondo oscuro incluso en modo claro (contraste tech)
- Responsive: overlay en mobile

**Estados:**
- **Activo**: `bg-sidebar-primary` con barra derecha cyan brillante
- **Hover**: `hover:translate-x-1` + scale de ícono + hover:bg-sidebar-accent
- **Mobile**: Overlay con backdrop-blur y animación slide-in

### 2. Header
**Características:**
- Breadcrumbs navegables
- Barra de búsqueda global
- Notificaciones con badge rojo
- Theme toggle
- Sticky con backdrop-blur

### 3. Cards Estadísticas (Dashboard)
**Diseño:**
- Gradientes tecnológicos únicos por métrica:
  - Clientes: `gradient-tech-blue` (cyan/blue)
  - Contratos: `gradient-tech-green` (verde)
  - Pagos: `gradient-tech-purple` (púrpura)
  - Planes: `gradient-tech-orange` (naranja)
- Ícono en badge circular con gradiente
- Hover: elevación + flecha aparece + scale del badge
- Enlaces clickeables a secciones
- Animación staggered (delay por índice: 0ms, 100ms, 200ms, 300ms)

### 4. DataTable
**Características:**
- Skeleton loading states
- Empty states con emoji
- Hover en filas
- Responsive con scroll horizontal
- Paginación integrada

### 5. Forms
**Best Practices:**
- Labels claros y descriptivos
- Íconos en inputs (Mail, Lock, etc.)
- Validación inline con mensajes en español
- Estados: default, focus, error, disabled
- Botones con loading states (spinner)

---

## 📐 Spacing System

Basado en Tailwind's spacing scale (4px base):

```
gap-2  → 8px   (elementos muy cercanos)
gap-3  → 12px  (elementos relacionados)
gap-4  → 16px  (separación estándar)
gap-6  → 24px  (secciones)
gap-8  → 32px  (bloques grandes)
```

### Padding Estándar
- **Card**: `p-6` (24px)
- **Page**: `p-4 lg:p-6` (responsive)
- **Sidebar**: `px-3 py-4`
- **Header**: `px-4 lg:px-6`

---

## 🔤 Tipografía

### Font System
```css
font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
font-feature-settings: "rlig" 1, "calt" 1; /* Ligatures */
```

### Hierarchy
- **h1**: `text-4xl lg:text-5xl font-bold tracking-tight`
- **h2**: `text-3xl font-semibold tracking-tight`
- **h3**: `text-2xl font-semibold tracking-tight`
- **h4**: `text-xl font-semibold tracking-tight`
- **Body**: `text-base leading-7`
- **Small**: `text-sm text-muted-foreground`

---

## 🎯 Patrones de Diseño

### 1. Página de Login
**Estructura:**
```
[Branding Left 50%] | [Form Right 50%]
```
- Left: Gradiente tech cyan/blue con stats tecnológicas y CTA
  - Stats: "100+ Clientes Activos", "99.9% Uptime", "24/7 Soporte"
  - Background con patrón de grid sutil
- Right: Form centrado con sombra pronunciada y campos con íconos
- Mobile: Solo form, logo arriba con gradiente tech

### 2. Dashboard
**Layout:**
```
[Header con breadcrumbs]
[4 Stats Cards en grid]
[Tabla de pagos pendientes]
```
- Stats clickeables con gradientes únicos
- Animaciones staggered
- Links a secciones respectivas

### 3. Lista (CRUD)
**Patrón estándar:**
```tsx
<Header + Button "Nuevo" />
<Filters Row (search, selects) />
<DataTable />
<Pagination />
```

### 4. Formulario
**Estructura:**
```
[Title]
[Grid de campos 2 cols]
[Submit Button]
```
- Labels claros
- Validación inline
- Loading states
- Campos relacionados agrupados

---

## 🎨 Badges de Estado

### Contratos
```tsx
activo      → variant="success" (verde)
suspendido  → variant="warning" (amarillo)
cancelado   → variant="destructive" (rojo)
pendiente   → variant="default" (gris)
```

### Pagos
```tsx
pendiente  → variant="warning"
validado   → variant="success"
rechazado  → variant="destructive"
```

---

## 🚀 Efectos de Interacción

### Hover States
```css
/* Cards */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

/* Sidebar links */
hover:translate-x-1
hover:scale-110 (iconos)

/* Buttons */
hover:bg-primary/90
```

### Focus States
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

### Loading States
```tsx
{isPending ? (
  <div className="flex items-center gap-2">
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    Cargando...
  </div>
) : "Texto normal"}
```

---

## 📱 Responsiveness

### Breakpoints
```
sm:  640px  → Mobile landscape
md:  768px  → Tablet
lg:  1024px → Desktop
xl:  1280px → Large desktop
2xl: 1536px → Extra large
```

### Patterns
```tsx
// Grid responsivo
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

// Sidebar mobile
<aside className="lg:static fixed ... lg:translate-x-0">

// Padding responsivo
<div className="p-4 lg:p-6">

// Ocultar en mobile
<div className="hidden md:block">
```

---

## 🎭 Dark Mode

### Implementación
```tsx
// ThemeProvider con localStorage
const [theme, setTheme] = useState(() =>
  localStorage.getItem('theme') || 'light'
);

// Toggle
<button onClick={toggleTheme}>
  {theme === 'light' ? <Moon /> : <Sun />}
</button>
```

### CSS Variables
Todas las variables están duplicadas en `:root` y `.dark`:
```css
:root {
  --background: 220 25% 97%;  /* Subtle gray, no flat white */
  --primary: 199 89% 48%;      /* Cyan/Blue tech */
  --chart-1: 199 89% 48%;
  --chart-2: 142 76% 36%;
  --chart-3: 262 83% 58%;
}

.dark {
  --background: 222 47% 11%;   /* Deep navy */
  --primary: 188 100% 60%;      /* Bright cyan */
  --chart-1: 188 100% 60%;
  --chart-2: 142 76% 45%;
  --chart-3: 262 83% 65%;
}
```

**Importante**: No se usa blanco puro (#FFF). El fondo claro es gris sutil con gradientes animados y patrón de grid para estética tecnológica.

---

## 🛠️ Utilidades Custom

### cn() - Class Names
```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)} />
```

### formatCRC()
```tsx
formatCRC(25000) // "₡25,000"
```

### formatDate()
```tsx
formatDate("2025-01-15") // "15/1/2025"
```

---

## 📋 Checklist de Diseño

Al crear nuevas páginas/componentes:

- [ ] ✅ Usa componentes shadcn/ui existentes
- [ ] ✅ Aplica animaciones de entrada (fade-in, scale-in)
- [ ] ✅ Implementa estados de loading
- [ ] ✅ Maneja empty states con mensajes amigables
- [ ] ✅ Responsive (mobile-first)
- [ ] ✅ Dark mode compatible
- [ ] ✅ Accesibilidad (labels, aria-labels, focus states)
- [ ] ✅ Hover effects en elementos interactivos
- [ ] ✅ Consistencia en spacing (gap-4, gap-6)
- [ ] ✅ Validación de forms con mensajes claros

---

## 🎓 Best Practices

### DO ✅
- Usar gradientes tecnológicos para elementos destacados (gradient-tech-blue, cyan, purple, etc.)
- Animaciones sutiles (0.2-0.3s) con efectos de glow y pulse
- Spacing consistente (múltiplos de 4px)
- Icons de lucide-react
- Loading states en botones y tablas
- Empty states con emoji/ilustración
- Breadcrumbs en header
- Badges para estados
- Hover effects en elementos clickeables (lift, glow, scale)
- Glass morphism para overlays y cards especiales
- Fondos dinámicos con gradientes animados y patrones de grid
- Efectos de neón para elementos tech destacados

### DON'T ❌
- Animaciones mayores a 500ms
- Más de 2 colores por componente (excl. gradientes tecnológicos)
- Botones sin loading state
- Forms sin validación inline
- Tablas sin skeleton loading
- Cards sin hover effect
- Colores hardcoded (usar CSS variables con hsl())
- Íconos sin size-classes consistentes
- Fondos blancos puros (usar --background con gradientes)
- Efectos de glow excesivos (mantener opacidad baja: 0.2-0.4)
- Patrones de grid muy densos (60px mínimo)

---

## 🔗 Referencias

- **shadcn/ui Docs**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Lucide Icons**: https://lucide.dev/
- **Radix UI**: https://www.radix-ui.com/

---

## 🎨 Ejemplos de Código

### Stat Card Profesional
```tsx
<Link to="/clientes">
  <Card className="hover-lift cursor-pointer group animate-scale-in">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        Total Clientes
      </CardTitle>
      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
        <Users className="h-5 w-5 text-white" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-bold">142</div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </CardContent>
  </Card>
</Link>
```

### Input con Ícono
```tsx
<div className="relative">
  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
  <Input
    type="email"
    placeholder="email@example.com"
    className="pl-10 h-11"
  />
</div>
```

### Button con Loading
```tsx
<Button disabled={isPending}>
  {isPending ? (
    <>
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
      Guardando...
    </>
  ) : (
    "Guardar"
  )}
</Button>
```

---

**Actualizado**: 2026-02-04
**Versión**: 2.0.0 - Tech Color Scheme
