"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { isEmailAllowed, isUserAdmin } from "../services/userService";

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

  async function loginWithGoogle() {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Verificar si el correo está en la lista de permitidos en Firebase
      setCheckingPermission(true);
      const isAllowed = await isEmailAllowed(result.user.email);

      if (!isAllowed) {
        console.log("Correo no permitido:", result.user.email);
        await signOut(auth);
        setError("No tienes permiso para acceder a esta aplicación.");
        setCheckingPermission(false);
        return false;
      }

      // Verificar si el usuario es administrador
      const adminStatus = await isUserAdmin(result.user.email);
      setIsAdmin(adminStatus);
      setCheckingPermission(false);

      return true;
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError("Error al iniciar sesión con Google. Inténtalo de nuevo.");
      setCheckingPermission(false);
      return false;
    }
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Verificar si el correo está en la lista de permitidos en Firebase
        setCheckingPermission(true);
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
  }, []);

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
