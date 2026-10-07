import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { after, before, describe, it } from "node:test";

import {
  CABECERA_DERIVACION,
  conDerivacion,
  fetchAlPreview,
  instalarDerivacion,
  origenDePreview,
  puedeLlevarDerivacion,
} from "./derivacion.mjs";

/*
 * GUARDARRAÍL del incidente del 2026-10-06: el secreto de derivación del
 * preview llegó a Mapbox porque un script lo puso en TODAS las peticiones.
 * Estas pruebas fallan si la cabecera puede ir a otro host.
 */
const PREVIEW = "https://partequipos-abc123-thejuanptorres-projects.vercel.app";
const SECRETO = "secreto-de-prueba";

describe("derivación: qué es un preview", () => {
  it("un despliegue del proyecto sí; producción, otros proyectos y trucos de URL, no", () => {
    assert.equal(origenDePreview(`${PREVIEW}/admin/`), PREVIEW);
    for (const url of [
      "https://partequipos.vercel.app/",
      "http://partequipos-abc.vercel.app/",
      "https://otro-proyecto-abc.vercel.app/",
      "https://partequipos-abc.vercel.app.evil.com/",
      "https://partequipos-abc.vercel.app:8443/",
      "https://usuario@partequipos-abc.vercel.app/",
      "no es una url",
    ]) {
      assert.equal(origenDePreview(url), null, url);
    }
  });
});

describe("derivación: el secreto solo va al ORIGEN del preview", () => {
  it("al preview, sí", () => {
    assert.equal(puedeLlevarDerivacion(`${PREVIEW}/api/marcas/`, PREVIEW), true);
  });

  it("a cualquier otro host, no", () => {
    for (const url of [
      "https://api.mapbox.com/mapbox-gl-js/v3.20.0/mapbox-gl.js",
      "https://events.mapbox.com/events/v2",
      "https://lsndnc29nh4ws7eh.public.blob.vercel-storage.com/foto.png",
      "https://fonts.gstatic.com/s/inter.woff2",
      "https://vercel.com/sso-api?url=x",
      "https://vercel.live/_next-live/feedback/feedback.js",
      "https://partequipos.vercel.app/",
      `${PREVIEW}.evil.com/`,
      `https://evil.com/?u=${PREVIEW}`,
      `https://${new URL(PREVIEW).host}@evil.com/`,
      PREVIEW.replace("https:", "http:"),
    ]) {
      assert.equal(puedeLlevarDerivacion(url, PREVIEW), false, url);
    }
  });

  it("si el origen declarado no es un preview, a nadie (ni a ese origen)", () => {
    assert.equal(
      puedeLlevarDerivacion("https://partequipos.vercel.app/", "https://partequipos.vercel.app"),
      false,
    );
    assert.equal(puedeLlevarDerivacion("https://evil.com/", "https://evil.com"), false);
  });

  it("conDerivacion pone el secreto al preview y lo QUITA si iba a otro host", () => {
    assert.equal(conDerivacion({}, `${PREVIEW}/`, PREVIEW, SECRETO)[CABECERA_DERIVACION], SECRETO);
    const fuera = conDerivacion(
      { "X-Vercel-Protection-Bypass": SECRETO, accept: "*/*" },
      "https://api.mapbox.com/x",
      PREVIEW,
      SECRETO,
    );
    assert.deepEqual(fuera, { accept: "*/*" });
  });
});

