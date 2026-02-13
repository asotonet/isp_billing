import { ChevronRight, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import NotificationsDropdown from "./NotificationsDropdown";
import { useLocation, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onMenuClick: () => void;
}

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  clientes: "Clientes",
  planes: "Planes",
  contratos: "Contratos",
  pagos: "Pagos",
  routers: "Routers",
  instalaciones: "Instalaciones",
  settings: "Configuración",
  usuarios: "Usuarios",
  roles: "Roles",
  personalizacion: "Personalización",
  nuevo: "Nuevo",
  editar: "Editar",
  validar: "Validar",
  "nueva-solicitud": "Nueva Solicitud",
};

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();

  const getBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    return paths.map((path, index) => ({
      label: routeLabels[path] || path,
      href: "/" + paths.slice(0, index + 1).join("/"),
      isLast: index === paths.length - 1,
    }));
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      {/* Left section */}
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumbs */}
        <nav className="hidden md:flex items-center space-x-1 text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
              {crumb.isLast ? (
                <span className="text-xl font-semibold text-foreground">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.href}
                  className="text-sm hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-64 pl-8 h-9"
          />
        </div>
        <NotificationsDropdown />
        <ThemeToggle />
      </div>
    </header>
  );
}
