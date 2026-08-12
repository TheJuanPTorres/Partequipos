import type { ErroresCampo } from "@/lib/validation/solicitud";

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
};

export const ESTADO_INICIAL: EstadoFormulario = { estado: "inicial" };
