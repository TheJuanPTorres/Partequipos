import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { REGLAS_SUBIDA_DIRECTA, avisoAntesDeSubir, permisoDeSubida } from "./subidaDirecta";

const MB = 1024 * 1024;

describe("subida directa: el permiso que se firma", () => {
  it("documentos: solo PDF, hasta 25 MB, sin sobrescribir y con sufijo aleatorio", () => {
    assert.deepEqual(permisoDeSubida("documentos", "ficha-tecnica.pdf"), {
      ok: true,
      allowedContentTypes: ["application/pdf"],
      maximumSizeInBytes: 25 * MB,
      addRandomSuffix: true,
      allowOverwrite: false,
    });
  });

  it("imágenes: JPEG, PNG o WebP, hasta 15 MB", () => {
    assert.deepEqual(permisoDeSubida("media", "foto.JPG"), {
      ok: true,
      allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
      maximumSizeInBytes: 15 * MB,
      addRandomSuffix: true,
      allowOverwrite: false,
    });
    assert.equal(permisoDeSubida("media", "foto.gif").ok, false);
  });

  it("vídeos y cualquier otra colección se quedan sin subida directa (4 MB por la vía normal)", () => {
    assert.equal(permisoDeSubida("videos", "clip.mp4").ok, false);
    assert.equal(permisoDeSubida(null, "ficha.pdf").ok, false);
    assert.deepEqual(Object.keys(REGLAS_SUBIDA_DIRECTA).sort(), ["documentos", "media"]);
  });

  it("nombres con carpetas, ocultos o con otra extensión: no", () => {
    assert.equal(permisoDeSubida("documentos", "media/otra-foto.pdf").ok, false);
    assert.equal(permisoDeSubida("documentos", "../x.pdf").ok, false);
    assert.equal(permisoDeSubida("documentos", ".pdf").ok, false);
    assert.equal(permisoDeSubida("documentos", "ficha.pdf.exe").ok, false);
    assert.equal(permisoDeSubida("documentos", "Ficha técnica Case (2026).pdf").ok, true);
  });
});

describe("subida directa: el aviso en español ANTES de subir", () => {
  it("dentro del tope y del tipo: sin aviso", () => {
    assert.equal(
      avisoAntesDeSubir("documentos", { name: "f.pdf", type: "application/pdf", size: 10 * MB }),
      null,
    );
    assert.equal(
      avisoAntesDeSubir("media", { name: "f.png", type: "image/png", size: 12 * MB }),
      null,
    );
  });

  it("por encima del tope: aviso con el peso y el máximo, y sin subir nada", () => {
    const pdf = avisoAntesDeSubir("documentos", {
      name: "f.pdf",
      type: "application/pdf",
      size: 30 * MB,
    });
    assert.match(pdf ?? "", /pesa 30[\s\S]*máximo es 25 MB[\s\S]*No se ha subido nada/);
    const img = avisoAntesDeSubir("media", { name: "f.png", type: "image/png", size: 20 * MB });
    assert.match(img ?? "", /pesa 20[\s\S]*máximo es 15 MB/);
  });

  it("tipo equivocado: aviso", () => {
    assert.match(
      avisoAntesDeSubir("documentos", { name: "f.docx", type: "application/msword", size: 1 }) ??
        "",
      /un PDF/,
    );
    assert.match(
      avisoAntesDeSubir("media", { name: "f.gif", type: "image/gif", size: 1 }) ?? "",
      /JPEG, PNG o WebP/,
    );
  });
});
