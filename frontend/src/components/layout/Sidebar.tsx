import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Palette,
  Server,
  Settings,
  Shield,
  UserCog,
  Users,
  Wifi,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useLogout } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { hasAccess } from "@/utils/permissions";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { label: "Clientes", href: "/clientes", icon: Users, module: "clientes" },
  { label: "Contratos", href: "/contratos", icon: FileText, module: "contratos" },
  { label: "Planes", href: "/planes", icon: Wifi, module: "planes" },
  { label: "Instalaciones", href: "/instalaciones", icon: Wrench, module: "instalaciones" },
  { label: "Pagos", href: "/pagos", icon: CreditCard, module: "pagos" },
];

const settingsItems = [
  { label: "Routers", href: "/routers", icon: Server, module: "routers" },
  { label: "Usuarios", href: "/settings/usuarios", icon: UserCog, module: "usuarios" },
  { label: "Roles", href: "/settings/roles", icon: Shield, module: "roles" },
  { label: "Personalización", href: "/settings/personalizacion", icon: Palette, module: "usuarios" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const { data: settings, refetch: refetchSettings } = useSettings();
  const [settingsExpanded, setSettingsExpanded] = useState(
    location.pathname.startsWith("/settings") || location.pathname.startsWith("/routers")
  );

  const companyName = settings?.company_name || "ISP Billing";

  // Escuchar cambios en la configuración
  useEffect(() => {
    const handleSettingsUpdate = () => {
      refetchSettings();
    };
    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("settingsUpdated", handleSettingsUpdate);
    };
  }, [refetchSettings]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Filtrar navItems según permisos del usuario
  const filteredNavItems = user
    ? navItems.filter((item) => hasAccess(user.rol, item.module))
    : [];

  const filteredSettingsItems = user
    ? settingsItems.filter((item) => hasAccess(user.rol, item.module))
    : [];

  const hasSettingsAccess = filteredSettingsItems.length > 0;

  return (
    <>
      {/* Mobile overlay with blur */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar-background border-r border-sidebar-border transition-all duration-300 lg:static lg:translate-x-0 scan-lines",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Tech border glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-breathing" />
          <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-chart-3/5 rounded-full blur-3xl animate-breathing" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header with enhanced logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border relative z-10 backdrop-blur-sm bg-sidebar-background/80">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 flex items-center justify-center shadow-lg hover-glow animate-breathing relative overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 shimmer" />
              <Zap className="h-6 w-6 text-white relative z-10" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-sidebar-foreground truncate group-hover:text-gradient-animated transition-all">
                {companyName}
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Costa Rica
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover-glow"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation with staggered animations */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto relative z-10 stagger-fade">
          {filteredNavItems.map((item, index) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                  isActive
                    ? "bg-gradient-to-r from-sidebar-primary/90 to-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:translate-x-1 hover:shadow-md"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Active indicator glow */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-chart-3/20 blur-xl" />
                )}

                {/* Icon with enhanced effects */}
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all duration-300 relative z-10",
                    isActive
                      ? "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      : "group-hover:scale-110 group-hover:rotate-12"
                  )}
                />

                <span className="relative z-10">{item.label}</span>

                {/* Active indicator line with pulse */}
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-l-full animate-pulse-glow" />
                )}

                {/* Hover shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute inset-0 shimmer" />
                </div>
              </Link>
            );
          })}

          {/* Settings Section with enhanced accordion */}
          {hasSettingsAccess && (
            <div className="space-y-1 pt-2">
              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                  location.pathname.startsWith("/settings") || location.pathname.startsWith("/routers")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:shadow-md"
                )}
              >
                <Settings className={cn(
                  "h-5 w-5 transition-all duration-300",
                  settingsExpanded && "rotate-180"
                )} />
                <span className="flex-1 text-left">Configuración</span>
                {settingsExpanded ? (
                  <ChevronDown className="h-4 w-4 animate-bounce-in" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}

                {/* Hover effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute inset-0 shimmer" />
                </div>
              </button>

              {settingsExpanded && (
                <div className="space-y-1 ml-4 pl-4 border-l-2 border-primary/30 animate-slide-in-left">
                  {filteredSettingsItems.map((item, index) => {
                    const isActive = location.pathname === item.href ||
                      location.pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 group relative overflow-hidden animate-fade-in",
                          isActive
                            ? "bg-gradient-to-r from-sidebar-primary/90 to-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:translate-x-1 hover:shadow-md"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-chart-3/20 blur-xl" />
                        )}

                        <item.icon className={cn(
                          "h-4 w-4 transition-all duration-300 relative z-10",
                          isActive
                            ? "scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                            : "group-hover:scale-110"
                        )} />

                        <span className="relative z-10">{item.label}</span>

                        {isActive && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-l-full animate-pulse-glow" />
                        )}

                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="absolute inset-0 shimmer" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        <Separator className="mx-3 bg-sidebar-border/50" />

        {/* User section with enhanced avatar */}
        {user && (
          <div className="p-4 space-y-3 relative z-10 backdrop-blur-sm bg-sidebar-background/80">
            <div className="flex items-center gap-3 px-2 group cursor-pointer hover-lift">
              <div className="relative">
                <Avatar className="h-11 w-11 ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all duration-300">
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 text-white text-sm font-bold relative overflow-hidden">
                    <div className="absolute inset-0 shimmer" />
                    <span className="relative z-10">{getInitials(user.nombre_completo)}</span>
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-sidebar-background animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate group-hover:text-gradient-animated transition-all">
                  {user.nombre_completo}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 hover:shadow-md hover-glow ripple-effect transition-all duration-300"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Cerrando...
                </span>
              ) : (
                "Cerrar Sesión"
              )}
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
