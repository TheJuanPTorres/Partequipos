/**
 * Busca los números de serie de la maquinaria usada en TODA la base (2026-10-17,
 * decisión de dirección). SOLO LEE e imprime RECUENTOS: tabla, columna y id de
 * la fila, nunca el valor ni el serial.
 *
 *   npm run preview:usados:seriales-buscar
 *   npx tsx scripts/usados/buscar-seriales.ts produccion "fuente=<usados JSON>"  (runbook)
 *
 * Recorre cada fila de cada tabla del esquema `public` (textos alternativos,
 * nombres, descripciones, ficheros, SEO, redirects…) y cuenta tres cosas:
 *
 * - **seriales:** un serial de la exportación como palabra suelta (`patronSerial`);
 * - **menciones:** «serial», «SN», «S/N»… con un código (`mencionaSerial`);
 * - **pegados:** el serial dentro de otra palabra (`contieneSerial`). Puede ser
 *   una coincidencia (un sufijo aleatorio de un fichero): se revisa a mano.
 *
 * Usa `pg` directo, sin cargar Payload: no puede tocar el esquema. Mismas
 * guardas de destino que los demás scripts de usados.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Client } from "pg";

import { veredictoDestino } from "../../src/lib/demo/copiaDemo";
import { puedeTocarHeroDePrueba } from "../../src/lib/portada/heroPrueba";
import { contieneSerial, mencionaSerial, patronSerial } from "../../src/lib/usados/wordpress";

const args = process.argv.slice(2);
const destino = args.find((a) => a === "preview" || a === "produccion" || a === "prueba");
const valorDe = (k: string) => args.find((a) => a.startsWith(`${k}=`))?.slice(k.length + 1);
const fallar = (m: string): never => {
  const e = new Error(`[seriales] ✗ ${m}`);
  e.stack = e.message;
  throw e;
};
if (!destino) fallar("indica el destino: preview, produccion o prueba");
if (destino === "preview") {
  const v = puedeTocarHeroDePrueba(process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.permitido) fallar(`NO se hace nada: ${v.motivo}`);
} else {
  const v = veredictoDestino(destino, process.env.DATABASE_URI, process.env.BLOB_READ_WRITE_TOKEN);
  if (!v.valido) fallar(`destino no válido, no se hace nada: ${v.motivo}`);
}

const FUENTE =
  valorDe("fuente") ??
  path.join(os.homedir(), "Desktop", "partequipos-cierre", "usados-wordpress.json");
if (!fs.existsSync(FUENTE)) fallar(`no está la fuente ${FUENTE}`);
const { unidades } = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as {
  unidades: { serial?: string }[];
};
const seriales = [...new Set(unidades.map((u) => (u.serial ?? "").trim()).filter(Boolean))];
if (seriales.length < 100)
  fallar(`la fuente solo trae ${seriales.length} seriales (se esperaban ~126)`);
const patrones = seriales.map((s) => patronSerial(s, "i")).filter((p): p is RegExp => p !== null);

/** Columnas que no son contenido: contraseñas y sesiones. */
const IGNORADAS = new Set(["hash", "salt", "reset_password_token", "sessions"]);

const cliente = new Client({
  connectionString: process.env.DATABASE_URI,
  connectionTimeoutMillis: 20000,
});
await cliente.connect();
const log = (m: string) => process.stdout.write(`[seriales] ${m}\n`);
log(`destino: ${destino} · seriales de la exportación: ${seriales.length}`);

const tablas = (
  await cliente.query<{ t: string }>(
    "SELECT table_name AS t FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY 1",
  )
).rows.map((r) => r.t);

/*
 * La URL ANTIGUA de un 301 (`redirects.desde`) es la de WordPress, y 86 de las
 * 128 de usados llevaban el serial: tiene que estar tal cual para que el 301
 * funcione. Ninguna página la pinta (el sitio responde con el destino) y el
 * mapa de `/api/redirects-map/` solo lleva su resumen con clave (2026-10-17);
 * hoy sigue publicada en el WordPress. Se cuenta aparte.
 */
const esRutaAntigua = (t: string, col: string) => t === "redirects" && col === "desde";

const total = { filas: 0, seriales: 0, menciones: 0, pegados: 0, rutasAntiguas: 0 };
const hallazgos: string[] = [];
for (const t of tablas) {
  const filas = (
    await cliente.query<{ r: Record<string, unknown> }>(`SELECT to_jsonb(x) AS r FROM "${t}" x`)
  ).rows;
  total.filas += filas.length;
  for (const { r } of filas) {
    for (const [col, valor] of Object.entries(r)) {
      if (
        valor === null ||
        IGNORADAS.has(col) ||
        typeof valor === "number" ||
        typeof valor === "boolean"
      )
        continue;
      const texto = typeof valor === "string" ? valor : JSON.stringify(valor);
      const s = patrones.some((p) => p.test(texto));
      const m = mencionaSerial(texto);
      // Sin el sufijo aleatorio de 30 caracteres que el Blob añade a cada fichero:
      // ahí un serial corto aparece por azar (la imagen 796 de producción, 2026-10-17).
      const sinSufijo = texto.replace(/-[A-Za-z0-9]{30}(?=\.[A-Za-z0-9]{2,5}\b)/g, "");
      const g = !s && seriales.some((x) => contieneSerial(sinSufijo, x));
      if (!s && !m && !g) continue;
      if (esRutaAntigua(t, col)) {
        total.rutasAntiguas++;
        continue;
      }
      if (s) total.seriales++;
      if (m) total.menciones++;
      if (g) total.pegados++;
      const tipo = [s && "serial", m && "mención", g && "pegado"].filter(Boolean).join("+");
      hallazgos.push(`${t}.${col} id=${String(r.id ?? "?")} (${tipo})`);
    }
  }
}
await cliente.end();

log(`tablas: ${tablas.length} · filas: ${total.filas}`);
for (const h of hallazgos) log(`  ${h}`);
log(
  `RESULTADO: seriales ${total.seriales} · menciones ${total.menciones} · pegados (a revisar) ${total.pegados}`,
);
log(
  `aparte: ${total.rutasAntiguas} URL antiguas de WordPress en redirects.desde (las necesita el 301)`,
);
if (total.seriales + total.menciones > 0) fallar("quedan seriales en la base");
