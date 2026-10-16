import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ENLACES_TARJETAS,
  PREFIJO_REAL,
  elegidoEnElPanel,
  ficheroReal,
  quedaCopiaDemo,
  restoDeLaCopia,
} from "./contenidoReal";

describe("ficheroReal", () => {
  it("prefijo propio, la clave y la extensión del fichero de WordPress", () => {
    assert.equal(
      ficheroReal("logo-hitachi", "https://x.invalid/a/Logo.PNG"),
      `${PREFIJO_REAL}logo-hitachi.png`,
    );
    assert.equal(
      ficheroReal("Marca Case", "https://x.invalid/a/foto.jpeg?v=2"),
      `${PREFIJO_REAL}marca-case.jpeg`,
    );
    assert.equal(ficheroReal("x", "https://x.invalid/a/sin-extension"), `${PREFIJO_REAL}x.jpg`);
  });
});

describe("quedaCopiaDemo", () => {
  it("solo cuenta los ficheros con el prefijo de la copia", () => {
    assert.deepEqual(
      quedaCopiaDemo(["demo-copia-a.png", "wp-real-b.jpg", null, "otra-demo-copia-c.png"]),
      ["demo-copia-a.png"],
    );
    assert.deepEqual(quedaCopiaDemo([]), []);
  });

  it("restoDeLaCopia mira imágenes, vídeos y animaciones", async () => {
    const vistas: string[] = [];
    const falso = {
      find: async ({ collection }: { collection: string }) => {
        vistas.push(collection);
        return { docs: collection === "videos" ? [{ filename: "demo-copia-v.mp4" }] : [] };
      },
    };
    assert.deepEqual(await restoDeLaCopia(falso), ["demo-copia-v.mp4"]);
    assert.deepEqual(vistas, ["media", "videos", "animaciones"]);
  });
});

describe("ENLACES_TARJETAS", () => {
  it("rutas del sitio con barra final", () => {
    for (const enlace of Object.values(ENLACES_TARJETAS)) assert.match(enlace, /^\/[a-z-/]+\/$/);
  });
});

describe("elegidoEnElPanel: lo que eligió un editor no se pisa", () => {
  const f = (id: number, fichero: string | null) => ({ id, fichero });

  it("un logo subido desde el panel, distinto del de antes, se conserva", () => {
    assert.equal(elegidoEnElPanel(f(9, "logo-hitachi-transparente.png"), 3), true);
    // La máquina recortada puesta en el panel cuando el importador la dejó vacía.
    assert.equal(elegidoEnElPanel(f(12, "brazo-excavadora.png"), null), true);
  });

  it("vacío, propio de la importación o el de antes de la primera pasada: se sustituye", () => {
    assert.equal(elegidoEnElPanel(null, 3), false);
    assert.equal(elegidoEnElPanel(f(7, `${PREFIJO_REAL}logo-hitachi.png`), 3), false);
    assert.equal(elegidoEnElPanel(f(3, "demo-copia-logo.png"), 3), false);
  });

  it("un id que ya no existe en Media cuenta como vacío", () => {
    assert.equal(elegidoEnElPanel(f(44, null), 3), false);
  });
});
