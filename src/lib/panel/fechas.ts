/**
 * Fechas del panel: relativas («hace 2 días») y exactas («15 sep 2026, 23:56»,
 * el formato de `admin.dateFormat`), en la hora de Colombia. Las usan la
 * portada propia (F2) y las celdas de las listas (F3). Funciones puras.
 */
const ZONA = "America/Bogota";
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const relativa = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

const PASOS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** «hace 2 días», «hace 3 h»… Menos de un minuto: «ahora mismo». */
export function fechaRelativa(fecha: string | Date, ahora: Date = new Date()): string {
  const momento = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (Number.isNaN(momento.getTime())) return "";
  const segundos = Math.round((momento.getTime() - ahora.getTime()) / 1000);
  for (const [unidad, tamano] of PASOS) {
    if (Math.abs(segundos) >= tamano) {
      return relativa.format(Math.round(segundos / tamano), unidad);
    }
  }
  return "ahora mismo";
}

/** «15 sep 2026, 23:56», en la hora de Colombia. */
export function fechaExacta(fecha: string | Date): string {
  const momento = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (Number.isNaN(momento.getTime())) return "";
  const partes = new Intl.DateTimeFormat("es-CO", {
    timeZone: ZONA,
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(momento);
  const v = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)?.value ?? "";
  // Los meses como los pinta el panel (date-fns en español), no «sept» de Intl.
  const mes = MESES[Number(v("month")) - 1] ?? "";
  return `${v("day")} ${mes} ${v("year")}, ${v("hour")}:${v("minute")}`;
}
