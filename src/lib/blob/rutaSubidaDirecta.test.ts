import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import type { Config, Endpoint, PayloadRequest } from "payload";

import {
  MANEJADOR_ADAPTADOR,
  MANEJADOR_PROPIO,
  RUTA_SUBIDA_DIRECTA,
  endurecerSubidaDirecta,
  rutaSubidaDirecta,
} from "./rutaSubidaDirecta";

/**
 * GUARDARRAÍL (decisión de dirección del 2026-10-05, CLAUDE.md §10.39): la
 * subida directa depende de DOS nombres internos del adaptador
 * `@payloadcms/storage-vercel-blob` —su ruta del permiso y su manejador del
 * navegador—, que nuestro plugin sustituye por los endurecidos. Si una
 * actualización de Payload los renombra o cambia su forma, la sustitución
 * dejaría de ocurrir SIN ERROR, y volverían el permiso sin topes y el aviso en
 * inglés. Esta prueba construye la config con el adaptador REAL y falla.
 */
const TOKEN = "vercel_blob_rw_abc123def456_xyz789";

function configBase(): Config {
  return {
    collections: [
      { slug: "documentos", upload: { mimeTypes: ["application/pdf"] }, fields: [] },
      { slug: "media", upload: { mimeTypes: ["image/png"] }, fields: [] },
    ],
  } as unknown as Config;
}

async function conAdaptador(): Promise<Config> {
  const c = await vercelBlobStorage({
    enabled: true,
    clientUploads: true,
    addRandomSuffix: true,
    collections: { documentos: true, media: true },
    token: TOKEN,
  })(configBase());
  return c;
}

const rutas = (c: Config) =>
  (c.endpoints ?? []).filter((e) => e.path?.startsWith(RUTA_SUBIDA_DIRECTA));
const caminos = (c: Config) =>
  (c.admin?.components?.providers ?? []).map((p) =>
    typeof p === "object" && p && "path" in p ? p.path : p,
  );

describe("subida directa: lo que el adaptador registra (falla si cambia en una actualización)", () => {
  it("una ruta POST con ese nombre exacto", async () => {
    const r = rutas(await conAdaptador());
    assert.equal(r.length, 1, `el adaptador ya no registra «${RUTA_SUBIDA_DIRECTA}»`);
    assert.equal(r[0]!.path, RUTA_SUBIDA_DIRECTA);
    assert.equal(r[0]!.method, "post");
    assert.equal(typeof r[0]!.handler, "function");
  });

  it("un proveedor por colección con su manejador de navegador, y los datos que usamos", async () => {
    const c = await conAdaptador();
    const provs = (c.admin?.components?.providers ?? []).filter(
      (p) => typeof p === "object" && p && "path" in p && p.path === MANEJADOR_ADAPTADOR,
    ) as { clientProps?: Record<string, unknown> }[];
    assert.equal(
      provs.length,
      2,
      `el manejador del adaptador ya no se llama «${MANEJADOR_ADAPTADOR}»`,
    );
    for (const p of provs) {
      // `ManejadorSubidaDirecta` recibe exactamente estas props.
      assert.equal(p.clientProps?.serverHandlerPath, RUTA_SUBIDA_DIRECTA);
      assert.equal(p.clientProps?.enabled, true);
      assert.equal((p.clientProps?.extra as { addRandomSuffix?: boolean })?.addRandomSuffix, true);
    }
    assert.ok(c.admin?.dependencies?.[MANEJADOR_ADAPTADOR], "falta en el mapa de importación");
  });
});

describe("subida directa: nuestro plugin las sustituye", () => {
  it("la ruta del permiso queda con el manejador endurecido", async () => {
    const antes = await conAdaptador();
    const original = rutas(antes)[0]!.handler;
    const despues = endurecerSubidaDirecta(TOKEN)(antes) as Config;
    const r = rutas(despues);
    assert.equal(r.length, 1);
    assert.notEqual(r[0]!.handler, original);
  });

  it("el manejador del navegador queda el nuestro, sin rastro del del adaptador", async () => {
    const despues = endurecerSubidaDirecta(TOKEN)(await conAdaptador()) as Config;
    const c = caminos(despues);
    assert.ok(!c.includes(MANEJADOR_ADAPTADOR));
    assert.equal(c.filter((x) => x === MANEJADOR_PROPIO).length, 2);
    assert.ok(despues.admin?.dependencies?.[MANEJADOR_PROPIO]);
  });
});

describe("subida directa: el permiso que firma la ruta endurecida", () => {
  const cuerpo = (pathname: string, coleccion: string) => ({
    type: "blob.generate-client-token",
    payload: { pathname, clientPayload: coleccion, multipart: false },
  });
  const peticion = (cuerpoJson: unknown, user: unknown, puedeCrear: boolean) =>
    ({
      user,
      t: ((k: string) => k) as unknown,
      json: async () => cuerpoJson,
      url: "https://ejemplo.vercel.app/api/vercel-blob-client-upload-route/",
      headers: new Headers({ host: "ejemplo.vercel.app" }),
      payload: {
        collections: {
          documentos: { config: { access: { create: () => puedeCrear } } },
          media: { config: { access: { create: () => puedeCrear } } },
        },
        logger: { error: () => {} },
      },
    }) as unknown as PayloadRequest;
  const manejador = rutaSubidaDirecta(TOKEN) as NonNullable<Endpoint["handler"]>;
  const estado = async (req: PayloadRequest) => {
    try {
      const r = await manejador(req);
      return r.status;
    } catch (e) {
      return (e as { status?: number }).status ?? 500;
    }
  };

  it("sin sesión: 403", async () => {
    assert.equal(await estado(peticion(cuerpo("ficha.pdf", "documentos"), null, true)), 403);
  });

  it("con sesión pero SIN permiso de crear: 403", async () => {
    assert.equal(await estado(peticion(cuerpo("ficha.pdf", "documentos"), { id: 1 }, false)), 403);
  });

  it("colección sin regla o nombre con carpeta: 400", async () => {
    assert.equal(await estado(peticion(cuerpo("clip.mp4", "videos"), { id: 1 }, true)), 400);
    assert.equal(await estado(peticion(cuerpo("a/b.pdf", "documentos"), { id: 1 }, true)), 400);
  });

  it("con permiso, firma un permiso de subida (sin red)", async () => {
    const r = await manejador(peticion(cuerpo("ficha.pdf", "documentos"), { id: 1 }, true));
    assert.equal(r.status, 200);
    const json = (await r.json()) as { type: string; clientToken: string };
    assert.equal(json.type, "blob.generate-client-token");
    assert.match(json.clientToken, /^vercel_blob_client_/);
  });
});
