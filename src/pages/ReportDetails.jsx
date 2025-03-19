"use client";

import {
  useLoaderData,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Edit, FileDown } from "lucide-react";
import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function ReportDetails() {
  const report = useLoaderData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [downloading, setDownloading] = useState(false);

  // Verificar si se debe descargar automáticamente el PDF
  const shouldDownload = searchParams.get("download") === "true";

  // Efecto para descargar automáticamente el PDF si se solicita
  useEffect(() => {
    if (shouldDownload) {
      downloadPDF();
      // Eliminar el parámetro de consulta después de iniciar la descarga
      navigate(`/reports/${report.id}`, { replace: true });
    }
  }, [shouldDownload, report.id]);

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

  const downloadPDF = () => {
    try {
      setDownloading(true);

      // Crear un nuevo documento PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // URL del logo de CEPRUNSA
      const logoUrl =
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/349615752_199607626324527_8076311446864506776_n-removebg-preview%20%281%29-odSjwPBe6la6Rv7o6XaFwLfG2zQoCO.png";

      // Colores corporativos
      const colorRojo = [183, 28, 28];
      const colorAmarillo = [230, 195, 92];
      const colorGris = [100, 100, 100];

      // Función para continuar después de cargar la imagen
      const continueWithPdfGeneration = (img) => {
        // Dibujar primero el fondo del encabezado
        doc.setFillColor(245, 245, 245); // Fondo gris claro
        doc.rect(0, 0, 210, 40, "F");

        // Agregar el logo encima del fondo
        if (img) {
          doc.addImage(img, "PNG", 10, 10, 30, 15);
        }

        // Línea decorativa superior
        doc.setDrawColor(...colorAmarillo);
        doc.setLineWidth(3);
        doc.line(0, 40, 210, 40);

        // Título principal
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...colorRojo);
        doc.text("INFORME DE ATENCIÓN", 105, 20, { align: "center" });

        // Número de informe
        doc.setFontSize(12);
        doc.text(`N° ${report.nro_consulta}`, 105, 30, { align: "center" });

        // Información del documento
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...colorGris);
        doc.text(
          `Generado el: ${new Date().toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          105,
          50,
          { align: "center" }
        );

        // Sección: Datos del Cliente
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...colorRojo);
        doc.text("DATOS DEL CLIENTE", 15, 65);

        // Línea decorativa bajo el título de sección
        doc.setDrawColor(...colorAmarillo);
        doc.setLineWidth(0.5);
        doc.line(15, 68, 195, 68);

        // Tabla de datos del cliente con estilo mejorado
        const clienteData = [
          ["Cliente", report.cliente || ""],
          [
            "Vínculo con el Postulante",
            report.vinculo_cliente_postulante === "Otro"
              ? `${report.vinculo_cliente_postulante} (${report.vinculo_otro})`
              : report.vinculo_cliente_postulante || "",
          ],
        ];

        autoTable(doc, {
          startY: 75,
          body: clienteData,
          theme: "grid",
          headStyles: {
            fillColor: colorAmarillo,
            textColor: [50, 50, 50],
            fontStyle: "bold",
            halign: "center",
          },
          styles: {
            fontSize: 9,
            cellPadding: 1,
          },
          columnStyles: {
            0: { fontStyle: "bold", fillColor: [250, 250, 250], cellWidth: 60 },
            1: { cellWidth: "auto" },
          },
          margin: { left: 15, right: 15 },
          alternateRowStyles: { fillColor: [252, 252, 252] },
        });

        // Sección: Datos de la Atención
        const finalY1 = doc.lastAutoTable.finalY + 15;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...colorRojo);
        doc.text("DATOS DE LA ATENCIÓN", 15, finalY1);

        // Línea decorativa bajo el título de sección
        doc.setDrawColor(...colorAmarillo);
        doc.setLineWidth(0.5);
        doc.line(15, finalY1 + 3, 195, finalY1 + 3);

        // Tabla de datos de la atención con estilo mejorado
        const atencionData = [
          [
            "Tipo de Consulta",
            Array.isArray(report.tipo_consulta)
              ? report.tipo_consulta.join(", ")
              : "",
          ],
          ["Medio de Atención", report.medio || ""],
          ["Detalle del Medio", report.medio_comunicacion || ""],
          [
            "Estado",
            report.estado === "atendido"
              ? {
                  content: "Atendido",
                  styles: { textColor: [0, 128, 0], fontStyle: "bold" },
                }
              : {
                  content: "Derivado",
                  styles: { textColor: [180, 120, 0], fontStyle: "bold" },
                },
          ],
          ["Fecha y Hora", formatDate(report.fecha_hora)],
          ["Responsable", report.responsable || ""],
        ];

        // Añadir oficina derivada si aplica
        if (report.estado === "derivado" && report.oficina_derivada) {
          atencionData.push(["Oficina Derivada", report.oficina_derivada]);
        }

        autoTable(doc, {
          startY: finalY1 + 10,

          body: atencionData,
          theme: "grid",
          headStyles: {
            fillColor: colorAmarillo,
            textColor: [50, 50, 50],
            fontStyle: "bold",
            halign: "center",
          },
          styles: {
            fontSize: 9,
            cellPadding: 1,
          },
          columnStyles: {
            0: { fontStyle: "bold", fillColor: [250, 250, 250], cellWidth: 60 },
            1: { cellWidth: "auto" },
          },
          margin: { left: 15, right: 15 },
          alternateRowStyles: { fillColor: [252, 252, 252] },
        });

        // Resultado final (si existe)
        if (report.resultado_final) {
          const finalY2 = doc.lastAutoTable.finalY + 15;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(...colorRojo);
          doc.text("RESULTADO FINAL", 15, finalY2);

          // Línea decorativa bajo el título de sección
          doc.setDrawColor(...colorAmarillo);
          doc.setLineWidth(0.5);
          doc.line(15, finalY2 + 3, 195, finalY2 + 3);

          autoTable(doc, {
            startY: finalY2 + 10,
            body: [[report.resultado_final]],
            theme: "plain",
            styles: {
              fontSize: 9,
              cellPadding: 1,
              lineWidth: 0.1,
              lineColor: [200, 200, 200],
            },
            columnStyles: { 0: { cellWidth: 180 } },
            margin: { left: 15, right: 15 },
            tableLineColor: [200, 200, 200],
            tableLineWidth: 0.1,
            drawCell: (cell, data) => {
              if (data.column.index === 0) {
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.1);
                doc.rect(cell.x, cell.y, cell.width, cell.height, "S");
              }
            },
          });
        }

        // Pie de página en todas las páginas
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);

          // Fondo del pie de página
          doc.setFillColor(245, 245, 245);
          doc.rect(0, doc.internal.pageSize.height - 20, 210, 20, "F");

          // Línea decorativa del pie de página
          doc.setDrawColor(...colorAmarillo);
          doc.setLineWidth(1);
          doc.line(
            0,
            doc.internal.pageSize.height - 20,
            210,
            doc.internal.pageSize.height - 20
          );

          // Texto del pie de página
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(...colorGris);
          doc.text(
            "CEPRUNSA - Centro Preuniversitario de la Universidad Nacional de San Agustín",
            105,
            doc.internal.pageSize.height - 12,
            { align: "center" }
          );

          // Número de página
          doc.text(
            `Página ${i} de ${pageCount}`,
            105,
            doc.internal.pageSize.height - 6,
            { align: "center" }
          );
        }

        // Guardar el PDF
        doc.save(`Informe_${report.nro_consulta}.pdf`);
        setDownloading(false);
      };

      const img = new Image();
      img.crossOrigin = "Anonymous"; // Importante para evitar problemas CORS
      img.onload = () => {
        continueWithPdfGeneration(img);
      };
      img.onerror = () => {
        console.error("Error al cargar el logo, generando PDF sin logo");
        continueWithPdfGeneration(null);
      };
      img.src = logoUrl;
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      setDownloading(false);
      alert(`Error al generar el PDF: ${error.message}`);
    }
  };

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
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Detalles del Informe
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Información completa del informe de atención.
          </p>
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
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {report.estado === "atendido" ? "Atendido" : "Derivado"}
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
          </dl>
        </div>
      </div>
    </div>
  );
}

export default ReportDetails;
