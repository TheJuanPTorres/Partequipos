import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Payload } from "payload";
import { renderToStaticMarkup } from "react-dom/server";

import AltFlojos from "./AltFlojos";

type Doc = { id: number; alt: string | null; filename: string | null };

/** Un `payload` falso que solo sabe hacer el `find` del aviso. */
function payloadCon(docs: Doc[]): { payload: Payload; consultas: unknown[] } {
  const consultas: unknown[] = [];
  const payload = {
    find: async (args: unknown) => {
      consultas.push(args);
      return { docs };
    },
  } as unknown as Payload;
  return { payload, consultas };
}

async function pintar(docs: Doc[]): Promise<{ html: string; consultas: unknown[] }> {
  const { payload, consultas } = payloadCon(docs);
  const elemento = await AltFlojos({ payload });
  return { html: elemento ? renderToStaticMarkup(elemento) : "", consultas };
}

describe("AltFlojos (aviso de la lista de Imágenes)", () => {
  it("sin flojas no pinta nada", async () => {
    const { html } = await pintar([
      { id: 1, alt: "Excavadora Hitachi en obra", filename: "a.png" },
    ]);
    assert.equal(html, "");
  });

  it("cuenta, enlaza cada una a su ficha y dice el motivo", async () => {
    const { html } = await pintar([
      { id: 1, alt: "Excavadora Hitachi en obra", filename: "a.png" },
      { id: 7, alt: "hero fondo", filename: "hero-fondo.png" },
      { id: 9, alt: "imagen", filename: "x.jpg" },
    ]);
    assert.match(html, /2 imágenes tienen el texto alternativo flojo/);
    assert.match(
      html,
      /href="\/admin\/collections\/media\/7">hero-fondo\.png<\/a> — Es el nombre del fichero\./,
    );
    assert.match(
      html,
      /href="\/admin\/collections\/media\/9">x\.jpg<\/a> — Es una palabra genérica/,
    );
    assert.doesNotMatch(html, /media\/1"/);
    assert.match(html, /role="status"/);
  });

  it("enumera 12 y cuenta el resto", async () => {
    const docs = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      alt: "",
      filename: `f${i}.png`,
    }));
    const { html } = await pintar(docs);
    assert.match(html, /15 imágenes/);
    assert.equal(html.match(/<li>/g)?.length, 12);
    assert.match(html, /Y 3 más\./);
  });

  it("solo lee id, alt y fichero de media", async () => {
    const { consultas } = await pintar([]);
    assert.deepEqual(consultas, [
      {
        collection: "media",
        depth: 0,
        pagination: false,
        select: { alt: true, filename: true },
        sort: "-updatedAt",
      },
    ]);
  });
});
