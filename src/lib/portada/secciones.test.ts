import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasUsada, EquiposUsado, MarcasMaquinaria, Media } from "@/payload-types";

import {
  enlacesDeUsada,
  fichaDeEquipo,
  tarjetasDeExcavadoras,
  tarjetasDeMarcas,
} from "./secciones";

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

describe("sección 3: enlaces a las categorías", () => {
  it("Excavadoras, Otros y Aditamentos, a su categoría de usados; textos desde el panel", () => {
    assert.deepEqual(
      enlacesDeUsada({ otros: "Otros equipos", aditamentos: "  " }).map((e) => [
        e.etiqueta,
        e.href,
      ]),
      [
        ["Excavadoras", "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/"],
        ["Otros equipos", "/maquinaria-pesada/maquinaria-pesada-usada/otros/"],
        ["Aditamentos", "/maquinaria-pesada/maquinaria-pesada-usada/aditamentos/"],
      ],
    );
  });
});

describe("sección 3: carrusel de excavadoras", () => {
  const exc = cat("excavadoras", "Excavadoras");
  const mini = cat("minicargadores", "Minicargadores");

  it("solo excavadoras, en el orden de la consulta y seis como máximo", () => {
    const r = tarjetasDeExcavadoras([
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((id) => equipo(id, exc)),
      equipo(9, mini),
    ]);
    assert.deepEqual(
      r.map((e) => e.id),
      [1, 2, 3, 4, 5, 6],
    );
  });

  it("nombre entero; «Ver producto» a la página de la unidad (sin dirección, nada)", () => {
    const r = tarjetasDeExcavadoras([
      equipo(1, exc, { nombre: "Excavadora Hitachi ZX350H-5B 2016", slug: "excavadora-hitachi-1" }),
      equipo(2, exc),
    ]);
    assert.deepEqual(
      r.map((e) => [e.nombre, e.href]),
      [
        [
          "Excavadora Hitachi ZX350H-5B 2016",
          "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/excavadora-hitachi-1/",
        ],
        ["Equipo 2", null],
      ],
    );
  });

  it("descarta los no disponibles, los aditamentos y los que no traen la categoría poblada", () => {
    const r = tarjetasDeExcavadoras([
      equipo(1, exc, { disponible: false }),
      equipo(2, 4),
      equipo(3, exc, { pestanaPortada: "aditamentos" }),
      equipo(4, exc),
    ]);
    assert.deepEqual(
      r.map((e) => e.id),
      [4],
    );
    assert.deepEqual(tarjetasDeExcavadoras([]), []);
  });
});
