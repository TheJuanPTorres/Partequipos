import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasUsada, EquiposUsado, MarcasMaquinaria, Media } from "@/payload-types";

import { fichaDeEquipo, pestanasDeUsada, tarjetasDeMarcas } from "./secciones";

const media = (id: number, alt = ""): Media =>
  ({ id, url: `/m/${id}.jpg`, alt, width: 800, height: 600 }) as Media;

const marca = (over: Partial<MarcasMaquinaria>): MarcasMaquinaria =>
  ({ id: 1, nombre: "Hitachi", slug: "hitachi", ordenPortada: 1, ...over }) as MarcasMaquinaria;

const cat = (slug: string, nombre: string): CategoriasUsada =>
  ({ id: slug.length, slug, nombre }) as CategoriasUsada;

const equipo = (
  id: number,
  categoria: CategoriasUsada | number,
  over: Partial<EquiposUsado> = {},
) => ({ id, nombre: `Equipo ${id}`, categoria, disponible: true, ...over }) as EquiposUsado;

describe("sección 2: tarjetas de marca", () => {
  it("en el orden de su posición en la portada; sin posición no salen (Dynapac, LiuGong)", () => {
    const r = tarjetasDeMarcas([
      marca({ id: 3, nombre: "Yanmar", slug: "yanmar", ordenPortada: 3, imagenTarjeta: media(12) }),
      marca({ id: 1, imagenTarjeta: media(10) }),
      marca({
        id: 2,
        nombre: "CASE",
        slug: "case-construction",
        ordenPortada: 2,
        imagenTarjeta: media(11),
      }),
      marca({
        id: 4,
        nombre: "Dynapac",
        slug: "dynapac",
        ordenPortada: null,
        imagenTarjeta: media(13),
      }),
    ]);
    assert.deepEqual(
      r.map((t) => t.nombre),
      ["Hitachi", "CASE", "Yanmar"],
    );
  });

  it("solo las marcas con foto de tarjeta; el resto no sale", () => {
    const r = tarjetasDeMarcas([
      marca({ id: 1, imagenTarjeta: media(10) }),
      marca({ id: 2, nombre: "Aditamentos", slug: "aditamentos" }),
    ]);
    assert.deepEqual(
      r.map((t) => t.id),
      [1],
    );
  });

  it("fondo decorativo (alt vacío) y logo con el nombre de la marca como alt", () => {
    const [t] = tarjetasDeMarcas([
      marca({ imagenTarjeta: media(10, "algo"), logo: media(11, "logo viejo") }),
    ]);
    assert.equal(t!.fondo.alt, "");
    assert.equal(t!.logo!.alt, "Hitachi");
    assert.equal(t!.href, "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/");
  });

  it("sin logo poblado la tarjeta sale igual, sin logo", () => {
    const [t] = tarjetasDeMarcas([marca({ imagenTarjeta: media(10), logo: 11 })]);
    assert.equal(t!.logo, null);
  });
});

describe("sección 3: ficha", () => {
  it("peso, año y horómetro, en orden, con coma decimal y separador de miles", () => {
    assert.deepEqual(
      fichaDeEquipo({ pesoOperativo: 8.4, anio: 2016, horometro: 12500 }).map(
        (d) => `${d.etiqueta}: ${d.valor}`,
      ),
      ["Peso operativo: 8,4 t", "Año: 2016", "Horómetro: 12.500 h"],
    );
  });

  it("separador de miles también con cuatro cifras", () => {
    assert.deepEqual(
      fichaDeEquipo({ pesoOperativo: null, anio: null, horometro: 4500 }).map((d) => d.valor),
      ["4.500 h"],
    );
  });

  it("omite lo que falta o no tiene sentido (0, negativo, vacío)", () => {
    assert.deepEqual(fichaDeEquipo({ pesoOperativo: 0, anio: null, horometro: -3 }), []);
  });
});

describe("sección 3: pestañas", () => {
  const exc = cat("excavadoras", "Excavadoras");
  const mini = cat("minicargadores", "Minicargadores");

  it("Excavadoras y Otros, tres tarjetas como máximo en cada una (Home V2)", () => {
    const r = pestanasDeUsada([
      equipo(1, exc),
      equipo(2, mini),
      equipo(3, exc),
      equipo(4, exc),
      equipo(5, cat("cargadores", "Cargadores")),
      equipo(6, exc),
    ]);
    assert.deepEqual(
      r.map((p) => [p.etiqueta, p.equipos.map((e) => e.id)]),
      [
        ["Excavadoras", [1, 3, 4]],
        ["Otros", [2, 5]],
      ],
    );
  });

  it("nombre entero; «Ficha técnica» lleva a la página de la unidad, «Ver más» a su categoría", () => {
    const [p] = pestanasDeUsada([
      equipo(1, exc, { nombre: "Excavadora Hitachi ZX350H-5B 2016", slug: "excavadora-hitachi-1" }),
      equipo(2, exc),
    ]);
    assert.deepEqual(
      p!.equipos.map((e) => [e.nombre, e.href, e.hrefFicha]),
      [
        [
          "Excavadora Hitachi ZX350H-5B 2016",
          "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/",
          "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/excavadora-hitachi-1/",
        ],
        ["Equipo 2", "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/", null],
      ],
    );
  });

  it("descarta los no disponibles y los que no traen la categoría poblada", () => {
    const r = pestanasDeUsada([
      equipo(1, exc, { disponible: false }),
      equipo(2, 4),
      equipo(3, mini),
    ]);
    assert.deepEqual(
      r.map((p) => p.clave),
      ["otros"],
    );
  });

  it("tercera pestaña: los marcados como aditamentos; etiquetas desde el panel", () => {
    const r = pestanasDeUsada(
      [
        equipo(1, exc),
        equipo(2, mini),
        equipo(3, exc, { pestanaPortada: "aditamentos" }),
        equipo(4, mini, { pestanaPortada: "aditamentos" }),
      ],
      { excavadoras: "Excavadoras", otros: "Otros equipos", aditamentos: "Aditamentos" },
    );
    assert.deepEqual(
      r.map((p) => [p.clave, p.etiqueta, p.equipos.map((e) => e.id)]),
      [
        ["excavadoras", "Excavadoras", [1]],
        ["otros", "Otros equipos", [2]],
        ["aditamentos", "Aditamentos", [3, 4]],
      ],
    );
  });

  it("sin equipos, ninguna pestaña; el enlace va a la categoría del equipo", () => {
    assert.deepEqual(pestanasDeUsada([]), []);
    const [p] = pestanasDeUsada([equipo(1, mini)]);
    assert.equal(p!.equipos[0]!.href, "/maquinaria-pesada/maquinaria-pesada-usada/minicargadores/");
  });
});
