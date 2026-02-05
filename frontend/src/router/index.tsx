import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ClientesListPage from "@/pages/clientes/ClientesListPage";
import ClienteCreatePage from "@/pages/clientes/ClienteCreatePage";
import ClienteEditPage from "@/pages/clientes/ClienteEditPage";
import ClienteDetailPage from "@/pages/clientes/ClienteDetailPage";
import PlanesListPage from "@/pages/planes/PlanesListPage";
import PlanCreatePage from "@/pages/planes/PlanCreatePage";
import PlanEditPage from "@/pages/planes/PlanEditPage";
import ContratosListPage from "@/pages/contratos/ContratosListPage";
import ContratoCreatePage from "@/pages/contratos/ContratoCreatePage";
import ContratoEditPage from "@/pages/contratos/ContratoEditPage";
import PagosListPage from "@/pages/pagos/PagosListPage";
import PagoCreatePage from "@/pages/pagos/PagoCreatePage";
import PagoValidarPage from "@/pages/pagos/PagoValidarPage";
import InstalacionesListPage from "@/pages/instalaciones/InstalacionesListPage";
import InstalacionSolicitudCreatePage from "@/pages/instalaciones/InstalacionSolicitudCreatePage";
import InstalacionDetailPage from "@/pages/instalaciones/InstalacionDetailPage";

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
          { path: "planes", element: <PlanesListPage /> },
          { path: "planes/nuevo", element: <PlanCreatePage /> },
          { path: "planes/:id/editar", element: <PlanEditPage /> },
          { path: "contratos", element: <ContratosListPage /> },
          { path: "contratos/nuevo", element: <ContratoCreatePage /> },
          { path: "contratos/:id/editar", element: <ContratoEditPage /> },
          { path: "pagos", element: <PagosListPage /> },
          { path: "pagos/nuevo", element: <PagoCreatePage /> },
          { path: "pagos/:id/validar", element: <PagoValidarPage /> },
          { path: "instalaciones", element: <InstalacionesListPage /> },
          { path: "instalaciones/nueva-solicitud", element: <InstalacionSolicitudCreatePage /> },
          { path: "instalaciones/:id", element: <InstalacionDetailPage /> },
        ],
      },
    ],
  },
]);
