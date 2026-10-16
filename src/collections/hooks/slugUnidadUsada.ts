import type { CollectionBeforeValidateHook, TextFieldSingleValidation } from "payload";
import { text } from "payload/shared";

import {
  MENSAJE_SLUG_UNIDAD_RESERVADO,
  esSlugUnidadReservado,
  slugDeUnidad,
  slugLibre,
} from "../../lib/usados/urls";
import { formatSlug } from "../../lib/utils/formatSlug";

const idDe = (v: unknown): number | null => {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "id" in v && typeof (v as { id: unknown }).id === "number") {
    return (v as { id: number }).id;
  }
  return null;
};

/** Los slugs que ya usa OTRA unidad de la categoría (la propia no cuenta). */
async function slugsOcupados(
  req: Parameters<CollectionBeforeValidateHook>[0]["req"],
  categoria: number,
  propia: number | string | undefined,
): Promise<Set<string>> {
  const { docs } = await req.payload.find({
    collection: "equipos-usados",
    where: {
      categoria: { equals: categoria },
      ...(propia !== undefined ? { id: { not_equals: propia } } : {}),
    },
    depth: 0,
    limit: 0,
    pagination: false,
    select: { slug: true },
    req,
  });
  return new Set(docs.flatMap((d) => (d.slug ? [d.slug] : [])));
}

/**
 * DIRECCIÓN WEB de una unidad usada (2026-10-16). Sin slug, sale del nombre
 * compuesto y, si choca con otra unidad de la categoría, lleva un contador.
 * El importador de WordPress manda su propio slug (con el id de WordPress si
 * dos chocan); con un slug escrito solo se normaliza: la unicidad la valida
 * `validarSlugUnidadUsada`.
 */
export const slugUnidadUsada: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data;
  // Editando, un slug ya guardado no se regenera aunque la petición no lo traiga.
  if (typeof originalDoc?.slug === "string" && originalDoc.slug) {
    return typeof data.slug === "string" ? { ...data, slug: formatSlug(data.slug) } : data;
  }

  const escrito = typeof data.slug === "string" ? formatSlug(data.slug) : "";
  const nombre = typeof data.nombre === "string" ? data.nombre : "";
  const base = slugDeUnidad(nombre);
  const categoria = idDe(data.categoria ?? originalDoc?.categoria);
  // El gancho del propio campo ya rellena el slug desde el nombre ANTES de este:
  // un slug igual al que saldría del nombre es el automático y puede chocar.
  // Uno distinto lo puso una persona o el importador: se respeta y lo valida el campo.
  const esAutomatico = !escrito || escrito === base;
  if (!esAutomatico) return { ...data, slug: escrito };
  if (!base || categoria === null) return data;
  const ocupados = await slugsOcupados(req, categoria, originalDoc?.id);
  return { ...data, slug: slugLibre(base, ocupados) };
};

/** Obligatorio, no reservado y único dentro de la categoría (el índice de la base lo respalda). */
export const validarSlugUnidadUsada: TextFieldSingleValidation = async (valor, args) => {
  const base = text(valor, args);
  if (base !== true) return base;
  if (typeof valor !== "string" || !valor.trim()) return "Falta la dirección web de la unidad.";
  if (esSlugUnidadReservado(valor)) return MENSAJE_SLUG_UNIDAD_RESERVADO;

  const datos = args.siblingData as { categoria?: unknown } | undefined;
  const categoria = idDe(datos?.categoria);
  if (categoria === null) return true;
  const ocupados = await slugsOcupados(args.req, categoria, args.id);
  return ocupados.has(valor)
    ? "Otra unidad de esta categoría ya usa esa dirección web. Elige otra."
    : true;
};
