/**
 * Verificación POR EFECTO de la validación del texto alternativo de `Media`
 * (`src/lib/media/altFlojo.ts`), contra `development` o el preview.
 *
 * Por qué así y no solo con las pruebas unitarias (CLAUDE.md §10.15): se
 * intenta guardar textos flojos en una imagen que ya existe y se lee la base
 * después. No sube ficheros ni crea registros: solo actualiza el `alt` de la
 * primera imagen, y el único guardado que se acepta deja el mismo texto que
 * tenía.
 *
 *   npm run qa:alt
 */
import { getPayload, type Payload } from "payload";

import { HOST_PRODUCCION } from "../../src/lib/portada/heroPrueba";

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";
// El endpoint sin «-pooler»: vale para la cadena directa y para la pooled.
const ENDPOINT_PRODUCCION = HOST_PRODUCCION.split(".")[0]!.replace(/-pooler$/, "");
if ((process.env.DATABASE_URI ?? "").includes(ENDPOINT_PRODUCCION)) {
  throw new Error("[alt] NO se ejecuta contra producción.");
}

const { default: config } = await import("../../src/payload.config");
const payload: Payload = await getPayload({ config });

let fallos = 0;
function comprobar(nombre: string, ok: boolean, detalle = ""): void {
  if (!ok) fallos++;
  process.stdout.write(`${ok ? "✓" : "✗"} ${nombre}${detalle ? ` — ${detalle}` : ""}\n`);
}

/** El mensaje del campo, que es el que ve el editor; el de arriba es genérico. */
function mensaje(e: unknown): string {
  const datos = (e as { data?: { errors?: { message?: string }[] } } | null)?.data;
  return datos?.errors?.[0]?.message ?? (e as Error | null)?.message ?? "";
}

const { docs } = await payload.find({ collection: "media", limit: 1, depth: 0, sort: "id" });
const imagen = docs[0];
if (!imagen) throw new Error("[alt] No hay ninguna imagen en esta base.");
const original = imagen.alt;
const fichero = imagen.filename ?? "";
process.stdout.write(`Imagen #${imagen.id} (${fichero}), texto actual: «${original}»\n`);

const flojos: [string, string, RegExp][] = [
  ["vacío", " ", /./],
  ["corto", "foto", /demasiado corto/],
  ["genérico", "Imagen 3", /palabra genérica/],
  ["el nombre del fichero", fichero.replace(/\.[a-z0-9]+$/i, ""), /nombre del fichero/],
];

for (const [nombre, alt, esperado] of flojos) {
  let error: unknown = null;
  try {
    await payload.update({ collection: "media", id: imagen.id, data: { alt } });
  } catch (e) {
    error = e;
  }
  const despues = await payload.findByID({ collection: "media", id: imagen.id, depth: 0 });
  comprobar(
    `rechaza el texto ${nombre} («${alt}»)`,
    error !== null && esperado.test(mensaje(error)) && despues.alt === original,
    error ? mensaje(error) : "SE GUARDÓ",
  );
}

// Un texto válido se acepta (el mismo que tenía: no cambia nada).
let error: unknown = null;
try {
  await payload.update({ collection: "media", id: imagen.id, data: { alt: original } });
} catch (e) {
  error = e;
}
comprobar("acepta un texto válido", error === null, error ? mensaje(error) : "");

const final = await payload.findByID({ collection: "media", id: imagen.id, depth: 0 });
comprobar("la imagen queda como estaba", final.alt === original);

if (fallos > 0) throw new Error(`[alt] ${fallos} comprobación(es) en rojo.`);
process.stdout.write("\n[alt] Todo en verde.\n");
