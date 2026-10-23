import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { alCargarTurnstile, montarPendientes } from "./colaTurnstile";

test("dos widgets que esperan al script se montan los dos (antes, el segundo pisaba al primero)", () => {
  const montados: string[] = [];
  alCargarTurnstile(() => montados.push("página"));
  alCargarTurnstile(() => montados.push("ventana"));
  montarPendientes();
  assert.deepEqual(montados, ["página", "ventana"]);
  // Cada uno una sola vez.
  montarPendientes();
  assert.deepEqual(montados, ["página", "ventana"]);
});

test("un widget que se desmonta antes de cargar el script no se monta", () => {
  const montados: string[] = [];
  const quitar = alCargarTurnstile(() => montados.push("ventana cerrada"));
  alCargarTurnstile(() => montados.push("página"));
  quitar();
  montarPendientes();
  assert.deepEqual(montados, ["página"]);
});

test("el componente usa la cola y no escribe su montaje en la función global", () => {
  const fuente = readFileSync("src/components/forms/Turnstile.tsx", "utf8");
  assert.match(fuente, /alCargarTurnstile\(montar\)/);
  assert.match(fuente, /window\.alListoTurnstile = montarPendientes/);
  assert.doesNotMatch(fuente, /window\.alListoTurnstile = montar;/);
});
