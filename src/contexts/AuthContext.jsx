"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase/config";

// Obtener la lista de correos permitidos desde variables de entorno
const getAllowedEmails = () => {
  const allowedEmailsString = import.meta.env.VITE_ALLOWED_EMAILS || "";
  return allowedEmailsString
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email !== "");
};

// Lista de correos permitidos
export const ALLOWED_EMAILS = getAllowedEmails();

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  async function loginWithGoogle() {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Verificar si el correo está en la lista de permitidos
      if (!ALLOWED_EMAILS.includes(result.user.email)) {
        console.log("Correo no permitido:", result.user.email);
        await signOut(auth);
        setError("No tienes permiso para acceder a esta aplicación.");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError("Error al iniciar sesión con Google. Inténtalo de nuevo.");
      return false;
    }
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Verificar si el correo está en la lista de permitidos
        if (!ALLOWED_EMAILS.includes(user.email)) {
          console.log("Correo no permitido:", user.email);
          setError("No tienes permiso para acceder a esta aplicación.");
          await signOut(auth);
          setCurrentUser(null);
        } else {
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
      setIsHydrated(true);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loginWithGoogle,
    logout,
    error,
    loading,
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
