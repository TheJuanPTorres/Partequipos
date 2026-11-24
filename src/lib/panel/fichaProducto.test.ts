import assert from "node:assert/strict";
import { test } from "node:test";

import { completitudUsada } from "./fichaUsada";
import {
  FICHAS,
  PARTES_MODELO,
  PARTES_NUEVA,
  completitud,
  insigniaWeb,
  valoresSugeridos,
} from "./fichaProducto";

const texto = (t: string) => ({ root: { children: [{ children: [{ text: t }] }] } });

test("nueva completa al 100 % y lo que falta, en el orden de la ficha", () => {
  const llena = {
    nombre: "Excavadora Hitachi ZX130-5B",
    marca: 1,
    tipo: 2,
    codigo: "ZX130-5B",
    entradilla: "Compacta y potente.",
    descripcion: texto("Para obra urbana."),
    imagenes: [1, 2, 3],
    fichaTecnica: [{}, {}, {}, {}, {}],
    fichaTecnicaPdf: 9,
  };
  assert.deepEqual(completitud(PARTES_NUEVA, llena), { porcentaje: 100, faltan: [] });
  const r = completitud(PARTES_NUEVA, {
    ...llena,
    descripcion: texto("   "),
    imagenes: [1],
    fichaTecnicaPdf: null,
  });
  assert.deepEqual(r.faltan, [
    "Descripción comercial",
    "Fotos (al menos 3)",
    "Ficha técnica en PDF",
  ]);
  assert.equal(r.porcentaje, Math.round(((12 - 1 - 2 - 1) / 12) * 100));
});

test("modelo de repuestos: una foto basta", () => {
  const r = completitud(PARTES_MODELO, {
    nombre: "320D",
    marca: 1,
    tipo: 1,
    codigo: "320D",
    imagenes: [5],
  });
  assert.deepEqual(r.faltan, ["Descripción"]);
});

test("el estado de nuevas y modelos: oculta solo si está desmarcada", () => {
  assert.equal(insigniaWeb({ mostrarEnWeb: false }).texto, "Oculta");
  assert.equal(insigniaWeb({ mostrarEnWeb: true }).texto, "Publicada");
  assert.equal(insigniaWeb({}).texto, "Publicada");
  assert.equal(FICHAS["equipos-usados"].insignia({ disponible: false }).texto, "Vendida");
});

test("usadas: la misma cuenta que el prototipo", () => {
  const d = { nombre: "x", imagenes: [1, 2] };
  assert.deepEqual(completitud(FICHAS["equipos-usados"].partes, d), completitudUsada(d));
});

test("el resumen lee los campos de las partes y los del estado, sin repetir", () => {
  assert.ok(FICHAS["equipos-nuevos"].campos.includes("mostrarEnWeb"));
  assert.ok(FICHAS["equipos-usados"].campos.includes("disponible"));
  const c = FICHAS["modelos-repuesto"].campos;
  assert.equal(c.length, new Set(c).size);
});

test("sugerencias: sin vacíos ni repetidos (sin distinguir mayúsculas), ordenadas", () => {
  assert.deepEqual(valoresSugeridos(["ZX130", " zx130 ", "", null, "EX200", 3]), [
    "EX200",
    "ZX130",
  ]);
});
