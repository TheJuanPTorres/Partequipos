import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

/*
 * GUARDARRAÍL de `POST /api/revalidar/` (2026-10-18): la ruta con la que los
 * runbooks vacían la caché tras una importación por script. Si deja de cubrir
 * una etiqueta o las páginas, una importación volvería a dejar datos viejos o
 * un 404 en caché sin ningún error.
 */
const RAIZ = path.resolve(import.meta.dirname, "..", "..");
const leer = (f: string) => fs.readFileSync(path.join(RAIZ, f), "utf8");

describe("ruta de revalidación", () => {
  const ruta = leer("src/app/(site)/api/revalidar/route.ts");
  it("solo responde a POST y exige el token antes de revalidar", () => {
    const metodos = [...ruta.matchAll(/export (?:async )?function (\w+)/g)].map((m) => m[1]);
    assert.deepEqual(metodos, ["POST"]);
    assert.ok(
      ruta.indexOf("tokenDeRevalidacionValido") < ruta.indexOf("revalidarCachesDelSitio("),
      "el token se comprueba antes de revalidar",
    );
    assert.match(ruta, /status: 403/);
  });
  it("revalida TODAS las etiquetas de la caché de datos y todas las páginas", () => {
    const rev = leer("src/lib/revalidation.ts");
    const cuerpo = rev.slice(rev.indexOf("export function revalidarCachesDelSitio"));
    assert.match(cuerpo, /Object\.values\(ETIQUETAS_DATOS\)/);
    assert.match(cuerpo, /revalidatePath\("\/", "layout"\)/);
    assert.match(cuerpo, /expire: 0/);
  });
});
