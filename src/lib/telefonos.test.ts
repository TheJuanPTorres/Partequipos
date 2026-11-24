import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { enlaceTel, numeroParaMarcar, telefonosDeTexto } from "./telefonos";

describe("teléfonos publicados", () => {
  it("dos números en un campo: un enlace por número, nunca pegados", () => {
    assert.deepEqual(telefonosDeTexto("3000000001 / (601)4000002"), [
      { texto: "3000000001", href: "tel:+573000000001" },
      { texto: "(601)4000002", href: "tel:+576014000002" },
    ]);
  });

  it("separa por «/», «;», «,», «|» y por «y» / «o»; no por espacios ni guiones", () => {
    assert.deepEqual(
      telefonosDeTexto("(604) 400 00 03; 300-000-0004 y 3000000005 | 3000000006, 3000000007").map(
        (t) => t.href,
      ),
      [
        "tel:+576044000003",
        "tel:+573000000004",
        "tel:+573000000005",
        "tel:+573000000006",
        "tel:+573000000007",
      ],
    );
  });

  it("un trozo que no es un número (una extensión) sale como texto, sin enlace", () => {
    assert.deepEqual(telefonosDeTexto("3000000001 / ext. 12"), [
      { texto: "3000000001", href: "tel:+573000000001" },
      { texto: "ext. 12", href: null },
    ]);
  });

  it("vacío, sin nada", () => {
    assert.deepEqual(telefonosDeTexto(""), []);
    assert.deepEqual(telefonosDeTexto(null), []);
    assert.deepEqual(telefonosDeTexto("   "), []);
  });

  it("el prefijo: respeta «+», lo pone a móviles y fijos de Colombia y no lo inventa en el resto", () => {
    assert.equal(numeroParaMarcar("+57 300 000 0001"), "+573000000001");
    assert.equal(numeroParaMarcar("57 300 000 0001"), "+573000000001");
    assert.equal(numeroParaMarcar("300 000 0001"), "+573000000001");
    assert.equal(numeroParaMarcar("(602) 400 0002"), "+576024000002");
    assert.equal(numeroParaMarcar("+1 555 000 0000"), "+15550000000");
    assert.equal(numeroParaMarcar("400-00-02"), "4000002");
    assert.equal(numeroParaMarcar("123"), null);
    assert.equal(enlaceTel("ext. 12"), null);
  });
});
