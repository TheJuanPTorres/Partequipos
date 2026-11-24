import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { RUTAS_FUERA_DEL_SITEMAP } from "../seo/sitemap";
import {
  CARPETA_VISTA_PREVIA,
  COLECCIONES_VISTA_PREVIA,
  rutaVistaPrevia,
  rutaVistaPreviaUsada,
} from "./enVivo";

/*
 * GUARDARRAÍL (tanda 21, tarea 3, fase 2, punto 5; condición de dirección al aprobar la
 * dependencia): `@payloadcms/live-preview-react` (y `@payloadcms/live-preview`) solo se importan
 * dentro de la ruta de vista previa. Fuera de ella entrarían en el JavaScript del sitio público.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PAQUETE =
  /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["']@payloadcms\/live-preview(?:-react)?(?:\/[^"']*)?["']/;

/** Los ficheros que importan el paquete fuera de la carpeta permitida (rutas con «/»). */
function importacionesFuera(ficheros: { ruta: string; texto: string }[]): string[] {
  const permitida = `${CARPETA_VISTA_PREVIA}/`;
  return ficheros
    .filter((f) => PAQUETE.test(f.texto) && !f.ruta.startsWith(permitida))
    .map((f) => f.ruta);
}

function ficherosDe(...carpetas: string[]): { ruta: string; texto: string }[] {
  const salida: { ruta: string; texto: string }[] = [];
  const recorrer = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const completa = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== "node_modules") recorrer(completa);
      } else if (/\.(?:[cm]?[jt]sx?)$/.test(e.name) && !/\.test\.[jt]sx?$/.test(e.name)) {
        salida.push({
          ruta: path.relative(RAIZ, completa).split(path.sep).join("/"),
          texto: fs.readFileSync(completa, "utf8"),
        });
      }
    }
  };
  for (const c of carpetas) recorrer(path.join(RAIZ, c));
  return salida;
}

describe("vista previa en vivo: el paquete solo en su ruta", () => {
  it("nada fuera de la ruta de vista previa importa @payloadcms/live-preview*", () => {
    assert.deepEqual(importacionesFuera(ficherosDe("src", "scripts")), []);
  });

  it("la ruta sí lo usa (si no, este guardarraíl vigila una carpeta vacía)", () => {
    const dentro = ficherosDe(CARPETA_VISTA_PREVIA).filter((f) => PAQUETE.test(f.texto));
    assert.ok(dentro.length > 0);
  });

  it("falla cuando debe: un import fuera, dinámico o de subruta, se detecta", () => {
    const malos = [
      {
        ruta: "src/components/Algo.tsx",
        texto: `import { useLivePreview } from "@payloadcms/live-preview-react";`,
      },
      {
        ruta: "src/app/(site)/page.tsx",
        texto: `const m = await import("@payloadcms/live-preview");`,
      },
      {
        ruta: "src/lib/x.ts",
        texto: `import { ready } from '@payloadcms/live-preview/dist/index.js';`,
      },
    ];
    assert.deepEqual(
      importacionesFuera(malos),
      malos.map((m) => m.ruta),
    );
    const buenos = [
      { ruta: `${CARPETA_VISTA_PREVIA}/equipos-usados/[id]/V.tsx`, texto: malos[0]!.texto },
      { ruta: "src/lib/y.ts", texto: `// habla de @payloadcms/live-preview-react sin importarlo` },
      // Una carpeta que solo EMPIEZA igual no cuenta como la permitida.
      { ruta: `${CARPETA_VISTA_PREVIA}-otra/x.tsx`, texto: malos[0]!.texto },
    ];
    assert.deepEqual(importacionesFuera(buenos), [`${CARPETA_VISTA_PREVIA}-otra/x.tsx`]);
  });

  const leer = (rel: string) => fs.readFileSync(path.join(RAIZ, CARPETA_VISTA_PREVIA, rel), "utf8");
  const NOINDEX = /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/;

  it("cada colección tiene su página, fuera del sitemap, noindex y solo con sesión", () => {
    const comun = leer("paginaServidor.tsx");
    for (const coleccion of COLECCIONES_VISTA_PREVIA) {
      assert.ok(`/vista-previa/${coleccion}/[id]` in RUTAS_FUERA_DEL_SITEMAP, coleccion);
      const pagina = leer(`${coleccion}/[id]/page.tsx`);
      assert.match(pagina, /export const dynamic = "force-dynamic";/, coleccion);
      if (coleccion === "equipos-usados") {
        assert.match(pagina, NOINDEX);
        assert.match(pagina, /if \(!esPersonal\(user\)\) notFound\(\);/);
      } else {
        // Las pintadas en el servidor lo hacen en `PaginaVistaPreviaServidor`.
        assert.match(pagina, /metadata = METADATA_VISTA_PREVIA;/, coleccion);
        assert.match(pagina, new RegExp(`coleccion="${coleccion}"`), coleccion);
      }
    }
    assert.match(comun, NOINDEX);
    assert.match(comun, /if \(!\(await sesionDelPersonal\(\)\)\) notFound\(\);/);
  });

  it("la función de servidor comprueba la sesión ANTES de leer nada", () => {
    const accion = leer("acciones.ts");
    const sesion = accion.indexOf("if (!(await sesionDelPersonal())) return null;");
    assert.ok(sesion > 0, "sin comprobación de sesión");
    assert.ok(sesion < accion.indexOf("await documentoGuardado("), "lee antes de comprobar");
  });

  it("no hay una página de vista previa de más, sin colección declarada", () => {
    const carpetas = fs
      .readdirSync(path.join(RAIZ, CARPETA_VISTA_PREVIA), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    assert.deepEqual(carpetas, [...COLECCIONES_VISTA_PREVIA].sort());
  });

  it("la dirección de la vista previa, solo con un id entero positivo", () => {
    assert.equal(rutaVistaPreviaUsada(27), "/vista-previa/equipos-usados/27/");
    assert.equal(rutaVistaPreviaUsada("27"), "/vista-previa/equipos-usados/27/");
    assert.equal(rutaVistaPrevia("modelos-repuesto", 5), "/vista-previa/modelos-repuesto/5/");
    for (const malo of [undefined, null, 0, -1, 1.5, "x", ""])
      assert.equal(rutaVistaPreviaUsada(malo), null, String(malo));
  });
});
