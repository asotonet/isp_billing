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
import { usePagos } from "@/hooks/usePagos";
import { formatCRC, formatDate } from "@/lib/utils";
import type { EstadoPago, Pago } from "@/types/pago";

const estadoVariants: Record<string, "success" | "warning" | "destructive"> = {
  pendiente: "warning",
  validado: "success",
  rechazado: "destructive",
};

const metodoLabels: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  sinpe_movil: "SINPE Móvil",
  tarjeta: "Tarjeta",
  deposito: "Depósito",
};

const columns: Column<Pago>[] = [
  { header: "Fecha", accessor: (row) => formatDate(row.fecha_pago) },
  { header: "Monto", accessor: (row) => formatCRC(row.monto) },
  { header: "Método", accessor: (row) => metodoLabels[row.metodo_pago] || row.metodo_pago },
  { header: "Periodo", accessor: "periodo_facturado" },
  { header: "Referencia", accessor: (row) => row.referencia || "-" },
  {
    header: "Estado",
    accessor: (row) => <Badge variant={estadoVariants[row.estado]}>{row.estado}</Badge>,
  },
  {
    header: "Acciones",
    accessor: (row) => (
      <div onClick={(e) => e.stopPropagation()}>
        {row.estado === "pendiente" && (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/pagos/${row.id}/validar`}>Validar</Link>
          </Button>
        )}
      </div>
    ),
  },
];

export default function PagosListPage() {
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState<string>("all");

  const { data, isLoading } = usePagos({
    page,
    page_size: 20,
    estado: estado === "all" ? undefined : (estado as EstadoPago),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pagos</h1>
        <Button asChild>
          <Link to="/pagos/nuevo">
            <Plus className="h-4 w-4" /> Nuevo Pago
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
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="validado">Validado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} />
      <Pagination page={page} totalPages={data?.total_pages ?? 1} onPageChange={setPage} />
    </div>
  );
}
