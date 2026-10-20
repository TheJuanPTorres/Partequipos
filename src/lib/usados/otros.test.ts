import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { UnidadDelIndice } from "./indice";
import { ETIQUETA_OTROS, separarCategorias, tarjetaOtros, vaEnOtros } from "./otros";

const cat = (id: number, nombre: string, enOtros?: boolean | null, orden?: number | null) => ({
  id,
  nombre,
  slug: nombre.toLowerCase(),
  enOtros,
  orden,
});

const CATEGORIAS = [
  cat(1, "Aditamentos", false, 2),
  cat(2, "Bulldozer"),
  cat(3, "Cargadores", true),
  cat(4, "Excavadoras", false, 1),
  cat(5, "Motoniveladoras", null),
];

const unidad = (categoria: number, fechaPublicacion: string, url?: string): UnidadDelIndice => ({
  categoria,
  marcaUsada: null,
  fechaPublicacion,
  foto: url ? { url, alt: "", width: 800, height: 600, focalX: null, focalY: null } : null,
});

describe("usados: primer nivel y «Otros»", () => {
  it("vacía (filas antiguas) cuenta como «Agrupar en Otros»", () => {
    assert.equal(vaEnOtros({ enOtros: null }), true);
    assert.equal(vaEnOtros({}), true);
    assert.equal(vaEnOtros({ enOtros: false }), false);
  });

  it("primer nivel por su orden; las agrupadas en el orden recibido", () => {
    const { primerNivel, agrupadas } = separarCategorias(CATEGORIAS);
    assert.deepEqual(
      primerNivel.map((c) => c.nombre),
      ["Excavadoras", "Aditamentos"],
    );
    assert.deepEqual(
      agrupadas.map((c) => c.nombre),
      ["Bulldozer", "Cargadores", "Motoniveladoras"],
    );
  });

  it("sin orden, las de primer nivel van detrás y por nombre", () => {
    const { primerNivel } = separarCategorias([
      cat(1, "Zeta", false),
      cat(2, "Alfa", false),
      cat(3, "Media", false, 5),
    ]);
    assert.deepEqual(
      primerNivel.map((c) => c.nombre),
      ["Media", "Alfa", "Zeta"],
    );
  });

  it("la tarjeta «Otros» suma las unidades de las agrupadas y toma la foto más reciente", () => {
    const { agrupadas } = separarCategorias(CATEGORIAS);
    const t = tarjetaOtros(
      agrupadas,
      [
        unidad(2, "2026-01-01", "https://x/vieja.jpg"),
        unidad(3, "2026-05-01", "https://x/nueva.jpg"),
        unidad(4, "2026-09-01", "https://x/excavadora.jpg"),
      ],
      null,
      "/maquinaria-pesada/maquinaria-pesada-usada/otros/",
    );
    assert.ok(t);
    assert.equal(t.titulo, ETIQUETA_OTROS);
    assert.equal(t.href, "/maquinaria-pesada/maquinaria-pesada-usada/otros/");
    assert.equal(t.detalle, "2 unidades disponibles");
    assert.equal(t.imagen?.url, "https://x/nueva.jpg");
  });

  it("sin unidades en las agrupadas, «Sin unidades por ahora»; sin agrupadas, ninguna tarjeta", () => {
    const { agrupadas } = separarCategorias(CATEGORIAS);
    assert.equal(
      tarjetaOtros(agrupadas, [unidad(4, "2026-09-01")], null, "/o/")?.detalle,
      "Sin unidades por ahora",
    );
    assert.equal(tarjetaOtros([], [], null, "/o/"), null);
  });
});
