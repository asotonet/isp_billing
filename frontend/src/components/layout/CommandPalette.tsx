import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  FileText,
  Wifi,
  CreditCard,
  Server,
  Wrench,
  Settings,
  UserCog,
  Shield,
  Palette,
  Zap,
} from "lucide-react";

const navigationItems = [
  {
    group: "Principal",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", shortcut: "⌘D" },
      { label: "Clientes", icon: Users, href: "/clientes", shortcut: "⌘C" },
      { label: "Contratos", icon: FileText, href: "/contratos", shortcut: "⌘N" },
      { label: "Planes", icon: Wifi, href: "/planes", shortcut: "⌘P" },
      { label: "Pagos", icon: CreditCard, href: "/pagos", shortcut: "⌘$" },
      { label: "Instalaciones", icon: Wrench, href: "/instalaciones" },
    ],
  },
  {
    group: "Configuración",
    items: [
      { label: "Routers", icon: Server, href: "/routers" },
      { label: "Usuarios", icon: UserCog, href: "/settings/usuarios" },
      { label: "Roles", icon: Shield, href: "/settings/roles" },
      { label: "Personalización", icon: Palette, href: "/settings/personalizacion" },
    ],
  },
];

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CommandPalette({ open: externalOpen, onOpenChange }: CommandPaletteProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const navigate = useNavigate();

  // Use external state if provided, otherwise use internal
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-3/5 animate-gradient-shift" />

        {/* Scan lines effect */}
        <div className="scan-lines absolute inset-0 pointer-events-none" />

        <Command className="relative z-10 bg-transparent">
          <div className="flex items-center border-b border-primary/20 px-3">
            <Zap className="mr-2 h-5 w-5 shrink-0 text-primary animate-pulse" />
            <CommandInput
              placeholder="Buscar o navegar... (Cmd+K)"
              className="border-0 bg-transparent focus:ring-0"
            />
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <SearchX className="h-8 w-8 opacity-50" />
                <p>No se encontraron resultados</p>
              </div>
            </CommandEmpty>

            {navigationItems.map((section, idx) => (
              <div key={section.group}>
                {idx > 0 && <CommandSeparator className="bg-primary/10" />}
                <CommandGroup
                  heading={section.group}
                  className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-2"
                >
                  {section.items.map((item) => (
                    <CommandItem
                      key={item.href}
                      onSelect={() => handleSelect(item.href)}
                      className="group flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-primary/10 hover:shadow-md data-[selected=true]:bg-primary/10 data-[selected=true]:shadow-md relative overflow-hidden"
                    >
                      {/* Hover effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-chart-3/20 to-transparent opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity" />

                      {/* Icon */}
                      <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary group-data-[selected=true]:text-primary transition-colors relative z-10" />

                      {/* Label */}
                      <span className="flex-1 relative z-10 font-medium group-hover:text-foreground group-data-[selected=true]:text-foreground transition-colors">
                        {item.label}
                      </span>

                      {/* Shortcut */}
                      {item.shortcut && (
                        <kbd className="relative z-10 pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border border-primary/20 bg-muted/50 px-2 font-mono text-xs font-medium text-muted-foreground opacity-100 group-hover:border-primary/40 group-hover:text-primary transition-all">
                          {item.shortcut}
                        </kbd>
                      )}

                      {/* Shimmer on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity pointer-events-none">
                        <div className="shimmer" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            ))}

            <CommandSeparator className="bg-primary/10" />
            <CommandGroup heading="Sugerencia" className="px-2 py-2">
              <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary animate-pulse" />
                Usa <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-semibold">⌘K</kbd> para abrir este menú desde cualquier lugar
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </CommandDialog>
  );
}

// Missing Command UI components that need to be added
import { SearchX } from "lucide-react";
