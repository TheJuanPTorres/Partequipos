/**
 * Verificación POR EFECTO de lo que el panel debe impedir en la ficha de
 * producto V2 (docs/diseno/decisiones-ficha.md), contra `development` o el
 * preview (CLAUDE.md §10.15: se intenta guardar y se lee la base después).
 *
 * 1. `documentos` rechaza un fichero que no es PDF aunque se llame .pdf, y
 *    acepta un PDF (que se borra al terminar).
 * 2. La ficha técnica de un equipo nuevo no se guarda con 5 filas destacadas
 *    y sí con 4; el equipo queda como estaba.
 *
 *   npm run qa:ficha                                  (development)
 *   npm run preview:ejecutar -- npm run qa:ficha      (preview)
 */
import { getPayload, type Payload } from "payload";

import { HOST_PRODUCCION } from "../../src/lib/portada/heroPrueba";

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
// El endpoint sin «-pooler»: vale para la cadena directa y para la pooled.
const ENDPOINT_PRODUCCION = HOST_PRODUCCION.split(".")[0]!.replace(/-pooler$/, "");
if ((process.env.DATABASE_URI ?? "").includes(ENDPOINT_PRODUCCION)) {
  throw new Error("[ficha] NO se ejecuta contra producción.");
}

const { default: config } = await import("../../src/payload.config");
const payload: Payload = await getPayload({ config });

let fallos = 0;
function comprobar(nombre: string, ok: boolean, detalle = ""): void {
  if (!ok) fallos++;
  process.stdout.write(`${ok ? "✓" : "✗"} ${nombre}${detalle ? ` — ${detalle}` : ""}\n`);
}

function mensaje(e: unknown): string {
  const datos = (e as { data?: { errors?: { message?: string }[] } } | null)?.data;
  return datos?.errors?.[0]?.message ?? (e as Error | null)?.message ?? "";
}

async function intentar(f: () => Promise<unknown>): Promise<unknown> {
  try {
    await f();
    return null;
  } catch (e) {
    return e;
  }
}

const contarDocumentos = async () =>
  (await payload.count({ collection: "documentos", overrideAccess: true })).totalDocs;

// ---------- 1. Documentos: solo PDF ----------
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<<>>\nendobj\nxref\n0 1\ntrailer\n<<>>\nstartxref\n9\n%%EOF\n",
  "latin1",
);
const PDF_CORTADO = PDF.subarray(0, 30);
const antes = await contarDocumentos();

const errPng = await intentar(() =>
  payload.create({
    collection: "documentos",
    data: { titulo: "QA ficha — PNG disfrazado" },
    file: { data: PNG, mimetype: "application/pdf", name: "qa-falso.pdf", size: PNG.length },
    overrideAccess: true,
  }),
);
comprobar(
  "documentos rechaza un PNG llamado .pdf",
  errPng !== null && /no es un PDF/.test(mensaje(errPng)) && (await contarDocumentos()) === antes,
  errPng ? mensaje(errPng) : "SE GUARDÓ",
);

const errCortado = await intentar(() =>
  payload.create({
    collection: "documentos",
    data: { titulo: "QA ficha — PDF cortado" },
    file: {
      data: PDF_CORTADO,
      mimetype: "application/pdf",
      name: "qa-cortado.pdf",
      size: PDF_CORTADO.length,
    },
    overrideAccess: true,
  }),
);
comprobar(
  "documentos rechaza un PDF cortado, en español",
  errCortado !== null &&
    /dañado o incompleto/.test(mensaje(errCortado)) &&
    (await contarDocumentos()) === antes,
  errCortado ? mensaje(errCortado) : "SE GUARDÓ",
);

let creado: number | null = null;
const errPdf = await intentar(async () => {
  const d = await payload.create({
    collection: "documentos",
    data: { titulo: "QA ficha — PDF válido" },
    file: { data: PDF, mimetype: "application/pdf", name: "qa-ficha.pdf", size: PDF.length },
    overrideAccess: true,
  });
  creado = d.id;
});
comprobar("documentos acepta un PDF", errPdf === null && creado !== null, mensaje(errPdf));
if (creado !== null) {
  await payload.delete({ collection: "documentos", id: creado, overrideAccess: true });
}
comprobar("documentos queda como estaba", (await contarDocumentos()) === antes);

// ---------- 2. Ficha técnica: máximo 4 destacadas ----------
const { docs } = await payload.find({
  collection: "equipos-nuevos",
  limit: 1,
  depth: 0,
  sort: "id",
  overrideAccess: true,
});
const equipo = docs[0];
if (!equipo) throw new Error("[ficha] No hay ningún equipo nuevo en esta base.");
const original = equipo.fichaTecnica ?? [];
const huella = (f: unknown) => JSON.stringify(f ?? []);
/** Las filas sin su `id` (Payload pone otros al volver a guardarlas). */
const sinId = (f: { id?: string | null }[]) =>
  f.map((fila) => {
    const copia: Record<string, unknown> = { ...fila };
    delete copia.id;
    return copia;
  });
process.stdout.write(`Equipo #${equipo.id} (${equipo.slug}), ${original.length} filas\n`);

const filas = (n: number) =>
  Array.from({ length: 5 }, (_, i) => ({
    etiqueta: `QA dato ${i + 1}`,
    valor: `${i + 1} kg`,
    destacar: i < n,
    icono: "peso" as const,
  }));

const errCinco = await intentar(() =>
  payload.update({
    collection: "equipos-nuevos",
    id: equipo.id,
    data: { fichaTecnica: filas(5) },
    overrideAccess: true,
  }),
);
const trasCinco = await payload.findByID({
  collection: "equipos-nuevos",
  id: equipo.id,
  depth: 0,
  overrideAccess: true,
});
comprobar(
  "rechaza 5 filas destacadas",
  errCinco !== null &&
    /Solo caben 4/.test(mensaje(errCinco)) &&
    huella(trasCinco.fichaTecnica) === huella(original),
  errCinco ? mensaje(errCinco) : "SE GUARDÓ",
);

const errCuatro = await intentar(() =>
  payload.update({
    collection: "equipos-nuevos",
    id: equipo.id,
    data: { fichaTecnica: filas(4) },
    overrideAccess: true,
  }),
);
const trasCuatro = await payload.findByID({
  collection: "equipos-nuevos",
  id: equipo.id,
  depth: 0,
  overrideAccess: true,
});
comprobar(
  "acepta 4 filas destacadas y guarda el icono",
  errCuatro === null &&
    (trasCuatro.fichaTecnica ?? []).filter((f) => f.destacar).length === 4 &&
    trasCuatro.fichaTecnica?.[0]?.icono === "peso",
  mensaje(errCuatro),
);

await payload.update({
  collection: "equipos-nuevos",
  id: equipo.id,
  data: { fichaTecnica: original },
  overrideAccess: true,
});
const final = await payload.findByID({
  collection: "equipos-nuevos",
  id: equipo.id,
  depth: 0,
  overrideAccess: true,
});
comprobar(
  "el equipo queda como estaba",
  huella(sinId(final.fichaTecnica ?? [])) === huella(sinId(original)),
);

if (fallos > 0) {
  const e = new Error(`[ficha] ✗ ${fallos} comprobaciones fallaron`);
  e.stack = e.message;
  throw e;
}
process.stdout.write("✓ todo en orden\n");
