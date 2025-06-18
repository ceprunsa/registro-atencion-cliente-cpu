"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast, TOAST_TYPES } from "../contexts/ToastContext";
import { RATING_VALUES } from "../services/ratingService";
import {
  ArrowLeft,
  Check,
  Loader,
  AlertCircle,
  Lock,
  Home,
} from "lucide-react";
import { useReport } from "../hooks/useReports";
import {
  useRating,
  useSaveRating,
  useCanModifyRating,
} from "../hooks/useRatings";

import ceprunsalogo from "../assets/images/ceprunsa-logo.png";

function ReportRating() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Usar React Query para obtener el reporte y la calificación
  const {
    data: report,
    isLoading: isLoadingReport,
    error: reportError,
  } = useReport(id);
  const { data: rating, isLoading: isLoadingRating } = useRating(id);
  const { data: canModify, isLoading: isLoadingCanModify } =
    useCanModifyRating(id);
  const saveRatingMutation = useSaveRating();

  const [selectedRating, setSelectedRating] = useState(null);
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [notificationShown, setNotificationShown] = useState(false);

  // Cargar calificación existente si hay
  useEffect(() => {
    if (rating && !notificationShown) {
      console.log("Calificación encontrada:", rating);
      setSelectedRating(rating.rating);
      setComments(rating.comments || "");

      // Si ya existe una calificación y está bloqueada, mostrar mensaje
      // Solo mostrar la notificación una vez
      if (rating.locked) {
        addToast({
          type: TOAST_TYPES.INFO,
          message: "Esta calificación ya no puede ser modificada.",
          duration: 5000,
        });
        setNotificationShown(true);
      }
    }
  }, [rating, addToast, notificationShown]);

  // Función para omitir la calificación y volver al dashboard
  const handleSkipRating = () => {
    addToast({
      type: TOAST_TYPES.INFO,
      message: "Ha omitido la calificación del informe.",
      duration: 3000,
    });
    navigate("/");
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRating) {
      addToast({
        type: TOAST_TYPES.WARNING,
        message: "Por favor, seleccione una calificación.",
        duration: 3000,
      });
      return;
    }

    try {
      const ratingData = {
        rating: selectedRating,
        comments: comments.trim(),
        report_id: id,
        report_number: report.nro_consulta,
        updated: true,
      };

      console.log("Guardando calificación:", ratingData);

      // Usar la mutación de React Query para guardar la calificación
      await saveRatingMutation.mutateAsync({ reportId: id, ratingData });

      addToast({
        type: TOAST_TYPES.SUCCESS,
        message: "¡Gracias por su calificación!",
        duration: 3000,
      });

      setSubmitted(true);

      // Redirigir después de 2 segundos al dashboard
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error al guardar calificación:", error);
      addToast({
        type: TOAST_TYPES.ERROR,
        message:
          error.message ||
          "Error al guardar la calificación. Por favor, inténtelo de nuevo.",
        duration: 5000,
      });
    }
  };

  // Renderizar estado de carga
  if (isLoadingReport || isLoadingRating || isLoadingCanModify) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ceprunsa-mustard"></div>
      </div>
    );
  }

  // Renderizar estado de error
  if (reportError || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
        <p className="text-gray-600 mb-6">
          No se pudo cargar la información del informe.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-ceprunsa-mustard text-gray-900 rounded-md hover:bg-ceprunsa-mustard-light"
        >
          Volver
        </button>
      </div>
    );
  }

  // Renderizar estado de éxito
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-green-100 rounded-full p-3 mb-4">
          <Check className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Gracias por su respuesta!
        </h2>
        <p className="text-gray-600 mb-6">
          Su calificación ha sido registrada correctamente.
        </p>
        <p className="text-sm text-gray-500">Redirigiendo al dashboard...</p>
      </div>
    );
  }

  // Renderizar mensaje de calificación bloqueada
  if (canModify === false) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center">
          <button
            onClick={() => navigate(`/reports/${id}`)}
            className="mr-4 p-2 rounded-full hover:bg-ceprunsa-gray-light"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Calificación Bloqueada
          </h1>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-yellow-100 rounded-full p-4 mb-6">
              <Lock className="h-12 w-12 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Esta calificación ya no puede ser modificada
            </h2>
            <p className="text-gray-600 mb-6">
              Las calificaciones solo pueden realizarse una vez para garantizar
              la integridad de las evaluaciones.
            </p>
            <button
              onClick={() => navigate(`/reports/${id}`)}
              className="px-6 py-3 bg-ceprunsa-mustard text-gray-900 rounded-md hover:bg-ceprunsa-mustard-light"
            >
              Volver al informe
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate(`/reports/${id}`)}
          className="mr-4 p-2 rounded-full hover:bg-ceprunsa-gray-light"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Calificar Atención</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Encabezado con logo y número de consulta */}
        <div className="border-b border-gray-200">
          <div className="grid grid-cols-2 items-center">
            <div className="p-4 border-r border-gray-200">
              <img
                src={ceprunsalogo}
                alt="CEPRUNSA Logo"
                className="h-16 object-contain"
              />
            </div>
            <div className="p-4">
              <p className="text-lg font-bold">N° de consulta:</p>
              <p className="text-xl font-bold text-ceprunsa-red">
                {report.nro_consulta}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de calificación */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-center mb-6">
              Por favor, califique la atención recibida:
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-4">
              {/* Opciones de calificación */}
              <div className="flex flex-col items-center">
                <label
                  className={`border rounded-md p-3 w-full text-center cursor-pointer transition-colors ${
                    selectedRating === RATING_VALUES.VERY_SATISFIED
                      ? "bg-green-100 border-green-500"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="rating"
                    value={RATING_VALUES.VERY_SATISFIED}
                    checked={selectedRating === RATING_VALUES.VERY_SATISFIED}
                    onChange={() =>
                      setSelectedRating(RATING_VALUES.VERY_SATISFIED)
                    }
                    className="sr-only"
                  />
                  <span className="block text-sm font-medium">
                    Muy satisfecho
                  </span>
                  <div className="flex justify-center mt-2">
                    <div className="h-5 w-5 border border-gray-300 flex items-center justify-center">
                      {selectedRating === RATING_VALUES.VERY_SATISFIED && (
                        <div className="h-3 w-3 bg-green-500"></div>
                      )}
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex flex-col items-center">
                <label
                  className={`border rounded-md p-3 w-full text-center cursor-pointer transition-colors ${
                    selectedRating === RATING_VALUES.SATISFIED
                      ? "bg-green-50 border-green-300"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="rating"
                    value={RATING_VALUES.SATISFIED}
                    checked={selectedRating === RATING_VALUES.SATISFIED}
                    onChange={() => setSelectedRating(RATING_VALUES.SATISFIED)}
                    className="sr-only"
                  />
                  <span className="block text-sm font-medium">Satisfecho</span>
                  <div className="flex justify-center mt-2">
                    <div className="h-5 w-5 border border-gray-300 flex items-center justify-center">
                      {selectedRating === RATING_VALUES.SATISFIED && (
                        <div className="h-3 w-3 bg-green-500"></div>
                      )}
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex flex-col items-center">
                <label
                  className={`border rounded-md p-3 w-full text-center cursor-pointer transition-colors ${
                    selectedRating === RATING_VALUES.NEUTRAL
                      ? "bg-gray-100 border-gray-500"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="rating"
                    value={RATING_VALUES.NEUTRAL}
                    checked={selectedRating === RATING_VALUES.NEUTRAL}
                    onChange={() => setSelectedRating(RATING_VALUES.NEUTRAL)}
                    className="sr-only"
                  />
                  <span className="block text-sm font-medium">Neutral</span>
                  <div className="flex justify-center mt-2">
                    <div className="h-5 w-5 border border-gray-300 flex items-center justify-center">
                      {selectedRating === RATING_VALUES.NEUTRAL && (
                        <div className="h-3 w-3 bg-gray-500"></div>
                      )}
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex flex-col items-center">
                <label
                  className={`border rounded-md p-3 w-full text-center cursor-pointer transition-colors ${
                    selectedRating === RATING_VALUES.UNSATISFIED
                      ? "bg-red-50 border-red-300"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="rating"
                    value={RATING_VALUES.UNSATISFIED}
                    checked={selectedRating === RATING_VALUES.UNSATISFIED}
                    onChange={() =>
                      setSelectedRating(RATING_VALUES.UNSATISFIED)
                    }
                    className="sr-only"
                  />
                  <span className="block text-sm font-medium">
                    Insatisfecho
                  </span>
                  <div className="flex justify-center mt-2">
                    <div className="h-5 w-5 border border-gray-300 flex items-center justify-center">
                      {selectedRating === RATING_VALUES.UNSATISFIED && (
                        <div className="h-3 w-3 bg-red-500"></div>
                      )}
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex flex-col items-center">
                <label
                  className={`border rounded-md p-3 w-full text-center cursor-pointer transition-colors ${
                    selectedRating === RATING_VALUES.VERY_UNSATISFIED
                      ? "bg-red-100 border-red-500"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="rating"
                    value={RATING_VALUES.VERY_UNSATISFIED}
                    checked={selectedRating === RATING_VALUES.VERY_UNSATISFIED}
                    onChange={() =>
                      setSelectedRating(RATING_VALUES.VERY_UNSATISFIED)
                    }
                    className="sr-only"
                  />
                  <span className="block text-sm font-medium">
                    Muy insatisfecho
                  </span>
                  <div className="flex justify-center mt-2">
                    <div className="h-5 w-5 border border-gray-300 flex items-center justify-center">
                      {selectedRating === RATING_VALUES.VERY_UNSATISFIED && (
                        <div className="h-3 w-3 bg-red-500"></div>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Comentarios */}
          <div className="mb-8">
            <label htmlFor="comments" className="block text-lg font-bold mb-2">
              Comentarios (opcional):
            </label>
            <textarea
              id="comments"
              name="comments"
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-ceprunsa-mustard focus:border-ceprunsa-mustard"
              placeholder="Escriba sus comentarios aquí..."
            />
          </div>

          {/* Aviso importante */}
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Importante:</strong> Las calificaciones solo pueden
                  realizarse una vez y no podrán ser modificadas posteriormente.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={handleSkipRating}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              <Home className="mr-2 h-5 w-5 inline" />
              Omitir calificación
            </button>

            <button
              type="submit"
              disabled={saveRatingMutation.isPending}
              className="px-6 py-3 bg-ceprunsa-mustard text-gray-900 rounded-md hover:bg-ceprunsa-mustard-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveRatingMutation.isPending ? (
                <>
                  <Loader className="mr-2 h-5 w-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Calificación"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportRating;
