import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useContratos } from "@/hooks/useContratos";
import { formatCRC, formatDate } from "@/lib/utils";
import type { Contrato, EstadoContrato } from "@/types/contrato";

const estadoVariants: Record<string, "success" | "warning" | "destructive" | "default"> = {
  activo: "success",
  suspendido: "warning",
  cancelado: "destructive",
  pendiente: "default",
};

const columns: Column<Contrato>[] = [
  { header: "N° Contrato", accessor: "numero_contrato" },
  {
    header: "Cliente",
    accessor: (row) =>
      row.cliente?.razon_social ||
      `${row.cliente?.nombre || ""} ${row.cliente?.apellido1 || ""}`.trim(),
  },
  { header: "Plan", accessor: (row) => row.plan?.nombre ?? "-" },
  { header: "Precio", accessor: (row) => formatCRC(row.plan?.precio_mensual ?? 0) },
  { header: "Inicio", accessor: (row) => formatDate(row.fecha_inicio) },
  {
    header: "Estado",
    accessor: (row) => <Badge variant={estadoVariants[row.estado]}>{row.estado}</Badge>,
  },
  {
    header: "Acciones",
    accessor: (row) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/contratos/${row.id}/editar`}>Editar</Link>
        </Button>
      </div>
    ),
  },
];

export default function ContratosListPage() {
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState<string>("all");

  const { data, isLoading } = useContratos({
    page,
    page_size: 20,
    estado: estado === "all" ? undefined : (estado as EstadoContrato),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contratos</h1>
        <Button asChild>
          <Link to="/contratos/nuevo">
            <Plus className="h-4 w-4" /> Nuevo Contrato
          </Link>
        </Button>
      </div>

      <div className="flex gap-4">
        <Select value={estado} onValueChange={(v) => { setEstado(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="suspendido">Suspendido</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} />
      <Pagination page={page} totalPages={data?.total_pages ?? 1} onPageChange={setPage} />
    </div>
  );
}
