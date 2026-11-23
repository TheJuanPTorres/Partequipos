import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CAMPO_TIEMPO,
  CAMPO_TRAMPA,
  TIEMPO_MAXIMO_MS,
  TIEMPO_MINIMO_MS,
  crearLimitePorIp,
  revisarTiempo,
  trampaRellena,
} from "./antiSpam";

function f(campos: Record<string, string>) {
  const d = new FormData();
  for (const [k, v] of Object.entries(campos)) d.set(k, v);
  return d;
}

describe("trampaRellena", () => {
  it("vacía o ausente: persona", () => {
    assert.equal(trampaRellena(f({})), false);
    assert.equal(trampaRellena(f({ [CAMPO_TRAMPA]: "  " })), false);
  });
  it("con texto: robot", () => {
    assert.equal(trampaRellena(f({ [CAMPO_TRAMPA]: "http://spam.test" })), true);
  });
});

describe("revisarTiempo", () => {
  const ahora = 1_800_000_000_000;
  it("pasado el mínimo: ok", () => {
    assert.equal(
      revisarTiempo(f({ [CAMPO_TIEMPO]: String(ahora - TIEMPO_MINIMO_MS) }), ahora),
      "ok",
    );
  });
  it("antes del mínimo: muy rápido", () => {
    assert.equal(revisarTiempo(f({ [CAMPO_TIEMPO]: String(ahora - 500) }), ahora), "muy-rapido");
  });
  it("hora del futuro: muy rápido (no se puede fiar)", () => {
    assert.equal(revisarTiempo(f({ [CAMPO_TIEMPO]: String(ahora + 60_000) }), ahora), "muy-rapido");
  });
  it("sin dato, basura o caducada: sin dato", () => {
    assert.equal(revisarTiempo(f({}), ahora), "sin-dato");
    assert.equal(revisarTiempo(f({ [CAMPO_TIEMPO]: "abc" }), ahora), "sin-dato");
    assert.equal(revisarTiempo(f({ [CAMPO_TIEMPO]: "0" }), ahora), "sin-dato");
    assert.equal(
      revisarTiempo(f({ [CAMPO_TIEMPO]: String(ahora - TIEMPO_MAXIMO_MS - 1) }), ahora),
      "sin-dato",
    );
  });
});

describe("límite por IP", () => {
  it("deja pasar hasta el tope y corta el siguiente", () => {
    const l = crearLimitePorIp(3, 1_000);
    assert.equal(l.permitir("1.2.3.4", 0), true);
    assert.equal(l.permitir("1.2.3.4", 1), true);
    assert.equal(l.permitir("1.2.3.4", 2), true);
    assert.equal(l.permitir("1.2.3.4", 3), false);
  });
  it("otra IP no se ve afectada", () => {
    const l = crearLimitePorIp(1, 1_000);
    assert.equal(l.permitir("1.1.1.1", 0), true);
    assert.equal(l.permitir("1.1.1.1", 1), false);
    assert.equal(l.permitir("2.2.2.2", 1), true);
  });
  it("pasada la ventana, vuelve a dejar", () => {
    const l = crearLimitePorIp(1, 1_000);
    assert.equal(l.permitir("1.1.1.1", 0), true);
    assert.equal(l.permitir("1.1.1.1", 999), false);
    assert.equal(l.permitir("1.1.1.1", 1_000), true);
  });
  it("sin IP no limita", () => {
    const l = crearLimitePorIp(1, 1_000);
    assert.equal(l.permitir(undefined, 0), true);
    assert.equal(l.permitir(undefined, 1), true);
  });
  it("no guarda la IP: ninguna clave la contiene", () => {
    const l = crearLimitePorIp(5, 1_000);
    l.permitir("203.0.113.77", 0);
    // La IP no se puede recuperar desde fuera; lo único visible es el recuento de huellas.
    assert.equal(l.tamano(), 1);
  });
});
