import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { logosDeLaBandaDeRepuestos, type MarcaDeRepuestos } from "./kitCliente";
import {
  filasDeLaBanda,
  rellenoDeBanda,
  validarMarcasSinRepetir,
  type FilaBanda,
} from "./marcasBanda";

const logo = { url: "/m.webp", width: 400, height: 100, oscuro: false };
const todas: MarcaDeRepuestos[] = [
  { id: 3, nombre: "Bobcat", slug: "bobcat", logo },
  { id: 1, nombre: "Caterpillar", slug: "caterpillar", logo },
  { id: 7, nombre: "Hitachi", slug: "hitachi", logo },
  { id: 5, nombre: "Komatsu", slug: "komatsu", logo },
];
const marca = (id: number | { id: number }): FilaBanda => ({ blockType: "bandaMarca", marca: id });
const libre = (nombre: string, enlace?: string | null, id = nombre): FilaBanda => ({
  blockType: "bandaLogo",
  id,
  nombre,
  enlace,
  imagen: { id: 90, url: `/${nombre}.png`, width: 600, height: 160 },
});
const nombres = (l: { nombre: string }[]) => l.map((x) => x.nombre);

describe("logosDeLaBandaDeRepuestos", () => {
  it("sin filas, todas las marcas en el orden recibido (alfabético), como antes", () => {
    for (const filas of [[], null, undefined]) {
      assert.deepEqual(nombres(logosDeLaBandaDeRepuestos(todas, filas)), [
        "Bobcat",
        "Caterpillar",
        "Hitachi",
        "Komatsu",
      ]);
    }
  });

  it("con filas, solo esas y en el orden del panel, marcas y logos libres mezclados", () => {
    const r = logosDeLaBandaDeRepuestos(todas, [
      marca(5),
      libre("Donaldson"),
      marca({ id: 3 }),
      libre("Berco"),
    ]);
    assert.deepEqual(nombres(r), ["Komatsu", "Donaldson", "Bobcat", "Berco"]);
  });

  it("una marca enlaza a su página; un logo libre lleva su imagen tal cual y su nombre de alt", () => {
    const [k, d] = logosDeLaBandaDeRepuestos(todas, [marca(5), libre("Donaldson")]);
    assert.equal(
      k!.href,
      "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/komatsu/",
    );
    assert.deepEqual(d!.logo, {
      url: "/Donaldson.png",
      width: 600,
      height: 160,
      oscuro: false,
      alt: "Donaldson",
    });
    assert.equal(d!.href, undefined, "sin enlace, el logo no es un enlace");
    assert.equal(d!.externo, undefined);
  });

  it("enlace de un logo libre: ruta o dirección del sitio (misma pestaña), otro sitio (otra pestaña) o ninguno", () => {
    const r = logosDeLaBandaDeRepuestos(todas, [
      libre("Interno", "/lubricantes/", "a"),
      libre("Externo", "https://www.donaldson.com/es-mx/", "b"),
      libre("Propio", "https://partequipos.com/contactanos/", "c"),
      libre("Malo", "javascript:alert(1)", "d"),
      libre("Vacio", "   ", "e"),
    ]);
    assert.deepEqual(
      r.map((l) => [l.nombre, l.href ?? null, l.externo ?? false]),
      [
        ["Interno", "/lubricantes/", false],
        ["Externo", "https://www.donaldson.com/es-mx/", true],
        ["Propio", "https://partequipos.com/contactanos/", false],
        ["Malo", null, false],
        ["Vacio", null, false],
      ],
    );
  });

  it("una marca elegida sin logo o borrada, o un logo libre sin imagen o sin nombre, no dejan hueco", () => {
    const r = logosDeLaBandaDeRepuestos(todas, [
      marca(99),
      marca(1),
      marca(1),
      { blockType: "bandaLogo", nombre: "Sin imagen", imagen: 12 },
      { blockType: "bandaLogo", nombre: "  ", imagen: { url: "/x.png", width: 1, height: 1 } },
    ]);
    assert.deepEqual(nombres(r), ["Caterpillar"]);
  });

  it("filas elegidas que no se pueden pintar: banda vacía (la sección no sale), como en el #429", () => {
    assert.deepEqual(logosDeLaBandaDeRepuestos(todas, [marca(99)]), []);
  });
});

describe("filasDeLaBanda", () => {
  it("cada logo libre con su clave (el id de la fila) aunque repita imagen", () => {
    const f = filasDeLaBanda([libre("A", null, "x1"), libre("A", null, "x2")]);
    assert.deepEqual(
      f.map((x) => (x.tipo === "logo" ? x.clave : x.marca)),
      ["x1", "x2"],
    );
  });
});

describe("validarMarcasSinRepetir", () => {
  it("acepta filas sin marcas repetidas, logos libres repetidos, vacía o sin valor", () => {
    assert.equal(validarMarcasSinRepetir([marca(1), marca(2), libre("A"), libre("A")]), true);
    assert.equal(validarMarcasSinRepetir([]), true);
    assert.equal(validarMarcasSinRepetir(null), true);
  });

  it("rechaza la misma marca dos veces, también poblada", () => {
    assert.match(String(validarMarcasSinRepetir([marca(1), libre("A"), marca(1)])), /repetida/);
    assert.match(String(validarMarcasSinRepetir([marca({ id: 4 }), marca(4)])), /repetida/);
  });
});

describe("rellenoDeBanda", () => {
  it("repite la lista entera hasta el mínimo, en su orden", () => {
    assert.deepEqual(rellenoDeBanda(["a", "b"], 5), ["a", "b", "a", "b", "a", "b"]);
    assert.deepEqual(rellenoDeBanda(["a"], 3), ["a", "a", "a"]);
  });
  it("con suficientes logos, la lista tal cual; sin logos, nada", () => {
    assert.deepEqual(rellenoDeBanda(["a", "b", "c"], 2), ["a", "b", "c"]);
    assert.deepEqual(rellenoDeBanda([], 8), []);
  });
});
