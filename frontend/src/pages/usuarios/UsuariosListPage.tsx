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
import { useUsuarios } from "@/hooks/useUsuarios";
import { RolBadge } from "@/components/usuarios/RolBadge";
import type { Usuario, RolUsuario } from "@/types/usuario";

const columns: Column<Usuario>[] = [
  { header: "Nombre Completo", accessor: "nombre_completo" },
  { header: "Email", accessor: "email" },
  {
    header: "Rol",
    accessor: (row) => <RolBadge rol={row.rol} />,
  },
  {
    header: "Estado",
    accessor: (row) => (
      <Badge variant={row.is_active ? "success" : "secondary"}>
        {row.is_active ? "Activo" : "Inactivo"}
      </Badge>
    ),
  },
];

export default function UsuariosListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [rolFilter, setRolFilter] = useState<string>("all");

  const { data, isLoading } = useUsuarios({
    page,
    page_size: 20,
    search: search || undefined,
    is_active: activeFilter === "all" ? undefined : activeFilter === "active",
    rol: rolFilter === "all" ? undefined : (rolFilter as RolUsuario),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <Button asChild>
          <Link to="/usuarios/nuevo">
            <Plus className="h-4 w-4" /> Nuevo Usuario
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={rolFilter}
          onValueChange={(v) => {
            setRolFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="operador">Operador</SelectItem>
            <SelectItem value="tecnico">Técnico</SelectItem>
            <SelectItem value="auditor">Auditor</SelectItem>
            <SelectItem value="soporte">Soporte</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={activeFilter}
          onValueChange={(v) => {
            setActiveFilter(v);
            setPage(1);
          }}
        >
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
        onRowClick={(row) => navigate(`/usuarios/${row.id}`)}
      />

      <Pagination
        page={page}
        totalPages={data?.total_pages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
