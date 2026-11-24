import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CLAVE_PISTA_MODO_ADMIN,
  hayPistaModoAdmin,
  ponerPistaModoAdmin,
  quitarPistaModoAdmin,
} from "./pistaModoAdmin";

function memoria() {
  const m = new Map<string, string>();
  return {
    m,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

const rota = {
  getItem: () => {
    throw new Error("bloqueado");
  },
  setItem: () => {
    throw new Error("bloqueado");
  },
  removeItem: () => {
    throw new Error("bloqueado");
  },
};

describe("pista del modo administración", () => {
  it("la clave es la que lee la web (diseño de A)", () => {
    assert.equal(CLAVE_PISTA_MODO_ADMIN, "pq-modo-admin");
  });

  it("se pone con «1» y se quita", () => {
    const a = memoria();
    assert.equal(hayPistaModoAdmin(a), false);
    ponerPistaModoAdmin(a);
    assert.equal(a.m.get("pq-modo-admin"), "1");
    assert.equal(hayPistaModoAdmin(a), true);
    quitarPistaModoAdmin(a);
    assert.equal(a.m.has("pq-modo-admin"), false);
    assert.equal(hayPistaModoAdmin(a), false);
  });

  it("otro valor no cuenta como pista", () => {
    const a = memoria();
    a.setItem("pq-modo-admin", "true");
    assert.equal(hayPistaModoAdmin(a), false);
  });

  it("sin almacenamiento o con él bloqueado, no rompe nada", () => {
    assert.doesNotThrow(() => ponerPistaModoAdmin(null));
    assert.doesNotThrow(() => quitarPistaModoAdmin(rota));
    assert.doesNotThrow(() => ponerPistaModoAdmin(rota));
    assert.equal(hayPistaModoAdmin(rota), false);
  });
});
