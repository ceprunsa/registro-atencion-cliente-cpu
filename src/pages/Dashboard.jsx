"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Eye,
  Edit,
  Search,
  PlusCircle,
  FileSpreadsheet,
  FileDown,
  Star,
} from "lucide-react";
import { getReportById } from "../services/reportService";
import { generateReportPDF } from "../services/pdfService";
import { exportReportsToExcel } from "../services/excelService";
import { useToast, TOAST_TYPES } from "../contexts/ToastContext";
import { useReports } from "../hooks/useReports";
import { useRating } from "../hooks/useRatings";

function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Usar el hook de React Query para obtener los reportes
  const { data: reports = [], isLoading, error } = useReports();

  const filteredReports = reports.filter(
    (report) =>
      report.nro_consulta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.cliente?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Función para descargar PDF directamente
  const handleDownloadPDF = async (reportId) => {
    try {
      setDownloadingPDF(true);
      setDownloadingReportId(reportId);

      // Obtener los datos completos del informe
      const reportData = await getReportById(reportId);

      // Generar y descargar el PDF
      await generateReportPDF(reportData);

      // Mostrar notificación de éxito
      addToast({
        type: TOAST_TYPES.SUCCESS,
        message: `PDF del informe #${reportData.nro_consulta} generado correctamente.`,
        duration: 3000,
      });

      setDownloadingPDF(false);
      setDownloadingReportId(null);
    } catch (error) {
      console.error("Error al descargar el PDF:", error);

      // Mostrar notificación de error
      addToast({
        type: TOAST_TYPES.ERROR,
        message: `Error al generar el PDF: ${error.message}`,
        duration: 5000,
      });

      setDownloadingPDF(false);
      setDownloadingReportId(null);
    }
  };

  // Función para exportar a Excel
  const handleExportToExcel = async (reportsToExport) => {
    setExporting(true);

    // Usar el servicio de Excel con callbacks para manejar éxito y error
    await exportReportsToExcel(
      reportsToExport,
      // Callback de éxito
      (count) => {
        addToast({
          type: TOAST_TYPES.SUCCESS,
          message: `Se exportaron ${count} informes a Excel correctamente.`,
          duration: 3000,
        });
        setExporting(false);
      },
      // Callback de error
      (error) => {
        addToast({
          type: TOAST_TYPES.ERROR,
          message:
            "Ocurrió un error al exportar los reportes. Por favor, inténtelo de nuevo.",
          duration: 5000,
        });
        setExporting(false);
      }
    );
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

  // Componente para mostrar la calificación de un reporte
  function ReportRatingBadge({ reportId }) {
    const { data: rating, isLoading } = useRating(reportId);

    if (isLoading) {
      return (
        <div className="ml-2 w-24 h-5 bg-gray-200 animate-pulse rounded-full"></div>
      );
    }

    if (!rating) return null;

    return (
      <div className="ml-2 flex-shrink-0 flex">
        <p
          className={`px-2 inline-flex items-center text-xs leading-5 rounded-full ${getRatingColor(
            rating.rating
          )}`}
        >
          <Star className="h-3 w-3 mr-1" />
          {getRatingText(rating.rating)}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ceprunsa-mustard"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Error al cargar los informes: {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Informes de Atención
        </h1>

        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar informes..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-ceprunsa-mustard focus:border-ceprunsa-mustard"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExportToExcel(filteredReports)}
              disabled={filteredReports.length === 0 || exporting}
              className="inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm text-gray-900 bg-white border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              title="Exportar a Excel"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-900 mr-2"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  Exportar
                </>
              )}
            </button>

            <Link
              to="/reports/new"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-900 bg-ceprunsa-mustard hover:bg-ceprunsa-mustard-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Nuevo Informe
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredReports.length === 0 ? (
          <div className="py-10 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay informes
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "No se encontraron informes con ese criterio de búsqueda."
                : "Comienza creando un nuevo informe."}
            </p>
            <div className="mt-6 flex justify-center gap-4">
              {reports.length > 0 && searchTerm && (
                <button
                  onClick={() => handleExportToExcel(reports)}
                  disabled={exporting}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-900 mr-2"></div>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet
                        className="-ml-1 mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      Exportar todos
                    </>
                  )}
                </button>
              )}
              {!searchTerm && (
                <Link
                  to="/reports/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-900 bg-ceprunsa-mustard hover:bg-ceprunsa-mustard-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard"
                >
                  <PlusCircle
                    className="-ml-1 mr-2 h-5 w-5"
                    aria-hidden="true"
                  />
                  Nuevo Informe
                </Link>
              )}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <li key={report.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-ceprunsa-red truncate">
                        {report.nro_consulta}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p
                          className={`px-2 inline-flex text-xs leading-5 rounded-full ${
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
                        </p>
                      </div>

                      {/* Mostrar calificación usando el componente ReportRatingBadge */}
                      <ReportRatingBadge reportId={report.id} />
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <button
                        onClick={() => handleDownloadPDF(report.id)}
                        disabled={
                          downloadingPDF && downloadingReportId === report.id
                        }
                        className="mr-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-ceprunsa-gray-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard disabled:opacity-50"
                        title="Descargar PDF"
                      >
                        {downloadingPDF && downloadingReportId === report.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-900 mr-1"></div>
                        ) : (
                          <FileDown className="h-4 w-4 mr-1" />
                        )}
                        PDF
                      </button>
                      <Link
                        to={`/reports/${report.id}`}
                        className="mr-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-ceprunsa-gray-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Link>
                      <Link
                        to={`/reports/${report.id}/edit`}
                        className="mr-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-ceprunsa-gray-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                      <Link
                        to={`/reports/${report.id}/rate`}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-ceprunsa-gray-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Calificar
                      </Link>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Cliente: {report.cliente}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        Medio: {report.medio}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>Fecha: {formatDate(report.fecha_hora)}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
