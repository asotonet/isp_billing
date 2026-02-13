import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as clientesApi from "@/api/clientes";
import * as contratosApi from "@/api/contratos";
import * as planesApi from "@/api/planes";
import * as usuariosApi from "@/api/usuarios";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const navigate = useNavigate();

  // Use external state if provided, otherwise use internal
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search queries - only fetch if there's a search term
  const { data: clientes } = useQuery({
    queryKey: ["search-clientes", debouncedQuery],
    queryFn: () => clientesApi.getClientes({ page: 1, page_size: 5, search: debouncedQuery }),
    enabled: debouncedQuery.length > 2,
  });

  const { data: contratos } = useQuery({
    queryKey: ["search-contratos", debouncedQuery],
    queryFn: () => contratosApi.getContratos({ page: 1, page_size: 5, search: debouncedQuery }),
    enabled: debouncedQuery.length > 2,
  });

  const { data: planes } = useQuery({
    queryKey: ["search-planes", debouncedQuery],
    queryFn: () => planesApi.getPlanes({ page: 1, page_size: 5, search: debouncedQuery }),
    enabled: debouncedQuery.length > 2,
  });

  const { data: usuarios } = useQuery({
    queryKey: ["search-usuarios", debouncedQuery],
    queryFn: () => usuariosApi.getUsuarios({ page: 1, page_size: 5, search: debouncedQuery }),
    enabled: debouncedQuery.length > 2,
  });

  const hasSearchResults = debouncedQuery.length > 2 && (
    (clientes?.items.length ?? 0) > 0 ||
    (contratos?.items.length ?? 0) > 0 ||
    (planes?.items.length ?? 0) > 0 ||
    (usuarios?.items.length ?? 0) > 0
  );

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
    setSearchQuery("");
    navigate(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-3/5 animate-gradient-shift" />

        {/* Scan lines effect */}
        <div className="scan-lines absolute inset-0 pointer-events-none" />

        <Command className="relative z-10 bg-transparent" shouldFilter={false}>
          <div className="flex items-center border-b border-primary/20 px-3">
            <Zap className="mr-2 h-5 w-5 shrink-0 text-primary animate-pulse" />
            <CommandInput
              placeholder="Buscar clientes, contratos, planes... (Cmd+K)"
              className="border-0 bg-transparent focus:ring-0"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <SearchX className="h-8 w-8 opacity-50" />
                <p>{debouncedQuery.length > 2 ? "No se encontraron resultados" : "Escribe al menos 3 caracteres para buscar"}</p>
              </div>
            </CommandEmpty>

            {/* Search Results */}
            {hasSearchResults && (
              <>
                {clientes && clientes.items.length > 0 && (
                  <CommandGroup heading="Clientes" className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-2">
                    {clientes.items.map((cliente) => (
                      <CommandItem
                        key={cliente.id}
                        onSelect={() => handleSelect(`/clientes/${cliente.id}`)}
                        className="group flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-primary/10 data-[selected=true]:bg-primary/10 relative overflow-hidden"
                      >
                        <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors relative z-10" />
                        <div className="flex-1 relative z-10">
                          <div className="font-medium group-hover:text-foreground">
                            {cliente.razon_social || `${cliente.nombre} ${cliente.apellido1 || ""}`.trim()}
                          </div>
                          <div className="text-xs text-muted-foreground">{cliente.numero_identificacion}</div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {contratos && contratos.items.length > 0 && (
                  <>
                    <CommandSeparator className="bg-primary/10" />
                    <CommandGroup heading="Contratos" className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-2">
                      {contratos.items.map((contrato) => (
                        <CommandItem
                          key={contrato.id}
                          onSelect={() => handleSelect(`/contratos/${contrato.id}`)}
                          className="group flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-primary/10 data-[selected=true]:bg-primary/10 relative overflow-hidden"
                        >
                          <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors relative z-10" />
                          <div className="flex-1 relative z-10">
                            <div className="font-medium group-hover:text-foreground">{contrato.numero_contrato}</div>
                            <div className="text-xs text-muted-foreground">
                              {contrato.cliente_nombre} - {contrato.plan_nombre}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}

                {planes && planes.items.length > 0 && (
                  <>
                    <CommandSeparator className="bg-primary/10" />
                    <CommandGroup heading="Planes" className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-2">
                      {planes.items.map((plan) => (
                        <CommandItem
                          key={plan.id}
                          onSelect={() => handleSelect(`/planes/${plan.id}`)}
                          className="group flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-primary/10 data-[selected=true]:bg-primary/10 relative overflow-hidden"
                        >
                          <Wifi className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors relative z-10" />
                          <div className="flex-1 relative z-10">
                            <div className="font-medium group-hover:text-foreground">{plan.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {plan.velocidad_bajada}↓ / {plan.velocidad_subida}↑ Mbps
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}

                {usuarios && usuarios.items.length > 0 && (
                  <>
                    <CommandSeparator className="bg-primary/10" />
                    <CommandGroup heading="Usuarios" className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-2">
                      {usuarios.items.map((usuario) => (
                        <CommandItem
                          key={usuario.id}
                          onSelect={() => handleSelect(`/settings/usuarios/${usuario.id}`)}
                          className="group flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-primary/10 data-[selected=true]:bg-primary/10 relative overflow-hidden"
                        >
                          <UserCog className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors relative z-10" />
                          <div className="flex-1 relative z-10">
                            <div className="font-medium group-hover:text-foreground">{usuario.nombre_completo}</div>
                            <div className="text-xs text-muted-foreground">{usuario.email}</div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}

                <CommandSeparator className="bg-primary/10" />
              </>
            )}

            {/* Navigation Items - show when no search query or no results */}
            {(!debouncedQuery || (debouncedQuery.length > 2 && !hasSearchResults)) && navigationItems.map((section, idx) => (
              <div key={section.group}>
                {idx > 0 && <CommandSeparator className="bg-primary/10" />}
                <CommandGroup
                  heading={section.group}
                  className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-2"
                >
                  {section.items.filter(item =>
                    !debouncedQuery ||
                    item.label.toLowerCase().includes(debouncedQuery.toLowerCase())
                  ).map((item) => (
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
          </CommandList>
        </Command>
      </div>
    </CommandDialog>
  );
}

// Missing Command UI components that need to be added
import { SearchX } from "lucide-react";
