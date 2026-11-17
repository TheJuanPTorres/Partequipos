import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { tarjetasDeCategorias } from "./plantillaTipo";

describe("recorte guardado de las fotos de pieza", () => {
  it("se encuentra por el nombre del fichero, sin el sufijo aleatorio del Blob", () => {
    const categoria = {
      id: 1,
      nombre: "Filtración",
      slug: "filtracion",
      imagen: {
        id: 9,
        url: "https://almacen-de-prueba.public.blob.vercel-storage.com/wp-real-cat-filtracion-AbCdEfGhIjKlMnOpQrStUvWxYz0123.png",
        width: 800,
        height: 800,
      },
    } as unknown as Parameters<typeof tarjetasDeCategorias>[0][number];
    const [tarjeta] = tarjetasDeCategorias([categoria]);
    const recorte = tarjeta?.pieza?.recorte;
    assert.ok(recorte);
    assert.ok(recorte.w < 1 && recorte.h < 1);
  });

  it("sin entrada para esa foto, no hay recorte (se mide al pintar)", () => {
    const categoria = {
      id: 2,
      nombre: "Otra",
      slug: "otra",
      imagen: {
        id: 10,
        url: "https://almacen-de-prueba.public.blob.vercel-storage.com/otra-foto-AbCdEfGhIjKlMnOpQrStUvWxYz0123.png",
        width: 800,
        height: 800,
      },
    } as unknown as Parameters<typeof tarjetasDeCategorias>[0][number];
    assert.equal(tarjetasDeCategorias([categoria])[0]?.pieza?.recorte, null);
  });
});
