import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, FileText, Wifi, UserCog, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import * as clientesApi from "@/api/clientes";
import * as contratosApi from "@/api/contratos";
import * as planesApi from "@/api/planes";
import * as usuariosApi from "@/api/usuarios";

interface GlobalSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function GlobalSearch({ open: externalOpen, onOpenChange }: GlobalSearchProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setSelectedIndex(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Search queries
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

  // Build results array
  const results = [];
  if (clientes?.items) {
    clientes.items.forEach((cliente) => {
      results.push({
        type: "cliente",
        id: cliente.id,
        title: cliente.razon_social || `${cliente.nombre} ${cliente.apellido1 || ""}`.trim(),
        subtitle: cliente.numero_identificacion,
        href: `/clientes/${cliente.id}`,
        icon: Users,
      });
    });
  }
  if (contratos?.items) {
    contratos.items.forEach((contrato) => {
      results.push({
        type: "contrato",
        id: contrato.id,
        title: contrato.numero_contrato,
        subtitle: `${contrato.cliente_nombre} - ${contrato.plan_nombre}`,
        href: `/contratos/${contrato.id}`,
        icon: FileText,
      });
    });
  }
  if (planes?.items) {
    planes.items.forEach((plan) => {
      results.push({
        type: "plan",
        id: plan.id,
        title: plan.nombre,
        subtitle: `${plan.velocidad_bajada}↓ / ${plan.velocidad_subida}↑ Mbps`,
        href: `/planes/${plan.id}`,
        icon: Wifi,
      });
    });
  }
  if (usuarios?.items) {
    usuarios.items.forEach((usuario) => {
      results.push({
        type: "usuario",
        id: usuario.id,
        title: usuario.nombre_completo,
        subtitle: usuario.email,
        href: `/settings/usuarios/${usuario.id}`,
        icon: UserCog,
      });
    });
  }

  const handleSelect = (href: string) => {
    setOpen(false);
    setSearchQuery("");
    navigate(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex].href);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Auto open when typing
  useEffect(() => {
    if (searchQuery.length > 0) {
      setOpen(true);
    }
  }, [searchQuery, setOpen]);

  return (
    <div className="relative hidden md:block w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background transition-all cursor-text focus:outline-none focus-visible:outline-none">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar clientes, contratos, planes..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery.length > 0 && setOpen(true)}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setOpen(false);
                }}
                className="p-1 hover:bg-accent rounded shrink-0"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <kbd className="hidden xl:flex h-5 select-none items-center gap-1 rounded border border-border bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground shrink-0">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[500px] p-0 border-border shadow-lg outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0"
          align="start"
          side="bottom"
          onOpenAutoFocus={(e) => e.preventDefault()}
          sideOffset={8}
        >

        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Escribe al menos 3 caracteres para buscar
          </div>
        )}

        {debouncedQuery.length >= 3 && results.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No se encontraron resultados
          </div>
        )}

        {results.length > 0 && (
          <div className="max-h-[400px] overflow-y-auto">
            <div className="p-2">
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result.href)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                      index === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{result.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
