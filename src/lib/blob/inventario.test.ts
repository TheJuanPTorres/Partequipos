import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ALMACEN_PREVIEW, ALMACEN_PRODUCCION } from "./almacen";
import { veredictoInventario } from "./inventario";

const url = (almacen: string, f = "a.png") =>
  `https://${almacen}.public.blob.vercel-storage.com/${f}`;

describe("inventario del Blob: la URL guardada tiene que ser del almacén esperado", () => {
  it("todos en el almacén esperado: válido", () => {
    const filas = [
      { id: 1, coleccion: "media", url: url(ALMACEN_PRODUCCION) },
      { id: 2, coleccion: "videos", url: url(ALMACEN_PRODUCCION, "v.mp4") },
    ];
    assert.deepEqual(veredictoInventario(filas, ALMACEN_PRODUCCION), { valido: true });
  });

  it("FALLA si el entorno espera otro almacén (respaldo de producción sin declararlo)", () => {
    const v = veredictoInventario(
      [{ id: 1, coleccion: "media", url: url(ALMACEN_PRODUCCION) }],
      ALMACEN_PREVIEW,
    );
    assert.equal(v.valido, false);
    assert.match(v.valido ? "" : v.motivo, new RegExp(ALMACEN_PRODUCCION));
  });

  it("FALLA con un solo registro de otro almacén entre muchos, y dice cuál", () => {
    const v = veredictoInventario(
      [
        { id: 1, coleccion: "media", url: url(ALMACEN_PREVIEW) },
        { id: 2, coleccion: "media", url: url(ALMACEN_PRODUCCION) },
      ],
      ALMACEN_PREVIEW,
    );
    assert.equal(v.valido, false);
    assert.deepEqual(v.valido ? [] : v.fuera, [
      { id: 2, coleccion: "media", almacen: ALMACEN_PRODUCCION },
    ]);
  });

  it("FALLA con un registro sin URL del Blob (ruta interna o vacía)", () => {
    for (const u of [null, "/api/media/file/a.png"]) {
      assert.equal(
        veredictoInventario([{ id: 1, coleccion: "media", url: u }], ALMACEN_PREVIEW).valido,
        false,
      );
    }
  });

  it("sin registros: válido (nada que inventariar)", () => {
    assert.deepEqual(veredictoInventario([], ALMACEN_PREVIEW), { valido: true });
  });
});
