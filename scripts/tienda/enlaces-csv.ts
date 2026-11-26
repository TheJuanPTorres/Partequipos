/**
 * ENLACES DE LA TIENDA POR CSV (2026-11-26): carga masiva de «Enlace en la tienda» en modelos de
 * repuestos, categorías técnicas, tipos de repuesto (grupos) y productos, para cuando la tienda
 * tenga sus páginas.
 *
 *   npm run preview:ejecutar -- payload run scripts/tienda/enlaces-csv.ts <modo> <archivo> [origen del preview]
 *
 * Modos:
 * - `volcar <hoja.csv>`: escribe la hoja con TODOS los elementos y su enlace actual (vacío si no
 *   tienen). Solo lee. Es la que se le da al cliente: rellena la columna `enlace` y devuelve el
 *   fichero. Se abre bien en Excel (separador `;` y BOM).
 * - `simular <hoja.csv>`: compara la hoja con lo guardado y dice qué cambiaría, qué filas están mal
 *   y qué claves ya no existen. No escribe nada.
 * - `aplicar <hoja.csv>`: lo mismo y, si no hay nada mal, lo escribe. Antes guarda en el
 *   MANIFIESTO (variable `MANIFIESTO`, un .json) lo que había. CONSERVA ese fichero: sin él no se
 *   puede deshacer. Es repetible (la segunda pasada no cambia nada).
 * - `revertir <manifiesto.json>`: devuelve cada enlace a lo que había. Si alguien lo cambió después,
 *   esa fila no se toca y se avisa.
 *
 * REGLAS de la hoja (`src/lib/tienda/hojaEnlaces.ts`, con pruebas): solo `https://`; una fila o clave
 * mala DETIENE todo (no se escribe nada); `enlace` vacío = no se toca; `-` = quitar el enlace; lo que
 * no está en la hoja no se toca.
 *
 * Con el origen de un preview (`https://partequipos-….vercel.app`), tras escribir llama a
 * `POST /api/revalidar/` (variable `REVALIDACION_TOKEN`). El secreto de derivación va solo con
 * `fetchAlPreview` (§10.40).
 *
 * SOLO EN EL PREVIEW: se niega fuera de `preview:ejecutar` o si la base no es la del preview
 * (`veredictoEntornoPreview`). El modo para el sitio publicado lo añade quien ejecuta el runbook, con
 * el destino declarado, como en los demás scripts de datos.
 */
import { readFileSync, writeFileSync } from "node:fs";

import {
  aplanar,
  claveCategoria,
  claveModelo,
  leerCsv,
  mapaActual,
  partirClave,
  planear,
  serializarCsv,
  type Cambio,
  type CategoriaEnHoja,
  type ModeloEnHoja,
} from "../../src/lib/tienda/hojaEnlaces";
import { fetchAlPreview } from "../../src/lib/preview/derivacion.mjs";
import { veredictoEntornoPreview } from "../../src/lib/preview/entornoPreview";
import { CABECERA_REVALIDACION } from "../../src/lib/seguridad/tokenRevalidacion";

const MODOS = ["volcar", "simular", "aplicar", "revertir"] as const;
type Modo = (typeof MODOS)[number];
const [modo, archivo, origen] = process.argv.slice(2) as [
  Modo | undefined,
  string | undefined,
  string | undefined,
];
if (!modo || !MODOS.includes(modo) || !archivo) {
  throw new Error(`Uso: ${MODOS.join(" | ")} <archivo> [origen del preview]`);
}
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

async function leerEstado() {
  const [modelos, categorias] = await Promise.all([
    payload.find({ collection: "modelos-repuesto", depth: 0, limit: 0, pagination: false }),
    payload.find({ collection: "categorias-tecnicas", depth: 0, limit: 0, pagination: false }),
  ]);
  return {
    modelos: modelos.docs as unknown as ModeloEnHoja[],
    categorias: categorias.docs as unknown as CategoriaEnHoja[],
  };
}

