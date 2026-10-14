import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

/**
 * GUARDARRAÍL (2026-10-14): un `select` o `populate` de un fichero (Media,
 * documentos…) que pide `url` sin `filename` devuelve `url: null`, porque
 * Payload 3.89 calcula la URL con el nombre del fichero. Sin error: las
 * tarjetas simplemente se quedan sin foto. Pasó en el listado de usados (24
 * tarjetas, 0 fotos en el preview) y en el de nueva.
 *
 * Busca cada `url: true` en `src/` y exige `filename: true` en el MISMO
 * objeto literal.
 */

/** El objeto literal `{…}` más pequeño que contiene la posición `i`. */
export function objetoQueContiene(texto: string, i: number): string {
  let inicio = i;
  let nivel = 0;
  for (; inicio >= 0; inicio--) {
    const c = texto[inicio];
    if (c === "}") nivel++;
    else if (c === "{") {
      if (nivel === 0) break;
      nivel--;
    }
  }
  let fin = i;
  nivel = 0;
  for (; fin < texto.length; fin++) {
    const c = texto[fin];
    if (c === "{") nivel++;
    else if (c === "}") {
      if (nivel === 0) break;
      nivel--;
    }
  }
  return texto.slice(Math.max(inicio, 0), fin + 1);
}

/** Los `url: true` de un texto cuyo objeto no pide también `filename`. */
export function urlSinFilename(texto: string): string[] {
  const malos: string[] = [];
  for (const m of texto.matchAll(/\burl:\s*true\b/g)) {
    const objeto = objetoQueContiene(texto, m.index ?? 0);
    if (!/\bfilename:\s*true\b/.test(objeto)) malos.push(objeto.replace(/\s+/g, " ").slice(0, 120));
  }
  return malos;
}

function ficheros(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) return ficheros(ruta);
    return /\.(ts|tsx)$/.test(e.name) && !/\.test\.ts$/.test(e.name) ? [ruta] : [];
  });
}

describe("select/populate de ficheros con filename", () => {
  it("ningún `url: true` de src/ sin `filename: true` en el mismo objeto", () => {
    const fallos = ficheros(path.join(process.cwd(), "src")).flatMap((f) =>
      urlSinFilename(fs.readFileSync(f, "utf8")).map(
        (o) => `${path.relative(process.cwd(), f)}: ${o}`,
      ),
    );
    assert.deepEqual(fallos, []);
  });

  it("comprobación del propio guardián: detecta el caso malo y deja pasar el bueno", () => {
    assert.equal(urlSinFilename("select: { url: true, alt: true }").length, 1);
    assert.equal(urlSinFilename("populate: { media: { url: true, width: true } }").length, 1);
    assert.equal(urlSinFilename("select: { url: true, filename: true, alt: true }").length, 0);
    assert.equal(
      urlSinFilename("select: {\n  url: true,\n  filename: true,\n  focalX: true,\n}").length,
      0,
    );
  });
});
