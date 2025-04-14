import { QueryClient } from "@tanstack/react-query";

// Crear una instancia del cliente de React Query con configuración mejorada
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configuración por defecto para todas las consultas
      staleTime: 1000 * 60 * 5, // 5 minutos - tiempo que los datos se consideran frescos
      cacheTime: 1000 * 60 * 30, // 30 minutos - tiempo que los datos permanecen en caché
      refetchOnWindowFocus: true, // Recargar datos cuando la ventana recupera el foco
      refetchOnMount: true, // Recargar datos cuando el componente se monta
      refetchOnReconnect: true, // Recargar datos cuando se recupera la conexión
      retry: 1, // Intentar una vez más si falla la consulta
    },
    mutations: {
      // Configuración por defecto para todas las mutaciones
      retry: 1,
      onError: (error) => {
        console.error("Error en mutación:", error);
      },
    },
  },
});

// Funciones de utilidad para invalidación selectiva de caché

/**
 * Invalida todas las consultas relacionadas con reportes
 */
export const invalidateReports = () => {
  return queryClient.invalidateQueries({ queryKey: ["reports"] });
};

/**
 * Invalida un reporte específico por ID
 * @param {string} id - ID del reporte a invalidar
 */
export const invalidateReport = (id) => {
  return queryClient.invalidateQueries({ queryKey: ["reports", "detail", id] });
};

/**
 * Invalida todas las consultas relacionadas con usuarios
 */
export const invalidateUsers = () => {
  return queryClient.invalidateQueries({ queryKey: ["users"] });
};

/**
 * Invalida la información de permisos de un usuario específico
 * @param {string} email - Email del usuario a invalidar
 */
export const invalidateUserPermissions = (email) => {
  return queryClient.invalidateQueries({
    queryKey: ["users", "permissions", "allowed", email],
  });
};

/**
 * Invalida todas las consultas relacionadas con calificaciones
 */
export const invalidateRatings = () => {
  return queryClient.invalidateQueries({ queryKey: ["ratings"] });
};

/**
 * Invalida una calificación específica por ID de reporte
 * @param {string} reportId - ID del reporte cuya calificación se invalidará
 */
export const invalidateRating = (reportId) => {
  return queryClient.invalidateQueries({
    queryKey: ["ratings", "detail", reportId],
  });
};
