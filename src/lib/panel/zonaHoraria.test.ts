import assert from "node:assert/strict";
import { it } from "node:test";

import { fijarZonaDelPanel, ZONA_PANEL, zonaDelProceso } from "./zonaHoraria";

it("dentro de Next, el proceso pasa a la hora de Colombia", () => {
  assert.equal(zonaDelProceso({ NEXT_RUNTIME: "nodejs" }), ZONA_PANEL);
  const env: { NEXT_RUNTIME?: string; TZ?: string } = { NEXT_RUNTIME: "nodejs", TZ: ":UTC" };
  fijarZonaDelPanel(env);
  assert.equal(env.TZ, "America/Bogota");
});

it("fuera de Next (scripts de payload run, pruebas) no se toca la zona", () => {
  assert.equal(zonaDelProceso({}), undefined);
  assert.equal(zonaDelProceso({ NEXT_RUNTIME: "edge" }), undefined);
  const env: { NEXT_RUNTIME?: string; TZ?: string } = { TZ: "UTC" };
  fijarZonaDelPanel(env);
  assert.equal(env.TZ, "UTC");
});
