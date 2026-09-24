import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasUsada, EquiposUsado, MarcasMaquinaria, Media } from "@/payload-types";

import { fichaDeEquipo, lineasDeNombre, pestanasDeUsada, tarjetasDeMarcas } from "./secciones";

const media = (id: number, alt = ""): Media =>
  ({ id, url: `/m/${id}.jpg`, alt, width: 800, height: 600 }) as Media;

const marca = (over: Partial<MarcasMaquinaria>): MarcasMaquinaria =>
  ({ id: 1, nombre: "Hitachi", slug: "hitachi", ...over }) as MarcasMaquinaria;

const cat = (slug: string, nombre: string): CategoriasUsada =>
  ({ id: slug.length, slug, nombre }) as CategoriasUsada;

const equipo = (
  id: number,
  categoria: CategoriasUsada | number,
  over: Partial<EquiposUsado> = {},
) => ({ id, nombre: `Equipo ${id}`, categoria, disponible: true, ...over }) as EquiposUsado;

describe("sección 2: tarjetas de marca", () => {
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

describe("sección 3: nombre en dos líneas", () => {
  it("quita el modelo del final del nombre", () => {
    assert.deepEqual(lineasDeNombre("Excavadora Hitachi ZX75US-7", "ZX75US-7"), {
      principal: "Excavadora Hitachi",
      modelo: "ZX75US-7",
    });
  });

  it("si el nombre no acaba en el modelo, lo deja entero", () => {
    assert.deepEqual(lineasDeNombre("Excavadora Hitachi", "ZX75"), {
      principal: "Excavadora Hitachi",
      modelo: "ZX75",
    });
  });

  it("sin modelo, una sola línea; y nunca deja la principal vacía", () => {
    assert.deepEqual(lineasDeNombre("PC200", null), { principal: "PC200", modelo: null });
    assert.deepEqual(lineasDeNombre("PC200", "pc200"), { principal: "PC200", modelo: "pc200" });
  });
});

describe("sección 3: ficha", () => {
  it("peso, potencia y motor, en orden, con coma decimal", () => {
    assert.deepEqual(
      fichaDeEquipo({ pesoOperativo: 8.4, potencia: 64, motor: " YANMAR 4TNV98CT " }).map(
        (d) => `${d.etiqueta}: ${d.valor}`,
      ),
      ["Peso operativo: 8,4 t", "Potencia: 64 hp", "Motor: YANMAR 4TNV98CT"],
    );
  });

  it("omite lo que falta o no tiene sentido (0, negativo, vacío)", () => {
    assert.deepEqual(fichaDeEquipo({ pesoOperativo: 0, potencia: null, motor: "  " }), []);
  });
});

describe("sección 3: pestañas", () => {
  const exc = cat("excavadoras", "Excavadoras");
  const mini = cat("minicargadores", "Minicargadores");

  it("Excavadoras y Otros, dos tarjetas como máximo en cada una", () => {
    const r = pestanasDeUsada([
      equipo(1, exc),
      equipo(2, mini),
      equipo(3, exc),
      equipo(4, exc),
      equipo(5, cat("cargadores", "Cargadores")),
    ]);
    assert.deepEqual(
      r.map((p) => [p.etiqueta, p.equipos.map((e) => e.id)]),
      [
        ["Excavadoras", [1, 3]],
        ["Otros", [2, 5]],
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

  it("sin equipos, ninguna pestaña; el enlace va a la categoría del equipo", () => {
    assert.deepEqual(pestanasDeUsada([]), []);
    const [p] = pestanasDeUsada([equipo(1, mini)]);
    assert.equal(p!.equipos[0]!.href, "/maquinaria-pesada/maquinaria-pesada-usada/minicargadores/");
  });
});
