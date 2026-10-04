import { MAX, type ErroresCampo } from "@/lib/validation/solicitud";

/**
 * Estado del formulario, compartido entre la Server Action y el componente.
 *
 * VIVE APARTE DE LA ACCIÓN A PROPÓSITO. Un archivo con `"use server"` solo puede
 * exportar funciones async: cualquier otra exportación —una constante, un
 * objeto— hace fallar la petición en tiempo de ejecución con
 * «A "use server" file can only export async functions, found object».
 *
 * No lo detectan `build`, `lint` ni `typecheck`: el build compila sin una queja
 * y el error solo aparece al enviar el formulario. Por eso el valor inicial está
 * aquí y no junto a `enviarSolicitud`.
 */
export type EstadoFormulario = {
  estado: "inicial" | "ok" | "error";
  /** Mensaje general, para lo que no pertenece a un campo concreto. */
  mensaje?: string;
  errores?: ErroresCampo;
  /**
   * Lo que escribió el usuario, para devolvérselo cuando el envío falla.
   * React restablece el formulario al terminar la acción: sin esto, un
   * rechazo de Turnstile o de validación le borra un mensaje largo.
   */
  valores?: ValoresFormulario;
};

export const ESTADO_INICIAL: EstadoFormulario = { estado: "inicial" };

/** Los campos que escribe el usuario (no los ocultos ni el token). */
export const CAMPOS_VISIBLES = ["nombre", "correo", "telefono", "empresa", "mensaje"] as const;
export type CampoVisible = (typeof CAMPOS_VISIBLES)[number];
export type ValoresFormulario = Partial<Record<CampoVisible, string>>;

/**
 * Valores para volver a rellenar el formulario tras un error.
 *
 * Solo los campos visibles, tal como se escribieron (sin recortar espacios),
 * y cortados a su longitud máxima: un POST hecho a mano con un mensaje enorme
 * no se devuelve entero en la respuesta.
 */
export function valoresParaReintento(formData: FormData): ValoresFormulario {
  const valores: ValoresFormulario = {};
  for (const campo of CAMPOS_VISIBLES) {
    const v = formData.get(campo);
    if (typeof v === "string" && v !== "") valores[campo] = v.slice(0, MAX[campo]);
  }
  return valores;
}
