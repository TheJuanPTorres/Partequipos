import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasTecnica, Media, Pagina } from "@/payload-types";

import {
  partirTitulo,
  categoriasDePortada,
  CAJA_FOTO,
  colocarFotoRepuesto,
  filtrosDeUsados,
  logosDeLaBanda,
  logosDeMarcasRepuestos,
} from "./kitCliente";

const media = (id: number, alt = ""): Media =>
  ({ id, url: `/m/${id}.webp`, alt, width: 800, height: 600 }) as Media;

describe("kit de la portada: tipos de usados", () => {
  it("siempre los tres filtros, en orden, con su página, nombre del panel e imagen decorativa", () => {
    const seccion = {
      pestanaExcavadoras: "Excavadora",
      pestanaOtros: "",
      pestanaAditamentos: "Aditamento",
      imagenOtros: media(7, "Bulldozer"),
    } as Pagina["seccionUsada"];
    const r = filtrosDeUsados(seccion);
    assert.deepEqual(
      r.map((f) => [f.nombre, f.href, f.imagen?.alt ?? null]),
      [
        ["Excavadora", "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/", null],
        ["Otros", "/maquinaria-pesada/maquinaria-pesada-usada/otros/", ""],
        ["Aditamento", "/maquinaria-pesada/maquinaria-pesada-usada/aditamentos/", null],
      ],
    );
  });
});

describe("kit de la portada: categorías de repuestos", () => {
  const c = (over: Partial<CategoriasTecnica>) =>
    ({
      id: 1,
      nombre: "Tren de Rodaje",
      slug: "tren-de-rodaje",
      ordenPortada: 1,
      ...over,
    }) as CategoriasTecnica;

  it("solo las de la portada, por su posición; título de portada; foto de portada o, si no, la de la tarjeta", () => {
    const r = categoriasDePortada([
      c({ id: 1, nombre: "Filtración", slug: "filtracion", ordenPortada: 2, imagen: media(1) }),
      c({
        id: 2,
        ordenPortada: 1,
        tituloPortada: "Tren",
        imagen: media(2),
        imagenPortada: media(3),
      }),
      c({ id: 3, nombre: "Sin portada", slug: "x", ordenPortada: null }),
    ]);
    assert.deepEqual(
      r.map((x) => [x.nombre, x.imagen?.url, x.imagen?.alt]),
      [
        ["Tren", "/m/3.webp", ""],
        ["Filtración", "/m/1.webp", ""],
      ],
    );
  });

  it("«Ver todos»: el enlace de la tarjeta del panel o la página de la categoría", () => {
    const r = categoriasDePortada([
      c({ id: 1, enlace: "/lubricantes/" }),
      c({ id: 2, nombre: "Filtración", slug: "filtracion", ordenPortada: 2 }),
    ]);
    assert.equal(r[0]?.href, "/lubricantes/");
    assert.match(r[1]?.href ?? "", /\/categoria-repuestos-para-maquinaria-pesada\/filtracion\/?$/);
  });
});

describe("kit de la portada: logos de la banda", () => {
  const sitio = new Map([
    ["hitachi", { url: "/sitio-hitachi.png", width: 10, height: 5, oscuro: true }],
  ]);

  it("regla común: el logo de la marca del sitio con ese nombre; si no la hay, el de la lista; sin ninguno, no sale", () => {
    const seccion = {
      logos: [
        { id: "a", nombre: "Hitachi", logo: media(5) },
        { id: "b", nombre: "Eni", logo: media(6) },
        { id: "c", nombre: "Sin logo", logo: null },
        { id: "d", nombre: "  ", logo: media(7) },
      ],
    } as unknown as Pagina["seccionLogos"];
    const r = logosDeLaBanda(seccion, sitio);
    assert.deepEqual(
      r.map((l) => [l.id, l.logo.url, l.logo.alt, l.logo.oscuro]),
      [
        ["a", "/sitio-hitachi.png", "Hitachi", true],
        ["b", "/m/6.webp", "Eni", false],
      ],
    );
  });
});

