import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { entradaListaOrdenable, LISTAS_ORDENABLES } from "./entradaOrdenable";

const B = "https://partequipos.vercel.app";
const destino = (ruta: string) => entradaListaOrdenable(new URL(B + ruta))?.toString() ?? null;

describe("las listas ordenables se abren por su arrastre", () => {
  it("son las 10 ordenables por lista", () => {
    assert.deepEqual([...LISTAS_ORDENABLES].sort(), [
      "categorias-maquinaria",
      "categorias-tecnicas",
      "categorias-usada",
      "marcas",
      "marcas-lubricante",
      "marcas-maquinaria",
      "marcas-usada",
      "preguntas-frecuentes",
      "sedes",
      "testimonios",
    ]);
  });

  it("al entrar sin `sort`, a la misma lista con `sort=_order`, conservando lo demás", () => {
    assert.equal(
      destino("/admin/collections/categorias-usada/"),
      `${B}/admin/collections/categorias-usada/?sort=_order`,
    );
    assert.equal(
      destino("/admin/collections/categorias-usada?page=2&limit=50"),
      `${B}/admin/collections/categorias-usada?page=2&limit=50&sort=_order`,
    );
  });

  it("con `sort` (el usuario eligió otra columna), se respeta", () => {
    assert.equal(destino("/admin/collections/categorias-usada/?sort=nombre"), null);
    assert.equal(destino("/admin/collections/categorias-usada/?sort=-_order"), null);
  });

  it("no toca nada más: fichas, otras colecciones ni el resto del panel", () => {
    assert.equal(destino("/admin/collections/categorias-usada/12"), null);
    assert.equal(destino("/admin/collections/categorias-usada/create"), null);
    assert.equal(destino("/admin/collections/equipos-usados/"), null);
    assert.equal(destino("/admin/collections/tipos-equipo/"), null);
    assert.equal(destino("/admin/"), null);
    assert.equal(destino("/maquinaria-pesada/"), null);
  });

  it("el proxy lo aplica a las listas del panel y deja el resto del panel fuera", () => {
    const proxy = readFileSync(new URL("../../proxy.ts", import.meta.url), "utf8");
    assert.match(proxy, /entradaListaOrdenable\(/);
    assert.match(proxy, /"\/admin\/collections\/:slug"/);
  });
});
