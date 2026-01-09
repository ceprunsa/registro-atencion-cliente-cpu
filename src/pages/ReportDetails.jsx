"use client";

import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Edit, FileDown, Star, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast, TOAST_TYPES } from "../contexts/ToastContext";
import { generateReportPDF } from "../services/pdfService";
import { useReport } from "../hooks/useReports";
import { useRating, useCanModifyRating } from "../hooks/useRatings";

function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [downloading, setDownloading] = useState(false);
  const { addToast } = useToast();

  // Usar React Query para obtener el reporte y la calificación
  const {
    data: report,
    isLoading: isLoadingReport,
    error: reportError,
  } = useReport(id);
  const { data: rating, isLoading: isLoadingRating } = useRating(id);
  const { data: canModifyRating, isLoading: isLoadingCanModify } =
    useCanModifyRating(id);

  // Verificar si se debe descargar automáticamente el PDF
  const shouldDownload = searchParams.get("download") === "true";

  // Efecto para descargar automáticamente el PDF si se solicita
  useEffect(() => {
    if (shouldDownload && report) {
      downloadPDF();
      // Eliminar el parámetro de consulta después de iniciar la descarga
      navigate(`/reports/${id}`, { replace: true });
    }
  }, [shouldDownload, report, id, navigate]);

  // Función para formatear la fecha de Firestore
  const formatDate = (timestamp) => {
    if (!timestamp) return "Fecha no disponible";

    if (timestamp.toDate) {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    }

    return "Fecha no disponible";
  };

  // Función para generar y descargar el PDF
  const downloadPDF = async () => {
    try {
      setDownloading(true);
      await generateReportPDF(report);

      // Mostrar notificación de éxito
      addToast({
        type: TOAST_TYPES.SUCCESS,
        message: `PDF del informe #${report.nro_consulta} generado correctamente.`,
        duration: 3000,
      });

      setDownloading(false);
    } catch (error) {
      console.error("Error al generar el PDF:", error);

      // Reemplazar el alert por una notificación toast
      addToast({
        type: TOAST_TYPES.ERROR,
        message: `Error al generar el PDF: ${error.message}`,
        duration: 5000,
      });

      setDownloading(false);
    }
  };

  // Función para obtener el texto de la calificación
  const getRatingText = (ratingValue) => {
    switch (ratingValue) {
      case "muy_satisfecho":
        return "Muy satisfecho";
      case "satisfecho":
        return "Satisfecho";
      case "neutral":
        return "Neutral";
      case "insatisfecho":
        return "Insatisfecho";
      case "muy_insatisfecho":
        return "Muy insatisfecho";
      default:
        return "No calificado";
    }
  };

  // Función para obtener el color de la calificación
  const getRatingColor = (ratingValue) => {
    switch (ratingValue) {
      case "muy_satisfecho":
        return "bg-green-100 text-green-800";
      case "satisfecho":
        return "bg-green-50 text-green-700";
      case "neutral":
        return "bg-gray-100 text-gray-800";
      case "insatisfecho":
        return "bg-red-50 text-red-700";
      case "muy_insatisfecho":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoadingReport) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ceprunsa-mustard"></div>
      </div>
    );
  }

  if (reportError || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ceprunsa-gray-light">
        <div className="bg-white p-8 rounded shadow-md">
          <h2 className="text-2xl font-semibold text-ceprunsa-red mb-4">
            Informe no encontrado
          </h2>
          <p className="text-gray-700 mb-4">
            El informe solicitado no existe o no se pudo cargar.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-ceprunsa-mustard text-gray-900 py-2 px-4 rounded hover:bg-ceprunsa-mustard-light focus:outline-none focus:ring-2 focus:ring-ceprunsa-mustard focus:ring-opacity-50"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full hover:bg-ceprunsa-gray-light"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Informe #{report.nro_consulta}
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard disabled:opacity-50"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-900 mr-2"></div>
                Generando PDF...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Descargar PDF
              </>
            )}
          </button>
          <Link
            to={`/reports/${report.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-900 bg-ceprunsa-mustard hover:bg-ceprunsa-mustard-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Detalles del Informe
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Información completa del informe de atención.
            </p>
          </div>

          {/* Sección de calificación */}
          {isLoadingRating || isLoadingCanModify ? (
            <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
          ) : rating ? (
            <div className="flex items-center">
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getRatingColor(
                  rating.rating
                )}`}
              >
                <Star className="h-4 w-4 mr-1" />
                {getRatingText(rating.rating)}
              </span>
              {canModifyRating ? (
                <Link
                  to={`/reports/${report.id}/rate`}
                  className="ml-2 text-sm text-ceprunsa-red hover:underline"
                >
                  Actualizar
                </Link>
              ) : (
                <span className="ml-2 text-sm text-gray-500 flex items-center">
                  <Lock className="h-3 w-3 mr-1" />
                  Bloqueada
                </span>
              )}
            </div>
          ) : (
            <Link
              to={`/reports/${report.id}/rate`}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-ceprunsa-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-red"
            >
              <Star className="h-4 w-4 mr-1" />
              Calificar atención
            </Link>
          )}
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            {/* Datos del cliente - Sección */}
            <div className="sm:col-span-2">
              <dt className="text-base font-medium text-ceprunsa-red">
                Datos del Cliente
              </dt>
              <dd className="mt-1 text-sm text-gray-900 border-b border-gray-200 pb-3"></dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Cliente</dt>
              <dd className="mt-1 text-sm text-gray-900">{report.cliente}</dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                Vínculo con el Postulante
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {report.vinculo_cliente_postulante}
                {report.vinculo_cliente_postulante === "Otro" &&
                  report.vinculo_otro && (
                    <span className="ml-1">({report.vinculo_otro})</span>
                  )}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                Correo Electrónico
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {report.correo_cliente || "No especificado"}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {report.telefono_cliente || "No especificado"}
              </dd>
            </div>

            {/* Datos de la atención - Sección */}
            <div className="sm:col-span-2">
              <dt className="text-base font-medium text-ceprunsa-red">
                Datos de la Atención
              </dt>
              <dd className="mt-1 text-sm text-gray-900 border-b border-gray-200 pb-3"></dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">
                Tipo de Consulta
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                <ul className="list-disc pl-5 space-y-1">
                  {report.tipo_consulta &&
                    report.tipo_consulta.map((tipo, index) => (
                      <li key={index}>{tipo}</li>
                    ))}
                </ul>
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                Medio de Atención
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{report.medio}</dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                Detalle del Medio de Comunicación
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {report.medio_comunicacion || "No especificado"}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    report.estado === "atendido"
                      ? "bg-green-100 text-green-800"
                      : report.estado === "derivado"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {report.estado === "atendido"
                    ? "Atendido"
                    : report.estado === "derivado"
                    ? "Derivado"
                    : "No atendido"}
                </span>
              </dd>
            </div>

            {report.estado === "derivado" && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Oficina Derivada
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {report.oficina_derivada}
                </dd>
              </div>
            )}

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                Fecha y Hora
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(report.fecha_hora)}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Responsable</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {report.responsable}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">
                Resultado Final
              </dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                {report.resultado_final || "No especificado"}
              </dd>
            </div>

            {/* Sección de calificación si existe */}
            {rating && rating.comments && (
              <>
                <div className="sm:col-span-2">
                  <dt className="text-base font-medium text-ceprunsa-red">
                    Calificación del Cliente
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 border-b border-gray-200 pb-3"></dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    Comentarios
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line bg-gray-50 p-3 rounded-md">
                    {rating.comments}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

export default ReportDetails;
