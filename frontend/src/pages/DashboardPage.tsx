import { ArrowUpRight, CreditCard, FileText, TrendingUp, Users, Wifi, Activity, AlertCircle, CheckCircle, XCircle, Server, RefreshCw, Zap } from "lucide-react";
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
  return (
    <Badge variant={variants[estado] || "default"} className="animate-pulse-border">
      {estado}
    </Badge>
  );
};

const pagoColumns: Column<Pago>[] = [
  { header: "Fecha", accessor: (row) => formatDate(row.fecha_pago) },
  { header: "Monto", accessor: (row) => <span className="font-semibold text-gradient-animated">{formatCRC(row.monto)}</span> },
  { header: "Método", accessor: "metodo_pago" },
  { header: "Periodo", accessor: "periodo_facturado" },
  { header: "Estado", accessor: (row) => estadoPagoBadge(row.estado) },
];

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case "ONLINE":
      return <CheckCircle className="h-4 w-4 text-green-500 animate-pulse" />;
    case "OFFLINE":
      return <XCircle className="h-4 w-4 text-red-500 animate-pulse" />;
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

      if (diffMins < 1) return <span className="text-primary font-semibold neon-pulse">Ahora</span>;
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
      gradient: "from-blue-500 via-cyan-500 to-blue-600",
      glowColor: "0 0 30px rgba(14, 165, 233, 0.4)",
      href: "/clientes",
    },
    {
      label: "Contratos Activos",
      value: contratosData?.total ?? 0,
      icon: FileText,
      gradient: "from-violet-500 via-purple-500 to-violet-600",
      glowColor: "0 0 30px rgba(139, 92, 246, 0.4)",
      href: "/contratos",
    },
    {
      label: "Pagos Pendientes",
      value: pagosData?.total ?? 0,
      icon: CreditCard,
      gradient: "from-orange-500 via-red-500 to-orange-600",
      glowColor: "0 0 30px rgba(249, 115, 22, 0.4)",
      href: "/pagos",
    },
    {
      label: "Planes Activos",
      value: planesData?.total ?? 0,
      icon: Wifi,
      gradient: "from-green-500 via-emerald-500 to-green-600",
      glowColor: "0 0 30px rgba(16, 185, 129, 0.4)",
      href: "/planes",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Animated Header */}
      <div className="flex items-center justify-between animate-slide-in-top">
        <div>
          <h1 className="text-4xl font-bold text-gradient-animated flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestión en tiempo real de tu ISP
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse-glow">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-breathing" />
          <span>Sistema activo</span>
        </div>
      </div>

      {/* Stats Cards with Enhanced Animations */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 stagger-fade">
        {stats.map((stat, index) => (
          <Link key={stat.label} to={stat.href}>
            <Card
              className="card-enhanced cursor-pointer group relative overflow-hidden border-0 shadow-xl scan-lines"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {/* Animated background gradient */}
              <div
                className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${stat.gradient})`,
                }}
              />

              {/* Content */}
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {stat.label}
                </CardTitle>
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 animate-breathing`}
                  style={{
                    boxShadow: stat.glowColor,
                  }}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-baseline justify-between">
                  <div className="text-4xl font-bold group-hover:scale-110 transition-transform">
                    {stat.value}
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                </div>
                <div className="mt-2 h-1 w-0 group-hover:w-full transition-all duration-500 rounded-full bg-gradient-to-r opacity-50"
                     style={{ backgroundImage: `linear-gradient(90deg, ${stat.gradient})` }}
                />
              </CardContent>

              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute inset-0 shimmer" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Payments with Glass Effect */}
      <Card className="animate-slide-in-bottom shadow-2xl glass-strong border-tech-animated relative overflow-hidden" style={{ animationDelay: "200ms" }}>
        {/* Scan lines overlay */}
        <div className="scan-lines absolute inset-0 pointer-events-none" />

        <CardHeader className="flex flex-row items-center justify-between relative z-10">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary animate-pulse" />
              <span className="text-gradient-animated">Pagos Pendientes Recientes</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Últimas transacciones pendientes de validación
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="hover-glow ripple-effect">
            <Link to="/pagos">
              Ver todos
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="rounded-lg overflow-hidden">
            <DataTable
              columns={pagoColumns}
              data={pagosData?.items ?? []}
              emptyMessage="🎉 No hay pagos pendientes"
            />
          </div>
        </CardContent>
      </Card>

      {/* Router Events History with Tech Border */}
      <Card className="animate-slide-in-bottom shadow-2xl glass-strong card-tech relative overflow-hidden" style={{ animationDelay: "300ms" }}>
        {/* Scan lines overlay */}
        <div className="scan-lines absolute inset-0 pointer-events-none" />

        <CardHeader className="flex flex-row items-center justify-between relative z-10">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary animate-pulse" />
              <span className="text-gradient-animated">Eventos de Routers</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Monitoreo en tiempo real de cambios y estado de routers
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="hover-glow ripple-effect">
            <Link to="/routers">
              Ver routers
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="rounded-lg overflow-hidden">
            <DataTable
              columns={routerEventColumns}
              data={routerEvents ?? []}
              emptyMessage="Sin eventos recientes"
            />
          </div>
        </CardContent>

        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-50" />
      </Card>
    </div>
  );
}
