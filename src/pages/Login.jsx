"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogIn } from "lucide-react";
import ceprunsalogo from "../assets/images/ceprunsa-logo.png";
import ceprunsalocal from "../assets/images/ceprunsa-local.jpg";

function Login() {
  const { loginWithGoogle, currentUser, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Solo redirigir si estamos en el cliente y tenemos un usuario
    if (typeof window !== "undefined" && currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleLogin = async () => {
    const success = await loginWithGoogle();
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Imagen de fondo con overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={ceprunsalocal}
          loading="lazy"
          decoding="async"
          alt="CEPRUNSA local"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-ceprunsa-mustard opacity-35"></div>
      </div>

      {/* Contenido del login */}
      <div className="relative z-10 w-full max-w-md px-6 py-12 bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl">
        <div className="flex flex-col items-center space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <img
              className="h-24 w-auto drop-shadow-md"
              src={ceprunsalogo}
              alt="CEPRUNSA Logo"
            />
            <div className="h-0.5 w-16 bg-ceprunsa-mustard my-2"></div>
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Sistema de Registro de Atención
            </h2>
            <p className="text-sm text-gray-600 text-center">
              Centro Preuniversitario de la Universidad Nacional de San Agustín
            </p>
          </div>

          <div className="w-full">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="h-px bg-gray-300 flex-grow"></div>
              <span className="text-sm text-gray-500 px-2">
                Acceso al sistema
              </span>
              <div className="h-px bg-gray-300 flex-grow"></div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6 animate-fadeIn">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error de acceso
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                      {error.includes("No tienes permiso") && (
                        <p className="mt-1">
                          Solo los correos autorizados pueden acceder al
                          sistema.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleLogin}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-gray-900 bg-ceprunsa-mustard hover:bg-ceprunsa-mustard-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard transition-all duration-200 shadow-md"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-gray-900 group-hover:text-gray-900" />
              </span>
              Iniciar sesión con Google
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} CEPRUNSA - Universidad Nacional de
              San Agustín
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
