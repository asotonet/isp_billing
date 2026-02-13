import { Bell, Calendar, CheckCircle2, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePagos } from "@/hooks/usePagos";
import { useInstalaciones } from "@/hooks/useInstalaciones";
import { useContratos } from "@/hooks/useContratos";
import { formatDate } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function NotificationsDropdown() {
  const navigate = useNavigate();

  // Fetch pending payments (estado: pendiente)
  const { data: pagosPendientes } = usePagos({
    page: 1,
    page_size: 5,
    estado: "pendiente",
  });

  // Fetch scheduled installations for today/this week
  const { data: instalacionesProgramadas } = useInstalaciones({
    page: 1,
    page_size: 5,
    estado: "programada",
  });

  // Fetch active contracts
  const { data: contratosActivos } = useContratos({
    page: 1,
    page_size: 5,
    estado: "activo",
  });

  // Calculate total notifications
  const totalNotifications =
    (pagosPendientes?.total ?? 0) + (instalacionesProgramadas?.total ?? 0);

  const hasNotifications = totalNotifications > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              <span className="sr-only">{totalNotifications} notificaciones</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <h3 className="font-semibold text-sm sm:text-base">Notificaciones</h3>
          {hasNotifications && (
            <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-xs font-medium">
              {totalNotifications > 99 ? "99+" : totalNotifications}
            </Badge>
          )}
        </div>

        <div className="max-h-[60vh] sm:max-h-[500px] overflow-y-auto">
          {/* Pagos Pendientes */}
          {pagosPendientes && pagosPendientes.total > 0 && (
            <>
              <div className="px-3 py-2 bg-muted/50 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-orange-500/10">
                    <Clock className="h-4 w-4 text-orange-500" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium">
                    Pagos Pendientes ({pagosPendientes.total})
                  </span>
                </div>
              </div>
              <div className="divide-y">
                {pagosPendientes.items.slice(0, 3).map((pago) => (
                  <button
                    key={pago.id}
                    onClick={() => navigate(`/pagos/validar/${pago.id}`)}
                    className="w-full px-3 py-2.5 text-left hover:bg-accent transition-colors focus:bg-accent focus:outline-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium truncate">
                          ₡{pago.monto.toLocaleString("es-CR")}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatDate(pago.fecha_pago)} • {pago.metodo_pago}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {pagosPendientes.total > 3 && (
                <button
                  onClick={() => navigate("/pagos")}
                  className="w-full py-2 text-center text-xs font-medium text-primary hover:bg-muted/50 border-t"
                >
                  Ver todos ({pagosPendientes.total})
                </button>
              )}
            </>
          )}

          {/* Instalaciones Programadas */}
          {instalacionesProgramadas && instalacionesProgramadas.total > 0 && (
            <>
              <div className="px-3 py-2 bg-muted/50 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-500/10">
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium">
                    Instalaciones ({instalacionesProgramadas.total})
                  </span>
                </div>
              </div>
              <div className="divide-y">
                {instalacionesProgramadas.items.slice(0, 3).map((instalacion) => (
                  <button
                    key={instalacion.id}
                    onClick={() => navigate(`/instalaciones/${instalacion.id}`)}
                    className="w-full px-3 py-2.5 text-left hover:bg-accent transition-colors focus:bg-accent focus:outline-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium truncate">
                          {instalacion.numero_instalacion}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatDate(instalacion.fecha_programada)}
                          {instalacion.tecnico_asignado && ` • ${instalacion.tecnico_asignado}`}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {instalacionesProgramadas.total > 3 && (
                <button
                  onClick={() => navigate("/instalaciones")}
                  className="w-full py-2 text-center text-xs font-medium text-primary hover:bg-muted/50 border-t"
                >
                  Ver todas ({instalacionesProgramadas.total})
                </button>
              )}
            </>
          )}

          {/* Empty state */}
          {!hasNotifications && (
            <div className="p-8 sm:p-12 text-center">
              <div className="flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-green-500/10 mx-auto mb-3">
                <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground font-medium mb-1">
                Todo al día
              </p>
              <p className="text-xs text-muted-foreground">
                No hay notificaciones pendientes
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
