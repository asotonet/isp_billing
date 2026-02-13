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
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar-background border-r border-sidebar-border transition-all duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-purple flex items-center justify-center shadow-md">
              <Wifi className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-sidebar-foreground truncate">{companyName}</h1>
              <p className="text-xs text-muted-foreground">Costa Rica</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive ? "scale-110" : "group-hover:scale-110"
                  )}
                />
                <span>{item.label}</span>
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-sidebar-primary-foreground rounded-l-full" />
                )}
              </Link>
            );
          })}

          {/* Settings Section */}
          {hasSettingsAccess && (
            <div className="space-y-1 pt-2">
              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                  location.pathname.startsWith("/settings") || location.pathname.startsWith("/routers")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="flex-1 text-left">Configuración</span>
                {settingsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {settingsExpanded && (
                <div className="space-y-1 ml-4 pl-4 border-l-2 border-sidebar-border">
                  {filteredSettingsItems.map((item) => {
                    const isActive = location.pathname === item.href ||
                      location.pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {isActive && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-sidebar-primary-foreground rounded-l-full" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        <Separator className="mx-3" />

        {/* User section */}
        {user && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 px-2">
              <Avatar className="h-10 w-10 ring-2 ring-sidebar-border">
                <AvatarFallback className="bg-gradient-purple text-white text-sm font-semibold">
                  {getInitials(user.nombre_completo)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.nombre_completo}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? "Cerrando..." : "Cerrar Sesión"}
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
