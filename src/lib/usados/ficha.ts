/**
 * Datos de la ficha de una unidad USADA (2026-10-16). Puro, sin Payload ni React.
 *
 * Los datos destacados de la ficha de nueva salen de las filas «Destacar» de la
 * ficha técnica; la usada no tiene ficha en filas, así que salen de sus campos:
 * peso, año, horómetro y ubicación, en ese orden y omitiendo lo que falte.
 *
 * EL NÚMERO DE SERIE de la maquinaria usada no sale (decisión de dirección,
 * 2026-10-07). La única excepción son los ADITAMENTOS (2026-10-23): su campo
 * «Serial» llega aquí solo si la unidad es de esa categoría
 * (`camposDeAditamento`, `src/lib/usados/aditamentos.ts`).
 */
import type { DatoDestacado } from "../maquinaria/fichaTecnica";

const numero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

const positivo = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v > 0;

export type DatosUnidad = {
  pesoOperativo?: number | null;
  anio?: number | null;
  horometro?: number | null;
  ubicacion?: string | null;
  /** Solo de un aditamento (`camposDeAditamento`); en el resto, nunca se pasa. */
  serial?: string | null;
};

/**
 * Cuántos datos caben en la tarjeta de «Otras unidades» (3) y en la principal (4).
 * El serial de un aditamento va el último y siempre cabe: es lo que lo distingue.
 */
export function datosDeUnidad(u: DatosUnidad, max = 4): DatoDestacado[] {
  const datos: DatoDestacado[] = [];
  if (positivo(u.pesoOperativo)) {
    datos.push({
      etiqueta: "Peso operativo",
      valor: `${numero.format(u.pesoOperativo)} t`,
      icono: "peso",
    });
  }
  if (positivo(u.anio)) {
    datos.push({ etiqueta: "Año", valor: String(u.anio), icono: "anio" });
  }
  // Un horómetro de 0 es un dato (máquina sin uso); solo «sin dato» se omite.
  if (typeof u.horometro === "number" && Number.isFinite(u.horometro) && u.horometro >= 0) {
    datos.push({
      etiqueta: "Horómetro",
      valor: `${u.horometro.toLocaleString("es-CO")} h`,
      icono: "horas",
    });
  }
  const ubicacion = u.ubicacion?.trim();
  if (ubicacion) datos.push({ etiqueta: "Ubicación", valor: ubicacion, icono: "ubicacion" });
  const serial = u.serial?.trim();
  if (!serial) return datos.slice(0, max);
  return [...datos.slice(0, max - 1), { etiqueta: "Serial", valor: serial, icono: "serial" }];
}

/** La descripción en párrafos (una línea en blanco o un salto separan párrafos). */
export function parrafos(texto: string | null | undefined): string[] {
  return (texto ?? "")
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}
