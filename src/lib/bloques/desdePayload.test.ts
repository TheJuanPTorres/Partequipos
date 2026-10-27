import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Media, Pagina, Video } from "@/payload-types";

import { idsDeVideos, vistaDeBloques } from "./desdePayload";

const media = (id: number, extra: Partial<Media> = {}): Media =>
  ({
    id,
    alt: `alt ${id}`,
    url: `https://x.public.blob.vercel-storage.com/m${id}.jpg`,
    width: 800,
    height: 600,
    focalX: 50,
    focalY: 50,
    updatedAt: "",
    createdAt: "",
    ...extra,
  }) as Media;

const video: Video = {
  id: 3,
  descripcion: "Excavadora al atardecer",
  poster: media(76),
  decorativo: true,
  url: "https://x.public.blob.vercel-storage.com/v.mp4",
  updatedAt: "",
  createdAt: "",
} as Video;

type Bloques = NonNullable<Pagina["bloques"]>;

describe("vistaDeBloques", () => {
  it("cabecera: el vídeo llega con su póster desde el mapa (depth 1 no lo puebla)", () => {
    const bloques: Bloques = [
      {
        blockType: "cabeceraVideo",
        titulo: "Quiénes somos",
        antetitulo: "Partequipos",
        video: 3,
        imagen: null,
      },
    ];
    const [v] = vistaDeBloques(bloques, new Map([[3, video]]));
    assert.equal(v?.blockType, "cabeceraVideo");
    if (v?.blockType !== "cabeceraVideo") return;
    assert.equal(v.video?.url, video.url);
    assert.equal(v.video?.poster?.url, media(76).url);
    assert.equal(v.video?.poster?.alt, "", "el póster es decorativo");
  });

  it("cabecera sin vídeo en el mapa ni poblado: sin vídeo, no rompe", () => {
    const [v] = vistaDeBloques([
      { blockType: "cabeceraVideo", titulo: "T", video: 99, imagen: media(1) },
    ]);
    assert.ok(v?.blockType === "cabeceraVideo" && v.video === null && v.imagen?.url);
  });

  it("botón solo con texto Y enlace", () => {
    const [a, b] = vistaDeBloques([
      {
        blockType: "presentacionImagen",
        titulo: "T",
        botonTexto: "Conoce más",
        botonEnlace: "/contactanos/",
      },
      { blockType: "presentacionImagen", titulo: "T", botonTexto: "Conoce más", botonEnlace: "  " },
    ]);
    assert.deepEqual(a?.blockType === "presentacionImagen" && a.boton, {
      texto: "Conoce más",
      href: "/contactanos/",
    });
    assert.equal(b?.blockType === "presentacionImagen" && b.boton, null);
  });

  it("presentación: conserva el alt de la imagen (puede transmitir información)", () => {
    const [v] = vistaDeBloques([
      { blockType: "presentacionImagen", titulo: "T", imagen: media(77) },
    ]);
    assert.equal(v?.blockType === "presentacionImagen" && v.imagen?.alt, "alt 77");
  });

  it("presentación: la animación solo con URL y medidas; sin ella, null", () => {
    const anim = (extra: object) =>
      ({
        id: 5,
        descripcion: "Mapa",
        url: "https://x.public.blob.vercel-storage.com/mapa.json",
        ancho: 1073,
        alto: 1536,
        updatedAt: "",
        createdAt: "",
        ...extra,
      }) as const;
    const [a, b, c] = vistaDeBloques([
      { blockType: "presentacionImagen", titulo: "T", lottie: anim({}) },
      { blockType: "presentacionImagen", titulo: "T", lottie: anim({ ancho: null }) },
      { blockType: "presentacionImagen", titulo: "T", lottie: 5 },
    ]);
    assert.deepEqual(a?.blockType === "presentacionImagen" && a.animacion, {
      url: "https://x.public.blob.vercel-storage.com/mapa.json",
      ancho: 1073,
      alto: 1536,
    });
    assert.equal(b?.blockType === "presentacionImagen" && b.animacion, null);
    assert.equal(c?.blockType === "presentacionImagen" && c.animacion, null);
  });

  it("cifras: descarta las incompletas y el bloque vacío", () => {
    const vistas = vistaDeBloques([
      {
        blockType: "cifras",
        cifras: [
          { numero: 25, prefijo: "+", etiqueta: "Años de experiencia" },
          { numero: 100, etiqueta: "  " },
        ],
      },
      { blockType: "cifras", cifras: [] },
    ]);
    assert.equal(vistas.length, 1);
    assert.equal(vistas[0]?.blockType === "cifras" && vistas[0].cifras.length, 1);
  });

  it("imagen sin medidas: se omite", () => {
    const [v] = vistaDeBloques([
      {
        blockType: "franjaMarquee",
        texto: "Marcas aliadas",
        imagenFondo: media(5, { width: null }),
      },
    ]);
    assert.deepEqual(v?.blockType === "franjaMarquee" && v.fondos, []);
  });

  it("franja: el pase es la imagen de fondo y después las demás, sin las que no sirven", () => {
    const [v] = vistaDeBloques([
      {
        blockType: "franjaMarquee",
        texto: "Marcas Aliadas",
        imagenFondo: media(1),
        fondosExtra: [media(2), 7, media(3, { width: null }), media(4)],
      },
    ]);
    assert.deepEqual(v?.blockType === "franjaMarquee" && v.fondos.map((f) => f.alt), [
      "alt 1",
      "alt 2",
      "alt 4",
    ]);
  });

  it("marcas aliadas: tarjetas en su orden, color solo si es válido, sin nombre no hay tarjeta", () => {
    const [v] = vistaDeBloques([
      {
        blockType: "marcasAliadas",
        titulo: " ",
        imagenFondo: media(1),
        fondosExtra: [media(2), 9],
        tarjetas: [
          {
            nombre: " Uno ",
            texto: " frase ",
            logo: media(3),
            color: "#0a5bb0",
            enlace: " https://uno.test/ ",
          },
          { nombre: "Dos", color: "azul", enlace: "", logo: 5 },
          { nombre: "  ", color: "#fff" },
        ],
      },
    ]);
    assert.equal(v?.blockType, "marcasAliadas");
    if (v?.blockType !== "marcasAliadas") return;
    assert.equal(v.titulo, "Marcas aliadas");
    assert.equal(v.fondos.length, 2);
    assert.deepEqual(
      v.tarjetas.map((t) => [t.nombre, t.texto, t.color, t.href, t.logo?.alt ?? null]),
      [
        ["Uno", "frase", "#0a5bb0", "https://uno.test/", "alt 3"],
        ["Dos", "", null, null, null],
      ],
    );
  });

  it("marcas aliadas: sin tarjetas no hay bloque", () => {
    assert.deepEqual(
      vistaDeBloques([{ blockType: "marcasAliadas", titulo: "X", tarjetas: [] }]),
      [],
    );
  });

  it("tarjetas: enlace vacío es null; sin tarjetas no hay bloque", () => {
    const vistas = vistaDeBloques([
      { blockType: "tarjetasExpandibles", titulo: "T", tarjetas: [{ titulo: "A", enlace: "" }] },
      { blockType: "tarjetasExpandibles", titulo: "T", tarjetas: [] },
    ]);
    assert.equal(vistas.length, 1);
    assert.equal(
      vistas[0]?.blockType === "tarjetasExpandibles" && vistas[0].tarjetas[0]?.href,
      null,
    );
  });
});

describe("idsDeVideos", () => {
  it("reúne los ids de las cabeceras, sin repetir, con id o documento", () => {
    assert.deepEqual(
      idsDeVideos([
        { blockType: "cabeceraVideo", titulo: "A", video: 3 },
        { blockType: "cabeceraVideo", titulo: "B", video: video },
        { blockType: "cifras", cifras: [] },
        { blockType: "cabeceraVideo", titulo: "C", video: null },
      ]),
      [3],
    );
  });
});
