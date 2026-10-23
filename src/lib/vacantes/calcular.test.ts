import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calcularVacantes, type Dependencias } from "./calcular";
import { INTERVALO_LECTURA_MS, tocaLeer, vacantesGuardadas, type Guardado } from "./estado";
import type { Vacante } from "./tipos";

const AHORA = Date.parse("2026-10-23T12:00:00.000Z");
const HACE = (horas: number) => new Date(AHORA - horas * 3_600_000).toISOString();
const copia: Vacante[] = [
  { cargo: "Analista TIC", ciudad: "Bogotá", enlace: "https://partequipos.buk.co/s/AAA111" },
];
const nuevas: Vacante[] = [
  ...copia,
  { cargo: "Asesor comercial", ciudad: "Cali", enlace: "https://partequipos.buk.co/s/BBB222" },
];

/** Dependencias falsas: anota lo que se guarda y cuántas veces se lee Buk. */
function con(guardado: Partial<Guardado>, leer: () => Promise<Vacante[]>) {
  const escrito: Partial<Guardado>[] = [];
  let lecturas = 0;
  const dep: Dependencias = {
    ahora: () => AHORA,
    leerGuardado: async () => ({
      leer: true,
      vacantes: null,
      copiaEl: null,
      ultimoIntento: null,
      ultimoError: null,
      ...guardado,
    }),
    guardar: async (d) => {
      escrito.push(d);
    },
    leer: async () => {
      lecturas += 1;
      return leer();
    },
  };
  return { dep, escrito, lecturas: () => lecturas };
}

describe("cuándo se lee Buk", () => {
  const base: Guardado = {
    leer: true,
    vacantes: null,
    copiaEl: null,
    ultimoIntento: null,
    ultimoError: null,
  };
  it("nunca leído, toca; a las 5 h, no; a las 6 h, sí", () => {
    assert.equal(tocaLeer(base, AHORA), true);
    assert.equal(tocaLeer({ ...base, ultimoIntento: HACE(5) }, AHORA), false);
    assert.equal(tocaLeer({ ...base, ultimoIntento: HACE(6) }, AHORA), true);
    assert.equal(INTERVALO_LECTURA_MS, 6 * 3_600_000);
  });
  it("con el interruptor apagado, nunca", () => {
    assert.equal(tocaLeer({ ...base, leer: false }, AHORA), false);
  });
  it("una fecha futura (reloj cambiado) cuenta como pasada", () => {
    assert.equal(
      tocaLeer({ ...base, ultimoIntento: new Date(AHORA + 3_600_000).toISOString() }, AHORA),
      true,
    );
  });
});

describe("las vacantes que se pintan", () => {
  it("lectura buena: se pintan y se guardan como copia", async () => {
    const p = con({}, async () => nuevas);
    const r = await calcularVacantes(p.dep);
    assert.equal(r.origen, "vivo");
    assert.deepEqual(r.vacantes, nuevas);
    assert.deepEqual(p.escrito, [
      {
        vacantes: nuevas,
        copiaEl: new Date(AHORA).toISOString(),
        ultimoIntento: new Date(AHORA).toISOString(),
        ultimoError: "",
      },
    ]);
  });

  it("dentro de las 6 h no lee Buk: pinta lo guardado", async () => {
    const p = con(
      { vacantes: copia, copiaEl: HACE(2), ultimoIntento: HACE(2), ultimoError: "" },
      async () => {
        throw new Error("no debería leer");
      },
    );
    const r = await calcularVacantes(p.dep);
    assert.equal(p.lecturas(), 0);
    assert.equal(r.origen, "vivo");
    assert.deepEqual(r.vacantes, copia);
    assert.equal(p.escrito.length, 0);
  });

  it("LECTURA FALLIDA CON COPIA: la última copia buena, y se anota el fallo", async () => {
    const p = con(
      { vacantes: copia, copiaEl: HACE(7), ultimoIntento: HACE(7), ultimoError: "" },
      async () => {
        throw new Error("el portal de Buk cambió de marcado: no está la lista de vacantes");
      },
    );
    const r = await calcularVacantes(p.dep);
    assert.equal(r.origen, "copia");
    assert.deepEqual(r.vacantes, copia);
    assert.equal(r.leidoEl, HACE(7));
    assert.equal(p.escrito.length, 1);
    assert.equal(p.escrito[0]?.ultimoIntento, new Date(AHORA).toISOString());
    assert.match(p.escrito[0]?.ultimoError ?? "", /cambió de marcado/);
    // La copia no se toca.
    assert.equal("vacantes" in (p.escrito[0] ?? {}), false);
  });

  it("LECTURA FALLIDA SIN COPIA: estado vacío", async () => {
    const p = con({}, async () => {
      throw new Error("HTTP 503");
    });
    const r = await calcularVacantes(p.dep);
    assert.equal(r.origen, "sinDatos");
    assert.deepEqual(r.vacantes, []);
  });

  it("tras un fallo reciente no reintenta en cada visita: copia hasta las 6 h", async () => {
    const p = con(
      { vacantes: copia, copiaEl: HACE(9), ultimoIntento: HACE(1), ultimoError: "HTTP 503" },
      async () => nuevas,
    );
    const r = await calcularVacantes(p.dep);
    assert.equal(p.lecturas(), 0);
    assert.equal(r.origen, "copia");
  });

  it("interruptor apagado: ni lee ni pinta vacantes", async () => {
    const p = con({ leer: false, vacantes: copia, copiaEl: HACE(1) }, async () => nuevas);
    const r = await calcularVacantes(p.dep);
    assert.equal(p.lecturas(), 0);
    assert.equal(r.origen, "apagado");
    assert.deepEqual(r.vacantes, []);
  });

  it("si la base falla al leer, estado vacío (la página no se cae)", async () => {
    const p = con({}, async () => nuevas);
    p.dep.leerGuardado = async () => {
      throw new Error("sin base");
    };
    const r = await calcularVacantes(p.dep);
    assert.equal(r.origen, "sinDatos");
  });

  it("si no se puede guardar la copia, se pinta igual la lectura", async () => {
    const p = con({}, async () => nuevas);
    p.dep.guardar = async () => {
      throw new Error("sin base");
    };
    const r = await calcularVacantes(p.dep);
    assert.equal(r.origen, "vivo");
    assert.deepEqual(r.vacantes, nuevas);
  });
});

describe("la copia guardada", () => {
  it("acepta una lista bien formada y rechaza lo demás", () => {
    assert.deepEqual(vacantesGuardadas(copia), copia);
    assert.equal(vacantesGuardadas(null), null);
    assert.equal(vacantesGuardadas([{ cargo: "x" }]), null);
    assert.equal(
      vacantesGuardadas([{ cargo: "x", ciudad: "y", enlace: "https://otro.example/s/1" }]),
      null,
    );
  });
});
