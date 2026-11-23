import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ANCHO_MAXIMO,
  AVISO_ORIGINAL_BYTES,
  avisoDeOriginalPesado,
  avisoDeTope,
  calidadPara,
  medidasReducidas,
  nombreCon,
  queSubir,
  TOPE_ORIGINAL_BYTES,
} from "./reducirImagen";

const MB = 1024 * 1024;

describe("medidasReducidas", () => {
  it("reduce al ancho máximo con la proporción", () => {
    assert.deepEqual(medidasReducidas({ ancho: 6000, alto: 4000 }), {
      ancho: 3840,
      alto: 2560,
      reducida: true,
    });
    assert.deepEqual(medidasReducidas({ ancho: 3841, alto: 10 }), {
      ancho: 3840,
      alto: 10,
      reducida: true,
    });
  });

  it("nunca amplía", () => {
    for (const ancho of [1, 800, 3839, ANCHO_MAXIMO]) {
      assert.deepEqual(medidasReducidas({ ancho, alto: 600 }), {
        ancho,
        alto: 600,
        reducida: false,
      });
    }
  });

  it("una imagen alta y estrecha se queda como está: el límite es el ancho", () => {
    assert.equal(medidasReducidas({ ancho: 2000, alto: 9000 }).reducida, false);
  });
});

describe("nombreCon", () => {
  it("cambia la extensión por la del formato", () => {
    assert.equal(nombreCon("Foto obra.JPG", "image/webp"), "Foto obra.webp");
    assert.equal(nombreCon("logo.v2.png", "image/webp"), "logo.v2.webp");
    assert.equal(nombreCon("foto.jpeg", "image/jpeg"), "foto.jpg");
    assert.equal(nombreCon("sin-extension", "image/webp"), "sin-extension.webp");
  });

  it("un formato desconocido no toca el nombre", () => {
    assert.equal(nombreCon("foto.jpg", "image/gif"), "foto.jpg");
  });
});

describe("calidadPara", () => {
  it("un PNG se escribe con más calidad que una foto", () => {
    assert.ok(calidadPara("image/webp", "image/png") > calidadPara("image/webp", "image/jpeg"));
  });
});

describe("queSubir", () => {
  const webp = (size: number) => ({ type: "image/webp", size });

  it("reducida: siempre el resultado", () => {
    assert.equal(queSubir({ type: "image/jpeg", size: 2 * MB }, webp(3 * MB), true), "resultado");
    assert.equal(
      queSubir({ type: "image/jpeg", size: 9 * MB }, { type: "image/jpeg", size: MB }, true),
      "resultado",
    );
  });

  it("sin reducir: el WebP solo si pesa menos", () => {
    assert.equal(queSubir({ type: "image/jpeg", size: 2 * MB }, webp(MB), false), "resultado");
    assert.equal(queSubir({ type: "image/jpeg", size: MB }, webp(2 * MB), false), "original");
  });

  it("sin reducir y ya en WebP: el original, sin volver a comprimir", () => {
    assert.equal(queSubir({ type: "image/webp", size: 2 * MB }, webp(MB), false), "original");
  });

  it("si el navegador no supo, el original", () => {
    assert.equal(queSubir({ type: "image/jpeg", size: MB }, null, false), "original");
    assert.equal(queSubir({ type: "image/jpeg", size: MB }, webp(0), true), "original");
    assert.equal(
      queSubir({ type: "image/png", size: MB }, { type: "image/png", size: MB / 2 }, false),
      "original",
    );
  });
});

describe("avisos", () => {
  it("tope: solo por encima del máximo", () => {
    assert.equal(avisoDeTope({ name: "a.jpg", size: TOPE_ORIGINAL_BYTES }), null);
    assert.match(
      avisoDeTope({ name: "a.jpg", size: TOPE_ORIGINAL_BYTES + 1 }) ?? "",
      /No se ha subido nada/,
    );
  });

  it("original pesado: avisa con lo que pesaba y lo que se subió", () => {
    const aviso = avisoDeOriginalPesado(
      { name: "obra.jpg", size: 22 * MB, medidas: { ancho: 6000, alto: 4000 } },
      {
        size: 1.9 * MB,
        medidas: { ancho: 3840, alto: 2560 },
        type: "image/webp",
        cambiada: true,
      },
    );
    assert.equal(
      aviso,
      "«obra.jpg» pesaba 22 MB (6000 × 4000 px): es mucho para la web. Se ha subido reducida " +
        "(3840 × 2560 px, WebP, 1,9 MB). La próxima vez, expórtala a 3840 px de ancho como mucho.",
    );
  });

  it("original pesado que no se pudo reducir: avisa igual", () => {
    assert.match(
      avisoDeOriginalPesado(
        { name: "a.png", size: AVISO_ORIGINAL_BYTES, medidas: null },
        { size: AVISO_ORIGINAL_BYTES, medidas: null, type: "image/png", cambiada: false },
      ) ?? "",
      /pesa 8 MB: es mucho para la web/,
    );
  });

  it("un original ligero no avisa", () => {
    assert.equal(
      avisoDeOriginalPesado(
        { name: "a.jpg", size: MB, medidas: null },
        { size: MB / 2, medidas: null, type: "image/webp", cambiada: true },
      ),
      null,
    );
  });
});
