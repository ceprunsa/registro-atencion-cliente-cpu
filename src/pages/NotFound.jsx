import { Link } from "react-router-dom";
import { Home } from "lucide-react";

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ceprunsa-gray-light px-4 py-12">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-ceprunsa-red">404</h1>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
          Página no encontrada
        </h2>
        <p className="mt-2 text-base text-gray-500">
          Lo sentimos, no pudimos encontrar la página que estás buscando.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-900 bg-ceprunsa-mustard hover:bg-ceprunsa-mustard-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard"
          >
            <Home className="h-5 w-5 mr-2" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
