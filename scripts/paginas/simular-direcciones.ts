/**
 * SIMULACIÓN DE LA VALIDACIÓN DE «DIRECCIÓN WEB» SOBRE LAS PÁGINAS QUE YA EXISTEN (tanda 26,
 * tarea 6). Solo lee: aplica a cada página las tres reglas de `direccionDePaginaValida` (formato,
 * rutas propias y origen de una redirección) y la de `enlacesDeTextoSeguros`, y lista las que no
 * pasarían. No cambia nada: una que no pase se reporta, nunca se corrige aquí.
 *
 *   npm run preview:ejecutar -- payload run scripts/paginas/simular-direcciones.ts
 *
 * SOLO EN EL PREVIEW (se niega fuera de `preview:ejecutar` o con otra base).
 */
import { veredictoEntornoPreview } from "../../src/lib/preview/entornoPreview";
import {
  errorDeFormato,
  errorDeRedireccion,
  errorDeReservada,
} from "../../src/lib/paginas/direccion";
import { normalizarRuta } from "../../src/lib/redirects/normalizar";
import { errorDeEnlaces } from "../../src/lib/paginas/enlacesTexto";

if (process.env.ENTORNO_PREVIEW !== "1") {
  throw new Error("Solo con npm run preview:ejecutar (entorno del preview).");
}
const v = veredictoEntornoPreview({
  DATABASE_URI: process.env.DATABASE_URI,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  VERCEL_AUTOMATION_BYPASS_SECRET: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
});
if (!v.valido) throw new Error(`No es el preview: ${v.motivo}`);

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const { default: config } = await import("../../src/payload.config");
const { getPayload } = await import("payload");
const payload = await getPayload({ config });

const paginas = await payload.find({
  collection: "paginas",
  depth: 0,
  limit: 0,
  pagination: false,
  overrideAccess: true,
});
const redirects = await payload.find({
  collection: "redirects",
  depth: 0,
  limit: 0,
  pagination: false,
  overrideAccess: true,
  select: { desde: true },
});
const origenes = new Set(redirects.docs.map((r) => r.desde));

let malas = 0;
for (const p of paginas.docs) {
  const error =
    errorDeFormato(p.slug, p.titulo) ??
    errorDeReservada(p.slug) ??
    errorDeRedireccion(p.slug, origenes.has(normalizarRuta(p.slug))) ??
    errorDeEnlaces(p);
  if (error) malas++;
  console.log(`${error ? "✗" : "✓"} ${p.slug}${error ? ` — ${error}` : ""}`);
}
console.log(
  `[simular-direcciones] ${paginas.totalDocs} páginas, ${redirects.totalDocs} redirecciones: ` +
    `${paginas.totalDocs - malas} pasan, ${malas} no pasarían. No se ha cambiado nada.`,
);
