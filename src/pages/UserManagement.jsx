"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  UserCheck,
  AlertCircle,
  Loader,
  Shield,
  ShieldOff,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast, TOAST_TYPES } from "../contexts/ToastContext";
import {
  useAllowedUsers,
  useAddAllowedUser,
  useRemoveAllowedUser,
  useUpdateUserAdminStatus,
} from "../hooks/useUsers";

function UserManagement() {
  const [newEmail, setNewEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");

  const { currentUser, isAdmin: currentUserIsAdmin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Usar React Query para obtener y manipular usuarios
  const { data: users = [], isLoading } = useAllowedUsers();
  const addUserMutation = useAddAllowedUser();
  const removeUserMutation = useRemoveAllowedUser();
  const updateAdminStatusMutation = useUpdateUserAdminStatus();

  // Validar formato de correo electrónico
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Agregar nuevo usuario permitido
  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!newEmail.trim()) {
      setError("Por favor, ingrese un correo electrónico.");
      return;
    }

    if (!isValidEmail(newEmail)) {
      setError("Por favor, ingrese un correo electrónico válido.");
      return;
    }

    setError("");

    try {
      await addUserMutation.mutateAsync({
        email: newEmail,
        addedBy: currentUser.email,
        isAdmin: isAdmin,
      });

      setNewEmail("");
      setIsAdmin(false);

      addToast({
        type: TOAST_TYPES.SUCCESS,
        message: `Usuario ${newEmail} agregado correctamente.`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error al agregar usuario:", error);
      setError(error.message || "Error al agregar usuario.");

      addToast({
        type: TOAST_TYPES.ERROR,
        message: error.message || "Error al agregar usuario.",
        duration: 5000,
      });
    }
  };

  // Eliminar usuario permitido
  const handleRemoveUser = async (userId, userEmail) => {
    if (
      window.confirm(`¿Está seguro de eliminar el acceso para ${userEmail}?`)
    ) {
      try {
        await removeUserMutation.mutateAsync(userId);

        addToast({
          type: TOAST_TYPES.SUCCESS,
          message: `Acceso para ${userEmail} eliminado correctamente.`,
          duration: 3000,
        });
      } catch (error) {
        console.error("Error al eliminar usuario:", error);

        addToast({
          type: TOAST_TYPES.ERROR,
          message: "Error al eliminar usuario.",
          duration: 5000,
        });
      }
    }
  };

  // Actualizar estado de administrador
  const handleToggleAdmin = async (userId, userEmail, currentAdminStatus) => {
    const newStatus = !currentAdminStatus;
    const action = newStatus ? "conceder" : "revocar";

    if (
      window.confirm(
        `¿Está seguro de ${action} permisos de administrador a ${userEmail}?`
      )
    ) {
      try {
        await updateAdminStatusMutation.mutateAsync({
          userId,
          isAdmin: newStatus,
        });

        addToast({
          type: TOAST_TYPES.SUCCESS,
          message: `Permisos de administrador ${
            newStatus ? "concedidos" : "revocados"
          } para ${userEmail}.`,
          duration: 3000,
        });
      } catch (error) {
        console.error("Error al actualizar permisos:", error);

        addToast({
          type: TOAST_TYPES.ERROR,
          message: "Error al actualizar permisos de administrador.",
          duration: 5000,
        });
      }
    }
  };

  // Redireccionar si no es administrador
  if (!currentUserIsAdmin && !isLoading) {
    navigate("/");
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-ceprunsa-gray-light"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          Administración de Usuarios
        </h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Usuarios con Acceso al Sistema
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Gestione los correos electrónicos que tienen permiso para acceder al
            sistema.
          </p>
        </div>

        {/* Formulario para agregar nuevo usuario */}
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-grow">
                <label htmlFor="email" className="sr-only">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Ingrese el correo electrónico"
                  className={`shadow-sm block w-full px-4 py-2 sm:text-sm rounded-md ${
                    error
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-ceprunsa-mustard focus:border-ceprunsa-mustard"
                  }`}
                  disabled={addUserMutation.isPending}
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={addUserMutation.isPending}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-900 bg-ceprunsa-mustard hover:bg-ceprunsa-mustard-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard disabled:opacity-50"
              >
                {addUserMutation.isPending ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Usuario
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center">
              <input
                id="isAdmin"
                name="isAdmin"
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="h-4 w-4 text-ceprunsa-mustard border-gray-300 rounded focus:ring-ceprunsa-mustard"
              />
              <label
                htmlFor="isAdmin"
                className="ml-2 block text-sm text-gray-900"
              >
                Conceder permisos de administrador
              </label>
            </div>
          </form>
        </div>

        {/* Lista de usuarios permitidos */}
        <div className="px-4 py-5 sm:px-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin h-8 w-8 text-ceprunsa-mustard" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay usuarios permitidos
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comience agregando correos electrónicos a la lista de
                permitidos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Correo Electrónico
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Rol
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Agregado Por
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Fecha
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isAdmin
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.isAdmin ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Administrador
                            </>
                          ) : (
                            "Usuario"
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.addedBy || "No disponible"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt && user.createdAt.toDate
                          ? user.createdAt
                              .toDate()
                              .toLocaleDateString("es-PE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                          : "No disponible"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() =>
                              handleToggleAdmin(
                                user.id,
                                user.email,
                                user.isAdmin
                              )
                            }
                            disabled={
                              updateAdminStatusMutation.isPending &&
                              updateAdminStatusMutation.variables?.userId ===
                                user.id
                            }
                            className={`focus:outline-none focus:underline disabled:opacity-50 ${
                              user.isAdmin
                                ? "text-orange-600 hover:text-orange-900"
                                : "text-purple-600 hover:text-purple-900"
                            }`}
                          >
                            {updateAdminStatusMutation.isPending &&
                            updateAdminStatusMutation.variables?.userId ===
                              user.id ? (
                              <Loader className="animate-spin h-4 w-4 inline" />
                            ) : user.isAdmin ? (
                              <>
                                <ShieldOff className="h-4 w-4 inline mr-1" />
                                Quitar Admin
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 inline mr-1" />
                                Hacer Admin
                              </>
                            )}
                          </button>

                          <button
                            onClick={() =>
                              handleRemoveUser(user.id, user.email)
                            }
                            disabled={
                              removeUserMutation.isPending &&
                              removeUserMutation.variables === user.id
                            }
                            className="text-red-600 hover:text-red-900 focus:outline-none focus:underline disabled:opacity-50"
                          >
                            {removeUserMutation.isPending &&
                            removeUserMutation.variables === user.id ? (
                              <Loader className="animate-spin h-4 w-4 inline" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 inline mr-1" />
                                Eliminar
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Nota informativa */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Los administradores pueden gestionar los usuarios permitidos y
              conceder permisos de administrador a otros usuarios. Asegúrese de
              conceder permisos de administrador solo a usuarios de confianza.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
