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
    const ratingRef = doc(db, RATINGS_COLLECTION, reportId);
    const ratingSnap = await getDoc(ratingRef);

    if (ratingSnap.exists()) {
      return { id: ratingSnap.id, ...ratingSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
}

// Crear o actualizar la calificación de un informe
export async function saveRating(reportId, ratingData) {
  try {
    const ratingRef = doc(db, RATINGS_COLLECTION, reportId);
    const ratingSnap = await getDoc(ratingRef);

    const ratingToSave = {
      ...ratingData,
      updated_at: serverTimestamp(),
    };

    if (ratingSnap.exists()) {
      await updateDoc(ratingRef, ratingToSave);
    } else {
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
    throw error;
  }
}
