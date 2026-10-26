import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  CategoriasTecnica,
  CategoriasUsada,
  EquiposUsado,
  Media,
  Pagina,
} from "@/payload-types";

import {
  categoriasDePortada,
  fichaCompleta,
  filtrosDeUsados,
  logosDeLaBanda,
  tarjetasDeUnidades,
  USADOS_POR_FILTRO,
} from "./kitCliente";

const media = (id: number, alt = ""): Media =>
  ({ id, url: `/m/${id}.webp`, alt, width: 800, height: 600 }) as Media;

const cat = (slug: string): CategoriasUsada =>
  ({ id: slug.length, slug, nombre: slug }) as CategoriasUsada;

const unidad = (
  id: number,
  categoria: CategoriasUsada | number,
  over: Partial<EquiposUsado> = {},
) => ({ id, nombre: `Equipo ${id}`, categoria, disponible: true, ...over }) as EquiposUsado;

describe("kit de la portada: ficha de la tarjeta de usados", () => {
  it("siempre tres filas, con coma decimal y separador de miles", () => {
    assert.deepEqual(
      fichaCompleta({ pesoOperativo: 8.4, anio: 2016, horometro: 4500 }).map(
        (d) => `${d.etiqueta}: ${d.valor}`,
      ),
      ["Peso operativo: 8,4 t", "Año: 2016", "Horómetro: 4.500 h"],
    );
  });

  it("un guion donde falta el dato (o no tiene sentido): las filas no se descuadran", () => {
    assert.deepEqual(
      fichaCompleta({ pesoOperativo: 0, anio: null, horometro: -3 }).map((d) => d.valor),
      ["—", "—", "—"],
    );
  });
});

describe("kit de la portada: tarjetas y filtro de usados", () => {
  const exc = cat("excavadoras");
  const bull = cat("bulldozers");
  const adit = cat("aditamentos");

  it("tarjetas en el orden recibido, con la página de su categoría, y como mucho las del filtro", () => {
    const r = tarjetasDeUnidades([
      unidad(1, bull, { nombre: "Bulldozer Caterpillar D6", slug: "bulldozer-caterpillar-d6" }),
      ...Array.from({ length: 12 }, (_, i) => unidad(i + 2, exc)),
    ]);
    assert.equal(r.length, USADOS_POR_FILTRO);
    assert.deepEqual(
      [r[0]?.nombre, r[0]?.href, r[1]?.href],
      [
        "Bulldozer Caterpillar D6",
        "/maquinaria-pesada/maquinaria-pesada-usada/bulldozers/bulldozer-caterpillar-d6/",
        null,
      ],
    );
  });

  it("descarta las no disponibles, sin nombre o sin la categoría poblada", () => {
    const r = tarjetasDeUnidades([
      unidad(1, exc, { disponible: false }),
      unidad(2, 9),
      unidad(3, exc, { nombre: "  " }),
      unidad(4, exc),
    ]);
    assert.deepEqual(
      r.map((t) => t.id),
      [4],
    );
  });

  it("siempre los tres filtros, en orden, con su página, nombre del panel e imagen decorativa", () => {
    const seccion = {
      pestanaExcavadoras: "Excavadora",
      pestanaOtros: "",
      pestanaAditamentos: "Aditamento",
      imagenOtros: media(7, "Bulldozer"),
    } as Pagina["seccionUsada"];
    const r = filtrosDeUsados(
      { excavadoras: [unidad(1, exc)], otros: [], aditamentos: [unidad(2, adit)] },
      seccion,
    );
    assert.deepEqual(
      r.map((f) => [f.nombre, f.href, f.tarjetas.length, f.imagen?.alt ?? null]),
      [
        ["Excavadora", "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/", 1, null],
        ["Otros", "/maquinaria-pesada/maquinaria-pesada-usada/otros/", 0, ""],
        ["Aditamento", "/maquinaria-pesada/maquinaria-pesada-usada/aditamentos/", 1, null],
      ],
    );
  });
});

describe("kit de la portada: categorías de repuestos", () => {
  const c = (over: Partial<CategoriasTecnica>) =>
    ({
      id: 1,
      nombre: "Tren de Rodaje",
      slug: "tren-de-rodaje",
      ordenPortada: 1,
      ...over,
    }) as CategoriasTecnica;

  it("solo las de la portada, por su posición; título de portada; foto de portada o, si no, la de la tarjeta", () => {
    const r = categoriasDePortada([
      c({ id: 1, nombre: "Filtración", slug: "filtracion", ordenPortada: 2, imagen: media(1) }),
      c({
        id: 2,
        ordenPortada: 1,
        tituloPortada: "Tren",
        imagen: media(2),
        imagenPortada: media(3),
      }),
      c({ id: 3, nombre: "Sin portada", slug: "x", ordenPortada: null }),
    ]);
    assert.deepEqual(
      r.map((x) => [x.nombre, x.imagen?.url, x.imagen?.alt]),
      [
        ["Tren", "/m/3.webp", ""],
        ["Filtración", "/m/1.webp", ""],
      ],
    );
  });

  it("«Ver todos»: el enlace de la tarjeta del panel o la página de la categoría", () => {
    const r = categoriasDePortada([
      c({ id: 1, enlace: "/lubricantes/" }),
      c({ id: 2, nombre: "Filtración", slug: "filtracion", ordenPortada: 2 }),
    ]);
    assert.equal(r[0]?.href, "/lubricantes/");
    assert.match(r[1]?.href ?? "", /\/categoria-repuestos-para-maquinaria-pesada\/filtracion\/?$/);
  });
});

describe("kit de la portada: logos de la banda", () => {
  const sitio = new Map([
    ["hitachi", { url: "/sitio-hitachi.png", width: 10, height: 5, oscuro: true }],
  ]);

  it("regla común: el logo de la marca del sitio con ese nombre; si no la hay, el de la lista; sin ninguno, no sale", () => {
    const seccion = {
      logos: [
        { id: "a", nombre: "Hitachi", logo: media(5) },
        { id: "b", nombre: "Eni", logo: media(6) },
        { id: "c", nombre: "Sin logo", logo: null },
        { id: "d", nombre: "  ", logo: media(7) },
      ],
    } as unknown as Pagina["seccionLogos"];
    const r = logosDeLaBanda(seccion, sitio);
    assert.deepEqual(
      r.map((l) => [l.id, l.logo.url, l.logo.alt, l.logo.oscuro]),
      [
        ["a", "/sitio-hitachi.png", "Hitachi", true],
        ["b", "/m/6.webp", "Eni", false],
      ],
    );
  });
});
