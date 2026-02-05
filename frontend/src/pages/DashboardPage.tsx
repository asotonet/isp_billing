import { ArrowUpRight, CreditCard, FileText, TrendingUp, Users, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientes } from "@/hooks/useClientes";
import { useContratos } from "@/hooks/useContratos";
import { usePagos } from "@/hooks/usePagos";
import { usePlanes } from "@/hooks/usePlanes";
import DataTable, { type Column } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { formatCRC, formatDate } from "@/lib/utils";
import type { Pago } from "@/types/pago";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const estadoPagoBadge = (estado: string) => {
  const variants: Record<string, "default" | "success" | "destructive" | "warning"> = {
    pendiente: "warning",
    validado: "success",
    rechazado: "destructive",
  };
  return <Badge variant={variants[estado] || "default"}>{estado}</Badge>;
};

const pagoColumns: Column<Pago>[] = [
  { header: "Fecha", accessor: (row) => formatDate(row.fecha_pago) },
  { header: "Monto", accessor: (row) => formatCRC(row.monto) },
  { header: "Método", accessor: "metodo_pago" },
  { header: "Periodo", accessor: "periodo_facturado" },
  { header: "Estado", accessor: (row) => estadoPagoBadge(row.estado) },
];

export default function DashboardPage() {
  const { data: clientesData } = useClientes({ page: 1, page_size: 1 });
  const { data: contratosData } = useContratos({ page: 1, page_size: 1, estado: "activo" });
  const { data: pagosData } = usePagos({ page: 1, page_size: 5, estado: "pendiente" });
  const { data: planesData } = usePlanes({ page: 1, page_size: 1, is_active: true });

  const stats = [
    {
      label: "Total Clientes",
      value: clientesData?.total ?? 0,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      href: "/clientes",
    },
    {
      label: "Contratos Activos",
      value: contratosData?.total ?? 0,
      icon: FileText,
      gradient: "from-violet-500 to-purple-500",
      href: "/contratos",
    },
    {
      label: "Pagos Pendientes",
      value: pagosData?.total ?? 0,
      icon: CreditCard,
      gradient: "from-orange-500 to-red-500",
      href: "/pagos",
    },
    {
      label: "Planes Activos",
      value: planesData?.total ?? 0,
      icon: Wifi,
      gradient: "from-green-500 to-emerald-500",
      href: "/planes",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenido a tu panel de control
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Actualizado ahora</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Link key={stat.label} to={stat.href}>
            <Card
              className="hover-lift cursor-pointer group animate-scale-in border-0 bg-gradient-to-br shadow-lg"
              style={{
                animationDelay: `${index * 100}ms`,
                backgroundImage: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)`,
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div
                  className={`h-10 w-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                >
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Payments */}
      <Card className="animate-slide-in-bottom shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Pagos Pendientes Recientes</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Últimas transacciones pendientes de validación
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/pagos">
              Ver todos
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={pagoColumns}
            data={pagosData?.items ?? []}
            emptyMessage="🎉 No hay pagos pendientes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
