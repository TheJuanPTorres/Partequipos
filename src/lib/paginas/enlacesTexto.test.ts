import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { enlacesInseguros, errorDeEnlaces, esquemaInseguro } from "./enlacesTexto";

const enlace = (url: string, type = "link") => ({
  type,
  fields: { linkType: "custom", url },
  children: [{ type: "text", text: "x" }],
});
const doc = (...hijos: unknown[]) => ({
  root: { type: "root", children: [{ type: "paragraph", children: hijos }] },
});

describe("enlaces del texto enriquecido", () => {
  it("admite rutas, anclas, https, http, mailto y tel", () => {
    for (const u of [
      "/contactanos/",
      "#taller",
      "https://a.co",
      "http://a.co",
      "mailto:a@b.co",
      "tel:+573001234567",
      "pagina",
    ]) {
      assert.equal(esquemaInseguro(u), null, u);
    }
  });
  it("rechaza javascript:, data:, vbscript: y file:, también disfrazados", () => {
    for (const [u, e] of [
      ["javascript:alert(1)", "javascript:"],
      ["JavaScript:alert(1)", "javascript:"],
      [" java\tscript:alert(1)", "javascript:"],
      ["data:text/html;base64,PHNjcmlwdD4=", "data:"],
      ["data:image/png;base64,AAAA", "data:"],
      ["vbscript:x", "vbscript:"],
      ["file:///etc/passwd", "file:"],
    ]) {
      assert.equal(esquemaInseguro(u!), e, u);
    }
  });
  it("encuentra los enlaces en cualquier campo, también anidados y autolink", () => {
    const pagina = {
      contenido: doc(enlace("/ok/"), enlace("javascript:x")),
      secciones: [{ contenido: doc(enlace("data:text/html,x", "autolink")) }],
    };
    assert.deepEqual(
      enlacesInseguros(pagina).map((m) => m.esquema),
      ["javascript:", "data:"],
    );
    assert.match(errorDeEnlaces(pagina) ?? "", /2 enlaces .*javascript:, data:/);
    assert.equal(errorDeEnlaces({ contenido: doc(enlace("https://a.co")) }), null);
  });
});
