import assert from "node:assert/strict";
import { test } from "node:test";

import { TITULOS_EN_MAYUSCULAS, aTipoTitulo, cambioSeo, decidir, enMayusculas } from "./tipoTitulo";

test("los 18 de la lista, a tipo título con siglas, códigos y preposiciones", () => {
  const despues = TITULOS_EN_MAYUSCULAS.map((t) => aTipoTitulo(t.antes));
  assert.deepEqual(despues, [
    "Martillo para Excavadoras",
    "Acople Rapido para Excavadoras",
    "Pontones para Excavadoras",
    "Brazo Largo para Excavadoras",
    "Barredora para Minicargadores",
    "Porta Pallet para Minicargadores",
    "Rodillo Vibrocompactador para Minicargadores",
    "Línea Húmeda para Minicargadores",
    "Cadenas de Llanta para Minicargadores",
    "Brazo para Minicargadores",
    "Martillo para Minicargadores",
    "Cucharón para Minicargadores",
    "Okada Top 100",
    "Martillo NPK 2015",
    "Crusher NPK G-17 2012",
    "Acople Rápido para Excavadora",
    "Tratamiento de Datos",
    "Términos y Condiciones Campaña Bonos de Recompra",
  ]);
  assert.equal(TITULOS_EN_MAYUSCULAS.length, 18);
});

test("códigos de modelo y siglas se quedan; la primera palabra va en mayúscula aunque sea menor", () => {
  assert.equal(aTipoTitulo("EXCAVADORA CASE CX130D"), "Excavadora CASE CX130D");
  assert.equal(
    aTipoTitulo("EXCAVADORA HITACHI ZX200-3 DE 2016"),
    "Excavadora Hitachi ZX200-3 de 2016",
  );
  assert.equal(aTipoTitulo("DE TODO PARA LA OBRA"), "De Todo para la Obra");
  assert.equal(aTipoTitulo("ÑANDÚ  DEL  SUR"), "Ñandú  del  Sur");
});

test("solo cuenta como «en mayúsculas» lo que tiene una palabra de verdad", () => {
  assert.equal(enMayusculas("MARTILLO NPK 2015"), true);
  assert.equal(enMayusculas("ZX200-3 CX130D"), false);
  assert.equal(enMayusculas("Martillo NPK"), false);
  for (const t of TITULOS_EN_MAYUSCULAS) assert.equal(enMayusculas(t.antes), true, t.antes);
});

test("no pisa lo editado en el panel", () => {
  const antes = "MARTILLO PARA EXCAVADORAS";
  const despues = aTipoTitulo(antes);
  assert.equal(decidir("aplicar", antes, antes, despues), "cambiar");
  assert.equal(decidir("aplicar", despues, antes, despues), "ya-estaba");
  assert.equal(decidir("aplicar", "Martillo hidráulico", antes, despues), "distinto");
  assert.equal(decidir("retirar", despues, antes, despues), "cambiar");
  assert.equal(decidir("retirar", antes, antes, despues), "ya-estaba");
  assert.equal(decidir("retirar", "Otro", antes, despues), "distinto");
  assert.equal(decidir("aplicar", null, antes, despues), "distinto");
});

test("título para buscadores: solo el que está todo en mayúsculas, y retirada exacta", () => {
  const caps = "TÉRMINOS Y CONDICIONES CAMPAÑA BONOS DE RECOMPRA";
  const nuestro = "Términos y Condiciones Campaña Bonos de Recompra";
  assert.deepEqual(cambioSeo("aplicar", caps), {
    decision: "cambiar",
    antes: caps,
    despues: nuestro,
  });
  assert.equal(cambioSeo("aplicar", nuestro)?.decision, "ya-estaba");
  assert.equal(cambioSeo("retirar", nuestro)?.decision, "cambiar");
  assert.equal(cambioSeo("retirar", caps)?.decision, "ya-estaba");
  assert.equal(cambioSeo("aplicar", "Términos de la campaña de bonos"), null);
  assert.equal(cambioSeo("aplicar", "Martillo Npk | partequipos"), null);
  assert.equal(cambioSeo("aplicar", "ZX200-3 CX130D"), null);
  assert.equal(cambioSeo("aplicar", ""), null);
  assert.equal(cambioSeo("aplicar", null), null);
});
