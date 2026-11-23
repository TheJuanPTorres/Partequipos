/**
 * AVISOS POR CORREO DE UNA SOLICITUD (2026-11-23, dirección). Lógica pura, con pruebas:
 *
 * - el correo al EQUIPO (buzón de formularios): los datos de la solicitud y el enlace a su ficha
 *   en el panel; responder a ese correo escribe al visitante (`replyTo`);
 * - la respuesta AUTOMÁTICA al visitante («Hemos recibido tu mensaje…»), con asunto y texto
 *   editables en «Correo y formularios». Vacíos, valen los de siempre (`RESPUESTA_POR_DEFECTO`).
 *
 * El texto lo escribe un visitante: nada de saltos de línea en un asunto (inyección de cabeceras)
 * y la respuesta nunca lleva su mensaje de vuelta.
 */

export const RESPUESTA_POR_DEFECTO = {
  asunto: "Hemos recibido tu mensaje",
  texto: [
    "Hola {nombre},",
    "",
    "Hemos recibido tu mensaje y un asesor de Partequipos te contactará muy pronto.",
    "",
    "Si es urgente, escríbenos por WhatsApp o llámanos.",
    "",
    "Gracias por escribirnos.",
    "Equipo Partequipos",
  ].join("\n"),
} as const;

type Entorno = Record<string, string | undefined>;

export type SolicitudParaCorreo = {
  id: number | string;
  tipo?: string | null;
  nombre: string;
  correo: string;
  telefono?: string | null;
  empresa?: string | null;
  ciudad?: string | null;
  referenciaTexto?: string | null;
  origen?: string | null;
  mensaje: string;
};

/** Una sola línea, sin saltos ni caracteres de control: apta para un asunto o un nombre. */
export function unaLinea(texto: unknown, max = 120): string {
  return String(texto ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

const ETIQUETA_TIPO: Record<string, string> = {
  contacto: "contacto",
  cotizacion: "cotización",
  repuesto: "repuesto",
};

/** El correo que recibe el equipo, con el enlace a la solicitud en el panel. */
export function correoAlEquipo(doc: SolicitudParaCorreo, urlBase: string) {
  const enlace = `${urlBase.replace(/\/+$/, "")}/admin/collections/solicitudes/${doc.id}`;
  const tipo = ETIQUETA_TIPO[doc.tipo ?? ""] ?? unaLinea(doc.tipo, 30);
  return {
    subject: `Nueva solicitud (${tipo}) de ${unaLinea(doc.nombre, 80)}`,
    replyTo: unaLinea(doc.correo, 200),
    text: [
      `Tipo:     ${tipo}`,
      `Nombre:   ${doc.nombre}`,
      `Correo:   ${doc.correo}`,
      `Teléfono: ${doc.telefono ?? "—"}`,
      `Empresa:  ${doc.empresa ?? "—"}`,
      `Ciudad:   ${doc.ciudad ?? "—"}`,
      `Producto: ${doc.referenciaTexto ?? "—"}`,
      `Origen:   ${doc.origen ?? "—"}`,
      "",
      "Mensaje:",
      doc.mensaje,
      "",
      `Ábrela en el panel: ${enlace}`,
    ].join("\n"),
  };
}

export type TextosRespuesta = {
  respuestaActiva?: boolean | null;
  respuestaAsunto?: string | null;
  respuestaTexto?: string | null;
};

/** La respuesta automática, o `null` si está desactivada. Sin textos propios, los de siempre. */
export function respuestaAlVisitante(
  doc: Pick<SolicitudParaCorreo, "nombre">,
  textos: TextosRespuesta | null | undefined,
): { subject: string; text: string } | null {
  // Sin valor cuenta como activa: solo se apaga desmarcando.
  if (textos?.respuestaActiva === false) return null;
  const asunto = unaLinea(textos?.respuestaAsunto) || RESPUESTA_POR_DEFECTO.asunto;
  const texto = textos?.respuestaTexto?.trim() || RESPUESTA_POR_DEFECTO.texto;
  const nombre = unaLinea(doc.nombre, 60) || "";
  const poner = (t: string) => t.replaceAll("{nombre}", nombre).replace(/ ,/g, ",");
  return { subject: poner(asunto), text: poner(texto) };
}

/**
 * A quién va la respuesta automática. En el sitio publicado, al visitante. Fuera de él, la base
 * del preview es un clon con correos reales: va SOLO al buzón de pruebas (`SOLICITUDES_EMAIL_TO`),
 * con el asunto marcado, o a nadie.
 */
export function destinoRespuesta(
  correoVisitante: string,
  asunto: string,
  env: Entorno = process.env,
): { to: string; subject: string } | null {
  if (env.VERCEL_ENV === "production") {
    const to = correoVisitante.trim();
    return to ? { to, subject: asunto } : null;
  }
  const prueba = env.SOLICITUDES_EMAIL_TO?.trim();
  return prueba
    ? {
        to: prueba,
        subject: `[PRUEBA: respuesta automática a ${unaLinea(correoVisitante, 80)}] ${asunto}`,
      }
    : null;
}
