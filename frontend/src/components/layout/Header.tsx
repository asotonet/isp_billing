import { ChevronRight, Menu, Command as CommandIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import NotificationsDropdown from "./NotificationsDropdown";
import GlobalSearch from "./GlobalSearch";
import { useLocation, Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

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
  const [commandOpen, setCommandOpen] = useState(false);

  const getBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    return paths.map((path, index) => ({
      label: routeLabels[path] || path,
      href: "/" + paths.slice(0, index + 1).join("/"),
      isLast: index === paths.length - 1,
    }));
  };

  const breadcrumbs = getBreadcrumbs();

  // Listen for Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-4 lg:px-6 relative">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-chart-3/5 pointer-events-none" />

        {/* Left section */}
        <div className="flex items-center gap-4 flex-1 relative z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden hover-glow"
                onClick={onMenuClick}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Abrir menú
            </TooltipContent>
          </Tooltip>

          {/* Breadcrumbs with animations */}
          <nav className="hidden lg:flex items-center space-x-1 text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <div
                key={crumb.href}
                className="flex items-center animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {index > 0 && (
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4 mx-1 text-primary/50" />
                )}
                {crumb.isLast ? (
                  <span className="text-sm md:text-base font-semibold text-primary">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.href}
                    className="text-xs md:text-sm hover:text-foreground transition-all duration-300 hover:translate-x-0.5 relative group"
                  >
                    {crumb.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-chart-3 group-hover:w-full transition-all duration-300" />
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Global Search */}
          <div className="flex-1 ml-auto hidden lg:block">
            <GlobalSearch open={commandOpen} onOpenChange={setCommandOpen} />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 md:gap-2 relative z-10">

          <NotificationsDropdown />

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <ThemeToggle />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Cambiar tema
            </TooltipContent>
          </Tooltip>
        </div>

      </header>
    </TooltipProvider>
  );
}
