import { ChevronRight, Menu, Search, Command as CommandIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import NotificationsDropdown from "./NotificationsDropdown";
import CommandPalette from "./CommandPalette";
import { useLocation, Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

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
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 md:gap-2 relative z-10">
          {/* Command Palette Trigger */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCommandOpen(true)}
                className="hidden md:flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-primary/20 bg-background/50 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 hover:shadow-md group"
              >
                <Search className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs md:text-sm text-muted-foreground hidden lg:inline">Buscar...</span>
                <kbd className="hidden xl:inline-flex h-5 select-none items-center gap-1 rounded border border-primary/20 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 group-hover:border-primary/40">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Navegación rápida (Cmd+K)
            </TooltipContent>
          </Tooltip>

          {/* Mobile search button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden hover-glow"
                onClick={() => setCommandOpen(true)}
              >
                <CommandIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Buscar (Cmd+K)
            </TooltipContent>
          </Tooltip>

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

        <CommandPalette />
      </header>
    </TooltipProvider>
  );
}
