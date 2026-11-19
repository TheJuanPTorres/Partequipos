import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PayloadRequest } from "payload";

import { crearRedirectPorCambioDeSlug, SIN_REDIRECT_AUTOMATICO } from "./autoRedirect";

/** Una petición de mentira que apunta lo que se le pide a `redirects`. */
function peticion(context: Record<string, unknown>) {
  const llamadas: string[] = [];
  const req = {
    context,
    payload: {
      find: async () => {
        llamadas.push("find");
        return { docs: [] };
      },
      create: async () => {
        llamadas.push("create");
        return {};
      },
      update: async () => ({}),
      delete: async () => ({}),
    },
  } as unknown as PayloadRequest;
  return { req, llamadas };
}

describe("crearRedirectPorCambioDeSlug", () => {
  it("crea la redirección al cambiar una dirección", async () => {
    const { req, llamadas } = peticion({});
    await crearRedirectPorCambioDeSlug(req, "/a/viejo/", "/a/nuevo/");
    assert.deepEqual(llamadas, ["find", "find", "create"]);
  });

  it("no hace nada si el guardado lo pide (cambio masivo por script)", async () => {
    const { req, llamadas } = peticion({ [SIN_REDIRECT_AUTOMATICO]: true });
    await crearRedirectPorCambioDeSlug(req, "/a/viejo/", "/a/nuevo/");
    assert.deepEqual(llamadas, []);
  });
});
