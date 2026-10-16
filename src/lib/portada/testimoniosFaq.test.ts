import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ficheroTestimonio,
  preguntasPorCrear,
  problemasDeLaFuente,
  testimoniosPorCrear,
  type FuenteTestimoniosFaq,
} from "./testimoniosFaq";

const fuente: FuenteTestimoniosFaq = {
  preguntas: [
    { orden: 1, pregunta: "¿Qué venden?", respuesta: "Maquinaria." },
    { orden: 2, pregunta: "¿Dónde están?", respuesta: "En varias ciudades." },
  ],
  testimonios: [
    {
      orden: 1,
      clave: "uno",
      empresa: "Obras Ejemplo SAS",
      ciudad: null,
      youtube: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
      imagen: "https://ejemplo.com/a.jpg",
    },
    {
      orden: 2,
      clave: "dos",
      empresa: "Agregados Muestra",
      ciudad: "Cali",
      youtube: "https://www.youtube.com/watch?v=bbbbbbbbbbb",
      imagen: "https://ejemplo.com/b.png",
    },
  ],
};

describe("importador de preguntas y testimonios reales", () => {
  it("una fuente buena no da problemas", () => {
    assert.deepEqual(problemasDeLaFuente(fuente), []);
  });

  it("detecta enlaces ajenos, vídeos y claves repetidas, y empresas vacías", () => {
    const mala: FuenteTestimoniosFaq = {
      ...fuente,
      testimonios: [
        { ...fuente.testimonios[0]!, youtube: "https://evil.com/x" },
        { ...fuente.testimonios[1]!, clave: "dos" },
        { ...fuente.testimonios[1]!, clave: "dos", empresa: " " },
      ],
    };
    const p = problemasDeLaFuente(mala).join(" | ");
    assert.match(p, /enlace de YouTube no válido/);
    assert.match(p, /vídeo repetido/);
    assert.match(p, /clave repetida/);
    assert.match(p, /sin empresa/);
  });

  it("solo crea lo que falta: es idempotente", () => {
    assert.deepEqual(
      preguntasPorCrear(fuente.preguntas, ["¿QUÉ VENDEN?"]).map((q) => q.orden),
      [2],
    );
    assert.deepEqual(
      testimoniosPorCrear(fuente.testimonios, ["https://youtu.be/aaaaaaaaaaa", null]).map(
        (t) => t.clave,
      ),
      ["dos"],
    );
    assert.deepEqual(
      testimoniosPorCrear(fuente.testimonios, [
        "https://www.youtube.com/watch?v=aaaaaaaaaaa",
        "https://www.youtube.com/watch?v=bbbbbbbbbbb&t=5s",
      ]),
      [],
    );
  });

  it("el fichero de la miniatura lleva su prefijo y la extensión de origen", () => {
    assert.equal(
      ficheroTestimonio("Uno Dos", "https://x.com/a/B.PNG?v=1"),
      "wp-real-testimonio-uno-dos.png",
    );
    assert.equal(ficheroTestimonio("uno", "https://x.com/a"), "wp-real-testimonio-uno.jpg");
  });
});
