import assert from "node:assert/strict";
import { it } from "node:test";

import type { Access } from "payload";

import { EquipoNuevo } from "../collections/EquipoNuevo";
import { EquipoUsado } from "../collections/EquipoUsado";
import { ModeloRepuesto } from "../collections/ModeloRepuesto";
import { MAXIMO_VERSIONES_PRODUCTO } from "./borradores";

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
