import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  tipoEnTitulo,
  adjetivoConcordado,
  articuloDefinido,
  articuloIndeterminado,
  concuerda,
  descripcionPorDefecto,
  recortarDescripcion,
  tituloPorDefecto,
} from "./porDefecto";
import { SEO_POR_COLECCION, estadoLongitud } from "./seoPanel";

describe("tituloPorDefecto", () => {
  it("reproduce las plantillas que tenían las páginas", () => {
    assert.equal(
      tituloPorDefecto.tipoRepuesto("Excavadora", "Caterpillar"),
      "Repuestos para excavadora Caterpillar",
    );
    assert.equal(tituloPorDefecto.modeloRepuesto("CAT 320D"), "Repuestos CAT 320D");
    assert.equal(tituloPorDefecto.marcaMaquinaria("Hitachi"), "Maquinaria pesada Hitachi");
    assert.equal(tituloPorDefecto.tipoMaquinaria("Excavadoras", "Hitachi"), "Excavadoras Hitachi");
    // Sin repetir la marca si el tipo ya la nombra (auditoría, 2026-10-17).
    assert.equal(
      tituloPorDefecto.tipoMaquinaria("Pavimentadoras Dynapac", "Dynapac"),
      "Pavimentadoras Dynapac",
    );
    assert.equal(tituloPorDefecto.tipoMaquinaria("Aditamentos", "Aditamentos"), "Aditamentos");
    assert.equal(
      tituloPorDefecto.tipoMaquinaria("Minicargadores CASE", "Case Construction"),
      "Minicargadores CASE Case Construction",
    );
    assert.equal(
      tituloPorDefecto.tipoMaquinaria("Vibrocompactador SV208", "Case Construction"),
      "Vibrocompactador SV208 Case Construction",
    );
    assert.equal(tituloPorDefecto.categoriaNueva("Excavadoras"), "Excavadoras Nuevas");
    assert.equal(tituloPorDefecto.categoriaUsada("Excavadoras"), "Excavadoras Usadas");
    assert.equal(tituloPorDefecto.categoriaNueva("Excavadora"), "Excavadora Nueva");
    assert.equal(tituloPorDefecto.categoriaUsada("Bulldozer"), "Bulldozer Usado");
    assert.equal(tituloPorDefecto.marcaLubricante("Eni"), "Lubricantes Eni");
    assert.equal(tituloPorDefecto.categoriaLubricante("Motos", "Eni"), "Motos | Lubricantes Eni");
  });
});

describe("recortarDescripcion", () => {
  it("deja igual lo corto y corta lo largo a 160 con «…»", () => {
    assert.equal(recortarDescripcion("  hola   mundo "), "hola mundo");
    const largo = recortarDescripcion("a".repeat(200));
    assert.equal(largo.length, 160);
    assert.ok(largo.endsWith("…"));
  });
});

describe("SEO_POR_COLECCION", () => {
  it("cubre las colecciones con grupo SEO y página propia (no las categorías técnicas)", () => {
    assert.deepEqual(Object.keys(SEO_POR_COLECCION).sort(), [
      "articulos",
      "categorias-blog",
      "categorias-lubricante",
      "categorias-maquinaria",
      "categorias-usada",
      "equipos-nuevos",
      "equipos-usados",
      "marcas",
      "marcas-lubricante",
      "marcas-maquinaria",
      "marcas-usada",
      "modelos-repuesto",
      "paginas",
      "tipos-equipo",
      "tipos-maquinaria",
    ]);
  });

  it("sin el nombre de la marca no inventa título", () => {
    assert.equal(SEO_POR_COLECCION["tipos-equipo"]!.titulo("Excavadora", {}), null);
    assert.equal(
      SEO_POR_COLECCION["tipos-equipo"]!.titulo("Excavadora", { marca: "Volvo" }),
      "Repuestos para excavadora Volvo",
    );
  });
});

describe("estadoLongitud", () => {
  it("vacío, corto, bien y largo", () => {
    assert.equal(estadoLongitud(0, { max: 60 }), "vacio");
    assert.equal(estadoLongitud(61, { max: 60 }), "largo");
    assert.equal(estadoLongitud(50, { min: 120, max: 160 }), "corto");
    assert.equal(estadoLongitud(140, { min: 120, max: 160 }), "bien");
  });
});

