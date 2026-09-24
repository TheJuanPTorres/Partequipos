/**
 * GUARDARRAÍL — ningún script de `scripts/` puede cargar la config de Payload
 * con el push de esquema activo (CLAUDE.md §10.9 y §10.34).
 *
 * `payload.config.ts` decide `push` AL EVALUARSE el módulo, leyendo
 * `PAYLOAD_DISABLE_PUSH`. Los `import` estáticos se evalúan ANTES que cualquier
 * sentencia del script, así que un script que ponga la variable y luego importe
 * la config dinámicamente sigue abierto si OTRO import estático llega a la
 * config por el camino (p. ej. una constante de `src/lib/queries/`). Es lo que
 * pasó el 2026-09-24: el marcador `dev` en PRODUCCIÓN.
 *
 * Dos reglas por script:
 * 1. Ningún import ESTÁTICO puede alcanzar la config, ni directa ni
 *    transitivamente.
 * 2. Si el script importa la config (dinámicamente), `PAYLOAD_DISABLE_PUSH =
 *    "true"` tiene que aparecer ANTES en el fichero.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const RAIZ = path.resolve(import.meta.dirname, "../../..");
const CONFIG = path.join(RAIZ, "src", "payload.config.ts");

/** Imports estáticos de valor (no `import type`) y re-exportaciones. */
export function importsEstaticos(codigo: string): string[] {
  const sinComentarios = codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const salida: string[] = [];
  const re = /^\s*(import|export)\s+(?!type\b)(?:[^"';]*?\sfrom\s+)?["']([^"']+)["']/gm;
  for (const m of sinComentarios.matchAll(re)) salida.push(m[2]!);
  return salida;
}

function resolver(desde: string, especificador: string): string | null {
  let base: string;
  if (especificador === "@payload-config") return CONFIG;
  if (especificador.startsWith("@/")) base = path.join(RAIZ, "src", especificador.slice(2));
  else if (especificador.startsWith(".")) base = path.resolve(path.dirname(desde), especificador);
  else return null; // paquete de node_modules: no carga NUESTRA config
  for (const c of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

/** Cadena de ficheros por la que un import estático llega a la config, o null. */
export function caminoALaConfig(
  fichero: string,
  leer: (f: string) => string = (f) => fs.readFileSync(f, "utf8"),
  resolverImport: (desde: string, esp: string) => string | null = resolver,
  objetivo = CONFIG,
): string[] | null {
  const visitados = new Set<string>();
  const buscar = (f: string, camino: string[]): string[] | null => {
    if (f === objetivo) return camino;
    if (visitados.has(f)) return null;
    visitados.add(f);
    for (const esp of importsEstaticos(leer(f))) {
      const r = resolverImport(f, esp);
      if (!r) continue;
      const hallado = buscar(r, [...camino, r]);
      if (hallado) return hallado;
    }
    return null;
  };
  return buscar(fichero, [fichero]);
}

/** ¿Pone la variable antes del primer import dinámico de la config? */
export function desactivaPushAntes(codigo: string): boolean {
  const importConfig = codigo.search(/import\(\s*["'][^"']*payload\.config["']\s*\)/);
  if (importConfig === -1) return true;
  const variable = codigo.search(/process\.env\.PAYLOAD_DISABLE_PUSH\s*=\s*["']true["']/);
  return variable !== -1 && variable < importConfig;
}

function scripts(dir = path.join(RAIZ, "scripts")): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return scripts(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });
}

describe("scripts de scripts/: la config de Payload nunca con el push activo", () => {
  const todos = scripts();

  it("hay scripts que revisar (el guardián no mira una carpeta vacía)", () => {
    assert.ok(todos.length > 10, `solo ${todos.length} scripts`);
  });

  for (const s of todos) {
    const rel = path.relative(RAIZ, s).replace(/\\/g, "/");
    it(`${rel}: ningún import estático llega a la config`, () => {
      const camino = caminoALaConfig(s);
      assert.equal(
        camino,
        null,
        `llega por: ${camino?.map((f) => path.relative(RAIZ, f).replace(/\\/g, "/")).join(" → ")}. ` +
          "Pasa ese import a dinámico, DESPUÉS de fijar PAYLOAD_DISABLE_PUSH.",
      );
    });
    it(`${rel}: fija PAYLOAD_DISABLE_PUSH antes de importar la config`, () => {
      assert.ok(desactivaPushAntes(fs.readFileSync(s, "utf8")));
    });
  }
});

describe("el guardián falla cuando debe", () => {
  // Grafo inventado: script → consultas → config. Es el caso del 2026-09-24.
  const ficheros: Record<string, string> = {
    "/s.ts": 'import { X } from "./q";\nimport type { T } from "./tipos";',
    "/q.ts": 'import config from "@payload-config";\nexport const X = 1;',
    "/tipos.ts": 'import config from "@payload-config";',
    "/limpio.ts": 'import { getPayload } from "payload";\nimport { Y } from "./puro";',
    "/puro.ts": "export const Y = 2;",
  };
  const leer = (f: string) => ficheros[f]!;
  const res = (_: string, esp: string) =>
    esp === "@payload-config" ? "/CONFIG" : esp.startsWith("./") ? `/${esp.slice(2)}.ts` : null;

  it("detecta la config alcanzada TRANSITIVAMENTE, e ignora `import type`", () => {
    assert.deepEqual(caminoALaConfig("/s.ts", leer, res, "/CONFIG"), ["/s.ts", "/q.ts", "/CONFIG"]);
    assert.equal(caminoALaConfig("/limpio.ts", leer, res, "/CONFIG"), null);
  });

  it("exige la variable ANTES del import dinámico de la config", () => {
    const bien =
      'process.env.PAYLOAD_DISABLE_PUSH = "true";\nawait import("../src/payload.config");';
    const mal =
      'await import("../src/payload.config");\nprocess.env.PAYLOAD_DISABLE_PUSH = "true";';
    assert.equal(desactivaPushAntes(bien), true);
    assert.equal(desactivaPushAntes(mal), false);
    assert.equal(desactivaPushAntes('await import("../src/payload.config");'), false);
    assert.equal(desactivaPushAntes("const a = 1;"), true);
  });
});
