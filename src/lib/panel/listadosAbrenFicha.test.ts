import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { CollectionConfig, Field } from "payload";

import {
  camposDeDatos,
  CELDA_MINIATURA,
  CELDA_TITULO_ENLACE,
  conListados,
  LISTADOS,
} from "./listados";

/*
 * GUARDARRAÍL: TODA LISTA DEL PANEL ABRE SUS FICHAS (2026-11-24, urgente; Juan Pablo no podía abrir
 * «Hitachi LANDCROS» desde la lista de marcas de maquinaria). En la lista de Payload 3.89 SOLO la
 * PRIMERA columna enlaza a la ficha, y si esa columna tiene una celda propia, es la celda la que
 * tiene que pintar el enlace (Payload le pasa `link`). Desde el #513 las listas que empiezan por el
 * logo o la imagen usaban una miniatura que no enlazaba: ninguna celda abría la ficha.
 *
 * Esta prueba falla, para CADA colección de `LISTADOS` (y las que se añadan), si:
 * - la primera columna usa una celda propia que no está en la lista de las que enlazan;
 * - el título (`useAsTitle`) está en las columnas, no es la primera y no enlaza;
 * - una de las celdas de la lista de las que enlazan deja de leer `link` o de pintar un `href`.
 */

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const carpeta = path.join(raiz, "collections");

/** Las celdas propias que pintan el enlace a la ficha (con su comprobación más abajo). */
const CELDAS_QUE_ENLAZAN = new Set([
  CELDA_MINIATURA,
  CELDA_TITULO_ENLACE,
  "/components/admin/celdas/CeldaNombreFicha",
  "/components/admin/celdas/CeldaSolicitud",
]);

async function colecciones(): Promise<CollectionConfig[]> {
  const todas: CollectionConfig[] = [];
  for (const f of readdirSync(carpeta).filter(
    (f) => f.endsWith(".ts") && !f.endsWith(".test.ts"),
  )) {
    const m: Record<string, unknown> = await import(pathToFileURL(path.join(carpeta, f)).href);
    for (const e of Object.values(m))
      if (e && typeof e === "object" && "slug" in e && "fields" in e)
        todas.push(e as CollectionConfig);
  }
  return todas;
}

const celdaDe = (campos: Field[], nombre: string): string | undefined => {
  const campo = camposDeDatos(campos).find((c) => "name" in c && c.name === nombre);
  const cell =
    campo && "admin" in campo
      ? (campo.admin as { components?: { Cell?: unknown } })?.components?.Cell
      : undefined;
  if (cell === undefined) return undefined;
  return typeof cell === "string" ? cell : String((cell as { path?: string }).path ?? cell);
};

/** Qué falla en la configuración (ya con `conListados`) de una colección. */
export function fallosDeEnlace(c: CollectionConfig, columnas: string[]): string[] {
  const fallos: string[] = [];
  const primera = columnas[0];
  if (primera) {
    const celda = celdaDe(c.fields, primera);
    if (celda && !CELDAS_QUE_ENLAZAN.has(celda))
      fallos.push(
        `${c.slug}: la primera columna («${primera}») usa ${celda}, que no abre la ficha`,
      );
  }
  const titulo = c.admin?.useAsTitle;
  if (titulo && columnas.includes(titulo) && titulo !== primera) {
    const celda = celdaDe(c.fields, titulo);
    if (!celda || !CELDAS_QUE_ENLAZAN.has(celda))
      fallos.push(`${c.slug}: el título («${titulo}») no es la primera columna y no abre la ficha`);
  }
  return fallos;
}

describe("toda lista del panel abre sus fichas (2026-11-24)", () => {
  it("en cada colección de la tabla, la primera columna y el título enlazan a la ficha", async () => {
    const todas = conListados(await colecciones());
    const fallos = Object.entries(LISTADOS).flatMap(([slug, listado]) => {
      const c = todas.find((x) => x.slug === slug);
      return c ? fallosDeEnlace(c, listado.columnas) : [`${slug}: no existe`];
    });
    assert.deepEqual(fallos, []);
  });

  it("las celdas que dicen enlazar leen `link` (o siempre enlazan) y pintan un href", () => {
    for (const celda of CELDAS_QUE_ENLAZAN) {
      const fuente = readFileSync(path.join(raiz, `${celda.replace(/^\//, "")}.tsx`), "utf8");
      assert.match(fuente, /href=\{/, `${celda} no pinta ningún enlace`);
      // Las que solo enlazan en la primera columna tienen que mirar `link` (las otras siempre enlazan).
      if (celda === CELDA_MINIATURA || celda.endsWith("CeldaSolicitud"))
        assert.match(fuente, /\blink\b/, `${celda} no mira \`link\``);
    }
  });

  it("y falla cuando la primera columna no enlaza (comprobación del guardián)", () => {
    const c = {
      slug: "x",
      admin: { useAsTitle: "nombre" },
      fields: [
        {
          name: "logo",
          type: "upload",
          relationTo: "media",
          admin: { components: { Cell: "/otra/Celda" } },
        },
        { name: "nombre", type: "text" },
      ],
    } as unknown as CollectionConfig;
    assert.deepEqual(fallosDeEnlace(c, ["logo", "nombre"]), [
      "x: la primera columna («logo») usa /otra/Celda, que no abre la ficha",
      "x: el título («nombre») no es la primera columna y no abre la ficha",
    ]);
    assert.deepEqual(fallosDeEnlace(c, ["nombre", "logo"]), []);
  });
});
