import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRatingByReportId,
  saveRating,
  canModifyRating,
} from "../services/ratingService";
import { invalidateRating, invalidateReport } from "../lib/queryClient";

// Claves para las consultas
export const ratingKeys = {
  all: ["ratings"],
  lists: () => [...ratingKeys.all, "list"],
  list: (filters) => [...ratingKeys.lists(), { filters }],
  details: () => [...ratingKeys.all, "detail"],
  detail: (reportId) => [...ratingKeys.details(), reportId],
  canModify: (reportId) => [...ratingKeys.all, "canModify", reportId],
};

// Hook para obtener la calificación de un reporte
export function useRating(reportId) {
  return useQuery({
    queryKey: ratingKeys.detail(reportId),
    queryFn: () => getRatingByReportId(reportId),
    enabled: !!reportId, // Solo ejecutar si hay un ID de reporte
  });
}

// Hook para verificar si se puede modificar una calificación
export function useCanModifyRating(reportId) {
  return useQuery({
    queryKey: ratingKeys.canModify(reportId),
    queryFn: () => canModifyRating(reportId),
    enabled: !!reportId, // Solo ejecutar si hay un ID de reporte
  });
}

// Hook para guardar una calificación
export function useSaveRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, ratingData }) => {
      // Verificar si se puede modificar antes de guardar
      const canModify = await canModifyRating(reportId);
      if (!canModify) {
        throw new Error("Esta calificación ya no puede ser modificada.");
      }
      return saveRating(reportId, ratingData);
    },
    onSuccess: (data) => {
      // Actualizar la calificación en la caché
      queryClient.setQueryData(ratingKeys.detail(data.id), data);

      // Actualizar el estado de "canModify" en la caché
      queryClient.setQueryData(ratingKeys.canModify(data.id), false);

      // Invalidar solo la calificación actualizada
      invalidateRating(data.id);

      // También invalidar el reporte relacionado para actualizar su vista de detalle
      invalidateReport(data.id);
    },
  });
}
