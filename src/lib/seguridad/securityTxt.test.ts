import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { securityTxt } from "./securityTxt";

describe("security.txt", () => {
  it("lleva el contacto, caduca a un año y pide español", () => {
    assert.equal(
      securityTxt(new Date("2026-11-23T10:00:00.500Z")),
      "Contact: mailto:info@partequipos.com\nExpires: 2027-11-23T10:00:00Z\nPreferred-Languages: es\n",
    );
  });

  it("la caducidad nunca pasa de un año (el RFC 9116 lo recomienda)", () => {
    const ahora = new Date("2028-02-29T00:00:00Z");
    const caduca = /Expires: (.+)/.exec(securityTxt(ahora))?.[1];
    assert.ok(caduca);
    assert.ok(new Date(caduca).getTime() - ahora.getTime() <= 366 * 24 * 60 * 60 * 1000);
  });
});
