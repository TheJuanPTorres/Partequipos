import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { Access, CollectionConfig, GlobalConfig } from "payload";

import { CABECERA_LECTURA, LONGITUD_MINIMA, tokenDeLecturaValido } from "./lecturaApi";

const TOKEN = "t".repeat(LONGITUD_MINIMA);
const conCabecera = (valor?: string) => new Headers(valor ? { [CABECERA_LECTURA]: valor } : {});

describe("tokenDeLecturaValido", () => {
  it("vale con el token exacto (y tolera espacios alrededor)", () => {
    assert.equal(tokenDeLecturaValido(conCabecera(TOKEN), { API_LECTURA_TOKEN: TOKEN }), true);
    assert.equal(
      tokenDeLecturaValido(conCabecera(` ${TOKEN} `), { API_LECTURA_TOKEN: TOKEN }),
      true,
    );
  });

  // Las comprobaciones de que FALLA cuando debe.
  it("no vale sin cabecera, con otro valor o con un prefijo del token", () => {
    const env = { API_LECTURA_TOKEN: TOKEN };
    assert.equal(tokenDeLecturaValido(conCabecera(), env), false);
    assert.equal(tokenDeLecturaValido(conCabecera("otro"), env), false);
    assert.equal(tokenDeLecturaValido(conCabecera(TOKEN.slice(0, -1)), env), false);
    assert.equal(tokenDeLecturaValido(undefined, env), false);
  });

  it("falla cerrado sin variable o con una corta", () => {
    assert.equal(tokenDeLecturaValido(conCabecera(TOKEN), {}), false);
    assert.equal(tokenDeLecturaValido(conCabecera(""), { API_LECTURA_TOKEN: "" }), false);
    const corto = "c".repeat(LONGITUD_MINIMA - 1);
    assert.equal(tokenDeLecturaValido(conCabecera(corto), { API_LECTURA_TOKEN: corto }), false);
  });
});

/*
 * GUARDARRAÍL: ninguna colección ni global se lee por la API sin sesión ni
 * token. El olvido que atrapa es volver a escribir `read: () => true` (o no
 * declarar `read`, que en Payload equivale a «cualquier usuario con sesión»,
 * pero deja de ser explícito) al crear una colección nueva.
 *
 * Se evalúa la función de acceso REAL de cada configuración con una petición
 * anónima, sin token, en un entorno con el token configurado.
 */
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function configs(carpeta: string): Promise<(CollectionConfig | GlobalConfig)[]> {
  const dir = path.join(raiz, carpeta);
  const encontradas: (CollectionConfig | GlobalConfig)[] = [];
  for (const fichero of readdirSync(dir).filter(
    (f) => f.endsWith(".ts") && !f.endsWith(".test.ts"),
  )) {
    const modulo: Record<string, unknown> = await import(
      pathToFileURL(path.join(dir, fichero)).href
    );
    for (const exportado of Object.values(modulo)) {
      if (typeof exportado === "object" && exportado !== null && "slug" in exportado) {
        if ("fields" in exportado) encontradas.push(exportado as CollectionConfig);
      }
    }
  }
  return encontradas;
}

function leer(acceso: Access | undefined, cabeceras: Headers) {
  assert.ok(acceso, "sin `read` explícito");
  return acceso({ req: { headers: cabeceras, user: null } } as unknown as Parameters<Access>[0]);
}

describe("la API no se lee sin sesión ni token", () => {
  const anterior = process.env.API_LECTURA_TOKEN;

  it("ninguna colección ni global: anónimo → false; con token → lectura", async () => {
    process.env.API_LECTURA_TOKEN = TOKEN;
    try {
      const todas = [...(await configs("collections")), ...(await configs("globals"))];
      // 26 colecciones + 6 globales. Si cambia, revisa el acceso de la nueva.
      assert.equal(todas.length, 32);
      for (const c of todas) {
        const anonimo = await leer(c.access?.read as Access, new Headers());
        assert.equal(anonimo, false, `«${c.slug}» se lee por la API sin sesión ni token`);
      }
      // Las que el sitio publica se leen con el token (las privadas, no).
      const privadas = new Set(["solicitudes", "users", "redirects"]);
      for (const c of todas.filter((c) => !privadas.has(c.slug))) {
        const conToken = await leer(c.access?.read as Access, conCabecera(TOKEN));
        assert.notEqual(conToken, false, `«${c.slug}» no se lee ni con el token`);
      }
      for (const c of todas.filter((c) => privadas.has(c.slug))) {
        const conToken = await leer(c.access?.read as Access, conCabecera(TOKEN));
        assert.equal(conToken, false, `«${c.slug}» se lee con el token de lectura`);
      }
    } finally {
      if (anterior === undefined) delete process.env.API_LECTURA_TOKEN;
      else process.env.API_LECTURA_TOKEN = anterior;
    }
  });
});
