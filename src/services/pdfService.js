import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getRatingByReportId } from "./ratingService";
import logoCeprunsa from "../assets/images/ceprunsa-logo.png";

// Función para formatear la fecha de Firestore
export const formatDate = (timestamp) => {
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

// Función para obtener el texto de la calificación
export const getRatingText = (ratingValue) => {
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

// Función para generar y descargar el PDF
export const generateReportPDF = async (report) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Obtener la calificación del informe
      let rating = null;
      try {
        rating = await getRatingByReportId(report.id);
      } catch (error) {
        console.error("Error al obtener calificación para PDF:", error);
        // Continuamos sin la calificación
      }

      // Crear un nuevo documento PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // URL del logo de CEPRUNSA
      const logoUrl = logoCeprunsa;

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
          doc.addImage(img, "PNG", 10, 12, 38, 12);
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
          ["Teléfono", report.telefono_cliente || "No especificado"],
          ["Correo Electrónico", report.correo_cliente || "No especificado"],
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
              : report.estado === "derivado"
              ? {
                  content: "Derivado",
                  styles: { textColor: [180, 120, 0], fontStyle: "bold" },
                }
              : {
                  content: "No atendido",
                  styles: { textColor: [180, 0, 0], fontStyle: "bold" },
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

        // Sección: Calificación del Cliente (si existe)
        let finalY2 = doc.lastAutoTable.finalY + 15;

        if (rating) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(...colorRojo);
          doc.text("CALIFICACIÓN DEL CLIENTE", 15, finalY2);

          // Línea decorativa bajo el título de sección
          doc.setDrawColor(...colorAmarillo);
          doc.setLineWidth(0.5);
          doc.line(15, finalY2 + 3, 195, finalY2 + 3);

          // Tabla de calificación
          const ratingData = [["Calificación", getRatingText(rating.rating)]];

          // Añadir comentarios si existen
          if (rating.comments) {
            ratingData.push(["Comentarios", rating.comments]);
          }

          autoTable(doc, {
            startY: finalY2 + 10,
            body: ratingData,
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
              0: {
                fontStyle: "bold",
                fillColor: [250, 250, 250],
                cellWidth: 60,
              },
              1: { cellWidth: "auto" },
            },
            margin: { left: 15, right: 15 },
            alternateRowStyles: { fillColor: [252, 252, 252] },
          });

          finalY2 = doc.lastAutoTable.finalY + 15;
        }

        // Resultado final (si existe)
        if (report.resultado_final) {
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
        resolve(true);
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
      reject(error);
    }
  });
};
