import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const REPORTS_COLLECTION = "reports";

// Generar número de consulta (XXXX-YYYY)
async function generateConsultationNumber() {
  const currentYear = new Date().getFullYear();

  // Obtener el último número de consulta para este año
  const q = query(
    collection(db, REPORTS_COLLECTION),
    where("nro_consulta", ">=", `0001-${currentYear}`),
    where("nro_consulta", "<=", `9999-${currentYear}`),
    orderBy("nro_consulta", "desc")
  );

  try {
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // No hay consultas para este año, comenzar desde 0001
      return `0001-${currentYear}`;
    }

    // Obtener el último número y aumentarlo en 1
    const lastNumber = querySnapshot.docs[0].data().nro_consulta;
    const lastNumberPart = Number.parseInt(lastNumber.split("-")[0]);
    const newNumberPart = (lastNumberPart + 1).toString().padStart(4, "0");

    return `${newNumberPart}-${currentYear}`;
  } catch (error) {
    console.error("Error al generar número de consulta:", error);
    // En caso de error, generar un número basado en timestamp para evitar duplicados
    const timestamp = Date.now().toString().slice(-4);
    return `${timestamp}-${currentYear}`;
  }
}

// Crear un nuevo informe
export async function createReport(reportData, userEmail) {
  try {
    console.log("Creando informe con datos:", reportData);
    const nroConsulta = await generateConsultationNumber();

    const newReport = {
      ...reportData,
      nro_consulta: nroConsulta,
      fecha_hora: serverTimestamp(),
      responsable: userEmail,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, REPORTS_COLLECTION), newReport);
    console.log("Informe creado con ID:", docRef.id);

    // Devolvemos un objeto con los datos del informe y el ID
    return {
      id: docRef.id,
      ...newReport,
      fecha_hora: Timestamp.now(),
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };
  } catch (error) {
    console.error("Error al crear informe:", error);
    throw error;
  }
}

// Actualizar un informe existente
export async function updateReport(reportId, reportData) {
  try {
    console.log("Actualizando informe con ID:", reportId, "Datos:", reportData);
    const reportRef = doc(db, REPORTS_COLLECTION, reportId);

    const updatedData = {
      ...reportData,
      updated_at: serverTimestamp(),
    };

    await updateDoc(reportRef, updatedData);
    console.log("Informe actualizado correctamente");

    // Obtenemos el documento actualizado para devolverlo
    const updatedDoc = await getDoc(reportRef);
    return {
      id: reportId,
      ...updatedDoc.data(),
    };
  } catch (error) {
    console.error("Error al actualizar informe:", error);
    throw error;
  }
}

// Obtener un informe por ID
export async function getReportById(reportId) {
  try {
    const reportRef = doc(db, REPORTS_COLLECTION, reportId);
    const reportSnap = await getDoc(reportRef);

    if (reportSnap.exists()) {
      return { id: reportSnap.id, ...reportSnap.data() };
    } else {
      console.error("Informe no encontrado");
      throw new Error("Informe no encontrado");
    }
  } catch (error) {
    console.error("Error al obtener informe:", error);
    throw error;
  }
}

// Obtener todos los informes
export async function getAllReports() {
  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      orderBy("created_at", "desc")
    );

    const querySnapshot = await getDocs(q);
    const reports = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return reports;
  } catch (error) {
    console.error("Error al obtener informes:", error);
    throw error;
  }
}
