"use client";

import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Menu, User } from "lucide-react";

function Header({ setSidebarOpen }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Abrir menú</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-gray-900">
                Sistema de Registro de Atención
              </h1>
            </div>
          </div>

          <div className="flex items-center">
            <div className="ml-3 relative">
              <div className="flex items-center">
                <button
                  type="button"
                  className="flex items-center max-w-xs rounded-full text-sm"
                  id="user-menu-button"
                >
                  <span className="sr-only">Abrir menú de usuario</span>
                  <div className="h-8 w-8 rounded-full bg-ceprunsa-mustard flex items-center justify-center text-ceprunsa-red">
                    {currentUser?.email?.charAt(0).toUpperCase() || (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                    {currentUser?.displayName || currentUser?.email}
                  </span>
                </button>

                <button
                  onClick={handleLogout}
                  className="ml-2 px-3 py-1 text-sm text-gray-700 hover:bg-ceprunsa-gray-light rounded-md"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
