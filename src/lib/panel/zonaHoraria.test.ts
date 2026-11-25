import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";

import { fijarZonaDelPanel, ZONA_PANEL, zonaDelProceso } from "./zonaHoraria";

it("dentro de Next, el proceso pasa a la hora de Colombia", () => {
  assert.equal(zonaDelProceso({ NEXT_RUNTIME: "nodejs" }), ZONA_PANEL);
  const env: { TZ?: string } = { TZ: ":UTC" };
  fijarZonaDelPanel("nodejs", env);
  assert.equal(env.TZ, "America/Bogota");
});

it("fuera de Next (scripts de payload run, pruebas) no se toca la zona", () => {
  assert.equal(zonaDelProceso({}), undefined);
  assert.equal(zonaDelProceso({ NEXT_RUNTIME: "edge" }), undefined);
  const env: { TZ?: string } = { TZ: "UTC" };
  fijarZonaDelPanel(undefined, env);
  assert.equal(env.TZ, "UTC");
});

it("NEXT_RUNTIME se lee literal, para que Next lo sustituya en el build (en Vercel no es variable)", () => {
  const fuente = readFileSync(new URL("./zonaHoraria.ts", import.meta.url), "utf8");
  assert.match(fuente, /=\s*process\.env\.NEXT_RUNTIME,/);
});
