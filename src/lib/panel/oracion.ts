/**
 * MAYÚSCULA SOLO AL INICIO (fundamento «Contenido» del sistema del cliente:
 * «Capitaliza solo la primera letra y los nombres propios o marcas»).
 *
 * La traducción al español de Payload 3.89 escribe 58 textos con mayúsculas de
 * título («Panel de Control», «Guardar Cambios», «Nueva Contraseña»…). En vez de
 * reescribirlos a mano, se convierten al cargar la config: si Payload añade o
 * cambia textos en una actualización, la regla los cubre sola.
 *
 * Qué NO se toca: la primera palabra de cada frase (tras «.», «!», «?» o «:»),
 * siglas y nombres de producto (`CONSERVAR`), las variables `{{…}}`, el HTML y
 * lo que va entre comillas (son nombres de menú o de botón).
 */
const CONSERVAR = new Set([
  "API",
  "URL",
  "ID",
  "JSON",
  "CSV",
  "PDF",
  "SEO",
  "HTML",
  "GraphQL",
  "Payload",
  "Lexical",
  "Markdown",
]);

/** «Guardar Cambios» → «Guardar cambios». */
export function aOracion(texto: string): string {
  return texto.replace(
    /(\{\{[^}]*\}\}|<[^>]*>|"[^"]*"|«[^»]*»)|(\S+)/g,
    (coincidencia, protegido: string | undefined, palabra: string | undefined, desde: number) => {
      if (protegido || !palabra) return coincidencia;
      const antes = texto.slice(0, desde).trimEnd();
      if (antes === "" || /[.!?:>]$/.test(antes)) return palabra;
      const limpia = palabra.replace(/[,.;:]$/, "");
      if (CONSERVAR.has(limpia)) return palabra;
      // Solo una palabra en forma de título (Mayúscula + minúsculas); las siglas
      // y las palabras con mayúsculas dentro quedan como están.
      if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+[,.;:]?$/.test(palabra)) {
        return palabra.charAt(0).toLowerCase() + palabra.slice(1);
      }
      return palabra;
    },
  );
}

type Traducciones = { [clave: string]: string | Traducciones };

/** Aplica `aOracion` a todos los textos de un árbol de traducciones. */
export function traduccionesEnOracion<T extends Traducciones>(arbol: T): T {
  const fuera: Traducciones = {};
  for (const [clave, valor] of Object.entries(arbol)) {
    fuera[clave] = typeof valor === "string" ? aOracion(valor) : traduccionesEnOracion(valor);
  }
  return fuera as T;
}

/** Pone `encima` sobre `base`, rama a rama (los cambios a mano ganan). */
export function fusionarTraducciones<T extends Traducciones>(base: T, encima: Traducciones): T {
  const fuera: Traducciones = { ...base };
  for (const [clave, valor] of Object.entries(encima)) {
    const previo = fuera[clave];
    fuera[clave] =
      typeof valor === "object" && typeof previo === "object"
        ? fusionarTraducciones(previo, valor)
        : valor;
  }
  return fuera as T;
}
