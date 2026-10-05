import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SLUG_ADITAMENTOS,
  claveDeEnlace,
  construirMegamenu,
  panelMaquinaria,
  panelRepuestos,
  type DatosMegamenu,
  type GrupoMenu,
} from "./megamenu";

const DATOS: DatosMegamenu = {
  marcasMaquinaria: [
    { id: 1, nombre: "Yanmar", slug: "yanmar" },
    { id: 2, nombre: "Aditamentos", slug: SLUG_ADITAMENTOS },
    { id: 3, nombre: "Case Construction", slug: "case-construction" },
  ],
  tiposMaquinaria: [
    { id: 10, nombre: "Miniexcavadoras", slug: "miniexcavadoras", marca: 1 },
    { id: 11, nombre: "Retrocargadoras", slug: "retrocargadoras", marca: { id: 3 } },
    { id: 12, nombre: "Bulldozers", slug: "bulldozer", marca: 3 },
    { id: 13, nombre: "Aditamentos para excavadoras", slug: "excavadoras", marca: 2 },
    { id: 14, nombre: "Huérfano", slug: "huerfano", marca: null },
  ],
  categoriasNueva: [{ id: 20, nombre: "Excavadoras", slug: "excavadoras" }],
  categoriasUsada: [
    { id: 30, nombre: "Motoniveladoras", slug: "motoniveladoras" },
    { id: 31, nombre: "Bulldozers", slug: "bulldozer" },
  ],
  marcasRepuestos: [
    { id: 40, nombre: "Caterpillar", slug: "repuestos-para-maquinaria-pesada-caterpillar" },
  ],
  tiposRepuestos: [
    {
      id: 50,
      nombre: "Excavadora",
      slug: "repuestos-para-maquinaria-pesada-excavadora-caterpillar",
      marca: 40,
    },
  ],
};

const titulos = (g: GrupoMenu[]) => g.map((x) => x.titulo);

describe("megamenú: maquinaria", () => {
  const panel = panelMaquinaria(DATOS);

  it("primero «Ver todo» a la sección, y después nueva, usada y aditamentos", () => {
    assert.deepEqual(panel.verTodo, {
      etiqueta: "Ver toda la maquinaria pesada",
      href: "/maquinaria-pesada/",
    });
    assert.deepEqual(titulos(panel.grupos), [
      "Maquinaria pesada nueva",
      "Maquinaria pesada usada",
      "Aditamentos para maquinaria pesada",
    ]);
  });

  it("nueva: por marca (sin aditamentos, en orden alfabético) y por tipo", () => {
    const nueva = panel.grupos[0]!;
    assert.equal(nueva.enlaces[0]?.href, "/maquinaria-pesada/maquinaria-pesada-nueva/");
    assert.deepEqual(titulos(nueva.grupos), ["Por marca", "Por tipo de máquina"]);
    const porMarca = nueva.grupos[0]!;
    assert.deepEqual(titulos(porMarca.grupos), ["Case Construction", "Yanmar"]);
    assert.deepEqual(porMarca.grupos[0]!.enlaces, [
      {
        etiqueta: "Ver todo Case Construction",
        href: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/",
      },
      {
        etiqueta: "Bulldozers",
        href: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/bulldozer/",
      },
      {
        etiqueta: "Retrocargadoras",
        href: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/",
      },
    ]);
    assert.deepEqual(nueva.grupos[1]!.enlaces, [
      { etiqueta: "Excavadoras", href: "/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras/" },
    ]);
  });

  it("usada: sin marcas, solo sus tipos", () => {
    const usada = panel.grupos[1]!;
    assert.equal(usada.grupos.length, 0);
    assert.deepEqual(
      usada.enlaces.map((e) => e.etiqueta),
      ["Ver toda la maquinaria usada", "Bulldozers", "Motoniveladoras"],
    );
  });

  it("aditamentos: la «marca» del sitio, con sus tipos", () => {
    const aditamentos = panel.grupos[2]!;
    assert.deepEqual(aditamentos.enlaces, [
      {
        etiqueta: "Ver todo Aditamentos",
        href: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/",
      },
      {
        etiqueta: "Aditamentos para excavadoras",
        href: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/excavadoras/",
      },
    ]);
  });

  it("sin la marca de aditamentos, el acordeón no sale; sin categorías, tampoco «Por tipo»", () => {
    const p = panelMaquinaria({
      ...DATOS,
      marcasMaquinaria: DATOS.marcasMaquinaria.filter((m) => m.slug !== SLUG_ADITAMENTOS),
      categoriasNueva: [],
    });
    assert.deepEqual(titulos(p.grupos), ["Maquinaria pesada nueva", "Maquinaria pesada usada"]);
    assert.deepEqual(titulos(p.grupos[0]!.grupos), ["Por marca"]);
  });
});

describe("megamenú: repuestos", () => {
  it("solo «Repuestos por marca»: las marcas del catálogo con sus tipos", () => {
    const p = panelRepuestos(DATOS);
    assert.equal(p.verTodo.href, "/repuestos-maquinaria-pesada-colombia/");
    assert.deepEqual(titulos(p.grupos), ["Repuestos por marca"]);
    const cat = p.grupos[0]!.grupos[0]!;
    assert.equal(cat.titulo, "Caterpillar");
    assert.deepEqual(
      cat.enlaces.map((e) => e.href),
      [
        "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-caterpillar/",
        "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-caterpillar/repuestos-para-maquinaria-pesada-excavadora-caterpillar/",
      ],
    );
  });

  it("una marca nueva del catálogo aparece sola, sin tocar el código", () => {
    const p = panelRepuestos({
      ...DATOS,
      marcasRepuestos: [
        ...DATOS.marcasRepuestos,
        { id: 41, nombre: "Bobcat", slug: "repuestos-para-maquinaria-pesada-bobcat" },
      ],
    });
    assert.deepEqual(titulos(p.grupos[0]!.grupos), ["Bobcat", "Caterpillar"]);
  });
});

describe("megamenú: qué enlace de la cabecera abre qué panel", () => {
  it("por su ruta, con o sin barra final", () => {
    const m = construirMegamenu(DATOS);
    assert.ok(m[claveDeEnlace("/maquinaria-pesada")]);
    assert.ok(m[claveDeEnlace("/maquinaria-pesada/")]);
    assert.ok(m[claveDeEnlace("/repuestos-maquinaria-pesada-colombia/")]);
    assert.equal(m[claveDeEnlace("/lubricantes/lubricantes-eni/")], undefined);
    assert.equal(m[claveDeEnlace("/servicio-tecnico/")], undefined);
  });
});
