import { ValidationError } from "payload";
import type { CollectionAfterChangeHook, CollectionBeforeValidateHook } from "payload";

import { comprobarPadre } from "../../lib/repuestos/anidado";
import { idDeRelacion } from "./marcaDelTipo";

/**
 * «Cuelga de» de un tipo de repuestos (docs/repuestos-importacion.md §11).
 *
 * `beforeValidate`: comprueba el padre (`comprobarPadre`) y pone `slugPadre`,
 * el slug del padre desnormalizado, que es lo que compone la URL. Lo pone
 * SIEMPRE el servidor: sin padre, vacío.
 */
export const slugPadreDelTipo: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) return data;
  const idPadre = idDeRelacion(
    "tipoPadre" in data ? data.tipoPadre : (originalDoc as { tipoPadre?: unknown })?.tipoPadre,
  );
  if (!idPadre) return { ...data, slugPadre: null };

  const padre = await req.payload.findByID({
    collection: "tipos-equipo",
    id: idPadre,
    depth: 0,
    disableErrors: true,
    req,
  });
  if (!padre) {
    throw new ValidationError({
      errors: [{ path: "tipoPadre", message: "El tipo del que cuelga ya no existe." }],
    });
  }

  const idTipo = originalDoc?.id ? Number(originalDoc.id) : null;
  const slugTipo = String(data.slug ?? originalDoc?.slug ?? "");
  const marcaTipo = idDeRelacion(data.marca ?? originalDoc?.marca);
  const [modelos, hijos] = await Promise.all([
    req.payload.find({
      collection: "modelos-repuesto",
      where: { tipo: { equals: padre.id } },
      depth: 0,
      limit: 0,
      select: { slug: true },
      req,
    }),
    idTipo === null
      ? Promise.resolve({ totalDocs: 0 })
      : req.payload.count({
          collection: "tipos-equipo",
          where: { tipoPadre: { equals: idTipo } },
          req,
        }),
  ]);

  const error = comprobarPadre({
    idTipo,
    slugTipo,
    marcaTipo: marcaTipo === null ? null : Number(marcaTipo),
    padre,
    marcaPadre: Number(idDeRelacion(padre.marca)),
    slugsDeModelosDelPadre: modelos.docs.map((m) => m.slug),
    tieneHijos: hijos.totalDocs > 0,
  });
  if (error) throw new ValidationError({ errors: [{ path: "tipoPadre", message: error }] });
  return { ...data, slugPadre: padre.slug };
};

/**
 * `afterChange`: si cambia el slug de un tipo PADRE, sus hijos llevan su
 * `slugPadre` al día (su propio guardado revalida y deja el 301 de la URL vieja).
 */
export const slugPadreDeLosHijos: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (!previousDoc?.slug || previousDoc.slug === doc.slug) return doc;
  try {
    const { docs: hijos } = await req.payload.find({
      collection: "tipos-equipo",
      where: { tipoPadre: { equals: doc.id } },
      depth: 0,
      limit: 0,
      req,
    });
    for (const hijo of hijos) {
      await req.payload.update({
        collection: "tipos-equipo",
        id: hijo.id,
        data: { slugPadre: doc.slug },
        req,
      });
    }
  } catch (error) {
    console.error(
      `[tipos-equipo] no se pudo actualizar la URL de los tipos que cuelgan de ${doc.slug}:`,
      error,
    );
  }
  return doc;
};