describe("logosDeMarcasRepuestos", () => {
  const logo = { url: "/m/1.webp", width: 400, height: 100, oscuro: false };

  it("cada marca con su logo, su alt y el enlace a su página, en el orden recibido", () => {
    const logos = logosDeMarcasRepuestos([
      { id: 1, nombre: "Caterpillar", slug: "caterpillar", logo },
      { id: 2, nombre: "Case Construction", slug: "case-construction", logo },
    ]);
    assert.deepEqual(
      logos.map((l) => [l.nombre, l.logo.alt, l.href]),
      [
        [
          "Caterpillar",
          "Caterpillar",
          "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/caterpillar/",
        ],
        [
          "Case Construction",
          "Case Construction",
          "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/case-construction/",
        ],
      ],
    );
  });

  it("una marca sin nombre o sin dirección no sale", () => {
    assert.deepEqual(
      logosDeMarcasRepuestos([
        { id: 1, nombre: "  ", slug: "x", logo },
        { id: 2, nombre: "Doosan", slug: "", logo },
      ]),
      [],
    );
  });
});

describe("partirTitulo (Venta de repuestos v3)", () => {
  it("pinta en rojo la palabra donde aparece, sin distinguir mayúsculas, con su grafía del título", () => {
    assert.deepEqual(partirTitulo("Encuentra Maquinaria y Repuestos Rápido y Fácil", "repuestos"), {
      antes: "Encuentra Maquinaria y ",
      resaltado: "Repuestos",
      despues: " Rápido y Fácil",
    });
  });

  it("sin palabra, o si el título no la lleva, todo el título en negro", () => {
    const todo = { antes: "Repuestos al día", resaltado: "", despues: "" };
    assert.deepEqual(partirTitulo("Repuestos al día", ""), todo);
    assert.deepEqual(partirTitulo("Repuestos al día", "  "), todo);
    assert.deepEqual(partirTitulo("Repuestos al día", "filtros"), todo);
  });

  it("solo la primera vez", () => {
    assert.deepEqual(partirTitulo("Repuestos y más repuestos", "Repuestos"), {
      antes: "",
      resaltado: "Repuestos",
      despues: " y más repuestos",
    });
  });
});

describe("kit de la portada: piezas de repuestos al mismo tamaño", () => {
  // La pieza dentro de la caja de la foto, en px de la caja virtual (400 × 300).
  const pieza = (
    img: { width: number; height: number },
    r: { x: number; y: number; w: number; h: number },
  ) => {
    const c = colocarFotoRepuesto(img, r)!;
    const anchoImg = (c.ancho / 100) * CAJA_FOTO.ancho;
    const altoImg = (c.alto / 100) * CAJA_FOTO.alto;
    return {
      x: (c.izquierda / 100) * CAJA_FOTO.ancho + r.x * anchoImg,
      y: (c.arriba / 100) * CAJA_FOTO.alto + r.y * altoImg,
      w: r.w * anchoImg,
      h: r.h * altoImg,
      proporcionImg: anchoImg / altoImg,
    };
  };

  it("una pieza que llena el fichero y otra con mucho margen salen con la misma área", () => {
    const llena = pieza({ width: 800, height: 600 }, { x: 0, y: 0, w: 1, h: 1 });
    const pequena = pieza({ width: 800, height: 600 }, { x: 0.3, y: 0.35, w: 0.4, h: 0.3 });
    assert.ok(Math.abs(llena.w * llena.h - pequena.w * pequena.h) < 2);
  });

  it("centrada, sin deformar el fichero y sin salirse de la caja", () => {
    const p = pieza({ width: 1000, height: 1000 }, { x: 0.1, y: 0.4, w: 0.3, h: 0.2 });
    assert.ok(Math.abs(p.x + p.w / 2 - CAJA_FOTO.ancho / 2) < 0.5);
    assert.ok(Math.abs(p.y + p.h / 2 - CAJA_FOTO.alto / 2) < 0.5);
    assert.ok(Math.abs(p.proporcionImg - 1) < 0.01);
    const larga = pieza({ width: 800, height: 600 }, { x: 0, y: 0.45, w: 1, h: 0.1 });
    assert.ok(larga.x >= 0 && larga.x + larga.w <= CAJA_FOTO.ancho + 0.01);
    assert.ok(larga.y >= 0 && larga.y + larga.h <= CAJA_FOTO.alto + 0.01);
  });

  it("sin medidas del fichero, nada que colocar", () => {
    assert.equal(colocarFotoRepuesto({ width: 0, height: 0 }, { x: 0, y: 0, w: 1, h: 1 }), null);
  });
});
