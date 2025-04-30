"use client";

import { Link, useLocation } from "react-router-dom";
import { Home, PlusCircle, X, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import ceprunsalogo from "../assets/images/ceprunsa-logo.png";

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const { currentUser, isAdmin } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Nuevo Informe", href: "/reports/new", icon: PlusCircle },
  ];

  // Agregar opción de administración de usuarios solo para administradores
  if (isAdmin) {
    navigation.push({
      name: "Administrar Usuarios",
      href: "/admin/users",
      icon: Users,
    });
  }

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-600 opacity-70"
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar panel */}
        <div className="fixed inset-y-0 left-0 flex flex-col max-w-xs w-full bg-white shadow-xl">
          <div className="h-0 flex-1 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center">
                <img
                  className="h-10 w-auto"
                  src={ceprunsalogo}
                  alt="CEPRUNSA Logo"
                />
              </div>
              <button
                type="button"
                className="h-10 w-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Cerrar menú</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    location.pathname === item.href
                      ? "bg-ceprunsa-mustard text-gray-900"
                      : "text-gray-600 hover:bg-ceprunsa-gray-light"
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`${
                      location.pathname === item.href
                        ? "text-gray-900"
                        : "text-gray-400 group-hover:text-gray-500"
                    } mr-4 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0 border-r border-gray-200">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white shadow-sm">
            <div className="flex flex-col items-center h-16 px-4  text-white">
              <img
                className="h-14 w-auto mt-2"
                src={ceprunsalogo}
                alt="CEPRUNSA Logo"
              />
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? "bg-ceprunsa-mustard text-gray-900"
                        : "text-gray-600 hover:bg-ceprunsa-gray-light"
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        location.pathname === item.href
                          ? "text-gray-900"
                          : "text-gray-400 group-hover:text-gray-500"
                      } mr-3 h-5 w-5`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
