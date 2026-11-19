/** «15 oct 2026», en español y en UTC (la fecha del blog no tiene hora local). */
export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const MESES_BREVES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sept",
  "oct",
  "nov",
  "dic",
];

/** «25 sept 2026», en una línea y en UTC. */
export function fechaBreve(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MESES_BREVES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
