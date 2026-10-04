import { valoresParaReintento, type EstadoFormulario } from "@/lib/actions/estadoFormulario";
import { desdeFormData, validarSolicitud, type DatosSolicitud } from "@/lib/validation/solicitud";

/**
 * La decisión del envío de un formulario público, sin red ni base: validar,
 * comprobar el captcha y guardar, con esas dos últimas cosas inyectadas.
 *
 * VIVE FUERA de `solicitudes.ts` («use server») a propósito: todo lo que
 * exporta un fichero de Server Actions se puede invocar desde el navegador, y
 * esta función recibe sus dependencias como parámetro. Aquí solo la llama la
 * acción, y así se prueba sin Next ni Payload (`procesarSolicitud.test.ts`).
 */
export type Dependencias = {
  /** Verifica el token de Turnstile en el servidor. */
  verificar: (token: string | undefined, ip?: string) => Promise<boolean>;
  /** Persiste la solicitud. Puede lanzar: se devuelve el error genérico. */
  guardar: (datos: DatosSolicitud) => Promise<void>;
  /** Registra un fallo de guardado (el detalle no va al usuario, §8). */
  registrarError: (error: unknown) => void;
  ip?: string;
};

/** Mensaje único para los fallos del servidor: no se filtran detalles al usuario. */
export const ERROR_GENERICO =
  "No pudimos registrar tu solicitud. Vuelve a intentarlo en un momento o escríbenos por WhatsApp.";
export const ERROR_TURNSTILE =
  "No pudimos comprobar que eres una persona. Revisa la casilla de verificación y vuelve a enviar: lo que escribiste sigue aquí.";
export const ERROR_VALIDACION = "Revisa los campos marcados.";
export const OK = "Recibimos tu solicitud. Te responderemos por correo o teléfono.";

export async function procesarSolicitud(
  formData: FormData,
  deps: Dependencias,
): Promise<EstadoFormulario> {
  // En cualquier error se devuelven los valores: React vacía el formulario
  // al terminar la acción, y así vuelve a rellenarse con lo que escribió.
  const valores = valoresParaReintento(formData);

  // 1. Validación. Primero, porque es barata y no toca la red.
  const resultado = validarSolicitud(desdeFormData(formData));
  if (!resultado.ok) {
    return { estado: "error", mensaje: ERROR_VALIDACION, errores: resultado.errores, valores };
  }

  // 2. Captcha. Antes de escribir nada.
  const token = formData.get("cf-turnstile-response");
  const humano = await deps.verificar(typeof token === "string" ? token : undefined, deps.ip);
  if (!humano) return { estado: "error", mensaje: ERROR_TURNSTILE, valores };

  // 3. Persistencia.
  try {
    await deps.guardar(resultado.datos);
  } catch (error) {
    deps.registrarError(error);
    return { estado: "error", mensaje: ERROR_GENERICO, valores };
  }

  return { estado: "ok", mensaje: OK };
}
