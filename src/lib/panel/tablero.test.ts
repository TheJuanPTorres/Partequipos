import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cifrasDePortada, editadosPorMi, type Reciente } from "./portada";

describe("tablero del panel: cifras", () => {
  it("una tarjeta por dato que el rol puede leer, en orden, con enlace y tono", () => {
    const c = cifrasDePortada({
      solicitudesNuevas: 4,
      incompletas: { "equipos-nuevos": 22, "equipos-usados": 4, "modelos-repuesto": 21 },
      fotosPequenas: 1629,
      busquedasSinResultado: 0,
    });
    assert.deepEqual(
      c.map((x) => [x.clave, x.valor, x.tono]),
      [
        ["solicitudes", 4, "atencion"],
        ["incompletas", 47, "atencion"],
        ["fotos", 1629, "atencion"],
        ["busquedas", 0, "exito"],
      ],
    );
    assert.equal(c[0]!.href, "/admin/collections/solicitudes?where[estado][equals]=nueva");
    // El enlace de las incompletas va a la lista con más.
    assert.equal(c[1]!.href, "/admin/collections/equipos-nuevos");
    assert.equal(c[3]!.detalle, "Ninguna");
  });

  it("lo que el rol no puede leer no sale", () => {
    assert.deepEqual(
      cifrasDePortada({ fotosPequenas: 2 }).map((x) => x.clave),
      ["fotos"],
    );
    assert.deepEqual(cifrasDePortada({ incompletas: {} }), []);
    assert.deepEqual(cifrasDePortada({}), []);
  });
});

describe("tablero del panel: lo último que editaste", () => {
  const r = (titulo: string, editor: string, actualizado: string): Reciente => ({
    slug: "x",
    coleccion: "X",
    titulo,
    href: `/admin/collections/x/${titulo}`,
    actualizado,
    editor,
  });

  it("solo lo de quien mira, lo más nuevo primero y como mucho n", () => {
    const listas = [
      [
        r("a", "ti", "2026-11-24T10:00:00Z"),
        r("b", "otra persona del equipo", "2026-11-24T12:00:00Z"),
      ],
      [r("c", "ti", "2026-11-24T11:00:00Z"), r("d", "—", "2026-11-24T13:00:00Z")],
      [r("e", "ti", "2026-11-23T09:00:00Z")],
    ];
    assert.deepEqual(
      editadosPorMi(listas, 2).map((x) => x.titulo),
      ["c", "a"],
    );
  });
});
