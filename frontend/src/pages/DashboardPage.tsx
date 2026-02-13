import { ArrowUpRight, CreditCard, FileText, TrendingUp, Users, Wifi, Activity, AlertCircle, CheckCircle, XCircle, Server, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientes } from "@/hooks/useClientes";
import { useContratos } from "@/hooks/useContratos";
import { usePagos } from "@/hooks/usePagos";
import { usePlanes } from "@/hooks/usePlanes";
import { useRouterEvents } from "@/hooks/useRouterEvents";
import DataTable, { type Column } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { formatCRC, formatDate } from "@/lib/utils";
import type { Pago } from "@/types/pago";
import type { RouterEvent } from "@/types/router-event";
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

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case "ONLINE":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "OFFLINE":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "CREATED":
      return <Server className="h-4 w-4 text-blue-500" />;
    case "IDENTITY_CHANGED":
    case "VERSION_CHANGED":
      return <RefreshCw className="h-4 w-4 text-orange-500" />;
    case "DELETED":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

const getEventBadge = (eventType: string) => {
  const variants: Record<string, "default" | "success" | "destructive" | "warning"> = {
    ONLINE: "success",
    OFFLINE: "destructive",
    CREATED: "default",
    IDENTITY_CHANGED: "warning",
    VERSION_CHANGED: "warning",
    DELETED: "destructive",
  };
  const labels: Record<string, string> = {
    ONLINE: "En línea",
    OFFLINE: "Desconectado",
    CREATED: "Creado",
    IDENTITY_CHANGED: "Identity",
    VERSION_CHANGED: "Versión",
    DELETED: "Eliminado",
  };
  return (
    <Badge variant={variants[eventType] || "default"} className="gap-1">
      {getEventIcon(eventType)}
      {labels[eventType] || eventType}
    </Badge>
  );
};

const routerEventColumns: Column<RouterEvent>[] = [
  {
    header: "Timestamp",
    accessor: (row) => {
      const date = new Date(row.created_at);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Ahora";
      if (diffMins < 60) return `Hace ${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Hace ${diffHours}h`;
      return formatDate(row.created_at);
    },
  },
  {
    header: "Router",
    accessor: (row) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.router_nombre || "—"}</span>
        <span className="text-xs text-muted-foreground">{row.router_ip}</span>
      </div>
    ),
  },
  {
    header: "Evento",
    accessor: (row) => getEventBadge(row.event_type),
  },
  {
    header: "Descripción",
    accessor: "description",
  },
];

export default function DashboardPage() {
  const { data: clientesData } = useClientes({ page: 1, page_size: 1 });
  const { data: contratosData } = useContratos({ page: 1, page_size: 1, estado: "activo" });
  const { data: pagosData } = usePagos({ page: 1, page_size: 5, estado: "pendiente" });
  const { data: planesData } = usePlanes({ page: 1, page_size: 1, is_active: true });
  const { data: routerEvents } = useRouterEvents(10);

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-end">
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

      {/* Router Events History */}
      <Card className="animate-slide-in-bottom shadow-lg" style={{ animationDelay: "100ms" }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Historial de Eventos de Routers
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Monitoreo en tiempo real de cambios y estado de routers
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/routers">
              Ver routers
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={routerEventColumns}
            data={routerEvents ?? []}
            emptyMessage="Sin eventos recientes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
