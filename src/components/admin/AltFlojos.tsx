import type { Payload } from "payload";

import { motivoAltFlojo } from "@/lib/media/altFlojo";

/** Cuántas se enumeran; el resto se cuenta. */
const MAX_LISTADAS = 12;

/**
 * Aviso encima de la lista de «Imágenes»: cuántas tienen el texto alternativo
 * flojo, cuáles y por qué (mejora 2 de la auditoría, `src/lib/media/altFlojo.ts`).
 *
 * Componente de servidor (`beforeListTable`, entre el buscador y la tabla):
 * Payload le pasa su instancia y la consulta solo LEE `id`, `alt` y
 * `filename`. Sin imágenes flojas no pinta nada.
 */
export default async function AltFlojos({ payload }: { payload: Payload }) {
  const { docs } = await payload.find({
    collection: "media",
    depth: 0,
    pagination: false,
    select: { alt: true, filename: true },
    sort: "-updatedAt",
  });

  const flojas = docs.flatMap((d) => {
    const motivo = motivoAltFlojo(d.alt, d.filename);
    return motivo ? [{ id: d.id, fichero: d.filename ?? `#${d.id}`, motivo }] : [];
  });
  if (flojas.length === 0) return null;

  const resto = flojas.length - MAX_LISTADAS;
  return (
    <div className="pq-alt-flojos" role="status">
      <p className="pq-alt-flojos__titulo">
        {flojas.length === 1
          ? "1 imagen tiene el texto alternativo flojo."
          : `${flojas.length} imágenes tienen el texto alternativo flojo.`}{" "}
        Ábrelas y describe lo que se ve: lo leen los lectores de pantalla y los buscadores.
      </p>
      <ul className="pq-alt-flojos__lista">
        {flojas.slice(0, MAX_LISTADAS).map((f) => (
          <li key={f.id}>
            <a href={`/admin/collections/media/${f.id}`}>{f.fichero}</a> — {f.motivo}
          </li>
        ))}
      </ul>
      {resto > 0 ? <p className="pq-alt-flojos__resto">Y {resto} más.</p> : null}
    </div>
  );
}
