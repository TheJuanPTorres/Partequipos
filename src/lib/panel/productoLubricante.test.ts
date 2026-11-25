import assert from "node:assert/strict";
import { test } from "node:test";

import { etiquetaProducto } from "./productoLubricante";

test("la fila dice el producto con su grado, y nada que falte si tiene foto y ficha", () => {
  assert.deepEqual(etiquetaProducto({ nombre: "I-SINT", grado: "0W-20", imagen: 4, ficha: 9 }, 1), {
    titulo: "I-SINT 0W-20",
    oculto: false,
    faltan: [],
  });
});

test("sin nombre, el número de la fila; y lo que falta", () => {
  assert.deepEqual(etiquetaProducto({ grado: "  " }, 3), {
    titulo: "Producto 03 (sin nombre)",
    oculto: false,
    faltan: ["foto", "ficha técnica"],
  });
  assert.deepEqual(etiquetaProducto(undefined, 12).titulo, "Producto 12 (sin nombre)");
});

test("oculto solo si «Mostrar en la web» está desmarcado", () => {
  assert.equal(etiquetaProducto({ nombre: "X", mostrarEnWeb: false }, 1).oculto, true);
  assert.equal(etiquetaProducto({ nombre: "X" }, 1).oculto, false);
});
