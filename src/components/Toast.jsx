"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { TOAST_TYPES } from "../contexts/ToastContext";

function Toast({ id, type, message, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  // Efecto para la animación de entrada
  useEffect(() => {
    // Pequeño retraso para permitir que la transición funcione
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // Determinar el icono y los colores según el tipo
  const getToastStyles = () => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800",
          iconColor: "text-green-500",
        };
      case TOAST_TYPES.ERROR:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          iconColor: "text-red-500",
        };
      case TOAST_TYPES.WARNING:
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-800",
          iconColor: "text-yellow-500",
        };
      case TOAST_TYPES.INFO:
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-800",
          iconColor: "text-blue-500",
        };
    }
  };

  const { icon, bgColor, borderColor, textColor, iconColor } = getToastStyles();

  // Manejar el cierre de la notificación
  const handleClose = () => {
    setIsVisible(false);
    // Dar tiempo para que termine la animación antes de eliminar
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div
      className={`${bgColor} border ${borderColor} rounded-md shadow-md px-4 py-3 max-w-md w-full pointer-events-auto transition-all duration-300 transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
      role="alert"
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${iconColor}`}>{icon}</div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        </div>
        <button
          type="button"
          className={`ml-auto -mx-1.5 -my-1.5 ${bgColor} ${textColor} rounded-lg p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard`}
          onClick={handleClose}
          aria-label="Cerrar"
        >
          <span className="sr-only">Cerrar</span>
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default Toast;
