import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable, { type Column } from "@/components/common/DataTable";
import Pagination from "@/components/common/Pagination";
import { InstalacionStatusBadge } from "@/components/instalaciones/InstalacionStatusBadge";
import { useInstalaciones } from "@/hooks/useInstalaciones";
import type { Instalacion, EstadoInstalacion } from "@/types/instalacion";

const columns: Column<Instalacion>[] = [
  { header: "Número", accessor: "numero_instalacion" },
  {
    header: "Cliente",
    accessor: (row) =>
      row.temp_razon_social ||
      `${row.temp_nombre} ${row.temp_apellido1 || ""}`.trim() ||
      "-",
  },
  {
    header: "Plan",
    accessor: (row) => row.plan.nombre,
  },
  {
    header: "Fecha Programada",
    accessor: (row) =>
      new Date(row.fecha_programada).toLocaleDateString("es-CR"),
  },
  {
    header: "Estado",
    accessor: (row) => <InstalacionStatusBadge estado={row.estado} />,
  },
];

const estadoLabels: Record<EstadoInstalacion, string> = {
  solicitud: "Solicitud",
  programada: "Programada",
  en_progreso: "En Progreso",
  completada: "Completada",
  cancelada: "Cancelada",
};

export default function InstalacionesListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [estadoFilter, setEstadoFilter] = useState<string>("all");

  const { data, isLoading } = useInstalaciones({
    page,
    page_size: 20,
    estado:
      estadoFilter === "all"
        ? undefined
        : (estadoFilter as EstadoInstalacion),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button asChild>
          <Link to="/instalaciones/nueva-solicitud">
            <Plus className="h-4 w-4" /> Nueva Solicitud
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Select
          value={estadoFilter}
          onValueChange={(v) => {
            setEstadoFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(estadoLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/instalaciones/${row.id}`)}
      />

      <Pagination
        page={page}
        totalPages={data?.total_pages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
