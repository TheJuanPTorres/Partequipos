/**
 * Estado de «Miniexcavadoras dentro de Excavadoras», SOLO LECTURA: unidades
 * por categoría, «Mostrar en la web» de Miniexcavadoras y a dónde llevan los
 * 301. Sirve de comprobación previa y final del runbook
 * (`miniexcavadoras-a-excavadoras.ts`). Imprime cifras, nunca slugs.
 *
 *   npm run preview:ejecutar -- payload run scripts/usados/miniexcavadoras-estado.ts
 */
import { getPayload } from "payload";

import { normalizarRuta } from "../../src/lib/redirects/normalizar";
import { rutas } from "../../src/lib/routes";

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });
for (const op of ["create", "update", "delete"] as const) {
  (payload as unknown as Record<string, unknown>)[op] = () => {
    throw new Error(`solo lectura: «${op}» no está permitido`);
  };
}
const log = (m: string) => process.stdout.write(`[miniexcavadoras-estado] ${m}\n`);

const { docs: categorias } = await payload.find({
  collection: "categorias-usada",
  where: { slug: { in: ["miniexcavadoras", "excavadoras"] } },
  depth: 0,
  limit: 2,
  overrideAccess: true,
});
for (const c of categorias) {
  const { totalDocs } = await payload.count({
    collection: "equipos-usados",
    where: { categoria: { equals: c.id } },
    overrideAccess: true,
  });
  const { totalDocs: disponibles } = await payload.count({
    collection: "equipos-usados",
    where: { categoria: { equals: c.id }, disponible: { equals: true } },
    overrideAccess: true,
  });
  log(
    `${c.slug} (id ${c.id}): ${totalDocs} unidades, ${disponibles} disponibles · «Mostrar en la web» ${c.mostrarEnWeb !== false} · en «Otros» ${c.enOtros !== false}`,
  );
}

const { docs: redirects } = await payload.find({
  collection: "redirects",
  limit: 0,
  pagination: false,
  depth: 0,
  overrideAccess: true,
});
const mini = normalizarRuta(rutas.categoriaUsada("miniexcavadoras"));
const exc = normalizarRuta(rutas.categoriaUsada("excavadoras"));
const haciaMini = redirects.filter((r) => normalizarRuta(r.hacia).startsWith(`${mini}/`));
const desdeMini = redirects.filter((r) => normalizarRuta(r.desde).startsWith(`${mini}/`));
const categoria = redirects.find((r) => normalizarRuta(r.desde) === mini);
const deWordPress = redirects.filter(
  (r) => r.origen === "migracion" && normalizarRuta(r.hacia).startsWith(`${exc}/`),
);
log(`301 que llevan a una ficha de Miniexcavadoras: ${haciaMini.length}`);
log(`301 desde una ficha de Miniexcavadoras: ${desdeMini.length}`);
log(`301 de la categoría: ${categoria ? `→ ${normalizarRuta(categoria.hacia)}` : "no existe"}`);
log(`301 de WordPress (migración) que llevan a una ficha de Excavadoras: ${deWordPress.length}`);
process.exit(0);
