import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  destinoPorNombre,
  destinoTienda,
  esBusquedaTiendaValida,
  nombreCorto,
  urlBusqueda,
  validarBusquedaTienda,
  enlaceTiendaGeneral,
  esEnlaceTiendaValido,
  validarEnlaceTienda,
} from "./enlaceTienda";

describe("enlace de la tienda: validación", () => {
  it("solo https:// completos", () => {
    assert.equal(esEnlaceTiendaValido("https://tienda.ejemplo.test/p/123"), true);
    assert.equal(esEnlaceTiendaValido("  https://tienda.ejemplo.test/ "), true);
    for (const malo of [
      "http://tienda.ejemplo.test/",
      "//tienda.ejemplo.test/",
      "/tienda/",
      "tienda.ejemplo.test",
      "javascript:alert(1)",
      "https://",
      "https://localhost",
      "https://user:clave@tienda.ejemplo.test/",
      "",
      null,
      undefined,
      42,
    ]) {
      assert.equal(esEnlaceTiendaValido(malo), false, String(malo));
    }
  });

  it("el campo del panel: vacío vale y lo malo da un mensaje", () => {
    assert.equal(validarEnlaceTienda(""), true);
    assert.equal(validarEnlaceTienda("   "), true);
    assert.equal(validarEnlaceTienda(null), true);
    assert.equal(validarEnlaceTienda("https://tienda.ejemplo.test/x"), true);
    assert.match(String(validarEnlaceTienda("http://x.test")), /https:\/\//);
    assert.match(String(validarEnlaceTienda("tienda")), /https:\/\//);
  });
});

describe("la tienda general sale del botón «Tienda» de la cabecera", () => {
  const menu = [
    { etiqueta: "Repuestos", href: "/repuestos/" },
    { etiqueta: "Transporte", href: "https://transporte.ejemplo.test/" },
    { etiqueta: "Tienda", href: "https://tienda.ejemplo.test/", externo: true },
  ];
  it("toma el enlace externo llamado Tienda", () => {
    assert.equal(enlaceTiendaGeneral(menu), "https://tienda.ejemplo.test/");
  });
  it("sin enlace de tienda (o con un destino no válido), null: no se inventa ninguno", () => {
    assert.equal(enlaceTiendaGeneral(menu.slice(0, 2)), null);
    assert.equal(enlaceTiendaGeneral([{ etiqueta: "Tienda", href: "/tienda/" }]), null);
    assert.equal(enlaceTiendaGeneral([]), null);
    assert.equal(enlaceTiendaGeneral(undefined), null);
  });
  it("prefiere el externo a otro que también se llame tienda", () => {
    const dos = [
      { etiqueta: "Tienda online", href: "https://otra.ejemplo.test/" },
      { etiqueta: "Tienda", href: "https://tienda.ejemplo.test/", externo: true },
    ];
    assert.equal(enlaceTiendaGeneral(dos), "https://tienda.ejemplo.test/");
  });
});

describe("destino de un botón", () => {
  const general = "https://tienda.ejemplo.test/";
  it("el propio si es válido; si no, el general", () => {
    assert.equal(
      destinoTienda("https://tienda.ejemplo.test/p/1", general),
      "https://tienda.ejemplo.test/p/1",
    );
    assert.equal(destinoTienda("", general), general);
    assert.equal(destinoTienda(null, general), general);
    assert.equal(destinoTienda("http://inseguro.test/", general), general);
  });
  it("sin general ni propio, ningún botón", () => {
    assert.equal(destinoTienda(null, null), null);
    assert.equal(destinoTienda("", undefined), null);
  });
  it("un propio válido sirve aunque no haya general", () => {
    assert.equal(
      destinoTienda("https://tienda.ejemplo.test/p/1", null),
      "https://tienda.ejemplo.test/p/1",
    );
  });
});

const BUSQUEDA = "https://tienda.ejemplo.test/catalogsearch/result/?q=";
const GENERAL = "https://tienda.ejemplo.test/";

describe("la búsqueda de la tienda", () => {
  it("el campo del panel: https y terminada en el parámetro; vacío vale", () => {
    assert.equal(esBusquedaTiendaValida(BUSQUEDA), true);
    assert.equal(validarBusquedaTienda(""), true);
    assert.equal(validarBusquedaTienda(null), true);
    assert.equal(validarBusquedaTienda(BUSQUEDA), true);
    for (const mala of [
      "https://tienda.ejemplo.test/buscar",
      "http://tienda.ejemplo.test/?q=",
      "tienda?q=",
      "/buscar?q=",
    ]) {
      assert.match(String(validarBusquedaTienda(mala)), /https:\/\//, mala);
    }
  });

  it("el nombre corto quita «para maquinaria pesada» del final", () => {
    assert.equal(nombreCorto("CADENA PARA MAQUINARIA PESADA"), "CADENA");
    assert.equal(nombreCorto("CADENA PARA EXCAVADORA MAQUINARIA PESADA"), "CADENA PARA EXCAVADORA");
    assert.equal(nombreCorto("  Filtro   de aire para maquinaria  pesada "), "Filtro de aire");
    assert.equal(nombreCorto("Tren de Rodaje"), "Tren de Rodaje");
    assert.equal(nombreCorto("Maquinaria pesada"), "Maquinaria pesada");
    assert.equal(nombreCorto("Bulldozer maquinaria pesada ZX"), "Bulldozer maquinaria pesada ZX");
    assert.equal(nombreCorto(null), "");
  });

  it("la URL lleva el nombre codificado: tildes, espacios y «&»", () => {
    assert.equal(urlBusqueda(BUSQUEDA, "CADENA PARA MAQUINARIA PESADA"), `${BUSQUEDA}CADENA`);
    assert.equal(
      urlBusqueda(BUSQUEDA, "Sección de cadena para maquinaria pesada"),
      `${BUSQUEDA}Secci%C3%B3n%20de%20cadena`,
    );
    assert.equal(
      urlBusqueda(BUSQUEDA, "Pin & buje para maquinaria pesada"),
      `${BUSQUEDA}Pin%20%26%20buje`,
    );
    assert.equal(urlBusqueda(BUSQUEDA, "Rodillo #1 +2"), `${BUSQUEDA}Rodillo%20%231%20%2B2`);
  });

  it("sin base válida o sin nombre, no hay búsqueda", () => {
    assert.equal(urlBusqueda(null, "Cadena"), null);
    assert.equal(urlBusqueda("https://tienda.ejemplo.test/buscar", "Cadena"), null);
    assert.equal(urlBusqueda(BUSQUEDA, "  "), null);
  });
});

describe("destinoPorNombre: propio → búsqueda → grupo → general", () => {
  const conTodo = { general: GENERAL, busqueda: BUSQUEDA };
  it("el enlace propio gana a todo", () => {
    assert.equal(
      destinoPorNombre(
        "https://tienda.ejemplo.test/p/1",
        "Cadena",
        conTodo,
        "https://tienda.ejemplo.test/g",
      ),
      "https://tienda.ejemplo.test/p/1",
    );
  });
  it("sin propio, la búsqueda con el nombre corto (gana al del grupo)", () => {
    assert.equal(
      destinoPorNombre(
        "",
        "CADENA PARA MAQUINARIA PESADA",
        conTodo,
        "https://tienda.ejemplo.test/g",
      ),
      `${BUSQUEDA}CADENA`,
    );
    assert.equal(destinoPorNombre("http://mal.test", "Cadena", conTodo), `${BUSQUEDA}Cadena`);
  });
  it("sin búsqueda en el panel, como antes: propio → grupo → general", () => {
    const sin = { general: GENERAL, busqueda: null };
    assert.equal(
      destinoPorNombre(null, "Cadena", sin, "https://tienda.ejemplo.test/g"),
      "https://tienda.ejemplo.test/g",
    );
    assert.equal(destinoPorNombre(null, "Cadena", sin), GENERAL);
    assert.equal(
      destinoPorNombre(null, "Cadena", { general: GENERAL, busqueda: "https://x.test/buscar" }),
      GENERAL,
    );
  });
  it("sin nombre se salta la búsqueda; sin nada, ningún botón", () => {
    assert.equal(destinoPorNombre(null, "", conTodo), GENERAL);
    assert.equal(destinoPorNombre(null, "Cadena", { general: null, busqueda: null }), null);
    assert.equal(
      destinoPorNombre(null, "Cadena", { general: null, busqueda: BUSQUEDA }),
      `${BUSQUEDA}Cadena`,
    );
  });
});
