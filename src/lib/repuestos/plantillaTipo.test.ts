import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasTecnica, Marca, RepuestosMarca } from "@/payload-types";

import { tarjetasDeCategorias, vistaPorQue } from "./plantillaTipo";

const media = { id: 7, url: "/f.jpg", width: 800, height: 600, alt: "x" };
const categoria = (id: number, extra: Partial<CategoriasTecnica> = {}) =>
  ({ id, nombre: `Categoría ${id}`, slug: `categoria-${id}`, ...extra }) as CategoriasTecnica;

describe("tarjetasDeCategorias", () => {
  it("orden de la marca primero, luego por nombre; sin las que no tienen nombre o página", () => {
    const r = tarjetasDeCategorias([
      categoria(1, { nombre: "Zeta" }),
      categoria(2, { nombre: "Alfa" }),
      categoria(3, { nombre: "Beta", ordenMarca: 1 }),
      categoria(4, { slug: "" }),
      categoria(5, { nombre: " " }),
    ]);
    assert.deepEqual(
      r.map((t) => t.titulo),
      ["Beta", "Alfa", "Zeta"],
    );
  });

  it("enlaza a su página y lleva su foto, o nada", () => {
    const [con, sin] = tarjetasDeCategorias([
      categoria(1, { nombre: "A", imagen: media as never }),
      categoria(2, { nombre: "B" }),
    ]);
    assert.match(con!.href, /categoria-1\/$|categoria-1$/);
    assert.equal(con!.imagen?.url, "/f.jpg");
    assert.equal(sin!.imagen, null);
  });
});

describe("vistaPorQue", () => {
  const marca = { id: 1, nombre: "Kobelco", slug: "kobelco" } as Marca;
  const global = (extra: Partial<RepuestosMarca>) =>
    ({ id: 1, porQueImagen: media, ...extra }) as RepuestosMarca;

  it("sin título, la sección no se pinta", () => {
    assert.equal(vistaPorQue(global({ porQueTitulo: "  " }), marca), null);
    assert.equal(vistaPorQue(global({}), marca), null);
  });

  it("sustituye {marca} en el cierre y descarta los puntos incompletos", () => {
    const v = vistaPorQue(
      global({
        porQueTitulo: "¿Por qué elegirnos?",
        porQueCierre: "Confíe en nosotros: su maquinaria {marca} lo merece.",
        porQueBoton: "Solicita asesoría",
        porQuePuntos: [
          { id: "a", titulo: "Calidad", texto: "Alta" },
          { id: "b", titulo: "Sin texto", texto: " " },
          { id: "c", titulo: " ", texto: "Sin título" },
        ],
      }),
      marca,
    )!;
    assert.equal(v.cierre, "Confíe en nosotros: su maquinaria Kobelco lo merece.");
    assert.deepEqual(
      v.puntos.map((p) => p.titulo),
      ["Calidad"],
    );
    assert.equal(v.boton, "Solicita asesoría");
    assert.equal(v.imagen?.url, "/f.jpg");
  });

  it("sin foto, la sección no se pinta (hasta que el cliente mande una)", () => {
    assert.equal(
      vistaPorQue(global({ porQueTitulo: "¿Por qué elegirnos?", porQueImagen: null }), marca),
      null,
    );
  });
});
