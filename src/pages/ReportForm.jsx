"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast, TOAST_TYPES } from "../contexts/ToastContext";
import { Save, ArrowLeft } from "lucide-react";
import {
  useReport,
  useCreateReport,
  useUpdateReport,
} from "../hooks/useReports";

// Opciones para los campos de selección
const VINCULO_OPTIONS = [
  { value: "Postulante", label: "Postulante" },
  { value: "Madre/Padre o Apoderado", label: "Madre/Padre o Apoderado" },
  { value: "Otro", label: "Otro" },
];

const MEDIO_OPTIONS = [
  { value: "Presencial", label: "Presencial" },
  { value: "Telefónico", label: "Telefónico" },
  { value: "Telefónico Fijo", label: "Telefónico Fijo" },
  { value: "Correo", label: "Correo" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Otro", label: "Otro" },
];

// Modificar las opciones de estado para incluir "No atendido"
const ESTADO_OPTIONS = [
  { value: "atendido", label: "Atendido" },
  { value: "derivado", label: "Derivado" },
  { value: "no_atendido", label: "No atendido" },
];

// Modificar las opciones de oficina derivada para incluir "Coordinación Administrativa"
const OFICINA_DERIVADA_OPTIONS = [
  { value: "Informática CEPRUNSA", label: "Informática CEPRUNSA" },
  { value: "Supervisión Académica", label: "Supervisión Académica" },
  {
    value: "Coordinación Administrativa",
    label: "Coordinación Administrativa",
  },
];

const TIPO_CONSULTA_OPTIONS = [
  { value: "Información general", label: "Información general" },
  { value: "Académica", label: "Académica" },
  { value: "Administrativa", label: "Administrativa" },
  { value: "Queja/Sugerencia", label: "Queja/Sugerencia" },
];
// Action para manejar la creación/actualización de informes
export async function action({ request, params }) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  console.log("Action ejecutada con datos:", data);

  // Convertir tipo_consulta de string a array
  data.tipo_consulta = formData.getAll("tipo_consulta");

  try {
    if (params.id) {
      // Actualizar informe existente
      const result = await updateReport(params.id, data);
      console.log("Informe actualizado:", result);
      return {
        success: true,
        message: "Informe actualizado correctamente.",
        isNew: false,
      };
    } else {
      // Crear nuevo informe
      const userEmail = formData.get("userEmail");
      const result = await createReport(data, userEmail);
      console.log("Informe creado:", result);
      return {
        success: true,
        message: "Informe creado correctamente.",
        isNew: true,
        reportNumber: result.nro_consulta,
      };
    }
  } catch (error) {
    console.error("Error en action:", error);
    return {
      success: false,
      message: "Error al guardar el informe. Inténtelo de nuevo.",
    };
  }
}
function ReportForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  // Usar React Query para obtener el reporte si estamos editando
  const { data: reportData, isLoading: isLoadingReport } = useReport(id);

  // Usar React Query para crear/actualizar reportes
  const createReportMutation = useCreateReport();
  const updateReportMutation = useUpdateReport();

  const isEditing = !!id;

  // Estado del formulario
  const [formData, setFormData] = useState({
    cliente: "",
    vinculo_cliente_postulante: "Postulante",
    vinculo_otro: "",
    medio: "Presencial",
    medio_comunicacion: "Local Ceprunsa",
    estado: "atendido",
    tipo_consulta: [],
    oficina_derivada: "",
    resultado_final: "",
  });

  // Estado para validación
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (isEditing && reportData) {
      console.log("Cargando datos para edición:", reportData);

      // Si el medio es Presencial pero no hay detalle, establecer el valor por defecto
      let medio_comunicacion = reportData.medio_comunicacion || "";
      if (reportData.medio === "Presencial" && !reportData.medio_comunicacion) {
        medio_comunicacion = "Local del Ceprunsa";
      }

      setFormData({
        cliente: reportData.cliente || "",
        vinculo_cliente_postulante:
          reportData.vinculo_cliente_postulante || "Postulante",
        vinculo_otro: reportData.vinculo_otro || "",
        medio: reportData.medio || "Presencial",
        medio_comunicacion: medio_comunicacion,
        estado: reportData.estado || "atendido",
        tipo_consulta: reportData.tipo_consulta || [],
        oficina_derivada: reportData.oficina_derivada || "",
        resultado_final: reportData.resultado_final || "",
      });
    }
  }, [isEditing, reportData]);

  // Modificar la función handleChange para establecer automáticamente "Local del Ceprunsa" cuando el medio es "Presencial"
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si se está cambiando el medio, manejar el detalle del medio según corresponda
    if (name === "medio") {
      if (value === "Presencial") {
        // Si es Presencial, establecer automáticamente "Local del Ceprunsa"
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          medio_comunicacion: "Local del Ceprunsa",
        }));
      } else {
        // Para otros medios, limpiar el campo para que el usuario lo complete
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          medio_comunicacion: "",
        }));
      }

      // Limpiar error si existía
      if (errors.medio_comunicacion) {
        setErrors((prev) => ({ ...prev, medio_comunicacion: null }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Limpiar error cuando el usuario corrige el campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;

    setFormData((prev) => {
      const newTipoConsulta = checked
        ? [...prev.tipo_consulta, value]
        : prev.tipo_consulta.filter((item) => item !== value);

      // Limpiar error si se selecciona al menos un tipo
      if (newTipoConsulta.length > 0 && errors.tipo_consulta) {
        setErrors((prev) => ({ ...prev, tipo_consulta: null }));
      }

      return { ...prev, tipo_consulta: newTipoConsulta };
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cliente.trim()) {
      newErrors.cliente = "El nombre del cliente es obligatorio";
    }

    if (formData.tipo_consulta.length === 0) {
      newErrors.tipo_consulta = "Debe seleccionar al menos un tipo de consulta";
    }

    if (formData.estado === "derivado" && !formData.oficina_derivada) {
      newErrors.oficina_derivada = "Debe seleccionar una oficina derivada";
    }

    if (
      formData.vinculo_cliente_postulante === "Otro" &&
      !formData.vinculo_otro
    ) {
      newErrors.vinculo_otro = "Debe especificar el vínculo";
    }

    if (!formData.medio_comunicacion.trim()) {
      newErrors.medio_comunicacion =
        "Debe especificar el detalle del medio de comunicación";
    }

    if (!formData.resultado_final.trim()) {
      newErrors.resultado_final =
        "Debe especificar el resultado final de la atención";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);

      // Mostrar notificación de error de validación
      addToast({
        type: TOAST_TYPES.WARNING,
        message: "Por favor, complete todos los campos requeridos.",
        duration: 5000,
      });

      // Desplazar a la primera sección con error
      const firstErrorField = document.querySelector('[aria-invalid="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
        firstErrorField.focus();
      }
      return;
    }

    try {
      if (isEditing) {
        // Actualizar informe existente
        await updateReportMutation.mutateAsync({
          id,
          reportData: formData,
        });

        addToast({
          type: TOAST_TYPES.SUCCESS,
          message: "Informe actualizado correctamente.",
          duration: 5000,
        });

        // Redirección inmediata sin retraso
        navigate("/");
      } else {
        // Crear nuevo informe
        const result = await createReportMutation.mutateAsync({
          reportData: formData,
          userEmail: currentUser.email,
        });

        addToast({
          type: TOAST_TYPES.SUCCESS,
          message: `Informe #${result.nro_consulta} creado correctamente.`,
          duration: 5000,
        });

        // Redirigir a la página de calificación del reporte
        navigate(`/reports/${result.id}/rate`);
      }
    } catch (error) {
      console.error("Error al guardar el informe:", error);

      addToast({
        type: TOAST_TYPES.ERROR,
        message: "Error al guardar el informe. Inténtelo de nuevo.",
        duration: 5000,
      });

      setIsSubmitting(false);
    }
  };

  if (isLoadingReport && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ceprunsa-mustard"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-ceprunsa-gray-light transition-colors duration-200"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Editar Informe" : "Nuevo Informe"}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300"
        noValidate
      >
        <div className="px-6 py-6 sm:p-8">
          <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-6">
            {/* Datos del cliente */}
            <div className="sm:col-span-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6 flex items-center">
                <span className="bg-ceprunsa-mustard w-1.5 h-6 rounded mr-2"></span>
                Datos del Cliente
              </h2>
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="cliente"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre del Cliente <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="cliente"
                  id="cliente"
                  value={formData.cliente}
                  onChange={handleChange}
                  className={`shadow-sm block w-full px-4 py-2.5 sm:text-sm rounded-md transition-colors duration-200
                    ${
                      errors.cliente
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                        : "border-gray-300 focus:ring-ceprunsa-mustard focus:border-ceprunsa-mustard focus:outline-none"
                    }`}
                  aria-invalid={errors.cliente ? "true" : "false"}
                  aria-describedby={
                    errors.cliente ? "cliente-error" : undefined
                  }
                  required
                />
                {errors.cliente && (
                  <p className="mt-1 text-sm text-red-600" id="cliente-error">
                    {errors.cliente}
                  </p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="vinculo_cliente_postulante"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Vínculo con el Postulante{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="vinculo_cliente_postulante"
                  name="vinculo_cliente_postulante"
                  value={formData.vinculo_cliente_postulante}
                  onChange={handleChange}
                  className="shadow-sm block w-full px-4 py-2.5 sm:text-sm border-gray-300 rounded-md focus:ring-ceprunsa-mustard focus:border-ceprunsa-mustard focus:outline-none transition-colors duration-200"
                  required
                >
                  {VINCULO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.vinculo_cliente_postulante === "Otro" && (
              <div className="sm:col-span-3">
                <label
                  htmlFor="vinculo_otro"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Especificar Vínculo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="vinculo_otro"
                    id="vinculo_otro"
                    value={formData.vinculo_otro}
                    onChange={handleChange}
                    className={`shadow-sm block w-full px-4 py-2.5 sm:text-sm rounded-md transition-colors duration-200
                      ${
                        errors.vinculo_otro
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                          : "border-gray-300 focus:ring-ceprunsa-mustard focus:border-ceprunsa-mustard focus:outline-none"
                      }`}
                    aria-invalid={errors.vinculo_otro ? "true" : "false"}
                    aria-describedby={
                      errors.vinculo_otro ? "vinculo-otro-error" : undefined
                    }
                    required={formData.vinculo_cliente_postulante === "Otro"}
                  />
                  {errors.vinculo_otro && (
                    <p
                      className="mt-1 text-sm text-red-600"
                      id="vinculo-otro-error"
                    >
                      {errors.vinculo_otro}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Datos de la atención */}
            <div className="sm:col-span-6 pt-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6 flex items-center">
                <span className="bg-ceprunsa-mustard w-1.5 h-6 rounded mr-2"></span>
                Datos de la Atención
              </h2>
            </div>

            <div className="sm:col-span-6">
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Consulta <span className="text-red-500">*</span>
                </legend>
                <div
                  className={`mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-md border ${
                    errors.tipo_consulta
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                  aria-invalid={errors.tipo_consulta ? "true" : "false"}
                  aria-describedby={
                    errors.tipo_consulta ? "tipo-consulta-error" : undefined
                  }
                >
                  {TIPO_CONSULTA_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`tipo_${option.value}`}
                          name="tipo_consulta"
                          type="checkbox"
                          value={option.value}
                          checked={formData.tipo_consulta.includes(
                            option.value
                          )}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-ceprunsa-mustard border-gray-300 rounded focus:ring-ceprunsa-mustard focus:ring-offset-0 focus:outline-none transition-colors duration-200"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor={`tipo_${option.value}`}
                          className="font-medium text-gray-700"
                        >
                          {option.label}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.tipo_consulta && (
                  <p
                    className="mt-1 text-sm text-red-600"
                    id="tipo-consulta-error"
                  >
                    {errors.tipo_consulta}
                  </p>
                )}
              </fieldset>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="medio"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Medio de Atención <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="medio"
                  name="medio"
                  value={formData.medio}
                  onChange={handleChange}
                  className="shadow-sm block w-full px-4 py-2.5 sm:text-sm border-gray-300 rounded-md focus:ring-ceprunsa-mustard focus:border-ceprunsa-mustard focus:outline-none transition-colors duration-200"
                  required
                >
                  {MEDIO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="medio_comunicacion"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Detalle del medio de comunicación{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="medio_comunicacion"
                  id="medio_comunicacion"
                  value={formData.medio_comunicacion}
                  onChange={handleChange}
                  placeholder={
                    formData.medio === "Telefónico"
                      ? "Número telefónico"
                      : formData.medio === "Telefónico Fijo"
                      ? "Número telefónico fijo"
                      : formData.medio === "Correo"
                      ? "Dirección de correo electrónico"
                      : formData.medio === "WhatsApp"
                      ? "Número de WhatsApp"
                      : "Detalles del medio de comunicación"
                  }
                  className={`shadow-sm block w-full px-4 py-2.5 sm:text-sm rounded-md transition-colors duration-200
                    ${
                      errors.medio_comunicacion
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                        : "border-gray-300 focus:ring-ceprunsa-mustard focus:border-ceprunsa-mustard focus:outline-none"
                    }`}
                  aria-invalid={errors.medio_comunicacion ? "true" : "false"}
                  aria-describedby={
                    errors.medio_comunicacion
                      ? "medio-comunicacion-error"
                      : undefined
                  }
                  required
                />
                {errors.medio_comunicacion && (
                  <p
                    className="mt-1 text-sm text-red-600"
                    id="medio-comunicacion-error"
                  >
                    {errors.medio_comunicacion}
                  </p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="estado"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Estado de la Atención <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="shadow-sm block w-full px-4 py-2.5 sm:text-sm border-gray-300 rounded-md focus:ring-ceprunsa-mustard focus:border-ceprunsa-mustard focus:outline-none transition-colors duration-200"
                  required
                >
                  {ESTADO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.estado === "derivado" && (
              <div className="sm:col-span-3">
                <label
                  htmlFor="oficina_derivada"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Oficina Derivada <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="oficina_derivada"
                    name="oficina_derivada"
                    value={formData.oficina_derivada}
                    onChange={handleChange}
                    className={`shadow-sm block w-full px-4 py-2.5 sm:text-sm rounded-md transition-colors duration-200
                      ${
                        errors.oficina_derivada
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                          : "border-gray-300 focus:ring-ceprunsa-mustard focus:border-ceprunsa-mustard focus:outline-none"
                      }`}
                    aria-invalid={errors.oficina_derivada ? "true" : "false"}
                    aria-describedby={
                      errors.oficina_derivada
                        ? "oficina-derivada-error"
                        : undefined
                    }
                    required={formData.estado === "derivado"}
                  >
                    <option value="">Seleccionar oficina</option>
                    {OFICINA_DERIVADA_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.oficina_derivada && (
                    <p
                      className="mt-1 text-sm text-red-600"
                      id="oficina-derivada-error"
                    >
                      {errors.oficina_derivada}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="sm:col-span-6">
              <label
                htmlFor="resultado_final"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Resultado Final <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  id="resultado_final"
                  name="resultado_final"
                  rows={4}
                  value={formData.resultado_final}
                  onChange={handleChange}
                  className={`shadow-sm block w-full px-4 py-2.5 sm:text-sm rounded-md transition-colors duration-200
        ${
          errors.resultado_final
            ? "border-red-300 focus:ring-red-500 focus:border-red-500 focus:outline-none"
            : "border-gray-300 focus:ring-ceprunsa-mustard focus:border-ceprunsa-mustard focus:outline-none"
        }`}
                  placeholder="Describa el resultado final de la atención..."
                  aria-invalid={errors.resultado_final ? "true" : "false"}
                  aria-describedby={
                    errors.resultado_final ? "resultado-final-error" : undefined
                  }
                  required
                />
                {errors.resultado_final && (
                  <p
                    className="mt-1 text-sm text-red-600"
                    id="resultado-final-error"
                  >
                    {errors.resultado_final}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 text-right sm:px-8 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex justify-center py-2.5 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard transition-colors duration-200"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2.5 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-900 bg-ceprunsa-mustard hover:bg-ceprunsa-mustard-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ceprunsa-mustard transition-colors duration-200"
              disabled={
                isSubmitting ||
                createReportMutation.isPending ||
                updateReportMutation.isPending
              }
            >
              <span className="flex items-center">
                {isSubmitting ||
                createReportMutation.isPending ||
                updateReportMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                    {isEditing ? "Actualizando..." : "Guardando..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? "Actualizar" : "Guardar"}
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ReportForm;
