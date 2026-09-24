import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PIE_INICIAL, columnasDelPie, hrefTelefono, validarDestinoPie } from "./pie";

describe("pie: columnas", () => {
  it("el contenido inicial da las tres columnas de ux-9, con el teléfono de seoConfig", () => {
    const c = columnasDelPie(PIE_INICIAL.columnas, "+57 317 670 7071");
    assert.deepEqual(
      c.map((x) => x.titulo),
      ["Maquinaria pesada", "Navegación", "Contacto"],
    );
    const call = c[2]!.enlaces[0]!;
    assert.deepEqual(call, { etiqueta: "Call center", href: "tel:+573176707071", interno: false });
  });

  it("descarta enlaces sin etiqueta o con destino inválido, y columnas vacías", () => {
    const c = columnasDelPie(
      [
        {
          titulo: "A",
          enlaces: [
            { etiqueta: "", tipo: "pagina", destino: "/x/" },
            { etiqueta: "Malo", tipo: "pagina", destino: "javascript:alert(1)" },
            { etiqueta: "Bueno", tipo: "pagina", destino: "/bueno/" },
          ],
        },
        { titulo: "Vacía", enlaces: [{ etiqueta: "Sin destino", tipo: "pagina", destino: "" }] },
        { titulo: "  ", enlaces: [{ etiqueta: "X", tipo: "pagina", destino: "/x/" }] },
      ],
      "1",
    );
    assert.deepEqual(c, [
      { titulo: "A", enlaces: [{ etiqueta: "Bueno", href: "/bueno/", interno: true }] },
    ]);
  });
});

describe("pie: validación del destino", () => {
  it("obligatorio para una página; ignorado para el teléfono", () => {
    assert.notEqual(validarDestinoPie("", { siblingData: { tipo: "pagina" } }), true);
    assert.equal(validarDestinoPie("", { siblingData: { tipo: "telefono" } }), true);
    assert.equal(validarDestinoPie("/nosotros/", { siblingData: { tipo: "pagina" } }), true);
    assert.notEqual(validarDestinoPie("//otro.com", { siblingData: { tipo: "pagina" } }), true);
  });

  it("el href de teléfono conserva solo el + y los dígitos", () => {
    assert.equal(hrefTelefono("+57 317 670 7071"), "tel:+573176707071");
  });
});
