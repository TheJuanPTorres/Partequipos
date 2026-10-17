import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TOPE_VIDEO_BYTES,
  esVideoPermitido,
  formatoDeVideoPermitido,
} from "./formatoDeVideoPermitido";

type Argumentos = Parameters<typeof formatoDeVideoPermitido>[0];

const ftyp = (marca: string) =>
  Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x20]), Buffer.from(`ftyp${marca}`, "ascii")]);

const CABECERAS = {
  mp4: ftyp("isom"),
  mp42: ftyp("mp42"),
  webm: Buffer.concat([
    Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86]),
    Buffer.from("  webm"),
  ]),
  avif: ftyp("avif"),
  heic: ftyp("heic"),
  mkv: Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.from("matroska")]),
  gif: Buffer.from("GIF89a      ", "binary"),
};

function llamar(data: Buffer, name = "fichero.mp4") {
  return formatoDeVideoPermitido({
    args: {},
    operation: "create",
    req: { file: { data, name, mimetype: "video/mp4", size: data.length } },
  } as unknown as Argumentos);
}

describe("formato de vídeo por contenido", () => {
  it("acepta MP4 y WebM", () => {
    assert.equal(esVideoPermitido(CABECERAS.mp4), "MP4");
    assert.equal(esVideoPermitido(CABECERAS.mp42), "MP4");
    assert.equal(esVideoPermitido(CABECERAS.webm), "WebM");
  });

  it("RECHAZA un AVIF aunque también empiece por `ftyp`: es el formato del CVE", () => {
    assert.equal(esVideoPermitido(CABECERAS.avif), null);
    assert.equal(esVideoPermitido(CABECERAS.heic), null);
  });

  it("rechaza Matroska que no es WebM, y cualquier otra cosa", () => {
    assert.equal(esVideoPermitido(CABECERAS.mkv), null);
    assert.equal(esVideoPermitido(CABECERAS.gif), null);
  });

  it("el hook deja pasar un MP4 pequeño", async () => {
    await assert.doesNotReject(async () => llamar(CABECERAS.mp4));
  });

  it("el hook rechaza un AVIF renombrado a .mp4, en español", async () => {
    await assert.rejects(
      async () => llamar(CABECERAS.avif, "truco.mp4"),
      /no es un vídeo MP4 ni WebM/,
    );
  });

  it("el hook deja pasar un MP4 de 8 MB, por debajo del tope", async () => {
    const ocho = Buffer.concat([CABECERAS.mp4, Buffer.alloc(8 * 1024 * 1024)]);
    await assert.doesNotReject(async () => llamar(ocho));
  });

  it("el hook rechaza un MP4 por encima del tope, con el tamaño", async () => {
    const grande = Buffer.concat([CABECERAS.mp4, Buffer.alloc(TOPE_VIDEO_BYTES)]);
    await assert.rejects(async () => llamar(grande), /el máximo es 10 MB/);
  });

  it("el tope es de 10 MB: pasa de 4,5 MB, así que los vídeos van por subida directa", () => {
    assert.equal(TOPE_VIDEO_BYTES, 10 * 1024 * 1024);
  });
});
