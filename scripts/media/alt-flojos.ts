/**
 * Recuento de imágenes con el texto alternativo flojo, en SOLO LECTURA
 * (mejora 2 de la auditoría del panel; regla en `src/lib/media/altFlojo.ts`).
 *
 *   npm run media:alt-flojos
 *
 * Lee `id`, `alt` y `filename` de `media` en la base de `DATABASE_URI` y no
 * escribe nada. Imprime el recuento, el motivo de cada una y el total.
 */
import { getPayload, type Payload } from "payload";

import { motivoAltFlojo } from "../../src/lib/media/altFlojo";

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";

const { default: config } = await import("../../src/payload.config");
const payload: Payload = await getPayload({ config });

const { docs } = await payload.find({
  collection: "media",
  depth: 0,
  pagination: false,
  select: { alt: true, filename: true },
  sort: "id",
});

let flojas = 0;
for (const d of docs) {
  const motivo = motivoAltFlojo(d.alt, d.filename);
  if (!motivo) continue;
  flojas++;
  process.stdout.write(
    `  #${d.id} ${d.filename ?? "(sin fichero)"} — «${d.alt ?? ""}»: ${motivo}\n`,
  );
}
process.stdout.write(
  `\n[alt] ${flojas} de ${docs.length} imágenes con el texto alternativo flojo.\n`,
);
