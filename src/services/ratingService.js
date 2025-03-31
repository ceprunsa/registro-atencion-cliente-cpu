import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const RATINGS_COLLECTION = "ratings";

// Valores posibles para la calificación
export const RATING_VALUES = {
  VERY_SATISFIED: "muy_satisfecho",
  SATISFIED: "satisfecho",
  NEUTRAL: "neutral",
  UNSATISFIED: "insatisfecho",
  VERY_UNSATISFIED: "muy_insatisfecho",
};

// Obtener la calificación de un informe
export async function getRatingByReportId(reportId) {
  try {
    console.log("Buscando calificación para el informe:", reportId);
    const ratingRef = doc(db, RATINGS_COLLECTION, reportId);
    const ratingSnap = await getDoc(ratingRef);

    if (ratingSnap.exists()) {
      console.log("Calificación encontrada:", ratingSnap.data());
      return { id: ratingSnap.id, ...ratingSnap.data() };
    } else {
      console.log("No se encontró calificación para el informe:", reportId);
      return null;
    }
  } catch (error) {
    console.error("Error al obtener calificación:", error);
    throw error;
  }
}

// Crear o actualizar la calificación de un informe
export async function saveRating(reportId, ratingData) {
  try {
    console.log(
      "Guardando calificación para el informe:",
      reportId,
      ratingData
    );
    const ratingRef = doc(db, RATINGS_COLLECTION, reportId);
    const ratingSnap = await getDoc(ratingRef);

    const ratingToSave = {
      ...ratingData,
      updated_at: serverTimestamp(),
    };

    if (ratingSnap.exists()) {
      console.log("Actualizando calificación existente");
      await updateDoc(ratingRef, ratingToSave);
    } else {
      console.log("Creando nueva calificación");
      ratingToSave.created_at = serverTimestamp();
      await setDoc(ratingRef, ratingToSave);
    }

    return {
      id: reportId,
      ...ratingToSave,
      updated_at: new Date(),
      created_at: ratingToSave.created_at ? new Date() : undefined,
    };
  } catch (error) {
    console.error("Error al guardar calificación:", error);
    throw error;
  }
}
