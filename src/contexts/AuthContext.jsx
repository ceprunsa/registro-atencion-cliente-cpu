"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { useQueryClient } from "@tanstack/react-query";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Usar QueryClient para acceder a las funciones de invalidación
  const queryClient = useQueryClient();

  async function loginWithGoogle() {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Verificar si el correo está en la lista de permitidos en Firebase
      setCheckingPermission(true);

      // Consultar directamente el servicio en lugar de usar el hook
      // ya que estamos en un contexto donde no podemos usar hooks de React Query
      const { isEmailAllowed } = await import("../services/userService");
      const isAllowed = await isEmailAllowed(result.user.email);

      if (!isAllowed) {
        console.log("Correo no permitido:", result.user.email);
        await signOut(auth);
        setError("No tienes permiso para acceder a esta aplicación.");
        setCheckingPermission(false);
        return false;
      }

      // Verificar si el usuario es administrador
      const { isUserAdmin } = await import("../services/userService");
      const adminStatus = await isUserAdmin(result.user.email);
      setIsAdmin(adminStatus);
      setCheckingPermission(false);

      // Invalidar las consultas relacionadas con el usuario
      queryClient.invalidateQueries({ queryKey: ["users", "permissions"] });

      return true;
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError("Error al iniciar sesión con Google. Inténtalo de nuevo.");
      setCheckingPermission(false);
      return false;
    }
  }

  function logout() {
    // Limpiar caché relacionada con el usuario al cerrar sesión
    queryClient.invalidateQueries({ queryKey: ["users"] });
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Verificar si el correo está en la lista de permitidos en Firebase
        setCheckingPermission(true);

        // Consultar directamente el servicio
        const { isEmailAllowed, isUserAdmin } = await import(
          "../services/userService"
        );
        const isAllowed = await isEmailAllowed(user.email);

        if (!isAllowed) {
          console.log("Correo no permitido:", user.email);
          setError("No tienes permiso para acceder a esta aplicación.");
          await signOut(auth);
          setCurrentUser(null);
          setIsAdmin(false);
          setCheckingPermission(false);
        } else {
          // Verificar si el usuario es administrador
          const adminStatus = await isUserAdmin(user.email);
          setCurrentUser(user);
          setIsAdmin(adminStatus);
          setCheckingPermission(false);

          // Precarga de datos del usuario en la caché
          queryClient.prefetchQuery({
            queryKey: ["users", "permissions", "allowed", user.email],
            queryFn: () => isEmailAllowed(user.email),
          });

          queryClient.prefetchQuery({
            queryKey: ["users", "permissions", "admin", user.email],
            queryFn: () => isUserAdmin(user.email),
          });
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setCheckingPermission(false);
      }
      setLoading(false);
      setIsHydrated(true);
    });

    return unsubscribe;
  }, [queryClient]);

  const value = {
    currentUser,
    isAdmin,
    loginWithGoogle,
    logout,
    error,
    loading: loading || checkingPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isHydrated ? (
        <div className="flex h-screen items-center justify-center">
          Cargando...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