describe("derivación: Playwright solo la pone en las peticiones al preview", () => {
  it("una página que pide al preview, a Mapbox y al Blob: la cabecera solo va al preview", async () => {
    let manejador: ((ruta: unknown) => unknown) | undefined;
    let patron = "";
    const contexto = {
      route: async (p: string, fn: (ruta: unknown) => unknown) => {
        patron = p;
        manejador = fn;
      },
    };
    await instalarDerivacion(contexto, PREVIEW, SECRETO);
    // Solo intercepta el origen del preview…
    assert.equal(patron, `${PREVIEW}/**`);
    // …y aun si le llegara otra petición, no le pondría el secreto:
    const enviadas: Record<string, Record<string, string>> = {};
    for (const url of [
      `${PREVIEW}/`,
      "https://api.mapbox.com/mapbox-gl-js/v3.20.0/mapbox-gl.js",
      "https://lsndnc29nh4ws7eh.public.blob.vercel-storage.com/foto.png",
    ]) {
      await manejador?.({
        request: () => ({ url: () => url, headers: () => ({ accept: "*/*" }) }),
        continue: (o: { headers: Record<string, string> }) => {
          enviadas[url] = o.headers;
        },
      });
    }
    const conSecreto = Object.entries(enviadas)
      .filter(([, h]) => Object.keys(h).some((k) => k.toLowerCase() === CABECERA_DERIVACION))
      .map(([u]) => u);
    assert.deepEqual(conSecreto, [`${PREVIEW}/`]);
  });

  it("con un origen que no es un preview (producción), no instala nada", async () => {
    let llamado = false;
    await instalarDerivacion(
      { route: async () => void (llamado = true) },
      "https://partequipos.vercel.app",
      SECRETO,
    );
    assert.equal(llamado, false);
  });
});

describe("derivación: fetchAlPreview no sigue redirecciones con el secreto", () => {
  // Dos servidores locales: el «tercero» cuenta lo que recibe.
  const recibidoTercero: string[] = [];
  let tercero: http.Server;
  let urlTercero = "";
  before(async () => {
    tercero = http.createServer((req, res) => {
      recibidoTercero.push(String(req.headers[CABECERA_DERIVACION] ?? "sin-cabecera"));
      res.end("ok");
    });
    await new Promise<void>((r) => tercero.listen(0, "127.0.0.1", r));
    urlTercero = `http://127.0.0.1:${(tercero.address() as AddressInfo).port}/`;
  });
  after(() => tercero.close());

  it("se niega a mandar el secreto a otro host, antes de conectar", () => {
    assert.throws(
      () => fetchAlPreview(urlTercero, PREVIEW, SECRETO),
      /no es el origen del preview/,
    );
    assert.deepEqual(recibidoTercero, []);
  });

  it("una redirección del preview a otro host no se sigue: el tercero no recibe nada", async () => {
    const fetchOriginal = globalThis.fetch;
    let opciones: RequestInit | undefined;
    globalThis.fetch = (async (_u: string | URL | Request, init?: RequestInit) => {
      opciones = init;
      return new Response(null, { status: 302, headers: { location: urlTercero } });
    }) as typeof fetch;
    try {
      const r = await fetchAlPreview(`${PREVIEW}/api/marcas/`, PREVIEW, SECRETO);
      assert.equal(r.status, 302);
      assert.equal(opciones?.redirect, "manual");
      assert.equal((opciones?.headers as Record<string, string>)[CABECERA_DERIVACION], SECRETO);
      assert.deepEqual(recibidoTercero, []);
    } finally {
      globalThis.fetch = fetchOriginal;
    }
  });
});

describe("derivación: ningún script del repositorio la manda por su cuenta", () => {
  const RAIZ = path.resolve(import.meta.dirname, "../../..");
  const ficheros = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === "node_modules" ? [] : ficheros(p);
      return /\.(m?[jt]s|tsx)$/.test(e.name) ? [p] : [];
    });
  const todos = ["scripts", "src"].flatMap((d) => ficheros(path.join(RAIZ, d)));
  const PROPIO = path.join("src", "lib", "preview", "derivacion");

  it("nadie usa extraHTTPHeaders ni setExtraHTTPHeaders (mandan la cabecera a TODOS los hosts)", () => {
    const malos = todos.filter(
      (f) =>
        !path.relative(RAIZ, f).startsWith(PROPIO) &&
        /extraHTTPHeaders|setExtraHTTPHeaders/.test(fs.readFileSync(f, "utf8")),
    );
    assert.deepEqual(
      malos.map((f) => path.relative(RAIZ, f)),
      [],
    );
  });

  it("la cabecera solo se escribe en este módulo: los demás lo usan", () => {
    const malos = todos.filter(
      (f) =>
        !path.relative(RAIZ, f).startsWith(PROPIO) &&
        fs.readFileSync(f, "utf8").includes(CABECERA_DERIVACION),
    );
    assert.deepEqual(
      malos.map((f) => path.relative(RAIZ, f)),
      [],
    );
  });
});
