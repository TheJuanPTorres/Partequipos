import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pushPermitido } from "./pushEsquema";

describe("push de esquema: solo si se pide", () => {
  it("apagado por defecto, también en desarrollo (npm run dev)", () => {
    assert.equal(pushPermitido({}), false);
    assert.equal(pushPermitido({ NODE_ENV: "development" }), false);
  });

  it("encendido solo con PAYLOAD_PERMITIR_PUSH=true", () => {
    assert.equal(pushPermitido({ NODE_ENV: "development", PAYLOAD_PERMITIR_PUSH: "true" }), true);
    assert.equal(pushPermitido({ PAYLOAD_PERMITIR_PUSH: "1" }), false);
  });

  it("nunca en producción ni con PAYLOAD_DISABLE_PUSH, aunque se pida", () => {
    assert.equal(pushPermitido({ NODE_ENV: "production", PAYLOAD_PERMITIR_PUSH: "true" }), false);
    assert.equal(
      pushPermitido({ PAYLOAD_PERMITIR_PUSH: "true", PAYLOAD_DISABLE_PUSH: "true" }),
      false,
    );
  });
});
