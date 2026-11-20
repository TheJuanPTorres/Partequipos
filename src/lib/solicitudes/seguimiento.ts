/**
 * SEGUIMIENTO DE SOLICITUDES (2026-11-20, dirección): estado, responsable,
 * notas internas y fecha de contacto. Lógica pura, con pruebas.
 *
 * Solo las «Nuevas» cuentan como pendientes (contador del menú y portada del
 * panel): ver `ESTADO_PENDIENTE`.
 */

export const ESTADOS_SOLICITUD = [
  { label: "Nueva", value: "nueva" },
  { label: "Contactada", value: "contactada" },
  { label: "Cerrada", value: "cerrada" },
] as const;

export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number]["value"];

/** El único estado que cuenta como «por atender». */
export const ESTADO_PENDIENTE: EstadoSolicitud = "nueva";

/**
 * Fecha de contacto al guardar: si la solicitud sale de «Nueva» y nadie puso la
 * fecha, se apunta el momento del cambio. Una fecha puesta a mano se respeta.
 * Volver a «Nueva» no la borra (es historial).
 */
export function fechaDeContacto(
  estadoAnterior: unknown,
  estadoNuevo: unknown,
  fechaActual: unknown,
  ahora: Date,
): string | null {
  if (typeof fechaActual === "string" && fechaActual) return fechaActual;
  const sale = (estadoAnterior ?? "nueva") === "nueva" && estadoNuevo !== "nueva" && !!estadoNuevo;
  return sale ? ahora.toISOString() : null;
}

// --- CSV para Excel --------------------------------------------------------------

export type FilaSolicitud = {
  createdAt?: string | null;
  estado?: string | null;
  tipo?: string | null;
  nombre?: string | null;
  correo?: string | null;
  telefono?: string | null;
  empresa?: string | null;
  ciudad?: string | null;
  mensaje?: string | null;
  referenciaTexto?: string | null;
  origen?: string | null;
  responsable?: { email?: string | null } | number | string | null;
  fechaContacto?: string | null;
  notasInternas?: string | null;
};

const ETIQUETAS_ESTADO: Record<string, string> = Object.fromEntries(
  ESTADOS_SOLICITUD.map((e) => [e.value, e.label]),
);
const ETIQUETAS_TIPO: Record<string, string> = {
  contacto: "Contacto general",
  cotizacion: "Cotización de equipo",
  repuesto: "Solicitud de repuesto",
};

export const ENCABEZADOS_CSV = [
  "Fecha",
  "Estado",
  "Tipo",
  "Nombre",
  "Correo",
  "Teléfono",
  "Empresa",
  "Ciudad",
  "Mensaje",
  "Producto consultado",
  "Origen",
  "Responsable",
  "Fecha de contacto",
  "Notas internas",
] as const;

/**
 * Una celda de CSV. Dos defensas: comillas por RFC 4180 y, contra la
 * «inyección de fórmulas» de Excel, un apóstrofo delante de lo que empiece por
 * `=`, `+`, `-`, `@`, tabulador o retorno (el texto lo escribe un visitante).
 */
export function celdaCsv(valor: unknown): string {
  let texto = valor == null ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

const soloFecha = (iso?: string | null) => (iso ? iso.slice(0, 16).replace("T", " ") : "");

/**
 * CSV con `;` y BOM UTF-8: es lo que Excel en español abre bien con doble clic
 * (con `,` lo deja todo en una columna; sin BOM, rompe las tildes).
 */
export function solicitudesACsv(filas: FilaSolicitud[]): string {
  const lineas = [ENCABEZADOS_CSV.map(celdaCsv).join(";")];
  for (const f of filas) {
    const responsable =
      f.responsable && typeof f.responsable === "object" ? (f.responsable.email ?? "") : "";
    lineas.push(
      [
        soloFecha(f.createdAt),
        ETIQUETAS_ESTADO[f.estado ?? ""] ?? f.estado,
        ETIQUETAS_TIPO[f.tipo ?? ""] ?? f.tipo,
        f.nombre,
        f.correo,
        f.telefono,
        f.empresa,
        f.ciudad,
        f.mensaje,
        f.referenciaTexto,
        f.origen,
        responsable,
        soloFecha(f.fechaContacto),
        f.notasInternas,
      ]
        .map(celdaCsv)
        .join(";"),
    );
  }
  return `\uFEFF${lineas.join("\r\n")}\r\n`;
}
