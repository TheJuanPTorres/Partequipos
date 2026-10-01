import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Media, PreguntasFrecuente, Testimonio } from "@/payload-types";

import { buildFaqJsonLd } from "../seo/jsonLd";
import { preguntasDeFaq, tarjetaInicial, tarjetasDeTestimonios } from "./seccionesH";

const media = (id: number): Media =>
  ({ id, url: `/m/${id}.jpg`, alt: "otra cosa", width: 1400, height: 900 }) as Media;

const testimonio = (over: Partial<Testimonio>): Testimonio =>
  ({
    id: 1,
    nombre: "Alejandro Morales",
    cita: "Muy buen servicio.",
    publicado: true,
    ...over,
  }) as Testimonio;

describe("sección 10: testimonios", () => {
  it("solo los publicados, aunque la consulta los traiga todos", () => {
    const r = tarjetasDeTestimonios([
      testimonio({ id: 1 }),
      testimonio({ id: 2, publicado: false }),
      testimonio({ id: 3, publicado: null }),
    ]);
    assert.deepEqual(
      r.map((t) => t.id),
      [1],
    );
  });

  it("como ux-9: grande la empresa, pequeño la ciudad; la foto nombra a la persona", () => {
    const [t] = tarjetasDeTestimonios([
      testimonio({ empresa: " EMT SAS ", ciudad: "Cali", foto: media(5) }),
    ]);
    assert.equal(t!.titulo, "EMT SAS");
    assert.equal(t!.subtitulo, "Cali");
    assert.equal(t!.foto!.alt, "Alejandro Morales");
  });

  it("sin empresa, el título es la persona; sin ciudad, nada", () => {
    const [t] = tarjetasDeTestimonios([testimonio({ empresa: "", ciudad: null })]);
    assert.equal(t!.titulo, "Alejandro Morales");
    assert.equal(t!.subtitulo, null);
  });

  it("el YouTube se lee con su segundo de inicio; uno ajeno se descarta", () => {
    const [a, b] = tarjetasDeTestimonios([
      testimonio({ id: 1, youtube: "https://www.youtube.com/watch?v=hBeMsx5WEko&t=21s" }),
      testimonio({ id: 2, youtube: "https://evil.com/x" }),
    ]);
    assert.deepEqual(a!.youtube, { id: "hBeMsx5WEko", inicio: 21 });
    assert.equal(b!.youtube, null);
  });

  it("la abierta al cargar es la segunda, o la única", () => {
    assert.equal(tarjetaInicial(4), 1);
    assert.equal(tarjetaInicial(1), 0);
  });
});

describe("sección 11: preguntas frecuentes", () => {
  const p = (over: Partial<PreguntasFrecuente>) =>
    ({
      id: 1,
      pregunta: "¿Qué?",
      respuesta: "Esto.",
      publicada: true,
      ...over,
    }) as PreguntasFrecuente;

  it("solo las publicadas y completas", () => {
    const r = preguntasDeFaq([
      p({ id: 1 }),
      p({ id: 2, publicada: false }),
      p({ id: 3, respuesta: " " }),
    ]);
    assert.deepEqual(
      r.map((x) => x.id),
      [1],
    );
  });

  it("JSON-LD FAQPage con sus preguntas; sin preguntas, no se emite", () => {
    const j = buildFaqJsonLd([{ pregunta: "¿Qué?", respuesta: "Esto." }]);
    assert.equal(j!["@type"], "FAQPage");
    assert.deepEqual((j!.mainEntity as unknown[])[0], {
      "@type": "Question",
      name: "¿Qué?",
      acceptedAnswer: { "@type": "Answer", text: "Esto." },
    });
    assert.equal(buildFaqJsonLd([]), null);
  });
});
