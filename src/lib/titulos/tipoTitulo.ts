/**
 * Títulos escritos TODO EN MAYÚSCULAS a tipo título (decisión de Juan Pablo, 2026-11-23).
 * Lo aplica `scripts/titulos/tipo-titulo.ts`, por runbook. Aquí, la regla y la lista, con pruebas.
 *
 * Regla: cada palabra con su primera letra en mayúscula y el resto en minúscula, salvo
 *  - las que llevan una cifra (códigos de modelo y años: CX130D, ZX200-3, G-17, 2015), tal cual;
 *  - las siglas y marcas en mayúsculas (`SIGLAS`) y las palabras sin vocales (NPK), tal cual;
 *  - artículos, preposiciones y conjunciones («para», «de», «y»…) en minúscula, menos la primera.
 * Las erratas no se corrigen («RAPIDO» → «Rapido»): el contenido es del cliente (2026-10-17).
 */

/** Siglas y marcas que se escriben en mayúsculas. */
const SIGLAS = new Set(["CASE", "NPK", "JCB", "ENI", "LANDCROS", "CAT", "SAP", "PQRSF"]);

/** Van en minúscula salvo al principio del título. */
const MENORES = new Set([
  "a",
  "al",
  "con",
  "de",
  "del",
  "desde",
  "e",
  "el",
  "en",
  "entre",
  "hasta",
  "la",
  "las",
  "lo",
  "los",
  "o",
  "para",
  "por",
  "sin",
  "sobre",
  "u",
  "un",
  "una",
  "y",
]);

const VOCAL = /[AEIOUÁÉÍÓÚÜ]/;

function palabra(p: string, primera: boolean): string {
  if (!p || /\d/.test(p)) return p;
  const mayus = p.toLocaleUpperCase("es");
  if (SIGLAS.has(mayus)) return mayus;
  if (/^\p{L}{2,}$/u.test(p) && !VOCAL.test(mayus)) return mayus;
  const min = p.toLocaleLowerCase("es");
  if (!primera && MENORES.has(min)) return min;
  return min.charAt(0).toLocaleUpperCase("es") + min.slice(1);
}

/** El título en tipo título. Respeta los espacios tal cual. */
export function aTipoTitulo(texto: string): string {
  let primera = true;
  return texto
    .split(/(\s+)/)
    .map((trozo) => {
      if (/^\s*$/.test(trozo)) return trozo;
      const r = palabra(trozo, primera);
      primera = false;
      return r;
    })
    .join("");
}

/** Todo en mayúsculas y con al menos una palabra de 4 letras o más sin cifras (el criterio de la lista). */
export function enMayusculas(texto: string): boolean {
  return (
    texto === texto.toLocaleUpperCase("es") &&
    texto.split(/\s+/).some((p) => /\p{Lu}{4,}/u.test(p) && !/\d/.test(p))
  );
}

export type ColeccionTitulo = "equipos-nuevos" | "equipos-usados" | "paginas";

/** Los 18 de `informes/2026-11-23-titulos-mayusculas-C.md`, medidos en el preview (clon del sitio publicado). */
export const TITULOS_EN_MAYUSCULAS: readonly {
  coleccion: ColeccionTitulo;
  id: number;
  antes: string;
}[] = [
  { coleccion: "equipos-nuevos", id: 123, antes: "MARTILLO PARA EXCAVADORAS" },
  { coleccion: "equipos-nuevos", id: 124, antes: "ACOPLE RAPIDO PARA EXCAVADORAS" },
  { coleccion: "equipos-nuevos", id: 125, antes: "PONTONES PARA EXCAVADORAS" },
  { coleccion: "equipos-nuevos", id: 126, antes: "BRAZO LARGO PARA EXCAVADORAS" },
  { coleccion: "equipos-nuevos", id: 127, antes: "BARREDORA PARA MINICARGADORES" },
  { coleccion: "equipos-nuevos", id: 128, antes: "PORTA PALLET PARA MINICARGADORES" },
  { coleccion: "equipos-nuevos", id: 129, antes: "RODILLO VIBROCOMPACTADOR PARA MINICARGADORES" },
  { coleccion: "equipos-nuevos", id: 130, antes: "LÍNEA HÚMEDA PARA MINICARGADORES" },
  { coleccion: "equipos-nuevos", id: 131, antes: "CADENAS DE LLANTA PARA MINICARGADORES" },
  { coleccion: "equipos-nuevos", id: 132, antes: "BRAZO PARA MINICARGADORES" },
  { coleccion: "equipos-nuevos", id: 133, antes: "MARTILLO PARA MINICARGADORES" },
  { coleccion: "equipos-nuevos", id: 134, antes: "CUCHARÓN PARA MINICARGADORES" },
  { coleccion: "equipos-usados", id: 158, antes: "OKADA TOP 100" },
  { coleccion: "equipos-usados", id: 159, antes: "MARTILLO NPK 2015" },
  { coleccion: "equipos-usados", id: 160, antes: "CRUSHER NPK G-17 2012" },
  { coleccion: "equipos-usados", id: 161, antes: "ACOPLE RÁPIDO PARA EXCAVADORA" },
  { coleccion: "paginas", id: 7, antes: "TRATAMIENTO DE DATOS" },
  { coleccion: "paginas", id: 9, antes: "TÉRMINOS Y CONDICIONES CAMPAÑA BONOS DE RECOMPRA" },
];

/** Qué hacer con un título según su valor actual: nunca pisa uno editado en el panel. */
export function decidir(
  modo: "aplicar" | "retirar",
  actual: string | null | undefined,
  antes: string,
  despues: string,
): "cambiar" | "ya-estaba" | "distinto" {
  const desde = modo === "aplicar" ? antes : despues;
  const hasta = modo === "aplicar" ? despues : antes;
  if (actual === hasta) return "ya-estaba";
  if (actual === desde) return "cambiar";
  return "distinto";
}
