import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { esEnvioDelCatalogo } from "./envioCatalogo";

const formulario = (atributos: Record<string, string>) => ({
  getAttribute: (nombre: string) => atributos[nombre] ?? null,
});

test('el formulario de filtros (method="get" declarado) lo toma la zona del catálogo', () => {
  assert.equal(esEnvioDelCatalogo(formulario({ method: "get" })), true);
  assert.equal(esEnvioDelCatalogo(formulario({ method: " GET " })), true);
});

test("un formulario con acción de servidor de React (sin method) NO lo toma: es una solicitud", () => {
  // Así pinta React un `<form action={accion}>`: sin `method` (la propiedad diría «get»).
  assert.equal(
    esEnvioDelCatalogo(formulario({ action: "javascript:throw new Error('A React form…')" })),
    false,
  );
  assert.equal(esEnvioDelCatalogo(formulario({ method: "post" })), false);
});

test("ZonaCatalogo decide con esEnvioDelCatalogo, no con la propiedad form.method", () => {
  const fuente = readFileSync("src/components/listado/ZonaCatalogo.tsx", "utf8");
  assert.match(fuente, /esEnvioDelCatalogo\(form\)/);
  assert.doesNotMatch(fuente, /form\.method/);
});
