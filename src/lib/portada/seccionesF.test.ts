import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Media, Pagina, Video } from "@/payload-types";

import { urlInsercion, validarYouTube, videoDeCompania, videoDeYouTube } from "./seccionesF";

describe("YouTube", () => {
  it("lee las formas habituales, con su segundo de inicio", () => {
    assert.deepEqual(videoDeYouTube("https://www.youtube.com/watch?v=hBeMsx5WEko&t=21s"), {
      id: "hBeMsx5WEko",
      inicio: 21,
    });
    assert.deepEqual(videoDeYouTube("https://www.youtube.com/watch?v=hBeMsx5WEko&amp;t=21s"), {
      id: "hBeMsx5WEko",
      inicio: 21,
    });
    assert.deepEqual(videoDeYouTube(" https://www.youtube.com/watch?v=lcIx96OBAWU"), {
      id: "lcIx96OBAWU",
      inicio: null,
    });
    assert.deepEqual(videoDeYouTube("https://youtu.be/hV33sXph6sU?t=1m5s"), {
      id: "hV33sXph6sU",
      inicio: 65,
    });
    assert.equal(
      videoDeYouTube("https://www.youtube-nocookie.com/embed/lcIx96OBAWU")?.id,
      "lcIx96OBAWU",
    );
  });

  it("rechaza lo que no es un vídeo de YouTube", () => {
    for (const u of [
      "http://www.youtube.com/watch?v=lcIx96OBAWU",
      "https://evil.com/watch?v=lcIx96OBAWU",
      "https://youtube.com.evil.com/watch?v=lcIx96OBAWU",
      "https://www.youtube.com/watch?v=corto",
      "https://www.youtube.com/watch?v=lcIx96OBAWU%22onload",
      "javascript:alert(1)",
      "",
    ]) {
      assert.equal(videoDeYouTube(u), null, u);
    }
  });

  it("la validación del panel acepta vacío y rechaza lo ajeno", () => {
    assert.equal(validarYouTube(""), true);
    assert.equal(validarYouTube(undefined), true);
    assert.equal(validarYouTube("https://www.youtube.com/watch?v=lcIx96OBAWU"), true);
    assert.equal(typeof validarYouTube("https://vimeo.com/123"), "string");
  });

  it("el iframe va al dominio sin cookies, con inicio si lo hay", () => {
    assert.equal(
      urlInsercion({ id: "hBeMsx5WEko", inicio: 21 }),
      "https://www.youtube-nocookie.com/embed/hBeMsx5WEko?autoplay=1&rel=0&start=21",
    );
    assert.equal(
      urlInsercion({ id: "lcIx96OBAWU", inicio: null }),
      "https://www.youtube-nocookie.com/embed/lcIx96OBAWU?autoplay=1&rel=0",
    );
  });
});

describe("sección 7: vídeo", () => {
  const poster = { id: 1, url: "/p.jpg", width: 1500, height: 1260, alt: "algo" } as Media;
  const video = (over: Partial<Video>) =>
    ({
      id: 1,
      url: "/v.mp4",
      mimeType: "video/mp4",
      descripcion: " Máquina ",
      poster,
      ...over,
    }) as Video;

  it("con vídeo poblado: url, póster decorativo y descripción", () => {
    const r = videoDeCompania({ video: video({ decorativo: true }) } as Pagina["seccionCompania"]);
    assert.equal(r!.url, "/v.mp4");
    assert.equal(r!.poster!.alt, "");
    assert.equal(r!.decorativo, true);
    assert.equal(r!.descripcion, "Máquina");
  });

  it("sin vídeo, o sin poblar, no hay vídeo (la alternativa se pinta)", () => {
    assert.equal(videoDeCompania(undefined), null);
    assert.equal(videoDeCompania({ video: 3 } as Pagina["seccionCompania"]), null);
  });

  it("un vídeo marcado como no decorativo se anuncia", () => {
    const r = videoDeCompania({ video: video({ decorativo: false }) } as Pagina["seccionCompania"]);
    assert.equal(r!.decorativo, false);
  });
});
