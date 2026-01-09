"use client";

import { useEffect, useMemo } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { queryClient } from "./lib/queryClient";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ReportForm, { action as reportFormAction } from "./pages/ReportForm";
import ReportDetails from "./pages/ReportDetails";
import ReportRating from "./pages/ReportRating";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { getAllReports, getReportById } from "./services/reportService";
import { isEmailAllowed, isUserAdmin } from "./services/userService";

// Componente para manejar errores
function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error("Error en la aplicación:", error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ceprunsa-gray-light p-4">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-ceprunsa-red mb-4">
          ¡Ups! Algo salió mal
        </h1>
        <p className="text-gray-700 mb-4">
          {error.message || "Ha ocurrido un error inesperado."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-ceprunsa-mustard text-gray-900 rounded-md hover:bg-ceprunsa-mustard-light"
        >
          Volver
        </button>
      </div>
    </div>
  );
}

// Loader para verificar autenticación
const authLoader = async () => {
  // Esta función se ejecutará en el cliente
  const auth = JSON.parse(
    localStorage.getItem("auth") || '{"currentUser": null}'
  );

  if (!auth.currentUser) {
    return redirect("/login");
  }

  // Verificar si el correo está en la lista de permitidos en Firebase
  const isAllowed = await isEmailAllowed(auth.currentUser.email);
  if (!isAllowed) {
    // Eliminar la información de autenticación
    localStorage.removeItem("auth");
    return redirect("/login");
  }

  return auth.currentUser;
};

// Loader para verificar permisos de administrador
const adminLoader = async () => {
  const user = await authLoader();

  if (!user) {
    return redirect("/login");
  }

  // Verificar si el usuario es administrador
  const adminStatus = await isUserAdmin(user.email);
  if (!adminStatus) {
    return redirect("/");
  }

  return user;
};

// Loader para obtener todos los informes
const reportsLoader = async () => {
  try {
    const reports = await getAllReports();
    return reports;
  } catch (error) {
    console.error("Error al cargar informes:", error);
    throw new Error(
      "No se pudieron cargar los informes. Por favor, intenta de nuevo."
    );
  }
};

// Loader para obtener un informe específico
const reportLoader = async ({ params }) => {
  try {
    console.log("Cargando informe con ID:", params.id);
    const report = await getReportById(params.id);
    console.log("Informe cargado:", report);
    return report;
  } catch (error) {
    console.error("Error al cargar informe:", error);
    throw new Error("No se pudo cargar el informe solicitado.");
  }
};

// Componente AuthSync para mantener sincronizado el estado de autenticación con localStorage
function AuthSync() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          currentUser: {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          },
        })
      );
    } else {
      localStorage.removeItem("auth");
    }
  }, [currentUser]);

  return null;
}

// Configuración del router
const createRouter = () => {
  return createBrowserRouter([
    {
      path: "/login",
      element: <Login />,
      errorElement: <ErrorBoundary />,
    },
    {
      path: "/",
      element: <Layout />,
      errorElement: <ErrorBoundary />,
      loader: authLoader,
      children: [
        {
          index: true,
          element: <Dashboard />,
          loader: reportsLoader,
        },
        {
          path: "reports/new",
          element: <ReportForm />,
          action: reportFormAction,
        },
        {
          path: "reports/:id",
          element: <ReportDetails />,
          loader: reportLoader,
        },
        {
          path: "reports/:id/edit",
          element: <ReportForm />,
          loader: reportLoader,
          action: reportFormAction,
        },
        {
          path: "reports/:id/rate",
          element: <ReportRating />,
          loader: reportLoader,
        },
        {
          path: "admin/users",
          element: <UserManagement />,
          loader: adminLoader,
        },
      ],
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ]);
};

function App() {
  // Creamos el router una sola vez para evitar recreaciones durante la hidratación
  const router = useMemo(() => createRouter(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <AuthSync />
          <RouterProvider
            router={router}
            fallbackElement={
              <div className="flex h-screen items-center justify-center">
                Cargando aplicación...
              </div>
            }
          />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
