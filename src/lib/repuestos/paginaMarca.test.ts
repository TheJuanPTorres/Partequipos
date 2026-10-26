import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasTecnica, Media } from "@/payload-types";

import { vistaBienvenida, vistaPorQuePropia } from "./paginaMarca";

const foto = (id: number) =>
  ({ id, url: `/f${id}.jpg`, alt: `Foto ${id}`, width: 800, height: 560 }) as Media;

type Pagina = CategoriasTecnica["paginaMarca"];
const cat = (paginaMarca: Pagina) => ({ nombre: "Filtros Donaldson", paginaMarca });

describe("presentación de una página de marca", () => {
  it("sin título, texto ni fotos, no se pinta", () => {
    assert.equal(vistaBienvenida(cat(undefined)), null);
    assert.equal(vistaBienvenida(cat({ bienvenidaTitulo: "  ", bienvenidaFotos: [] })), null);
  });

  it("las fotos sin fichero se saltan; el resto, en su orden", () => {
    const v = vistaBienvenida(
      cat({ bienvenidaTitulo: " Construcción ", bienvenidaFotos: [foto(2), 7, foto(1)] }),
    );
    assert.equal(v?.titulo, "Construcción");
    assert.deepEqual(
      v?.fotos.map((f) => f.url),
      ["/f2.jpg", "/f1.jpg"],
    );
  });
});

describe("«¿Por qué elegirnos?» propio", () => {
  const global = { porQueBoton: "Solicita asesoría" };

  it("sin título o sin foto, el general (null)", () => {
    assert.equal(vistaPorQuePropia(cat({ porQueTitulo: "¿Por qué elegirnos?" }), global), null);
    assert.equal(vistaPorQuePropia(cat({ porQueImagen: foto(3) }), global), null);
  });

  it("con título y foto: su texto, la frase destacada y el botón del general", () => {
    const v = vistaPorQuePropia(
      cat({
        porQueTitulo: "¿Por qué elegirnos?",
        porQueImagen: foto(3),
        porQueTexto: "Descubra…",
        compromisoTitulo: "Nuestro compromiso",
        compromisoTexto: "A nivel nacional.",
      }),
      global,
    );
    assert.equal(v?.texto, "Descubra…");
    assert.deepEqual(v?.compromiso, { titulo: "Nuestro compromiso", texto: "A nivel nacional." });
    assert.equal(v?.boton, "Solicita asesoría");
    assert.deepEqual(v?.puntos, []);
  });
});
