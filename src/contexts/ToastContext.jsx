"use client";

import { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/Toast";

// Definir el tipo de notificación
export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
};

// Crear el contexto
const ToastContext = createContext(null);

// Proveedor del contexto
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Función para añadir una notificación
  const addToast = useCallback(({ type, message, duration = 3000 }) => {
    const id = Date.now().toString();

    // Añadir la nueva notificación
    setToasts((prevToasts) => [...prevToasts, { id, type, message, duration }]);

    // Configurar el temporizador para eliminar la notificación
    setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  }, []);

  // Función para eliminar una notificación
  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Contenedor de notificaciones */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe ser usado dentro de un ToastProvider");
  }
  return context;
}
