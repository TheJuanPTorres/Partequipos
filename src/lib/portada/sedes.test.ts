import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Sede } from "@/payload-types";

import { sedesDePortada, tokenMapbox } from "./sedes";

const sede = (over: Partial<Sede>) =>
  ({
    id: 1,
    nombre: "Antioquia",
    ciudad: "Medellín",
    departamento: "Antioquia",
    latitud: 6.2442,
    longitud: -75.5812,
    lineas: [
      {
        linea: "Maquinaria",
        localidad: "Guarne",
        direccion: "Autopista Medellín – Bogotá Km 26+800, Guarne",
        telefono: "(604) 448 58 78",
      },
      { linea: "Almacén y repuestos", direccion: "Calle 16 # 45-104, El Poblado" },
    ],
    ...over,
  }) as Sede;

describe("sección 9: sedes", () => {
  it("ficha como en ux-9: «Sede X», «Ciudad, Departamento», líneas y teléfono por línea", () => {
    const [s] = sedesDePortada([sede({})]);
    assert.equal(s?.titulo, "Sede Antioquia");
    assert.equal(s?.etiqueta, "Medellín, Antioquia");
    assert.equal(s?.ciudad, "Medellín");
    assert.equal(s?.lineas[0]?.etiqueta, "Maquinaria · Guarne");
    assert.deepEqual(s?.lineas[0]?.telefono, { texto: "(604) 448 58 78", href: "tel:6044485878" });
    assert.equal(s?.lineas[1]?.telefono, null);
  });

  it("descarta sedes sin ciudad, departamento o coordenadas válidas", () => {
    assert.deepEqual(
      sedesDePortada([
        sede({ ciudad: " " }),
        sede({ departamento: "" }),
        sede({ latitud: 120 }),
        sede({ longitud: undefined as unknown as number }),
      ]),
      [],
    );
  });

  it("descarta líneas incompletas", () => {
    const [s] = sedesDePortada([sede({ lineas: [{ linea: "X", direccion: " " }] })]);
    assert.deepEqual(s?.lineas, []);
  });
});

describe("sección 9: token de Mapbox", () => {
  it("solo un token público (pk.) activa el globo", () => {
    assert.equal(tokenMapbox("pk.eyJ1IjoiYSJ9.abc-DEF_1"), "pk.eyJ1IjoiYSJ9.abc-DEF_1");
    for (const t of [undefined, "", "  ", "sk.eyJ1.abc", "pk.sinpunto", "token"])
      assert.equal(tokenMapbox(t), null, String(t));
  });
});
