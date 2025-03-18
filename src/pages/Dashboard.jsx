"use client";

import { useState, useEffect } from "react";
import { Link, useLoaderData } from "react-router-dom";
import {
  FileText,
  Eye,
  Edit,
  Search,
  PlusCircle,
  FileSpreadsheet,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function Dashboard() {
  const reports = useLoaderData() || [];
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // Simular un pequeño retraso para mostrar el estado de carga
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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

  // Nueva función para exportar a Excel usando ExcelJS
  const exportToExcel = async (reportsToExport) => {
    try {
      setExporting(true);

      // Crear un nuevo libro de trabajo
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "CEPRUNSA";
      workbook.lastModifiedBy = "Sistema de Registro de Atención";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Añadir una hoja de trabajo
      const worksheet = workbook.addWorksheet("Reportes de Atención");

      // Definir las columnas
      worksheet.columns = [
        { header: "Nro. Consulta", key: "nroConsulta", width: 15 },
        { header: "Cliente", key: "cliente", width: 25 },
        { header: "Vínculo", key: "vinculo", width: 20 },
        { header: "Medio", key: "medio", width: 15 },
        { header: "Detalle del Medio", key: "detalleMedio", width: 25 },
        { header: "Estado", key: "estado", width: 12 },
        { header: "Tipo Consulta", key: "tipoConsulta", width: 30 },
        { header: "Oficina Derivada", key: "oficinaDerivada", width: 20 },
        { header: "Resultado Final", key: "resultadoFinal", width: 40 },
        { header: "Fecha", key: "fecha", width: 12 },
        { header: "Hora", key: "hora", width: 12 },
        { header: "Responsable", key: "responsable", width: 25 },
      ];

      // Estilo para el encabezado
      worksheet.getRow(1).font = { bold: true, color: { argb: "000000" } };

      worksheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Añadir los datos
      reportsToExport.forEach((report) => {
        // Formatear la fecha para Excel
        let fecha = "No disponible";
        let hora = "No disponible";

        if (report.fecha_hora && report.fecha_hora.toDate) {
          const date = report.fecha_hora.toDate();
          fecha = date.toLocaleDateString("es-PE");
          hora = date.toLocaleTimeString("es-PE");
        }

        // Añadir fila
        worksheet.addRow({
          nroConsulta: report.nro_consulta || "",
          cliente: report.cliente || "",
          vinculo: report.vinculo_cliente_postulante || "",
          medio: report.medio || "",
          detalleMedio: report.medio_comunicacion || "",
          estado: report.estado === "atendido" ? "Atendido" : "Derivado",
          tipoConsulta: Array.isArray(report.tipo_consulta)
            ? report.tipo_consulta.join(", ")
            : "",
          oficinaDerivada: report.oficina_derivada || "",
          resultadoFinal: report.resultado_final || "",
          fecha: fecha,
          hora: hora,
          responsable: report.responsable || "",
        });
      });

      // Aplicar bordes a todas las celdas con datos
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        row.eachCell({ includeEmpty: false }, (cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          // Alineación para todas las celdas excepto el encabezado
          if (rowNumber > 1) {
            cell.alignment = { vertical: "middle", wrapText: true };
          }
        });
      });

      // Aplicar estilo condicional para las filas
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        //colorear el encabezado
        if (rowNumber === 1) {
          row.eachCell({ includeEmpty: false }, (cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "E6C35C" }, // Color amarillo
            };
          });
        }

        if (rowNumber > 1) {
          // Omitir la fila de encabezado
          // Alternar colores de fondo para mejorar la legibilidad
          if (rowNumber % 2 === 0) {
            row.eachCell({ includeEmpty: false }, (cell) => {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "F5F5F5" }, // Color gris claro
              };
            });
          }
        }
      });

      // Generar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const date = new Date().toISOString().slice(0, 10);
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `Reportes_CEPRUNSA_${date}.xlsx`);

      setExporting(false);
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      setExporting(false);
      alert(
        "Ocurrió un error al exportar los reportes. Por favor, inténtelo de nuevo."
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ceprunsa-mustard"></div>
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
              onClick={() => exportToExcel(filteredReports)}
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
                  onClick={() => exportToExcel(reports)}
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
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {report.estado === "atendido"
                            ? "Atendido"
                            : "Derivado"}
                        </p>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <Link
                        to={`/reports/${report.id}`}
                        className="mr-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-ceprunsa-gray-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Link>
                      <Link
                        to={`/reports/${report.id}/edit`}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-ceprunsa-gray-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
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
