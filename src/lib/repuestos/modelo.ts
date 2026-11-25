import type { CategoriasTecnica, Marca, ModelosRepuesto, TiposEquipo } from "@/payload-types";

/**
 * Lógica pura de la PÁGINA DE MODELO de repuestos (plantilla 4086 de Andrés,
 * docs/diseno/decisiones-modelo-repuestos.md): las categorías elegidas en su tipo
 * de máquina, en ese orden, y los títulos y referencias de la plantilla.
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";

/**
 * Las categorías de la página de un modelo: las que su tipo eligió en
 * «Categorías en las páginas de sus modelos», en el ORDEN POR ARRASTRE de la
 * lista de categorías técnicas, el mismo de todo el sitio (tanda 24, Juan Pablo y
 * dirección, 2026-11-25; antes iban en el orden en que se eligieron en el tipo).
 * Una que ya no existe (o sin nombre) no sale. `todas` son las categorías técnicas,
 * ya en su orden (`getCategoriasParaMarca`).
 */
export function categoriasDelTipo(
  tipo: Pick<TiposEquipo, "categoriasModelo">,
  todas: CategoriasTecnica[],
): CategoriasTecnica[] {
  const ids = new Set((tipo.categoriasModelo ?? []).map((c) => (typeof c === "number" ? c : c.id)));
  return todas.filter((c) => ids.has(c.id) && texto(c.nombre));
}

type Nombres = {
  marca: Pick<Marca, "nombre">;
  tipo: Pick<TiposEquipo, "nombre">;
  modelo: Pick<ModelosRepuesto, "nombre" | "codigo">;
};

/** El modelo en la plantilla 4086: su código («EX120-2») o, sin él, su nombre. */
const modeloCorto = (m: Nombres["modelo"]) => texto(m.codigo) || texto(m.nombre);

/**
 * El `<h1>` de la página de modelo con la plantilla 4086 de Andrés (2026-10-26): «{MARCA}
 * {Tipo} {Modelo}», p. ej. «HITACHI Excavadora EX120-2». La marca en mayúsculas, como el
 * diseño; el tipo, tal como está guardado (regla del sitio). El título SEO no cambia.
 */
export function tituloModelo4086({ marca, tipo, modelo }: Nombres): string {
  return [texto(marca.nombre).toLocaleUpperCase("es"), texto(tipo.nombre), modeloCorto(modelo)]
    .filter(Boolean)
    .join(" ");
}

/** «{tipo} {marca} {modelo}», tal como están guardados: «Excavadora Hitachi EX120-2». */
export function equipoModelo4086({ marca, tipo, modelo }: Nombres): string {
  return [texto(tipo.nombre), texto(marca.nombre), modeloCorto(modelo)].filter(Boolean).join(" ");
}

/**
 * El título de las categorías, en DOS líneas (Juan Pablo, 2026-10-26; el salto lo respeta el
 * revelado por palabras): «Repuestos disponibles para» y «{tipo} {marca} {modelo}».
 */
export function tituloDisponibles4086(nombres: Nombres): string {
  return `Repuestos disponibles para\n${equipoModelo4086(nombres)}`;
}

/** La referencia de «Cotizar» y del mensaje de WhatsApp: «Repuestos para Excavadora Hitachi EX120-2». */
export function referenciaModelo4086(nombres: Nombres): string {
  return `Repuestos para ${equipoModelo4086(nombres)}`;
}
