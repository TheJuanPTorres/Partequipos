/**
 * Insignias de estado de las listas del panel (F3 del rediseño, 2026-10-06;
 * decisiones-panel.md §24). Siempre con TEXTO: el color acompaña, nunca es lo
 * único que dice el estado (WCAG 1.4.1).
 */
export type TonoInsignia = "exito" | "aviso" | "error" | "info" | "neutro";
export type Insignia = { texto: string; tono: TonoInsignia };

export type TipoInsignia = "disponible" | "publicado" | "autorizacion" | "solicitud" | "destino";

const SI_NO: Record<"disponible" | "publicado" | "autorizacion", [si: Insignia, no: Insignia]> = {
  disponible: [
    { texto: "Disponible", tono: "exito" },
    { texto: "No disponible", tono: "neutro" },
  ],
  publicado: [
    { texto: "Publicado", tono: "exito" },
    { texto: "Borrador", tono: "neutro" },
  ],
  autorizacion: [
    { texto: "Autorizado", tono: "exito" },
    { texto: "Sin autorización", tono: "aviso" },
  ],
};

const OPCIONES: Record<"solicitud" | "destino", Record<string, Insignia>> = {
  solicitud: {
    nueva: { texto: "Nueva", tono: "aviso" },
    atendida: { texto: "Atendida", tono: "exito" },
  },
  destino: {
    resuelve: { texto: "Resuelve", tono: "exito" },
    "sin-contenido": { texto: "Sin contenido todavía", tono: "aviso" },
    "sin-ruta": { texto: "No existe", tono: "error" },
    externa: { texto: "Externa", tono: "info" },
    "sin-verificar": { texto: "Sin verificar", tono: "neutro" },
  },
};

/** La insignia de un valor, o `null` si no hay valor que mostrar. */
export function insigniaDe(tipo: TipoInsignia, valor: unknown): Insignia | null {
  if (tipo === "solicitud" || tipo === "destino") {
    return typeof valor === "string"
      ? (OPCIONES[tipo][valor] ?? { texto: valor, tono: "neutro" })
      : null;
  }
  if (valor === true) return SI_NO[tipo][0];
  if (valor === false || valor === null || valor === undefined) return SI_NO[tipo][1];
  return null;
}
