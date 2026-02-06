import { useState } from "react";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  usePermissionsMatrix,
  useBulkUpdatePermissions,
  useInitializeDefaultPermissions,
} from "@/hooks/useRolePermissions";
import type { RolePermissionCreate, RolePermissionsMatrix } from "@/types/rolePermission";
import type { RolUsuario } from "@/types/usuario";

const moduleNames: Record<string, string> = {
  dashboard: "Dashboard",
  clientes: "Clientes",
  planes: "Planes",
  contratos: "Contratos",
  pagos: "Pagos",
  instalaciones: "Instalaciones",
  usuarios: "Usuarios",
  roles: "Gestión de Roles",
};

const roleLabels: Record<RolUsuario, string> = {
  ADMIN: "Administrador",
  OPERADOR: "Operador",
  TECNICO: "Técnico",
  AUDITOR: "Auditor",
  SOPORTE: "Soporte",
};

export default function RolesManagementPage() {
  const { data, isLoading, refetch } = usePermissionsMatrix();
  const updateMutation = useBulkUpdatePermissions();
  const initializeMutation = useInitializeDefaultPermissions();

  const [localPermissions, setLocalPermissions] = useState<RolePermissionsMatrix | null>(null);

  // Usa localPermissions si existe, sino usa data
  const permissionsData = localPermissions || data;

  const handlePermissionChange = (
    module: string,
    rol: RolUsuario,
    type: "can_read" | "can_write",
    value: boolean
  ) => {
    if (!permissionsData) return;

    const newPermissions = { ...permissionsData };
    if (!newPermissions.permissions[module]) {
      newPermissions.permissions[module] = {} as any;
    }
    if (!newPermissions.permissions[module][rol]) {
      newPermissions.permissions[module][rol] = { can_read: false, can_write: false };
    }

    newPermissions.permissions[module][rol][type] = value;

    // Si se desmarca can_read, también desmarcar can_write
    if (type === "can_read" && !value) {
      newPermissions.permissions[module][rol].can_write = false;
    }

    // Si se marca can_write, también marcar can_read automáticamente
    if (type === "can_write" && value) {
      newPermissions.permissions[module][rol].can_read = true;
    }

    setLocalPermissions(newPermissions);
  };

  const handleSave = async () => {
    if (!permissionsData) return;

    const permissionsToSave: RolePermissionCreate[] = [];

    permissionsData.modules.forEach((module) => {
      permissionsData.roles.forEach((rol) => {
        const perms = permissionsData.permissions[module]?.[rol] || {
          can_read: false,
          can_write: false,
        };

        permissionsToSave.push({
          rol,
          module,
          can_read: perms.can_read,
          can_write: perms.can_write,
          description: `Permiso para ${moduleNames[module] || module}`,
        });
      });
    });

    updateMutation.mutate(permissionsToSave, {
      onSuccess: () => {
        toast.success("Permisos actualizados correctamente");
        setLocalPermissions(null);
        refetch();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || "Error al actualizar permisos");
      },
    });
  };

  const handleReset = () => {
    setLocalPermissions(null);
    toast.info("Cambios descartados");
  };

  const handleInitializeDefaults = () => {
    if (confirm("¿Estás seguro de que quieres restaurar los permisos por defecto?")) {
      initializeMutation.mutate(undefined, {
        onSuccess: () => {
          toast.success("Permisos inicializados correctamente");
          setLocalPermissions(null);
          refetch();
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.detail || "Error al inicializar permisos");
        },
      });
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!permissionsData) return <p>No se pudieron cargar los permisos</p>;

  const hasChanges = localPermissions !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Roles y Permisos</h1>
          <p className="text-muted-foreground mt-2">
            Configura los permisos de lectura y escritura para cada rol y módulo del sistema
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset} disabled={updateMutation.isPending}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Descartar
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Matriz de Permisos</CardTitle>
              <CardDescription>
                Marca los checkboxes para otorgar permisos. Lectura (R) y Escritura (W)
              </CardDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleInitializeDefaults}
              disabled={initializeMutation.isPending}
            >
              Restaurar Permisos por Defecto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold bg-muted">Módulo</th>
                  {permissionsData.roles.map((rol) => (
                    <th key={rol} className="text-center p-4 font-semibold bg-muted min-w-[120px]">
                      <div>{roleLabels[rol]}</div>
                      <div className="text-xs font-normal text-muted-foreground mt-1">
                        R / W
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissionsData.modules.map((module) => (
                  <tr key={module} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{moduleNames[module] || module}</td>
                    {permissionsData.roles.map((rol) => {
                      const perms = permissionsData.permissions[module]?.[rol] || {
                        can_read: false,
                        can_write: false,
                      };

                      return (
                        <td key={`${module}-${rol}`} className="p-4">
                          <div className="flex items-center justify-center gap-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`${module}-${rol}-read`}
                                checked={perms.can_read}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(
                                    module,
                                    rol,
                                    "can_read",
                                    checked as boolean
                                  )
                                }
                              />
                              <Label
                                htmlFor={`${module}-${rol}-read`}
                                className="text-xs cursor-pointer"
                              >
                                R
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`${module}-${rol}-write`}
                                checked={perms.can_write}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(
                                    module,
                                    rol,
                                    "can_write",
                                    checked as boolean
                                  )
                                }
                              />
                              <Label
                                htmlFor={`${module}-${rol}-write`}
                                className="text-xs cursor-pointer"
                              >
                                W
                              </Label>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasChanges && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Tienes cambios sin guardar. Haz clic en "Guardar Cambios" para aplicarlos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Descripción de Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <strong className="text-sm">Administrador:</strong>
              <span className="text-sm text-muted-foreground ml-2">
                Acceso completo a todas las funcionalidades del sistema
              </span>
            </div>
            <div>
              <strong className="text-sm">Operador:</strong>
              <span className="text-sm text-muted-foreground ml-2">
                Gestión de clientes, contratos, pagos, planes e instalaciones
              </span>
            </div>
            <div>
              <strong className="text-sm">Técnico:</strong>
              <span className="text-sm text-muted-foreground ml-2">
                Enfocado en instalaciones y soporte técnico
              </span>
            </div>
            <div>
              <strong className="text-sm">Auditor:</strong>
              <span className="text-sm text-muted-foreground ml-2">
                Solo lectura para reportes y auditoría
              </span>
            </div>
            <div>
              <strong className="text-sm">Soporte:</strong>
              <span className="text-sm text-muted-foreground ml-2">
                Atención al cliente, consultas básicas y registro de pagos
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
