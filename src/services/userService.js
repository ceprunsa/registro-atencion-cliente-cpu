import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

const ALLOWED_USERS_COLLECTION = "allowed_users";

// Verificar si un correo electrónico está autorizado
export async function isEmailAllowed(email) {
  try {
    if (!email) return false;

    const q = query(
      collection(db, ALLOWED_USERS_COLLECTION),
      where("email", "==", email.toLowerCase())
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error al verificar el correo electrónico:", error);
    return false;
  }
}

// Verificar si un usuario es administrador
export async function isUserAdmin(email) {
  try {
    if (!email) return false;

    const q = query(
      collection(db, ALLOWED_USERS_COLLECTION),
      where("email", "==", email.toLowerCase()),
      where("isAdmin", "==", true)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error al verificar si el usuario es administrador:", error);
    return false;
  }
}

// Obtener todos los usuarios permitidos
export async function getAllowedUsers() {
  try {
    const querySnapshot = await getDocs(
      collection(db, ALLOWED_USERS_COLLECTION)
    );

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error al obtener usuarios permitidos:", error);
    throw error;
  }
}

// Agregar un nuevo usuario permitido
export async function addAllowedUser(email, addedBy, isAdmin = false) {
  try {
    // Verificar si el correo ya existe
    const exists = await isEmailAllowed(email);
    if (exists) {
      throw new Error("Este correo electrónico ya está autorizado");
    }

    const docRef = await addDoc(collection(db, ALLOWED_USERS_COLLECTION), {
      email: email.toLowerCase(),
      addedBy,
      isAdmin: isAdmin,
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      email: email.toLowerCase(),
      addedBy,
      isAdmin: isAdmin,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error al agregar usuario permitido:", error);
    throw error;
  }
}

// Eliminar un usuario permitido
export async function removeAllowedUser(userId) {
  try {
    await deleteDoc(doc(db, ALLOWED_USERS_COLLECTION, userId));
    return true;
  } catch (error) {
    console.error("Error al eliminar usuario permitido:", error);
    throw error;
  }
}

// Actualizar el estado de administrador de un usuario
export async function updateUserAdminStatus(userId, isAdmin) {
  try {
    const userRef = doc(db, ALLOWED_USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      isAdmin: isAdmin,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error al actualizar estado de administrador:", error);
    throw error;
  }
}
