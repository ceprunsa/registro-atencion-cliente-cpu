"use client";

import { useLoaderData, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Edit } from "lucide-react";

function ReportDetails() {
  const report = useLoaderData();
  const navigate = useNavigate();

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
        <Link
          to={`/reports/${report.id}/edit`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-900 bg-ceprunsa-mustard hover:bg-ceprunsa-mustard-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Link>
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
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                Número de Consulta
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {report.nro_consulta}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                Fecha y Hora
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(report.fecha_hora)}
              </dd>
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
                Medio de Atención
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{report.medio}</dd>
            </div>

            <div className="sm:col-span-2">
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

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Responsable</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {report.responsable}
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
