/**
 * «HITACHI» → «HITACHI LANDCROS» EN LAS DIRECCIONES (dirección, 2026-11-18). El nombre ya se cambió
 * en los datos (`hitachiLandcros.ts`, 2026-10-26); aquí está la regla de las URL, que usa el script
 * `scripts/marcas/hitachi-landcros-urls.ts`.
 *
 * Patrón: en el slug, la palabra `hitachi` pasa a `hitachi-landcros`, en el mismo sitio:
 *
 *   hitachi                                        → hitachi-landcros
 *   excavadoras-hitachi                            → excavadoras-hitachi-landcros
 *   excavadora-hitachi-zx130-5b                    → excavadora-hitachi-landcros-zx130-5b
 *   repuestos-para-maquinaria-pesada-hitachi       → repuestos-para-maquinaria-pesada-hitachi-landcros
 *   repuestos-excavadora-hitachi-ex120-2           → repuestos-excavadora-hitachi-landcros-ex120-2
 *
 * Solo en la marca de REPUESTOS y en la de maquinaria NUEVA, con sus tipos, modelos y equipos. Las
 * unidades USADAS (son máquinas Hitachi) y los artículos del blog conservan su dirección.
 */

/** El slug con «landcros» detrás de «hitachi». Idempotente: el que ya lo lleva no cambia. */
export function slugConLandcros(slug: string): string {
  return slug.replace(/(^|-)hitachi(?!-landcros(?:-|$))(?=-|$)/g, "$1hitachi-landcros");
}

/** Si al slug le falta «landcros». */
export const leFaltaLandcros = (slug: string) => slugConLandcros(slug) !== slug;

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Reescribe, dentro de un texto, las rutas antiguas por las nuevas (enlaces del panel, del texto
 * enriquecido o del destino de una redirección). `pares` va de ruta antigua a ruta nueva, las dos
 * sin barra final. Casa la ruta entera: seguida de «/», de la query, del ancla, de un cierre o del
 * final; así `…/marcas/hitachi` no casa dentro de `…/marcas/hitachi-landcros`. Lo que sigue a la
 * ruta (barra, query, ancla) se conserva. Solo rutas RELATIVAS: una URL absoluta (otro dominio, o el
 * WordPress del cliente, donde la dirección nueva no existe) se queda como está.
 */
export function reescribirRutas(texto: string, pares: ReadonlyMap<string, string>): string {
  if (pares.size === 0 || !texto.includes("hitachi")) return texto;
  // Las más largas primero: la de un modelo empieza por la de su tipo y la de su marca.
  const antiguas = [...pares.keys()].sort((a, b) => b.length - a.length);
  const patron = new RegExp(
    `(?<![\\w.:/-])(?:${antiguas.map(escapar).join("|")})(?=[/?#"'\\s)<\\]]|$)`,
    "g",
  );
  return texto.replace(patron, (ruta) => pares.get(ruta) ?? ruta);
}

/** Como `reescribirRutas`, en todos los textos de un valor (objetos, listas y texto enriquecido). */
export function reescribirRutasProfundo<T>(valor: T, pares: ReadonlyMap<string, string>): T {
  if (typeof valor === "string") return reescribirRutas(valor, pares) as T;
  if (Array.isArray(valor)) return valor.map((v) => reescribirRutasProfundo(v, pares)) as T;
  if (valor && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor).map(([k, v]) => [k, reescribirRutasProfundo(v, pares)]),
    ) as T;
  }
  return valor;
}
