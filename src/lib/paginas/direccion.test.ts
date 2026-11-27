import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  CARPETAS_DE_PAGINAS,
  TRAMOS_RESERVADOS,
  direccionDesdeTitulo,
  errorDeFormato,
  errorDeRedireccion,
  errorDeReservada,
} from "./direccion";

const APP = path.join(process.cwd(), "src", "app");

/** Lo que la web sirve en el primer tramo, leído de `src/app` (no a mano). */
function primerosTramosDeLaWeb(): string[] {
  const tramos = new Set<string>(["_next"]);
  const metadatos: Record<string, string> = {
    "sitemap.ts": "sitemap.xml",
    "robots.ts": "robots.txt",
  };
  const leerRaiz = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        // Grupos «(site)», segmentos dinámicos «[…]» y carpetas privadas «_x» no son tramos.
        if (/^\(.*\)$/.test(e.name) || e.name.startsWith("[") || e.name.startsWith("_")) continue;
        tramos.add(e.name);
      } else if (metadatos[e.name]) {
        tramos.add(metadatos[e.name]!);
      } else if (/^(favicon\.ico|(apple-)?icon\d*\.(png|ico|svg|jpg))$/.test(e.name)) {
        tramos.add(e.name);
      }
    }
  };
  leerRaiz(APP);
  for (const grupo of fs.readdirSync(APP).filter((n) => /^\(.*\)$/.test(n))) {
    leerRaiz(path.join(APP, grupo));
  }
  return [...tramos].sort();
}

describe("direccion: formato", () => {
  it("acepta las direcciones de siempre", () => {
    for (const d of [
      "nosotros",
      "nosotros/trabaja-con-nosotros",
      "inicio",
      "politica-2026",
      "a1/b2-c3",
    ]) {
      assert.equal(errorDeFormato(d), null, d);
    }
  });
  it("rechaza mayúsculas, tildes, ñ, espacios, barras sobrantes, tramos vacíos y guiones sueltos", () => {
    for (const d of [
      "Nosotros",
      "política",
      "campaña",
      "dos palabras",
      "/nosotros",
      "nosotros/",
      "a//b",
      "-a",
      "a-",
      "a--b",
      "a_b",
      "a.b",
      "",
    ]) {
      assert.notEqual(errorDeFormato(d), null, d);
    }
  });
  it("propone la dirección desde el título", () => {
    assert.equal(direccionDesdeTitulo("Política de Garantía (2026)"), "politica-de-garantia-2026");
    assert.equal(direccionDesdeTitulo("  Campaña   Ñandú  "), "campana-nandu");
    assert.match(errorDeFormato("Campaña Nueva", "Campaña nueva") ?? "", /«campana-nueva»/);
  });
});

describe("direccion: rutas propias de la web", () => {
  it("TRAMOS_RESERVADOS más CARPETAS_DE_PAGINAS es exactamente lo que hay en src/app", () => {
    assert.deepEqual(
      [...TRAMOS_RESERVADOS, ...CARPETAS_DE_PAGINAS].sort(),
      primerosTramosDeLaWeb(),
      "Una carpeta o fichero nuevo en src/app: añádelo a TRAMOS_RESERVADOS (o, si sus rutas son páginas, a CARPETAS_DE_PAGINAS).",
    );
  });
  it("rechaza las reservadas por su primer tramo y deja las demás", () => {
    for (const d of [
      "maquinaria-pesada",
      "maquinaria-pesada/otra",
      "api",
      "admin/x",
      "noticias",
      "sitemap.xml",
    ]) {
      assert.match(errorDeReservada(d) ?? "", /no puede empezar por/, d);
    }
    for (const d of [
      "nosotros",
      "nosotros/trabaja-con-nosotros",
      "prueba-pagina-libre",
      "maquinaria",
    ]) {
      assert.equal(errorDeReservada(d), null, d);
    }
  });
  it("comprobación del guardián: una carpeta nueva haría fallar la comparación", () => {
    assert.notDeepEqual([...TRAMOS_RESERVADOS].sort(), [...TRAMOS_RESERVADOS, "tienda"].sort());
    assert.ok(primerosTramosDeLaWeb().includes("maquinaria-pesada"), "no leyó src/app/(site)");
  });
});

describe("direccion: origen de una redirección", () => {
  it("solo da error si ya es origen", () => {
    assert.match(errorDeRedireccion("vieja", true) ?? "", /origen de una redirección/);
    assert.equal(errorDeRedireccion("nueva", false), null);
  });
});