describe("concordancia de Nuevo/Nueva y Usado/Usada", () => {
  it("en plural, como hasta ahora pero con mayúscula", () => {
    const usada: Record<string, string> = {
      Vibrocompactadores: "Vibrocompactadores Usados",
      Retrocargadoras: "Retrocargadoras Usadas",
      Motoniveladoras: "Motoniveladoras Usadas",
      Minicargadores: "Minicargadores Usados",
      Excavadoras: "Excavadoras Usadas",
      Compactadores: "Compactadores Usados",
      "Cargadores Frontales": "Cargadores Frontales Usados",
      Bulldozers: "Bulldozers Usados",
      Aditamentos: "Aditamentos Usados",
    };
    for (const [nombre, titulo] of Object.entries(usada)) {
      assert.equal(tituloPorDefecto.categoriaUsada(nombre), titulo);
    }
    assert.equal(tituloPorDefecto.categoriaNueva("Excavadoras"), "Excavadoras Nuevas");
    assert.equal(tituloPorDefecto.categoriaNueva("Compactadores"), "Compactadores Nuevos");
  });

  it("en singular (cliente, 2026-10-23), concordado con cada máquina", () => {
    const nueva: Record<string, string> = {
      Bulldozer: "Bulldozer Nuevo",
      Excavadora: "Excavadora Nueva",
      Motoniveladora: "Motoniveladora Nueva",
      Miniexcavadora: "Miniexcavadora Nueva",
      Minicargador: "Minicargador Nuevo",
      Retrocargadora: "Retrocargadora Nueva",
      Compactador: "Compactador Nuevo",
      Pavimentadora: "Pavimentadora Nueva",
    };
    for (const [nombre, titulo] of Object.entries(nueva)) {
      assert.equal(tituloPorDefecto.categoriaNueva(nombre), titulo);
    }
    assert.equal(tituloPorDefecto.categoriaUsada("Cargador Frontal"), "Cargador Frontal Usado");
    assert.equal(tituloPorDefecto.categoriaUsada("Vibrocompactador"), "Vibrocompactador Usado");
    assert.equal(tituloPorDefecto.categoriaUsada("Regla Vibratoria"), "Regla Vibratoria Usada");
  });

  it("el género sale del sustantivo (la primera palabra), sin importar mayúsculas ni tildes", () => {
    assert.equal(concuerda("Grúas TELESCÓPICAS", "f", "m"), "f");
    assert.equal(concuerda("Equipos de compactación", "f", "m"), "m");
    assert.equal(concuerda("bulldozer", "f", "m"), "m");
    assert.equal(concuerda("Pavimentadora Dynapac", "f", "m"), "f");
    assert.equal(concuerda("Compactador de Llantas", "f", "m"), "m");
    assert.equal(adjetivoConcordado("Excavadora", "Usad"), "Usada");
    assert.equal(adjetivoConcordado("Compactadores de Suelo", "Nuev"), "Nuevos");
    assert.equal(articuloIndeterminado("Retrocargadora"), "una");
    assert.equal(articuloIndeterminado("Minicargador"), "un");
    assert.equal(articuloDefinido("Compactadores de suelo"), "el");
    assert.equal(articuloDefinido("Excavadora"), "la");
    assert.equal(articuloDefinido("Aditamentos"), "el");
  });
});

describe("descripcionPorDefecto de usados", () => {
  it("habla de maquinaria usada (no de repuestos) y cabe en 160 con nombres normales", () => {
    for (const d of [
      descripcionPorDefecto.categoriaUsada("Excavadoras"),
      descripcionPorDefecto.categoriaUsada("Retrocargadoras"),
      descripcionPorDefecto.marcaUsada("Case Construction"),
    ]) {
      assert.ok(d.length <= 160, d);
      assert.match(d, /usad[ao]s?\b/i);
      assert.doesNotMatch(d, /repuesto/i);
    }
    assert.ok(descripcionPorDefecto.marcaUsada("Hitachi").startsWith("Maquinaria Hitachi usada "));
  });

  it("el panel la usa como respaldo en las dos colecciones de usados", () => {
    assert.equal(
      SEO_POR_COLECCION["categorias-usada"]?.descripcion?.("Excavadoras"),
      descripcionPorDefecto.categoriaUsada("Excavadoras"),
    );
    assert.equal(
      SEO_POR_COLECCION["marcas-usada"]?.descripcion?.("Hitachi"),
      descripcionPorDefecto.marcaUsada("Hitachi"),
    );
  });
});

describe("tipoEnTitulo", () => {
  it("pone en mayúscula solo la primera letra y deja el resto como está guardado", () => {
    assert.equal(tipoEnTitulo("excavadora"), "Excavadora");
    assert.equal(tipoEnTitulo("  Cargador Frontal "), "Cargador Frontal");
    assert.equal(tipoEnTitulo("cargador frontal"), "Cargador frontal");
    assert.equal(tipoEnTitulo("Minicargador CASE"), "Minicargador CASE");
    assert.equal(tipoEnTitulo(""), "");
  });
});
