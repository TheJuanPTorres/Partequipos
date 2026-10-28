import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { enlacesDeCabecera } from "./enlaces";

describe("enlacesDeCabecera", () => {
  it("la tienda (https de otro sitio) es externa; las rutas y el propio dominio, no", () => {
    assert.deepEqual(
      enlacesDeCabecera([
        { etiqueta: "Blog", enlace: "/noticias/", mostrar: true },
        { etiqueta: "Tienda", enlace: "https://tienda.partequipos.com/", mostrar: true },
        { etiqueta: "Nosotros", enlace: "https://partequipos.com/nosotros/" },
      ]),
      [
        { etiqueta: "Blog", href: "/noticias/" },
        { etiqueta: "Tienda", href: "https://tienda.partequipos.com/", externo: true },
        { etiqueta: "Nosotros", href: "https://partequipos.com/nosotros/" },
      ],
    );
  });

  it("«Mostrar» desmarcado lo quita; vacío (filas de antes de la casilla) lo deja", () => {
    assert.deepEqual(
      enlacesDeCabecera([
        { etiqueta: "Blog", enlace: "/noticias/", mostrar: null },
        { etiqueta: "Tienda", enlace: "https://tienda.partequipos.com/", mostrar: false },
      ]).map((e) => e.etiqueta),
      ["Blog"],
    );
  });

  it("sin texto o sin destino no sale, y recorta espacios", () => {
    assert.deepEqual(
      enlacesDeCabecera([
        { etiqueta: "  ", enlace: "/x/" },
        { etiqueta: "Y", enlace: "" },
        { etiqueta: " Tienda ", enlace: " https://tienda.partequipos.com/ " },
      ]),
      [{ etiqueta: "Tienda", href: "https://tienda.partequipos.com/", externo: true }],
    );
    assert.deepEqual(enlacesDeCabecera(undefined), []);
  });
});
