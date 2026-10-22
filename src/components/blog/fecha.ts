/** «15 oct 2026», en español y en UTC (la fecha del blog no tiene hora local). */
export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** «15 de octubre de 2026». */
export function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
