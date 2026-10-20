import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cambiarEnlacesPorVisor, type EstadoLexical } from "./enPagina";

const PDF = "https://almacen.example/wp-garantia-v8-1-abc.pdf";
const texto = (t: string) => ({ type: "text", text: t });
const enlace = (url: string, t: string) => ({
  type: "link",
  fields: { url },
  children: [texto(t)],
});
const parrafo = (...children: object[]) => ({ type: "paragraph", children });
const estado = (...children: object[]) => ({ root: { type: "root", children } }) as EstadoLexical;
const DOCS = [{ id: 7, url: PDF, titulo: "Política de garantía" }];
let n = 0;
const id = () => `id${++n}`;

describe("cambiarEnlacesPorVisor", () => {
  it("cambia el párrafo que SOLO enlaza al PDF por el bloque, en el mismo sitio", () => {
    const r = cambiarEnlacesPorVisor(
      estado(
        parrafo(texto("Antes")),
        parrafo(enlace(PDF, "Descargar en PDF")),
        parrafo(texto("Después")),
      ),
      DOCS,
      id,
    );
    assert.deepEqual(r.cambiados, [{ id: 7, titulo: "Política de garantía" }]);
    const hijos = r.estado!.root.children;
    assert.equal(hijos.length, 3);
    assert.equal(hijos[1]!.type, "block");
    assert.deepEqual(
      { ...(hijos[1]!.fields as object), id: "x" },
      { id: "x", blockName: "", blockType: "documentoVisor", documento: 7, titulo: null },
    );
    assert.equal(hijos[0]!.type, "paragraph");
    assert.equal(hijos[2]!.type, "paragraph");
  });

  it("acepta la URL con query y espacios alrededor del enlace", () => {
    const r = cambiarEnlacesPorVisor(
      estado(parrafo(texto(" "), enlace(`${PDF}?v=2`, "PDF"))),
      DOCS,
      id,
    );
    assert.equal(r.cambiados.length, 1);
  });

  it("no toca un enlace dentro de una frase ni el enlace a otro fichero", () => {
    const original = estado(
      parrafo(texto("Lee la "), enlace(PDF, "política"), texto(" antes de comprar.")),
      parrafo(enlace("https://almacen.example/otro.pdf", "Otro")),
    );
    const r = cambiarEnlacesPorVisor(original, DOCS, id);
    assert.equal(r.cambiados.length, 0);
    assert.equal(r.estado, original);
  });

  it("sin contenido, nada", () => {
    assert.deepEqual(cambiarEnlacesPorVisor(null, DOCS, id), { estado: null, cambiados: [] });
  });
});
