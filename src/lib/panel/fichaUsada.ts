import type { Insignia } from "./insignias";

/**
 * EDICIÓN FÁCIL DE LA FICHA DE MÁQUINA USADA (tanda 21, tarea 3, fase 1: PROTOTIPO, solo en el
 * preview, sin esquema). Lógica pura del estado y de la ficha completa, con pruebas; la usan las
 * celdas de la lista y el resumen de arriba de la ficha.
 */

/** Lo que hace falta de la unidad para decir su estado y lo que falta. */
export type DatosUsada = {
  nombre?: unknown;
  categoria?: unknown;
  marcaUsada?: unknown;
  modelo?: unknown;
  anio?: unknown;
  horometro?: unknown;
  pesoOperativo?: unknown;
  ubicacion?: unknown;
  descripcion?: unknown;
  imagenes?: unknown;
  mostrarEnWeb?: unknown;
  disponible?: unknown;
};

export type EstadoUsada = "publicada" | "oculta" | "vendida";

/**
 * Estado en la web, en este orden: oculta manda (no sale en ningún sitio), después vendida (su
 * página lleva a la categoría) y si no, publicada. Sin valor cuenta como marcado, como en el
 * resto del panel (solo lo desmarcado oculta o vende).
 */
export function estadoUsada(d: Pick<DatosUsada, "mostrarEnWeb" | "disponible">): EstadoUsada {
  if (d.mostrarEnWeb === false) return "oculta";
  if (d.disponible === false) return "vendida";
  return "publicada";
}

const INSIGNIAS: Record<EstadoUsada, Insignia> = {
  publicada: { texto: "Publicada", tono: "exito" },
  oculta: { texto: "Oculta", tono: "aviso" },
  vendida: { texto: "Vendida", tono: "vendida" },
};

export const insigniaUsada = (d: Pick<DatosUsada, "mostrarEnWeb" | "disponible">): Insignia =>
  INSIGNIAS[estadoUsada(d)];

const lleno = (v: unknown): boolean => {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  if (Array.isArray(v)) return v.length > 0;
  return true;
};

/**
 * Lo que cuenta para «ficha completa», en el orden de la ficha pública, con su peso. Las fotos
 * pesan más: sin ellas la tarjeta del listado sale vacía. Lo opcional que la web no echa en falta
 * (serial, PDF, SEO) no cuenta.
 */
export const PARTES_FICHA: ReadonlyArray<{
  campo: keyof DatosUsada;
  texto: string;
  peso: number;
  /** Cuántos elementos hacen falta (fotos). */
  minimo?: number;
}> = [
  { campo: "nombre", texto: "Nombre", peso: 1 },
  { campo: "categoria", texto: "Categoría", peso: 1 },
  { campo: "marcaUsada", texto: "Marca", peso: 1 },
  { campo: "modelo", texto: "Modelo", peso: 1 },
  { campo: "anio", texto: "Año", peso: 1 },
  { campo: "horometro", texto: "Horómetro", peso: 1 },
  { campo: "pesoOperativo", texto: "Peso operativo", peso: 1 },
  { campo: "ubicacion", texto: "Ubicación", peso: 1 },
  { campo: "descripcion", texto: "Descripción", peso: 1 },
  { campo: "imagenes", texto: "Fotos (al menos 3)", peso: 3, minimo: 3 },
];

export type Completitud = { porcentaje: number; faltan: string[] };

export function completitudUsada(d: DatosUsada): Completitud {
  let total = 0;
  let hecho = 0;
  const faltan: string[] = [];
  for (const p of PARTES_FICHA) {
    total += p.peso;
    const v = d[p.campo];
    if (p.minimo !== undefined) {
      const n = Array.isArray(v) ? v.length : 0;
      hecho += p.peso * Math.min(1, n / p.minimo);
      if (n < p.minimo) faltan.push(p.texto);
    } else if (lleno(v)) {
      hecho += p.peso;
    } else {
      faltan.push(p.texto);
    }
  }
  return { porcentaje: Math.round((hecho / total) * 100), faltan };
}

/** Año válido de una máquina: de 1950 al año que viene (los modelos se anuncian antes). */
export function validarAnio(valor: unknown, hoy = new Date()): true | string {
  if (valor === null || valor === undefined || valor === "") return true;
  const max = hoy.getFullYear() + 1;
  if (typeof valor !== "number" || !Number.isInteger(valor) || valor < 1950 || valor > max) {
    return `Escribe el año con cuatro cifras, entre 1950 y ${max}. Ej. 2016.`;
  }
  return true;
}

/** Horas enteras y no negativas. */
export function validarHorometro(valor: unknown): true | string {
  if (valor === null || valor === undefined || valor === "") return true;
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0) {
    return "Escribe las horas como un número sin puntos ni letras. Ej. 8450.";
  }
  if (valor > 200000) return "Son demasiadas horas: revisa el número. Ej. 8450.";
  return true;
}

/** Modelos distintos, sin vacíos, ordenados, para el autocompletar. */
export function modelosSugeridos(valores: unknown[]): string[] {
  const vistos = new Map<string, string>();
  for (const v of valores) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (t && !vistos.has(t.toLowerCase())) vistos.set(t.toLowerCase(), t);
  }
  return [...vistos.values()].sort((a, b) => a.localeCompare(b, "es"));
}
