"use client";

import { useState, useEffect } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { FileText, Eye, Edit, Search, PlusCircle } from "lucide-react";

function Dashboard() {
  const reports = useLoaderData() || [];
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

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

          <Link
            to="/reports/new"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-900 bg-ceprunsa-mustard hover:bg-ceprunsa-mustard-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Nuevo Informe
          </Link>
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
            {!searchTerm && (
              <div className="mt-6">
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
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <li key={report.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium  truncate">
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
