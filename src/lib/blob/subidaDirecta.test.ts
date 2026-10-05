import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { REGLAS_SUBIDA_DIRECTA, permisoDeSubida } from "./subidaDirecta";

describe("subida directa: el permiso que se firma", () => {
  it("documentos: solo PDF, hasta 25 MB, sin sobrescribir y con sufijo aleatorio", () => {
    const p = permisoDeSubida("documentos", "ficha-tecnica.pdf");
    assert.deepEqual(p, {
      ok: true,
      allowedContentTypes: ["application/pdf"],
      maximumSizeInBytes: 25 * 1024 * 1024,
      addRandomSuffix: true,
      allowOverwrite: false,
    });
  });

  it("una colección sin regla no tiene subida directa (ni media ni videos, aún)", () => {
    assert.equal(permisoDeSubida("media", "foto.jpg").ok, false);
    assert.equal(permisoDeSubida("videos", "clip.mp4").ok, false);
    assert.equal(permisoDeSubida(null, "ficha.pdf").ok, false);
    assert.deepEqual(Object.keys(REGLAS_SUBIDA_DIRECTA), ["documentos"]);
  });

  it("nombres con carpetas, ocultos o con otra extensión: no", () => {
    assert.equal(permisoDeSubida("documentos", "media/otra-foto.pdf").ok, false);
    assert.equal(permisoDeSubida("documentos", "../x.pdf").ok, false);
    assert.equal(permisoDeSubida("documentos", ".pdf").ok, false);
    assert.equal(permisoDeSubida("documentos", "ficha.pdf.exe").ok, false);
    assert.equal(permisoDeSubida("documentos", "Ficha técnica Case (2026).pdf").ok, true);
  });
});
