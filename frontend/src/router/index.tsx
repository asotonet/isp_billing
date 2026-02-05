import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ClientesListPage from "@/pages/clientes/ClientesListPage";
import ClienteCreatePage from "@/pages/clientes/ClienteCreatePage";
import ClienteEditPage from "@/pages/clientes/ClienteEditPage";
import ClienteDetailPage from "@/pages/clientes/ClienteDetailPage";
import PlanesListPage from "@/pages/planes/PlanesListPage";
import PlanCreatePage from "@/pages/planes/PlanCreatePage";
import PlanEditPage from "@/pages/planes/PlanEditPage";
import RoutersListPage from "@/pages/routers/RoutersListPage";
import RouterCreatePage from "@/pages/routers/RouterCreatePage";
import RouterEditPage from "@/pages/routers/RouterEditPage";
import ContratosListPage from "@/pages/contratos/ContratosListPage";
import ContratoCreatePage from "@/pages/contratos/ContratoCreatePage";
import ContratoEditPage from "@/pages/contratos/ContratoEditPage";
import PagosListPage from "@/pages/pagos/PagosListPage";
import PagoCreatePage from "@/pages/pagos/PagoCreatePage";
import PagoValidarPage from "@/pages/pagos/PagoValidarPage";
import InstalacionesListPage from "@/pages/instalaciones/InstalacionesListPage";
import InstalacionSolicitudCreatePage from "@/pages/instalaciones/InstalacionSolicitudCreatePage";
import InstalacionDetailPage from "@/pages/instalaciones/InstalacionDetailPage";
import UsuariosListPage from "@/pages/usuarios/UsuariosListPage";
import UsuarioCreatePage from "@/pages/usuarios/UsuarioCreatePage";
import UsuarioEditPage from "@/pages/usuarios/UsuarioEditPage";
import RolesManagementPage from "@/pages/roles/RolesManagementPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "clientes", element: <ClientesListPage /> },
          { path: "clientes/nuevo", element: <ClienteCreatePage /> },
          { path: "clientes/:id", element: <ClienteDetailPage /> },
          { path: "clientes/:id/editar", element: <ClienteEditPage /> },
          {
            path: "planes",
            element: <RoleProtectedRoute module="planes"><PlanesListPage /></RoleProtectedRoute>
          },
          {
            path: "planes/nuevo",
            element: <RoleProtectedRoute module="planes"><PlanCreatePage /></RoleProtectedRoute>
          },
          {
            path: "planes/:id/editar",
            element: <RoleProtectedRoute module="planes"><PlanEditPage /></RoleProtectedRoute>
          },
          {
            path: "routers",
            element: <RoleProtectedRoute module="routers"><RoutersListPage /></RoleProtectedRoute>
          },
          {
            path: "routers/nuevo",
            element: <RoleProtectedRoute module="routers"><RouterCreatePage /></RoleProtectedRoute>
          },
          {
            path: "routers/:id/editar",
            element: <RoleProtectedRoute module="routers"><RouterEditPage /></RoleProtectedRoute>
          },
          { path: "contratos", element: <ContratosListPage /> },
          { path: "contratos/nuevo", element: <ContratoCreatePage /> },
          { path: "contratos/:id/editar", element: <ContratoEditPage /> },
          { path: "pagos", element: <PagosListPage /> },
          { path: "pagos/nuevo", element: <PagoCreatePage /> },
          { path: "pagos/:id/validar", element: <PagoValidarPage /> },
          {
            path: "instalaciones",
            element: <RoleProtectedRoute module="instalaciones"><InstalacionesListPage /></RoleProtectedRoute>
          },
          {
            path: "instalaciones/nueva-solicitud",
            element: <RoleProtectedRoute module="instalaciones"><InstalacionSolicitudCreatePage /></RoleProtectedRoute>
          },
          {
            path: "instalaciones/:id",
            element: <RoleProtectedRoute module="instalaciones"><InstalacionDetailPage /></RoleProtectedRoute>
          },
          {
            path: "usuarios",
            element: <RoleProtectedRoute module="usuarios"><UsuariosListPage /></RoleProtectedRoute>
          },
          {
            path: "usuarios/nuevo",
            element: <RoleProtectedRoute module="usuarios"><UsuarioCreatePage /></RoleProtectedRoute>
          },
          {
            path: "usuarios/:id",
            element: <RoleProtectedRoute module="usuarios"><UsuarioEditPage /></RoleProtectedRoute>
          },
          {
            path: "roles",
            element: <RoleProtectedRoute module="roles"><RolesManagementPage /></RoleProtectedRoute>
          },
        ],
      },
    ],
  },
]);
