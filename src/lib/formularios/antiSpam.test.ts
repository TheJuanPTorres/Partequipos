import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  CAMPO_TIEMPO,
  CAMPO_TRAMPA,
  MAX_ENVIOS,
  TIEMPO_MAXIMO_MS,
  TIEMPO_MINIMO_MS,
  VARIABLE_MAX_ENVIOS,
  crearLimitePorIp,
  maxEnviosDelEntorno,
  revisarTiempo,
  trampaRellena,
} from "./antiSpam";

function f(campos: Record<string, string>) {
  const d = new FormData();
  for (const [k, v] of Object.entries(campos)) d.set(k, v);
  return d;
}

describe("trampaRellena", () => {
  it("vacía o ausente: persona", () => {
    assert.equal(trampaRellena(f({})), false);
    assert.equal(trampaRellena(f({ [CAMPO_TRAMPA]: "  " })), false);
  });
  it("con texto: robot", () => {
    assert.equal(trampaRellena(f({ [CAMPO_TRAMPA]: "http://spam.test" })), true);
  });
});

describe("revisarTiempo", () => {
  const ahora = 1_800_000_000_000;
  it("pasado el mínimo: ok", () => {
    assert.equal(
      revisarTiempo(f({ [CAMPO_TIEMPO]: String(ahora - TIEMPO_MINIMO_MS) }), ahora),
      "ok",
    );
  });
  it("antes del mínimo: muy rápido", () => {
    assert.equal(revisarTiempo(f({ [CAMPO_TIEMPO]: String(ahora - 500) }), ahora), "muy-rapido");
  });
  it("hora del futuro: muy rápido (no se puede fiar)", () => {
    assert.equal(revisarTiempo(f({ [CAMPO_TIEMPO]: String(ahora + 60_000) }), ahora), "muy-rapido");
  });
  it("sin dato, basura o caducada: sin dato", () => {
    assert.equal(revisarTiempo(f({}), ahora), "sin-dato");
    assert.equal(revisarTiempo(f({ [CAMPO_TIEMPO]: "abc" }), ahora), "sin-dato");
    assert.equal(revisarTiempo(f({ [CAMPO_TIEMPO]: "0" }), ahora), "sin-dato");
    assert.equal(
      revisarTiempo(f({ [CAMPO_TIEMPO]: String(ahora - TIEMPO_MAXIMO_MS - 1) }), ahora),
      "sin-dato",
    );
  });
});

describe("límite por IP", () => {
  it("deja pasar hasta el tope y corta el siguiente", () => {
    const l = crearLimitePorIp(3, 1_000);
    assert.equal(l.permitir("1.2.3.4", 0), true);
    assert.equal(l.permitir("1.2.3.4", 1), true);
    assert.equal(l.permitir("1.2.3.4", 2), true);
    assert.equal(l.permitir("1.2.3.4", 3), false);
  });
  it("otra IP no se ve afectada", () => {
    const l = crearLimitePorIp(1, 1_000);
    assert.equal(l.permitir("1.1.1.1", 0), true);
    assert.equal(l.permitir("1.1.1.1", 1), false);
    assert.equal(l.permitir("2.2.2.2", 1), true);
  });
  it("pasada la ventana, vuelve a dejar", () => {
    const l = crearLimitePorIp(1, 1_000);
    assert.equal(l.permitir("1.1.1.1", 0), true);
    assert.equal(l.permitir("1.1.1.1", 999), false);
    assert.equal(l.permitir("1.1.1.1", 1_000), true);
  });
  it("sin IP no limita", () => {
    const l = crearLimitePorIp(1, 1_000);
    assert.equal(l.permitir(undefined, 0), true);
    assert.equal(l.permitir(undefined, 1), true);
  });
  it("no guarda la IP: ninguna clave la contiene", () => {
    const l = crearLimitePorIp(5, 1_000);
    l.permitir("203.0.113.77", 0);
    // La IP no se puede recuperar desde fuera; lo único visible es el recuento de huellas.
    assert.equal(l.tamano(), 1);
  });
});

describe("límite ajustable solo para pruebas de carga", () => {
  const V = VARIABLE_MAX_ENVIOS;

  it("sin variable, el tope de siempre en cualquier entorno", () => {
    assert.equal(maxEnviosDelEntorno({}), MAX_ENVIOS);
    assert.equal(maxEnviosDelEntorno({ VERCEL_ENV: "preview" }), MAX_ENVIOS);
    assert.equal(maxEnviosDelEntorno({ VERCEL_ENV: "production" }), MAX_ENVIOS);
  });

  it("en un preview o en local, un número sube el tope y 0 u off lo desactivan", () => {
    assert.equal(maxEnviosDelEntorno({ VERCEL_ENV: "preview", [V]: "500" }), 500);
    assert.equal(maxEnviosDelEntorno({ VERCEL_ENV: "development", [V]: " 40 " }), 40);
    assert.equal(maxEnviosDelEntorno({ [V]: "100" }), 100);
    assert.equal(maxEnviosDelEntorno({ VERCEL_ENV: "preview", [V]: "0" }), Infinity);
    assert.equal(maxEnviosDelEntorno({ VERCEL_ENV: "preview", [V]: "OFF" }), Infinity);
  });

  it("EN PRODUCCIÓN NUNCA SE RESPETA, ni subirlo ni desactivarlo", () => {
    for (const valor of ["500", "0", "off", "1"]) {
      assert.equal(maxEnviosDelEntorno({ VERCEL_ENV: "production", [V]: valor }), MAX_ENVIOS);
    }
    // Servidor de producción fuera de Vercel: ante la duda, producción.
    assert.equal(maxEnviosDelEntorno({ NODE_ENV: "production", [V]: "0" }), MAX_ENVIOS);
    // Una variable de producción de Vercel gana a un NODE_ENV de desarrollo.
    assert.equal(
      maxEnviosDelEntorno({ VERCEL_ENV: "production", NODE_ENV: "development", [V]: "0" }),
      MAX_ENVIOS,
    );
  });

  it("un valor mal escrito se ignora", () => {
    for (const valor of ["abc", "-5", "1.5", "", "  ", "5 000", "99999999999"]) {
      assert.equal(maxEnviosDelEntorno({ VERCEL_ENV: "preview", [V]: valor }), MAX_ENVIOS);
    }
  });

  it("con el límite desactivado no corta ni guarda huellas", () => {
    const l = crearLimitePorIp(Number.POSITIVE_INFINITY, 1_000);
    for (let i = 0; i < 1_000; i++) assert.equal(l.permitir("1.2.3.4", i), true);
    assert.equal(l.tamano(), 0);
  });

  it("la variable solo se lee en antiSpam.ts y el envío usa ese límite", () => {
    const aqui = (p: string) => join(process.cwd(), p);
    const lectores: string[] = [];
    const recorrer = (dir: string) => {
      for (const nombre of readdirSync(dir)) {
        const ruta = join(dir, nombre);
        if (statSync(ruta).isDirectory()) recorrer(ruta);
        else if (/\.(ts|tsx|mjs)$/.test(nombre) && !/\.test\.ts$/.test(nombre)) {
          if (readFileSync(ruta, "utf8").includes(V)) lectores.push(ruta.replaceAll("\\", "/"));
        }
      }
    };
    recorrer(aqui("src"));
    assert.deepEqual(
      lectores.map((r) => r.slice(r.indexOf("src/"))),
      ["src/lib/formularios/antiSpam.ts"],
    );
    const accion = readFileSync(aqui("src/lib/actions/solicitudes.ts"), "utf8");
    assert.match(accion, /limiteDeEnvios\.permitir/);
  });
});