/** Escribe `valores` (clave → enlace, vacío = quitar) y devuelve cuántos documentos tocó. */
async function escribir(valores: ReadonlyMap<string, string>): Promise<number> {
  const nuevo = (clave: string) => valores.get(clave) || null;
  let tocados = 0;
  const { modelos, categorias } = await leerEstado();

  for (const m of modelos) {
    if (!valores.has(claveModelo(m.id))) continue;
    await payload.update({
      collection: "modelos-repuesto",
      id: m.id,
      data: { enlaceTienda: nuevo(claveModelo(m.id)) },
      depth: 0,
    });
    tocados++;
  }

  for (const c of categorias) {
    const grupos = (c.grupos ?? []).map((g) => ({
      ...g,
      ...(g.id && valores.has(`grupo:${c.id}/${g.id}`)
        ? { enlaceTienda: nuevo(`grupo:${c.id}/${g.id}`) }
        : {}),
      productos: (g.productos ?? []).map((p) =>
        g.id && p.id && valores.has(`producto:${c.id}/${g.id}/${p.id}`)
          ? { ...p, enlaceTienda: nuevo(`producto:${c.id}/${g.id}/${p.id}`) }
          : p,
      ),
    }));
    const propia = valores.has(claveCategoria(c.id));
    const cambioGrupos = JSON.stringify(grupos) !== JSON.stringify(c.grupos ?? []);
    if (!propia && !cambioGrupos) continue;
    await payload.update({
      collection: "categorias-tecnicas",
      id: c.id,
      data: {
        ...(propia ? { enlaceTienda: nuevo(claveCategoria(c.id)) } : {}),
        ...(cambioGrupos ? { grupos } : {}),
      } as never,
      depth: 0,
    });
    tocados++;
  }
  return tocados;
}

async function revalidar() {
  if (!origen) {
    console.log(
      "Sin origen de preview: no se revalida (los ganchos del panel ya revalidan lo suyo).",
    );
    return;
  }
  const token = process.env.REVALIDACION_TOKEN ?? "";
  if (!token) throw new Error("Falta REVALIDACION_TOKEN del preview: no se revalida.");
  const r = await fetchAlPreview(
    `${origen.replace(/\/$/, "")}/api/revalidar/`,
    origen,
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
    { method: "POST", headers: { [CABECERA_REVALIDACION]: token } },
  );
  console.log(`POST /api/revalidar/: HTTP ${r.status}`);
  if (r.status !== 200) throw new Error("La revalidación no respondió 200.");
}

function informe(p: ReturnType<typeof planear>, muestra = 15) {
  console.log(
    `cambios: ${p.cambios.length} · sin cambio: ${p.sinCambio} · vacías (no se tocan): ${p.vacias} · inválidas: ${p.invalidas.length} · claves que no existen: ${p.noEncontradas.length}`,
  );
  for (const c of p.cambios.slice(0, muestra)) {
    console.log(`  ${c.clave}: «${c.antes || "(vacío)"}» → «${c.despues || "(quitar)"}»`);
  }
  if (p.cambios.length > muestra) console.log(`  … y ${p.cambios.length - muestra} más`);
  for (const i of p.invalidas) console.log(`  ✗ ${i.clave}: «${i.enlace}» ${i.motivo}`);
  for (const k of p.noEncontradas) console.log(`  ✗ ${k}: ya no existe`);
}

if (modo === "volcar") {
  const { modelos, categorias } = await leerEstado();
  const filas = aplanar(modelos, categorias);
  writeFileSync(archivo, serializarCsv(filas), "utf8");
  console.log(
    `hoja escrita: ${filas.length} filas (${filas.filter((f) => f.enlace).length} con enlace).`,
  );
} else if (modo === "revertir") {
  const manifiesto = JSON.parse(readFileSync(archivo, "utf8")) as { cambios: Cambio[] };
  const { modelos, categorias } = await leerEstado();
  const actual = mapaActual(aplanar(modelos, categorias));
  const valores = new Map<string, string>();
  for (const c of manifiesto.cambios) {
    if (!partirClave(c.clave)) throw new Error(`Clave no válida en el manifiesto: ${c.clave}`);
    if ((actual.get(c.clave) ?? "") !== c.despues) {
      console.log(`  ! ${c.clave}: lo cambiaron después, no se toca.`);
      continue;
    }
    valores.set(c.clave, c.antes);
  }
  const tocados = await escribir(valores);
  console.log(`revertido: ${valores.size} enlaces en ${tocados} documentos.`);
  await revalidar();
} else {
  const lectura = leerCsv(readFileSync(archivo, "utf8"));
  for (const e of lectura.errores) console.log(`  ✗ ${e}`);
  const { modelos, categorias } = await leerEstado();
  const plan = planear(lectura.filas, mapaActual(aplanar(modelos, categorias)), lectura.errores);
  informe(plan);
  if (modo === "aplicar") {
    if (plan.bloqueado) throw new Error("Algo de la hoja está mal: no se escribe NADA.");
    const ruta = process.env.MANIFIESTO;
    if (!ruta) throw new Error("Falta MANIFIESTO (ruta de un .json): sin él no se puede deshacer.");
    writeFileSync(
      ruta,
      JSON.stringify({ fecha: new Date().toISOString(), cambios: plan.cambios }, null, 2),
    );
    const tocados = await escribir(new Map(plan.cambios.map((c) => [c.clave, c.despues])));
    console.log(
      `escrito: ${plan.cambios.length} enlaces en ${tocados} documentos. Manifiesto: ${ruta}`,
    );
    await revalidar();
  }
}
