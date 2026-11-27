/**
 * PRUEBA DE UNA PÁGINA NUEVA DE SOLO TEXTO (tanda 26, tarea 6), SOLO EN EL PREVIEW.
 *
 *   npm run preview:ejecutar -- payload run scripts/paginas/prueba-pagina-libre.ts crear|retirar
 *
 * - `crear`: primero intenta guardar cuatro páginas que tienen que RECHAZARSE (dirección con
 *   mayúsculas y espacios, dirección de una sección propia, dirección que ya es origen de una
 *   redirección y un enlace `javascript:` en el texto) y comprueba que no se guardó ninguna. Después
 *   crea «prueba-pagina-libre» (publicada) con título, entradilla y un texto con h2–h4, lista,
 *   cita, enlace e imagen con texto alternativo; comprueba que tiene 1 versión, la vuelve a guardar
 *   con un cambio y comprueba que tiene 2. Por último, que un BORRADOR con una imagen pegada sin
 *   fichero también se rechaza.
 * - `retirar`: borra «prueba-pagina-libre» (y sus versiones) y comprueba que no queda nada.
 */
import { errorDeFormato, errorDeReservada } from "../../src/lib/paginas/direccion";
import { veredictoEntornoPreview } from "../../src/lib/preview/entornoPreview";

const SLUG = "prueba-pagina-libre";
const modo = process.argv.find((a) => a === "crear" || a === "retirar");
if (!modo) throw new Error("Uso: crear | retirar");
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

const texto = (t: string, format = 0) => ({
  type: "text",
  text: t,
  format,
  detail: 0,
  mode: "normal",
  style: "",
  version: 1,
});
const nodo = (type: string, children: unknown[], extra: Record<string, unknown> = {}) => ({
  type,
  children,
  direction: "ltr",
  format: "",
  indent: 0,
  version: 1,
  ...extra,
});
const enlace = (url: string, t: string) => ({
  ...nodo("link", [texto(t)]),
  version: 3,
  fields: { linkType: "custom", url, newTab: false },
});
const raiz = (children: unknown[]) => ({ root: nodo("root", children) });

