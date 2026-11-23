/**
 * PRUEBA DE LA VISTA PREVIA DEL BORRADOR (PR 8b), SOLO EN EL PREVIEW.
 *
 *   npm run preview:ejecutar -- npx payload run scripts/paginas/prueba-borrador.ts contar|crear|retirar [slug]
 *
 * - `contar`: páginas por estado y si hay borrador de prueba.
 * - `crear`: guarda un BORRADOR de la página (por defecto `tratamiento-de-datos`) con la marca
 *   «PRUEBA BORRADOR 8B» en el título. Solo escribe en la tabla de versiones: lo publicado no cambia.
 * - `retirar`: borra las versiones con la marca. Lo publicado sigue igual.
 */
export {};

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";

const MARCA = "PRUEBA BORRADOR 8B";
const modo = process.argv.find((a) => ["contar", "crear", "retirar"].includes(a));
const slug =
  process.argv.find((a, i) => i > process.argv.indexOf(modo ?? "") && /^[a-z0-9/-]+$/.test(a)) ??
  "tratamiento-de-datos";

const { puedeTocarHeroDePrueba } = await import("../../src/lib/portada/heroPrueba");
const { getPayload } = await import("payload");
const config = (await import("@payload-config")).default;

if (!puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN).permitido)
  throw new Error("Solo contra el preview.");

const payload = await getPayload({ config });

async function contar() {
  const todas = await payload.find({
    collection: "paginas",
    limit: 0,
    depth: 0,
    select: { slug: true, _status: true },
  });
  const pub = todas.docs.filter((d) => d._status === "published").length;
  console.log(`páginas: ${todas.totalDocs}, publicadas: ${pub}`);
  const p = todas.docs.find((d) => d.slug === slug);
  console.log(`«${slug}»: id ${p?.id ?? "—"}, estado ${p?._status ?? "—"}`);
  const v = await payload.findVersions({
    collection: "paginas",
    where: { "version.titulo": { like: MARCA } },
    limit: 0,
    depth: 0,
  });
  console.log(`versiones con la marca: ${v.totalDocs}`);
}

if (modo === "crear") {
  const p = (
    await payload.find({
      collection: "paginas",
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
    })
  ).docs[0];
  if (!p) throw new Error(`no existe «${slug}»`);
  await payload.update({
    collection: "paginas",
    id: p.id,
    draft: true,
    data: { titulo: `${MARCA} ${p.titulo}` },
  });
  const publicada = await payload.findByID({ collection: "paginas", id: p.id, depth: 0 });
  const borrador = await payload.findByID({
    collection: "paginas",
    id: p.id,
    depth: 0,
    draft: true,
  });
  console.log(`publicado: «${publicada.titulo}» · borrador: «${borrador.titulo}»`);
  await contar();
} else if (modo === "retirar") {
  await payload.db.deleteVersions({
    collection: "paginas",
    where: { "version.titulo": { like: MARCA } },
  });
  await contar();
} else if (modo === "contar") {
  await contar();
} else {
  throw new Error("modo: contar | crear | retirar");
}
