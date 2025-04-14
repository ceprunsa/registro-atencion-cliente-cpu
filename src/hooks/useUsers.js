import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllowedUsers,
  addAllowedUser,
  removeAllowedUser,
  updateUserAdminStatus,
  isEmailAllowed,
  isUserAdmin,
} from "../services/userService";

// Claves para las consultas
export const userKeys = {
  all: ["users"],
  lists: () => [...userKeys.all, "list"],
  list: (filters) => [...userKeys.lists(), { filters }],
  details: () => [...userKeys.all, "detail"],
  detail: (id) => [...userKeys.details(), id],
  permissions: () => [...userKeys.all, "permissions"],
  isAllowed: (email) => [...userKeys.permissions(), "allowed", email],
  isAdmin: (email) => [...userKeys.permissions(), "admin", email],
};

// Hook para obtener todos los usuarios permitidos
export function useAllowedUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: getAllowedUsers,
  });
}

// Hook para verificar si un correo está permitido
export function useIsEmailAllowed(email) {
  return useQuery({
    queryKey: userKeys.isAllowed(email),
    queryFn: () => isEmailAllowed(email),
    enabled: !!email, // Solo ejecutar si hay un email
  });
}

// Hook para verificar si un usuario es administrador
export function useIsUserAdmin(email) {
  return useQuery({
    queryKey: userKeys.isAdmin(email),
    queryFn: () => isUserAdmin(email),
    enabled: !!email, // Solo ejecutar si hay un email
  });
}

// Hook para agregar un nuevo usuario permitido
export function useAddAllowedUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, addedBy, isAdmin }) =>
      addAllowedUser(email, addedBy, isAdmin),
    onSuccess: (newUser) => {
      // Actualizar la lista de usuarios en la caché
      queryClient.setQueryData(userKeys.lists(), (oldData = []) => [
        ...oldData,
        newUser,
      ]);

      // Invalidar consultas relacionadas con permisos
      queryClient.invalidateQueries({
        queryKey: userKeys.isAllowed(newUser.email),
      });
      queryClient.invalidateQueries({
        queryKey: userKeys.isAdmin(newUser.email),
      });
    },
  });
}

// Hook para eliminar un usuario permitido
export function useRemoveAllowedUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => removeAllowedUser(userId),
    onSuccess: (_, userId) => {
      // Actualizar la lista de usuarios en la caché
      queryClient.setQueryData(userKeys.lists(), (oldData = []) =>
        oldData.filter((user) => user.id !== userId)
      );

      // Invalidar consultas relacionadas con permisos
      queryClient.invalidateQueries({ queryKey: userKeys.permissions() });
    },
  });
}

// Hook para actualizar el estado de administrador de un usuario
export function useUpdateUserAdminStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isAdmin }) => updateUserAdminStatus(userId, isAdmin),
    onSuccess: (_, { userId, isAdmin }) => {
      // Actualizar el usuario en la caché
      queryClient.setQueryData(userKeys.lists(), (oldData = []) =>
        oldData.map((user) =>
          user.id === userId ? { ...user, isAdmin } : user
        )
      );

      // Invalidar consultas relacionadas con permisos de administrador
      const userEmail = queryClient
        .getQueryData(userKeys.lists())
        ?.find((user) => user.id === userId)?.email;
      if (userEmail) {
        queryClient.invalidateQueries({
          queryKey: userKeys.isAdmin(userEmail),
        });
      }
    },
  });
}
