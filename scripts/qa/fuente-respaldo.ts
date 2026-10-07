/**
 * Tras `next build`: el CSS generado tiene que declarar la fuente de respaldo
 * de Inter con el nombre que usa la cabecera del artículo («Inter Fallback»).
 * Si Next la renombra, el build falla aquí en vez de devolver en silencio el
 * desplazamiento de la cabecera (ver `src/lib/blog/fuenteRespaldo.ts`).
 *
 * Lanza un error (y sale con 1) si no la encuentra.
 */
import fs from "node:fs";
import path from "node:path";

import { FUENTE_RESPALDO, declaraFuenteRespaldo } from "../../src/lib/blog/fuenteRespaldo";

function cssDe(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) return cssDe(ruta);
    return e.name.endsWith(".css") ? [ruta] : [];
  });
}

const ficheros = cssDe(path.join(process.cwd(), ".next", "static"));
if (!ficheros.length) {
  throw new Error("[fuente-respaldo] No hay CSS en .next/static: ¿se ejecutó `next build` antes?");
}
const con = ficheros.filter((f) => declaraFuenteRespaldo(fs.readFileSync(f, "utf8")));
if (!con.length) {
  throw new Error(
    `[fuente-respaldo] Ningún CSS del build (${ficheros.length} ficheros) declara la fuente «${FUENTE_RESPALDO}». ` +
      "next/font la ha renombrado: actualiza FUENTE_RESPALDO y cabeceraArticulo.module.css, " +
      "o la cabecera del artículo volverá a desplazarse al llegar Inter.",
  );
}
console.info(
  `[fuente-respaldo] «${FUENTE_RESPALDO}» declarada en ${con.length} de ${ficheros.length} CSS del build.`,
);
