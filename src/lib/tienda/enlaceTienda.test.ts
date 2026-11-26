import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  destinoTienda,
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
