import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { horarioJsonLd, textoDias, textoHora, tramosValidos, validarHora } from "./horario";

const SEMANA = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

describe("horario: validación", () => {
  it("acepta HH:MM en 24 horas", () => {
    for (const h of ["08:00", "17:30", "00:00", "23:59"]) assert.equal(validarHora(h), true, h);
  });
  it("rechaza lo demás", () => {
    for (const h of ["8:00", "24:00", "17:60", "5 pm", "", null, 800])
      assert.equal(typeof validarHora(h), "string", String(h));
  });
});

describe("horario: tramos válidos", () => {
  it("el horario actual: L–V 08:00–17:30 y S 09:00–12:00", () => {
    const t = tramosValidos([
      { dias: SEMANA, abre: "08:00", cierra: "17:30" },
      { dias: ["Saturday"], abre: "09:00", cierra: "12:00" },
    ]);
    assert.equal(t.length, 2);
  });
  it("descarta tramos sin días, con horas no válidas o que cierran antes de abrir", () => {
    assert.deepEqual(
      tramosValidos([
        { dias: [], abre: "08:00", cierra: "17:00" },
        { dias: ["Monday"], abre: "8:00", cierra: "17:00" },
        { dias: ["Monday"], abre: "18:00", cierra: "17:00" },
        { dias: ["Lunes"], abre: "08:00", cierra: "17:00" },
      ]),
      [],
    );
  });
  it("ordena los días y quita repetidos", () => {
    assert.deepEqual(
      tramosValidos([{ dias: ["Friday", "Monday", "Monday"], abre: "08:00", cierra: "09:00" }])[0]
        ?.dias,
      ["Monday", "Friday"],
    );
  });
  it("sin datos, sin tramos", () => {
    assert.deepEqual(tramosValidos(null), []);
  });
});

describe("horario: JSON-LD y texto", () => {
  const tramos = tramosValidos([
    { dias: SEMANA, abre: "08:00", cierra: "17:30" },
    { dias: ["Saturday"], abre: "09:00", cierra: "12:00" },
  ]);
  it("OpeningHoursSpecification por tramo, con días de schema.org", () => {
    assert.deepEqual(horarioJsonLd(tramos)[1], {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["https://schema.org/Saturday"],
      opens: "09:00",
      closes: "12:00",
    });
    assert.equal((horarioJsonLd(tramos)[0]?.dayOfWeek as string[]).length, 5);
  });
  it("texto: rangos seguidos, sueltos y horas sin cero", () => {
    assert.equal(textoDias(tramos[0]?.dias ?? []), "lunes a viernes");
    assert.equal(textoDias(["Saturday"]), "sábado");
    assert.equal(textoDias(["Monday", "Wednesday", "Friday"]), "lunes, miércoles y viernes");
    assert.equal(textoDias(["Saturday", "Sunday"]), "sábado y domingo");
    assert.equal(textoHora("08:00"), "8:00");
    assert.equal(textoHora("17:30"), "17:30");
  });
});
