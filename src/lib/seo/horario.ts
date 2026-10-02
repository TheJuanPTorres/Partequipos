/**
 * HORARIO DE ATENCIÓN — lógica pura (fase 6). Los datos salen del global `seo`
 * de Payload (`src/globals/Seo.ts`), editable desde el panel; aquí solo se
 * valida y se convierte para el JSON-LD y para la página de contacto.
 */

/** Días en el formato de schema.org (`DayOfWeek`), que es el que se guarda. */
export const DIAS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
export type Dia = (typeof DIAS)[number];

export const NOMBRE_DIA: Record<Dia, string> = {
  Monday: "lunes",
  Tuesday: "martes",
  Wednesday: "miércoles",
  Thursday: "jueves",
  Friday: "viernes",
  Saturday: "sábado",
  Sunday: "domingo",
};

export type Tramo = { dias: Dia[]; abre: string; cierra: string };

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Validación de un campo de hora del panel: «HH:MM» en 24 horas. */
export function validarHora(valor: unknown): true | string {
  if (typeof valor === "string" && HORA.test(valor.trim())) return true;
  return "Escribe la hora como HH:MM en formato de 24 horas, por ejemplo 08:00 o 17:30.";
}

/**
 * Tramos listos para usar: se descartan los incompletos o con horas no
 * válidas, y los que cierran antes de abrir. Los días van en el orden de la
 * semana, sin repetir.
 */
export function tramosValidos(
  filas:
    | { dias?: (string | null)[] | null; abre?: string | null; cierra?: string | null }[]
    | null
    | undefined,
): Tramo[] {
  return (filas ?? []).flatMap((f) => {
    const dias = DIAS.filter((d) => (f.dias ?? []).includes(d));
    const abre = f.abre?.trim() ?? "";
    const cierra = f.cierra?.trim() ?? "";
    if (dias.length === 0 || !HORA.test(abre) || !HORA.test(cierra) || cierra <= abre) return [];
    return [{ dias, abre, cierra }];
  });
}

/** `OpeningHoursSpecification` de schema.org, uno por tramo. */
export function horarioJsonLd(tramos: Tramo[]): Record<string, unknown>[] {
  return tramos.map((t) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: t.dias.map((d) => `https://schema.org/${d}`),
    opens: t.abre,
    closes: t.cierra,
  }));
}

/** «lunes a viernes», «sábado», «lunes, miércoles y viernes». */
export function textoDias(dias: Dia[]): string {
  const nombres = dias.map((d) => NOMBRE_DIA[d]);
  const primero = nombres[0] ?? "";
  const ultimo = nombres.at(-1) ?? "";
  const i = dias.map((d) => DIAS.indexOf(d));
  const seguidos = i.length > 2 && i.every((v, k) => k === 0 || v === (i[k - 1] ?? -2) + 1);
  if (seguidos) return `${primero} a ${ultimo}`;
  return nombres.length > 1 ? `${nombres.slice(0, -1).join(", ")} y ${ultimo}` : primero;
}

/** «8:00» y «17:30»: sin el cero a la izquierda de la hora. */
export function textoHora(hhmm: string): string {
  return hhmm.replace(/^0(\d)/, "$1");
}
