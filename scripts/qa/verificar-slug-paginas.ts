/**
 * Verificación POR EFECTO del bloqueo de la ruta de las páginas
 * (`slugEditable` en `PaginaInstitucional`), contra `development` o el preview.
 *
 * Por qué así (CLAUDE.md §10.15): el acceso de CAMPO no da error, Payload
 * descarta el cambio en silencio y responde bien. Solo leyendo la base se sabe
 * si el bloqueo funciona. Se crea una página de prueba (prefijo
 * `zz-prueba-ruta-`), se intenta cambiar su ruta como editor sin y con el
 * permiso, y se borra al terminar junto con la redirección que crea el cambio.
 *
 *   npm run qa:slug-paginas
 */
import { getPayload, type Payload } from "payload";

import { HOST_PRODUCCION } from "../../src/lib/portada/heroPrueba";

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
const ENDPOINT_PRODUCCION = HOST_PRODUCCION.split(".")[0]!.replace(/-pooler$/, "");
if ((process.env.DATABASE_URI ?? "").includes(ENDPOINT_PRODUCCION)) {
  throw new Error("[slug-paginas] NO se ejecuta contra producción.");
}

const { default: config } = await import("../../src/payload.config");
const payload: Payload = await getPayload({ config });

const PREFIJO = "zz-prueba-ruta-";
const editor = { id: 999_101, rol: "editor", collection: "users", puedeEditarSlugs: false };
const conPermiso = { ...editor, id: 999_102, puedeEditarSlugs: true };

let fallos = 0;
function comprobar(nombre: string, ok: boolean, detalle = ""): void {
  if (!ok) fallos++;
  process.stdout.write(`${ok ? "✓" : "✗"} ${nombre}${detalle ? ` — ${detalle}` : ""}\n`);
}

const slug = `${PREFIJO}${Date.now()}`;
const nuevo = `${slug}-b`;
const leer = async (id: number) =>
  ((await payload.findByID({ collection: "paginas", id, depth: 0 })) as { slug: string }).slug;

// Crear como editor: al crear la ruta sí se escribe.
const pagina = (await payload.create({
  collection: "paginas",
  data: { titulo: slug, slug } as never,
  user: editor as never,
  overrideAccess: false,
})) as unknown as { id: number; slug: string };
comprobar("crear con ruta como editor", pagina.slug === slug, pagina.slug);

try {
  await payload.update({
    collection: "paginas",
    id: pagina.id,
    data: { slug: nuevo, titulo: `${slug} editado` } as never,
    user: editor as never,
    overrideAccess: false,
  });
  const tras1 = await leer(pagina.id);
  comprobar("editor sin permiso: la ruta NO cambia", tras1 === slug, tras1);

  await payload.update({
    collection: "paginas",
    id: pagina.id,
    data: { slug: nuevo } as never,
    user: conPermiso as never,
    overrideAccess: false,
  });
  const tras2 = await leer(pagina.id);
  comprobar("con el permiso: la ruta SÍ cambia", tras2 === nuevo, tras2);

  const { totalDocs } = await payload.count({
    collection: "redirects",
    where: { desde: { like: slug }, hacia: { like: nuevo } },
  });
  comprobar(
    "el cambio crea la redirección desde la ruta anterior",
    totalDocs === 1,
    `${totalDocs}`,
  );
} finally {
  await payload.delete({ collection: "paginas", id: pagina.id });
  await payload.delete({ collection: "redirects", where: { desde: { like: PREFIJO } } });
}

const restos =
  (await payload.count({ collection: "paginas", where: { slug: { like: PREFIJO } } })).totalDocs +
  (await payload.count({ collection: "redirects", where: { desde: { like: PREFIJO } } })).totalDocs;
comprobar("sin restos de la prueba", restos === 0, `${restos}`);

process.stdout.write(`\n${fallos === 0 ? "TODO EN VERDE" : `${fallos} FALLO(S)`}\n`);
// `payload run` sale siempre con 0 (CLAUDE.md §10.25): para fallar hay que lanzar.
if (fallos > 0) throw new Error(`[slug-paginas] ${fallos} comprobación(es) en rojo`);
