import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
} from "../services/reportService";
import { invalidateReport, invalidateReports } from "../lib/queryClient";

// Claves para las consultas
export const reportKeys = {
  all: ["reports"],
  lists: () => [...reportKeys.all, "list"],
  list: (filters) => [...reportKeys.lists(), { filters }],
  details: () => [...reportKeys.all, "detail"],
  detail: (id) => [...reportKeys.details(), id],
};

// Hook para obtener todos los reportes
export function useReports() {
  return useQuery({
    queryKey: reportKeys.lists(),
    queryFn: getAllReports,
  });
}

// Hook para obtener un reporte específico
export function useReport(id) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => getReportById(id),
    enabled: !!id, // Solo ejecutar si hay un ID
  });
}

// Hook para crear un nuevo reporte
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportData }) => createReport(reportData),
    onSuccess: (data) => {
      // Agregar el nuevo reporte a la caché
      queryClient.setQueryData(reportKeys.detail(data.id), data);

      // Actualizar la lista de reportes en la caché
      queryClient.setQueryData(reportKeys.lists(), (oldData = []) => [
        data,
        ...oldData,
      ]);

      // Invalidar la consulta de la lista para asegurar datos actualizados
      invalidateReports();
    },
  });
}

// Hook para actualizar un reporte
export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reportData }) => updateReport(id, reportData),
    onSuccess: (data) => {
      // Actualizar el reporte en la caché
      queryClient.setQueryData(reportKeys.detail(data.id), data);

      // Actualizar la lista de reportes en la caché
      queryClient.setQueryData(reportKeys.lists(), (oldData = []) => {
        if (!oldData) return [data];
        return oldData.map((item) => (item.id === data.id ? data : item));
      });

      // Invalidar solo el reporte actualizado
      invalidateReport(data.id);
    },
  });
}
