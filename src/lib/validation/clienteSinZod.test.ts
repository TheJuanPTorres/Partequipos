/**
 * GUARDARRAÍL — ningún componente de cliente puede llevar Zod al navegador.
 *
 * Zod solo valida en el servidor (CLAUDE.md §5). Pero basta con que un
 * componente con `"use client"` importe una constante de un módulo que importa
 * `zod` para que el empaquetador meta Zod entero en el navegador: el esquema se
 * construye con `z.object` al cargar el módulo y no se puede quitar. Pasó con
 * el formulario de solicitud: 98 KiB comprimidos (406 KB de JavaScript) en
 * cinco plantillas, medido en el sitio publicado el 2026-10-14.
 *
 * Recorre los imports ESTÁTICOS de valor (no `import type`) desde cada fichero
 * con `"use client"` de `src/` y falla si alguno, directa o transitivamente,
 * importa `zod`. Se detiene en los ficheros con `"use server"`: de una Server
 * Action el cliente solo recibe una referencia, no su código.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const RAIZ = path.resolve(import.meta.dirname, "../../..");
const SRC = path.join(RAIZ, "src");

/** Imports estáticos de valor (no `import type`) y re-exportaciones. */
function importsEstaticos(codigo: string): string[] {
  const sinComentarios = codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const salida: string[] = [];
  const re = /^\s*(import|export)\s+(?!type\b)(?:[^"';]*?\sfrom\s+)?["']([^"']+)["']/gm;
  for (const m of sinComentarios.matchAll(re)) salida.push(m[2]!);
  return salida;
}

function resolver(desde: string, especificador: string): string | null {
  let base: string;
  if (especificador.startsWith("@/")) base = path.join(SRC, especificador.slice(2));
  else if (especificador.startsWith(".")) base = path.resolve(path.dirname(desde), especificador);
  else return null;
  for (const c of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

const esZod = (esp: string) => esp === "zod" || esp.startsWith("zod/");

/** Cadena de ficheros por la que un import estático llega a `zod`, o null. */
export function caminoAZod(
  fichero: string,
  leer: (f: string) => string = (f) => fs.readFileSync(f, "utf8"),
  resolverImport: (desde: string, esp: string) => string | null = resolver,
): string[] | null {
  const visitados = new Set<string>();
  const buscar = (f: string, camino: string[]): string[] | null => {
    if (visitados.has(f)) return null;
    visitados.add(f);
    const codigo = leer(f);
    if (camino.length > 1 && /^\s*["']use server["']/.test(codigo)) return null;
    for (const esp of importsEstaticos(codigo)) {
      if (esZod(esp)) return [...camino, "zod"];
      const r = resolverImport(f, esp);
      if (!r) continue;
      const hallado = buscar(r, [...camino, r]);
      if (hallado) return hallado;
    }
    return null;
  };
  return buscar(fichero, [fichero]);
}

function deCliente(dir = SRC): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : deCliente(p);
    if (!/\.tsx?$/.test(e.name) || /\.test\.tsx?$/.test(e.name)) return [];
    return /^\s*["']use client["']/.test(fs.readFileSync(p, "utf8")) ? [p] : [];
  });
}

describe("componentes de cliente sin Zod", () => {
  it("encuentra componentes de cliente que revisar", () => {
    assert.ok(deCliente().length > 10, 'no se han encontrado ficheros con "use client"');
  });

  it("ningún componente de cliente alcanza `zod` por un import estático", () => {
    const fallos = deCliente()
      .map((f) => caminoAZod(f))
      .filter((c): c is string[] => c !== null)
      .map((c) => c.map((f) => path.relative(RAIZ, f)).join(" → "));
    assert.deepEqual(fallos, [], `Zod llegaría al navegador:\n${fallos.join("\n")}`);
  });

  it("el guardián falla cuando debe: constante importada de un módulo con Zod", () => {
    const ficheros: Record<string, string> = {
      "/c.tsx":
        '"use client";\nimport { LISTA } from "./esquema";\nimport type { T } from "./tipos";',
      "/esquema.ts":
        'import { z } from "zod";\nexport const LISTA = [];\nexport const e = z.object({});',
      "/tipos.ts": 'import { z } from "zod";',
    };
    const leer = (f: string) => ficheros[f]!;
    const res = (_: string, esp: string) => (esp.startsWith("./") ? `/${esp.slice(2)}.ts` : null);
    assert.deepEqual(caminoAZod("/c.tsx", leer, res), ["/c.tsx", "/esquema.ts", "zod"]);
  });

  it("no cuenta los `import type` ni los módulos sin Zod", () => {
    const ficheros: Record<string, string> = {
      "/c.tsx":
        '"use client";\nimport type { T } from "./esquema";\nimport { LISTA } from "./opciones";',
      "/esquema.ts": 'import { z } from "zod";',
      "/opciones.ts": "export const LISTA = [];",
    };
    const res = (_: string, esp: string) => `/${esp.slice(2)}.ts`;
    assert.equal(
      caminoAZod("/c.tsx", (f) => ficheros[f]!, res),
      null,
    );
  });

  it('se detiene en una Server Action (`"use server"`)', () => {
    const ficheros: Record<string, string> = {
      "/c.tsx": '"use client";\nimport { enviar } from "./accion";',
      "/accion.ts": '"use server";\nimport { validar } from "./esquema";',
      "/esquema.ts": 'import { z } from "zod";',
    };
    const res = (_: string, esp: string) => `/${esp.slice(2)}.ts`;
    assert.equal(
      caminoAZod("/c.tsx", (f) => ficheros[f]!, res),
      null,
    );
  });
});
