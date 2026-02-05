import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable, { type Column } from "@/components/common/DataTable";
import Pagination from "@/components/common/Pagination";
import { useClientes } from "@/hooks/useClientes";
import type { Cliente } from "@/types/cliente";

const columns: Column<Cliente>[] = [
  { header: "Identificación", accessor: "numero_identificacion" },
  {
    header: "Nombre",
    accessor: (row) =>
      row.razon_social || `${row.nombre} ${row.apellido1 || ""} ${row.apellido2 || ""}`.trim(),
  },
  { header: "Email", accessor: (row) => row.email || "-" },
  { header: "Teléfono", accessor: (row) => row.telefono || "-" },
  {
    header: "Estado",
    accessor: (row) => (
      <Badge variant={row.is_active ? "success" : "secondary"}>
        {row.is_active ? "Activo" : "Inactivo"}
      </Badge>
    ),
  },
];

export default function ClientesListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const { data, isLoading } = useClientes({
    page,
    page_size: 20,
    search: search || undefined,
    is_active: activeFilter === "all" ? undefined : activeFilter === "active",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Button asChild>
          <Link to="/clientes/nuevo">
            <Plus className="h-4 w-4" /> Nuevo Cliente
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, cédula, email..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/clientes/${row.id}`)}
      />

      <Pagination
        page={page}
        totalPages={data?.total_pages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
