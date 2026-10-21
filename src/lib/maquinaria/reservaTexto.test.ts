import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { reservaDescripcion, textoPlanoLexical } from "./reservaTexto";

const parrafo = (...hijos: object[]) => ({ type: "paragraph", children: hijos });
const texto = (t: string) => ({ type: "text", text: t });
const doc = (...bloques: object[]) => ({ root: { type: "root", children: bloques } });

describe("textoPlanoLexical", () => {
  it("un párrafo por bloque, separados por una línea en blanco, con el texto inline unido", () => {
    assert.equal(
      textoPlanoLexical(
        doc(parrafo(texto("Potencia, "), texto("eficiencia")), {
          type: "heading",
          children: [texto("Título")],
        }),
      ),
      "Potencia, eficiencia\n\nTítulo",
    );
  });

  it("los saltos de línea y los elementos de lista, en líneas aparte; sin bloques vacíos", () => {
    assert.equal(
      textoPlanoLexical(
        doc(parrafo(texto("a"), { type: "linebreak" }, texto("b")), parrafo(), {
          type: "list",
          children: [
            { type: "listitem", children: [texto("uno")] },
            { type: "listitem", children: [texto("dos")] },
          ],
        }),
      ),
      "a\nb\n\nuno\ndos",
    );
  });

  it("sin datos, vacío", () => {
    assert.equal(textoPlanoLexical(null), "");
    assert.equal(textoPlanoLexical({}), "");
  });
});

describe("reservaDescripcion", () => {
  it("la entradilla y la descripción, como en la ficha", () => {
    assert.equal(reservaDescripcion(" Hola ", doc(parrafo(texto("x")))), "Hola\n\nx");
    assert.equal(reservaDescripcion("", doc(parrafo(texto("x")))), "x");
  });
});
