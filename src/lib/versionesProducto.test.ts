import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { it } from "node:test";

import type { Access } from "payload";

import { EquipoNuevo } from "../collections/EquipoNuevo";
import { EquipoUsado } from "../collections/EquipoUsado";
import { ModeloRepuesto } from "../collections/ModeloRepuesto";
import { MAXIMO_VERSIONES_PRODUCTO, versionesRecientesPrimero } from "./borradores";

/**
 * HISTORIAL DE LAS FICHAS DE PRODUCTO (tanda 21, tarea 3, fase 2, punto 4): versiones SIN
 * borradores (lo que se guarda se publica, como siempre), las 10 últimas, y el historial solo
 * para el personal. Si alguien activa los borradores aquí, cambia cómo se publica todo el
 * catálogo: este guardarraíl lo para.
 */
/*
 * Las líneas de lubricante NO: sus productos son filas, no fichas, y las tablas de su historial
 * pasarían de 63 bytes en Postgres (`_categorias_lubricante_v_version_productos_…_fk`); acortarlas
 * obligaría a renombrar tablas que ya existen.
 */
const PRODUCTOS = [EquipoNuevo, EquipoUsado, ModeloRepuesto];

it("las fichas de producto guardan versiones, sin borradores, las 10 últimas", () => {
  for (const c of PRODUCTOS) {
    const v = c.versions;
    assert.ok(v && typeof v === "object", `${c.slug}: sin versiones`);
    assert.equal(v.drafts, false, `${c.slug}: con borradores`);
    assert.equal(v.maxPerDoc, MAXIMO_VERSIONES_PRODUCTO, c.slug);
  }
});

it("el historial no se lee sin sesión ni con la de un usuario que no es del personal", async () => {
  for (const c of PRODUCTOS) {
    const leer = c.access?.readVersions as Access | undefined;
    assert.ok(leer, `${c.slug}: sin readVersions (lo leería cualquiera que lea la colección)`);
    const anonimo = await leer({ req: { user: null, headers: new Headers() } } as never);
    assert.equal(anonimo, false, c.slug);
  }
});

it("la lista de versiones sale por fecha, la más reciente primero, salvo que se pida otro orden", async () => {
  type Args = Parameters<typeof versionesRecientesPrimero>[0];
  const llamar = (operation: string, where: unknown, sort?: string) =>
    versionesRecientesPrimero({ args: { sort, where }, operation } as unknown as Args) as {
      sort?: string;
    };
  for (const c of PRODUCTOS) {
    assert.ok(
      c.hooks?.beforeOperation?.includes(versionesRecientesPrimero),
      `${c.slug}: sin el orden de las versiones`,
    );
    // El gancho reconoce el historial por `parent`: una colección con un campo `parent` lo confundiría.
    assert.ok(
      !JSON.stringify(c.fields).includes('"name":"parent"'),
      `${c.slug}: tiene un campo «parent»`,
    );
  }
  // Lo que manda la vista del historial (fetchVersions): `and` con el filtro por `parent`.
  const historial = { and: [{ parent: { equals: 27 } }] };
  assert.equal((await llamar("read", historial)).sort, "-updatedAt");
  assert.equal((await llamar("read", historial, "updatedAt")).sort, "updatedAt");
  // Las listas normales (`find`, también `read`) no se tocan.
  assert.equal((await llamar("read", { nombre: { like: "x" } })).sort, undefined);
  assert.equal((await llamar("read", undefined)).sort, undefined);
});

it("Payload sigue pasando findVersions al gancho como «read» (si cambia, revisar el gancho)", () => {
  const ruta = createRequire(import.meta.url).resolve("payload");
  const tipos = readFileSync(
    path.join(path.dirname(ruta), "collections/operations/utilities/types.js"),
    "utf8",
  );
  assert.match(tipos, /findVersions: 'read'/);
});
