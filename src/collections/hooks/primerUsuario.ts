import type { CollectionBeforeChangeHook } from "payload";

/**
 * El PRIMER usuario de una base vacía se crea como administrador.
 *
 * POR QUÉ EXISTE. El campo `rol` tiene `defaultValue: "editor"` y la migración
 * que lo añadió lo hizo con `DEFAULT 'editor' NOT NULL`. Eso abre una trampa de
 * arranque: quien crea la primera cuenta desde `/admin` —cuando todavía no hay
 * ningún usuario y por tanto nadie puede asignar roles— quedaría como **editor**,
 * sin poder crear usuarios, ni borrar nada, ni tocar redirects. Y tampoco podría
 * ascenderse, porque `rol` solo lo escribe un administrador.
 *
 * Es decir: una base nueva quedaría sin ningún administrador y sin forma de
 * conseguir uno desde la interfaz. Pasó en producción al aplicar la migración.
 *
 * Va en `beforeChange` y no en el acceso del campo a propósito: ampliar el
 * acceso de `rol` para el caso «no hay usuario» dejaría un hueco por el que
 * colarlo en otras circunstancias. Aquí el valor lo pone el servidor, no la
 * petición, así que no depende de lo que mande el cliente.
 */
export const primerUsuarioEsAdministrador: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== "create") return data;

  const { totalDocs } = await req.payload.count({ collection: "users" });
  if (totalDocs > 0) return data;

  return { ...data, rol: "administrador" };
};
