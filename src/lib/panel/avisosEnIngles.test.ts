import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import { AVISOS_EN_INGLES, traducirAviso } from "./avisosEnIngles";

/** Todo el JavaScript de `@payloadcms/ui/dist` y `@payloadcms/next/dist`, en un solo texto. */
function codigoDePayload(): string {
  const trozos: string[] = [];
  const recorrer = (dir: string) => {
    for (const nombre of readdirSync(dir)) {
      const ruta = join(dir, nombre);
      if (statSync(ruta).isDirectory()) recorrer(ruta);
      else if (nombre.endsWith(".js")) trozos.push(readFileSync(ruta, "utf8"));
    }
  };
  for (const paquete of ["ui", "next"]) {
    recorrer(join(process.cwd(), "node_modules", "@payloadcms", paquete, "dist"));
  }
  return trozos.join("\n");
}

describe("avisos de Payload en inglés", () => {
  it("cada texto sigue en el código de Payload (si no, la traducción ya no se aplica)", () => {
    const codigo = codigoDePayload();
    for (const ingles of Object.keys(AVISOS_EN_INGLES)) {
      const literal = JSON.stringify(ingles).slice(1, -1);
      assert.ok(
        codigo.includes(ingles) || codigo.includes(literal) || codigo.includes(`'${ingles}'`),
        `ya no está en Payload: «${ingles}»`,
      );
    }
  });

  it("traduce los conocidos y deja pasar el resto", () => {
    assert.equal(
      traducirAviso('To reorder the rows you must first sort them by the "Order" column'),
      "Para cambiar el orden arrastrando, ordena antes la lista por la columna «Orden».",
    );
    assert.equal(traducirAviso("Guardado"), "Guardado");
    const nodo = { tipo: "react" };
    assert.equal(traducirAviso(nodo), nodo);
  });
});