async function contenido(conEnlace: string) {
  const { docs: fotos } = await payload.find({
    collection: "media",
    where: { alt: { exists: true } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const foto = fotos[0];
  return raiz([
    nodo(
      "paragraph",
      [texto("Párrafo de prueba con "), enlace(conEnlace, "un enlace"), texto(".")],
      {
        textFormat: 0,
      },
    ),
    nodo("heading", [texto("Título de nivel 2")], { tag: "h2" }),
    nodo("paragraph", [texto("Texto bajo el título, con "), texto("negrita", 1), texto(".")]),
    nodo("heading", [texto("Título de nivel 3")], { tag: "h3" }),
    nodo(
      "list",
      [
        nodo("listitem", [texto("Primer punto de la lista")], { value: 1 }),
        nodo("listitem", [texto("Segundo punto de la lista")], { value: 2 }),
      ],
      { listType: "bullet", tag: "ul", start: 1 },
    ),
    nodo("heading", [texto("Título de nivel 4")], { tag: "h4" }),
    nodo("quote", [texto("Una cita destacada del texto de prueba.")]),
    ...(foto
      ? [
          {
            type: "upload",
            relationTo: "media",
            value: foto.id,
            fields: null,
            format: "",
            version: 3,
          },
        ]
      : []),
    nodo("paragraph", [texto("Último párrafo de la página de prueba.")]),
  ]);
}

const contarVersiones = async (id: number) =>
  (
    await payload.findVersions({
      collection: "paginas",
      where: { parent: { equals: id } },
      limit: 0,
      overrideAccess: true,
    })
  ).totalDocs;

if (modo === "crear") {
  // Una redirección cuyo origen pasaría las otras dos reglas: así se prueba la de verdad.
  const { docs: redirs } = await payload.find({
    collection: "redirects",
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  const origen =
    redirs
      .map((r) => r.desde.replace(/^\//, ""))
      .find((d) => errorDeFormato(d) === null && errorDeReservada(d) === null) ??
    "no-hay-redireccion-valida";
  const rechazos: [string, Record<string, unknown>][] = [
    ["formato", { titulo: "Prueba Libre", slug: "Prueba Libre" }],
    ["reservada", { titulo: "Prueba", slug: "maquinaria-pesada/prueba-pagina-libre" }],
    ["origen de redirección", { titulo: "Prueba", slug: origen }],
    [
      "enlace javascript:",
      { titulo: "Prueba", slug: `${SLUG}-js`, contenido: await contenido("javascript:alert(1)") },
    ],
  ];
  for (const [que, data] of rechazos) {
    try {
      await payload.create({ collection: "paginas", data: data as never, overrideAccess: true });
      throw new Error(`✗ ${que}: se guardó y tenía que rechazarse`);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (m.startsWith("✗")) throw e;
      const detalle =
        (e as { data?: { errors?: { message?: string }[] } }).data?.errors?.[0]?.message ?? m;
      console.log(`✓ rechazada (${que}): ${detalle}`);
    }
  }
  const sobrantes = await payload.count({
    collection: "paginas",
    where: { slug: { in: rechazos.map(([, d]) => String(d.slug)) } },
    overrideAccess: true,
  });
  console.log(`  páginas de prueba guardadas por error: ${sobrantes.totalDocs} (esperado 0)`);

  const creada = await payload.create({
    collection: "paginas",
    overrideAccess: true,
    data: {
      titulo: "Página de prueba libre",
      slug: SLUG,
      entradilla: "Entradilla de la página de prueba: un párrafo corto bajo el título.",
      contenido: (await contenido("/contactanos/")) as never,
      _status: "published",
    },
  });
  console.log(
    `✓ creada «${SLUG}» (id ${creada.id}), versiones: ${await contarVersiones(creada.id)} (esperado 1)`,
  );
  await payload.update({
    collection: "paginas",
    id: creada.id,
    overrideAccess: true,
    data: {
      entradilla: "Entradilla cambiada en la segunda pasada de la prueba.",
      _status: "published",
    },
  });
  console.log(`✓ guardada otra vez, versiones: ${await contarVersiones(creada.id)} (esperado 2)`);
  // Un BORRADOR también se valida: imagen pegada sin fichero, como la deja Word.
  const pegado = {
    root: {
      ...(await contenido("/contactanos/")).root,
      children: [
        ...(await contenido("/contactanos/")).root.children,
        {
          type: "upload",
          format: "",
          version: 3,
          pending: { src: "file:///C:/x/clip.png", formID: "a" },
        },
      ],
    },
  };
  const antes = await contarVersiones(creada.id);
  try {
    await payload.update({
      collection: "paginas",
      id: creada.id,
      draft: true,
      overrideAccess: true,
      data: { contenido: pegado as never },
    });
    throw new Error("✗ borrador con imagen vacía se guardó y tenía que rechazarse");
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    if (m.startsWith("✗")) throw e;
    const detalle =
      (e as { data?: { errors?: { message?: string }[] } }).data?.errors?.[0]?.message ?? m;
    console.log(`✓ rechazado (borrador con imagen pegada sin fichero): ${detalle}`);
  }
  console.log(
    `  versiones tras el rechazo: ${await contarVersiones(creada.id)} (esperado ${antes})`,
  );
} else {
  const { docs } = await payload.find({
    collection: "paginas",
    where: { slug: { equals: SLUG } },
    depth: 0,
    overrideAccess: true,
  });
  for (const d of docs) {
    await payload.delete({ collection: "paginas", id: d.id, overrideAccess: true });
  }
  const queda = await payload.count({
    collection: "paginas",
    where: { slug: { equals: SLUG } },
    overrideAccess: true,
  });
  const versiones = docs.length ? await contarVersiones(docs[0]!.id) : 0;
  console.log(
    `✓ retirada: borradas ${docs.length}; quedan ${queda.totalDocs} páginas y ${versiones} versiones (esperado 0 y 0)`,
  );
}
