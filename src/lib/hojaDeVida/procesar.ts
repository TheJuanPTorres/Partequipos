import { z } from "zod";

import { MAX_HV, type ErroresHv, type RespuestaHv } from "@/lib/hojaDeVida/constantes";
import { nombreAdjunto, validarPdf } from "@/lib/hojaDeVida/pdf";

/**
 * EL ENVÍO DE UNA HOJA DE VIDA, sin red ni base: validar, comprobar el captcha, mandar el correo con
 * el PDF adjunto y dejar el registro. Las dependencias entran como parámetro (se prueba sin Next ni
 * Payload, `procesar.test.ts`).
 *
 * EL PDF NO SE GUARDA: el Blob es público. Viaja SOLO de adjunto en el correo a Partequipos; en
 * «Solicitudes» queda el registro sin el archivo. Por eso el correo va ANTES que el registro: si
 * no se puede enviar, no hay solicitud a medias (la persona vuelve a intentarlo y el PDF no se
 * pierde en silencio). Si el correo sale y el registro falla, la hoja de vida llegó: se anota y
 * se responde que sí.
 */

const texto = (campo: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Escribe tu ${campo}.`)
    .max(max, `El campo ${campo} no puede pasar de ${max} caracteres.`);

export const esquemaHojaDeVida = z.object({
  nombre: texto("nombre", MAX_HV.nombre).min(2, "El nombre es demasiado corto."),
  correo: z
    .string()
    .trim()
    .min(1, "Escribe tu correo.")
    .max(MAX_HV.correo, "El correo es demasiado largo.")
    .email("Ese correo no parece válido.")
    .transform((v) => v.toLowerCase()),
  telefono: z
    .string()
    .trim()
    .min(1, "Escribe tu teléfono.")
    .max(MAX_HV.telefono, "El teléfono es demasiado largo.")
    .refine((v) => /^[+]?[\d\s\-().]{7,25}$/.test(v) && v.replace(/\D/g, "").length >= 7, {
      message: "Ese teléfono no parece válido. Ejemplo: +57 317 670 7071.",
    }),
  vacante: texto("vacante", MAX_HV.vacante),
  mensaje: z
    .string()
    .trim()
    .max(MAX_HV.mensaje, `El mensaje no puede pasar de ${MAX_HV.mensaje} caracteres.`)
    .optional()
    .transform((v) => (v ? v : undefined)),
  autorizacion: z.literal("on", {
    message: "Para enviar tu hoja de vida tienes que autorizar el tratamiento de tus datos.",
  }),
  origen: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type DatosHojaDeVida = z.infer<typeof esquemaHojaDeVida>;

export type Adjunto = { filename: string; content: Uint8Array; contentType: "application/pdf" };

export type DependenciasHv = {
  verificar: (token: string | undefined, ip?: string) => Promise<boolean>;
  /** A quién va el correo; `null` = no hay destino (no se puede enviar). */
  destino: () => Promise<string | null>;
  enviarCorreo: (correo: {
    to: string;
    replyTo: string;
    subject: string;
    text: string;
    attachments: Adjunto[];
  }) => Promise<void>;
  guardar: (datos: DatosHojaDeVida) => Promise<void>;
  registrarError: (contexto: string, error: unknown) => void;
  ip?: string;
};

export const ERROR_GENERICO_HV =
  "No pudimos enviar tu hoja de vida. Vuelve a intentarlo en un momento.";
export const ERROR_TURNSTILE_HV =
  "No pudimos comprobar que eres una persona. Revisa la casilla de verificación y vuelve a enviar.";
export const ERROR_VALIDACION_HV = "Revisa los campos marcados.";
export const OK_HV = "Recibimos tu hoja de vida. Gracias por querer ser parte de Partequipos.";

/** Una sola línea: sin saltos, que no puedan colarse otras cabeceras en el asunto. */
const unaLinea = (v: string) => v.replace(/[\r\n]+/g, " ").trim();

export function asuntoHv(vacante: string, nombre: string): string {
  return `Hoja de vida: ${unaLinea(vacante)} — ${unaLinea(nombre)}`;
}

export async function procesarHojaDeVida(
  formData: FormData,
  deps: DependenciasHv,
): Promise<RespuestaHv> {
  const leer = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : undefined;
  };

  // 1. Campos.
  const campos = esquemaHojaDeVida.safeParse({
    nombre: leer("nombre"),
    correo: leer("correo"),
    telefono: leer("telefono"),
    vacante: leer("vacante"),
    mensaje: leer("mensaje"),
    autorizacion: leer("autorizacion"),
    origen: leer("origen"),
  });
  const errores: ErroresHv = {};
  if (!campos.success) {
    for (const i of campos.error.issues) {
      const c = String(i.path[0] ?? "formulario");
      if (!errores[c]) errores[c] = i.message;
    }
  }

  // 2. El PDF: tamaño, extensión y CONTENIDO.
  const archivo = formData.get("hojaDeVida");
  let bytes: Uint8Array | null = null;
  let nombreArchivo = "";
  if (!(archivo instanceof File) || archivo.size === 0) {
    errores.hojaDeVida = "Adjunta tu hoja de vida en PDF.";
  } else {
    nombreArchivo = archivo.name;
    bytes = new Uint8Array(await archivo.arrayBuffer());
    const pdf = validarPdf(bytes, archivo.name);
    if (!pdf.ok) errores.hojaDeVida = pdf.mensaje;
  }

  if (!campos.success || Object.keys(errores).length > 0 || !bytes) {
    return { ok: false, mensaje: ERROR_VALIDACION_HV, errores };
  }
  const datos = campos.data;

  // 3. Captcha. Antes de tocar el correo o la base.
  const token = leer("cf-turnstile-response");
  if (!(await deps.verificar(token, deps.ip))) {
    return { ok: false, mensaje: ERROR_TURNSTILE_HV };
  }

  // 4. Correo con el PDF adjunto: sin él no hay envío.
  try {
    const to = await deps.destino();
    if (!to) {
      deps.registrarError("sin destino para las hojas de vida", null);
      return { ok: false, mensaje: ERROR_GENERICO_HV };
    }
    await deps.enviarCorreo({
      to,
      replyTo: datos.correo,
      subject: asuntoHv(datos.vacante, datos.nombre),
      text: [
        `Vacante:  ${unaLinea(datos.vacante)}`,
        `Nombre:   ${unaLinea(datos.nombre)}`,
        `Correo:   ${datos.correo}`,
        `Teléfono: ${unaLinea(datos.telefono)}`,
        `Origen:   ${datos.origen ?? "—"}`,
        "Autorizó el tratamiento de sus datos personales: sí.",
        "",
        "Mensaje:",
        datos.mensaje ?? "—",
        "",
        "La hoja de vida va adjunta (PDF). No se guarda en el sitio.",
      ].join("\n"),
      attachments: [
        {
          filename: nombreAdjunto(nombreArchivo, datos.nombre),
          content: bytes,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (error) {
    deps.registrarError("no se pudo enviar el correo", error);
    return { ok: false, mensaje: ERROR_GENERICO_HV };
  }

  // 5. El registro (sin el archivo). Si falla, la hoja de vida ya llegó.
  try {
    await deps.guardar(datos);
  } catch (error) {
    deps.registrarError("enviada, pero no se pudo guardar el registro", error);
  }

  return { ok: true, mensaje: OK_HV };
}
