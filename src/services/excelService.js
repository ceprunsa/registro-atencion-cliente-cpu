import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getRatingByReportId, RATING_VALUES } from "./ratingService";
import ceprunsalogo from "../assets/images/ceprunsa-logo.png";

// Función para obtener el texto de la calificación
const getRatingText = (ratingValue) => {
  switch (ratingValue) {
    case RATING_VALUES.VERY_SATISFIED:
      return "Muy satisfecho";
    case RATING_VALUES.SATISFIED:
      return "Satisfecho";
    case RATING_VALUES.NEUTRAL:
      return "Neutral";
    case RATING_VALUES.UNSATISFIED:
      return "Insatisfecho";
    case RATING_VALUES.VERY_UNSATISFIED:
      return "Muy insatisfecho";
    default:
      return "No calificado";
  }
};

// Función para exportar reportes a Excel
export const exportReportsToExcel = async (reports, onSuccess, onError) => {
  try {
    // Crear un nuevo libro de trabajo
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "CEPRUNSA";
    workbook.lastModifiedBy = "Sistema de Registro de Atención";
    workbook.created = new Date();
    workbook.modified = new Date();

    // Añadir una hoja de trabajo
    const worksheet = workbook.addWorksheet("Reportes de Atención");

    // URL del logo de CEPRUNSA
    const logoUrl = ceprunsalogo;
    // Cargar la imagen del logo
    const logoImage = await loadImage(logoUrl);

    // Agregar el logo a la hoja de trabajo
    if (logoImage) {
      const logoId = workbook.addImage({
        base64: logoImage,
        extension: "png",
      });

      // Insertar el logo en la celda A1 con un tamaño específico
      worksheet.addImage(logoId, {
        tl: { col: 0.2, row: 0.2 },
        ext: { width: 275, height: 75 },
      });
    }

    // Agregar título del reporte
    worksheet.mergeCells("C1:H2");
    const titleCell = worksheet.getCell("C1");
    titleCell.value = "CEPRUNSA - SISTEMA DE REGISTRO DE ATENCIÓN";
    titleCell.font = {
      name: "Arial",
      size: 16,
      bold: true,
      color: { argb: "B71C1C" }, // Color rojo CEPRUNSA
    };
    titleCell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    // Agregar subtítulo
    worksheet.mergeCells("C3:H3");
    const subtitleCell = worksheet.getCell("C3");
    subtitleCell.value = "Reporte de Atenciones";
    subtitleCell.font = {
      name: "Arial",
      size: 12,
      bold: true,
      color: { argb: "666666" },
    };
    subtitleCell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    // Agregar fecha de generación
    worksheet.mergeCells("C4:J4");
    const dateCell = worksheet.getCell("C4");
    dateCell.value = `Generado el: ${new Date().toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    dateCell.font = {
      name: "Arial",
      size: 10,
      color: { argb: "666666" },
    };
    dateCell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    // Espacio después del encabezado - agregar filas vacías
    worksheet.addRow([]); // Fila 5
    worksheet.addRow([]); // Fila 6

    // Definir las columnas para los datos
    const headerRow = worksheet.addRow([
      "Nro. Consulta",
      "Cliente",
      "Vínculo",
      "Teléfono",
      "Correo Electrónico",
      "Medio",
      "Detalle del Medio",
      "Estado",
      "Tipo Consulta",
      "Oficina Derivada",
      "Resultado Final",
      "Fecha",
      "Hora",
      "Responsable",
      "Calificación",
      "Comentarios",
    ]); // Fila 7

    // Configurar el ancho de las columnas
    worksheet.columns = [
      { key: "nroConsulta", width: 15 },
      { key: "cliente", width: 25 },
      { key: "vinculo", width: 20 },
      { key: "telefono", width: 20 },
      { key: "correo", width: 30 },
      { key: "medio", width: 15 },
      { key: "detalleMedio", width: 25 },
      { key: "estado", width: 12 },
      { key: "tipoConsulta", width: 30 },
      { key: "oficinaDerivada", width: 20 },
      { key: "resultadoFinal", width: 40 },
      { key: "fecha", width: 12 },
      { key: "hora", width: 12 },
      { key: "responsable", width: 25 },
      { key: "calificacion", width: 15 },
      { key: "comentarios", width: 40 },
    ];

    // Estilo para el encabezado de datos
    headerRow.font = {
      bold: true,
      color: { argb: "000000" },
    };
    headerRow.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    headerRow.height = 20;

    // Aplicar color de fondo al encabezado de la tabla
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "E6C35C" }, // Color amarillo CEPRUNSA
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Obtener calificaciones para todos los informes
    const ratingsMap = {};
    for (const report of reports) {
      try {
        const rating = await getRatingByReportId(report.id);
        if (rating) {
          ratingsMap[report.id] = rating;
        }
      } catch (error) {
        console.error(
          `Error al cargar calificación para informe ${report.id}:`,
          error
        );
      }
    }

    // Añadir los datos
    for (const report of reports) {
      // Formatear la fecha para Excel
      let fecha = "No disponible";
      let hora = "No disponible";

      if (report.fecha_hora && report.fecha_hora.toDate) {
        const date = report.fecha_hora.toDate();
        fecha = date.toLocaleDateString("es-PE");
        hora = date.toLocaleTimeString("es-PE");
      }

      // Obtener calificación si existe
      const rating = ratingsMap[report.id];
      const calificacion = rating
        ? getRatingText(rating.rating)
        : "No calificado";
      const comentarios = rating && rating.comments ? rating.comments : "";

      // Añadir fila
      const dataRow = worksheet.addRow({
        nroConsulta: report.nro_consulta || "",
        cliente: report.cliente || "",
        vinculo: report.vinculo_cliente_postulante || "",
        telefono: report.telefono_cliente || "No especificado",
        correo: report.correo_cliente || "No especificado",
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
        calificacion: calificacion,
        comentarios: comentarios,
      });

      // Aplicar bordes a las celdas de datos
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle", wrapText: true };
      });

      // Aplicar color de fondo alternado para mejorar la legibilidad
      if (dataRow.number % 2 === 0) {
        dataRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F5F5F5" }, // Color gris claro
          };
        });
      }

      // Aplicar color especial a la celda de calificación según su valor
      const calificacionCell = dataRow.getCell(13); // Columna de calificación
      if (rating) {
        switch (rating.rating) {
          case RATING_VALUES.VERY_SATISFIED:
            calificacionCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "E6FFE6" }, // Verde claro
            };
            calificacionCell.font = { color: { argb: "006600" } };
            break;
          case RATING_VALUES.SATISFIED:
            calificacionCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "E6FFE6" }, // Verde claro
            };
            calificacionCell.font = { color: { argb: "006600" } };
            break;
          case RATING_VALUES.NEUTRAL:
            calificacionCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F0F0F0" }, // Gris claro
            };
            calificacionCell.font = { color: { argb: "666666" } };
            break;
          case RATING_VALUES.UNSATISFIED:
            calificacionCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFEBEB" }, // Rojo claro
            };
            calificacionCell.font = { color: { argb: "CC0000" } };
            break;
          case RATING_VALUES.VERY_UNSATISFIED:
            calificacionCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFEBEB" }, // Rojo claro
            };
            calificacionCell.font = { color: { argb: "CC0000" } };
            break;
        }
      }
    }

    // Generar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Reportes_CEPRUNSA_${date}.xlsx`);

    // Llamar al callback de éxito con la cantidad de reportes exportados
    if (onSuccess) {
      onSuccess(reports.length);
    }
  } catch (error) {
    console.error("Error al exportar a Excel:", error);
    // Llamar al callback de error
    if (onError) {
      onError(error);
    }
  }
};

// Función auxiliar para cargar una imagen y convertirla a base64
const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Importante para evitar problemas CORS

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Convertir a base64
        const base64 = canvas.toDataURL("image/png").split(",")[1];
        resolve(base64);
      } catch (err) {
        console.error("Error al procesar la imagen:", err);
        resolve(null); // Resolver con null en caso de error para continuar sin imagen
      }
    };

    img.onerror = () => {
      console.error("Error al cargar la imagen");
      resolve(null); // Resolver con null en caso de error para continuar sin imagen
    };

    img.src = url;
  });
};
