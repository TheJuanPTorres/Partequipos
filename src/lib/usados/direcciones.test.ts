import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

import { direccionesDeUnidades } from "./direcciones";
import { nombreYCategoriaDeUnidad } from "./wordpress";

const u = (idWp: number, nombre: string, categoria = "excavadoras") => ({
  idWp,
  nombre,
  categoria,
  enlace: `https://partequipos.com/maquinaria-pesada-usada/viejo-${idWp}/`,
});

describe("direccionesDeUnidades", () => {
  it("slug del nombre, ruta nueva y 301 desde la antigua", () => {
    const [d] = direccionesDeUnidades([u(10, "Excavadora Hitachi ZX350H-5B 2016")]);
    assert.equal(d?.slug, "excavadora-hitachi-zx350h-5b-2016");
    assert.equal(
      d?.hacia,
      "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/excavadora-hitachi-zx350h-5b-2016",
    );
    assert.equal(d?.desde, "/maquinaria-pesada-usada/viejo-10");
  });

  it("el id de WordPress al final solo si dos de la misma categoría chocan", () => {
    const r = direccionesDeUnidades([
      u(30, "Excavadora Hitachi ZX200 2015"),
      u(20, "Excavadora Hitachi ZX200 2015"),
      u(40, "Excavadora Hitachi ZX200 2015", "miniexcavadoras"),
    ]);
    const por = Object.fromEntries(r.map((d) => [d.idWp, d.slug]));
    assert.equal(por[20], "excavadora-hitachi-zx200-2015");
    assert.equal(por[30], "excavadora-hitachi-zx200-2015-30");
    // Otra categoría: no choca.
    assert.equal(por[40], "excavadora-hitachi-zx200-2015");
  });

  it("no depende del orden de entrada", () => {
    const a = [u(1, "A b"), u(2, "A b")];
    const porId = (r: ReturnType<typeof direccionesDeUnidades>) =>
      Object.fromEntries(r.map((d) => [d.idWp, d.slug]));
    assert.deepEqual(
      porId(direccionesDeUnidades(a)),
      porId(direccionesDeUnidades([...a].reverse())),
    );
  });
});

/*
 * LA PRUEBA DEL SERIAL, contra la exportación real. Los números de serie son
 * datos del cliente y no entran al repositorio (CLAUDE.md §9): el JSON vive
 * fuera, y sin él la prueba se omite (CI). Se ejecuta a mano antes de importar
 * con `USADOS_JSON=<ruta> node --import tsx --test src/lib/usados/direcciones.test.ts`.
 */
const FUENTE =
  process.env.USADOS_JSON ??
  "C:/Users/Juan Torres/Desktop/partequipos-cierre/usados-wordpress.json";

type Crudo = Parameters<typeof nombreYCategoriaDeUnidad>[0] & {
  idWp: number;
  enlace: string;
  serial: string;
};

describe("direcciones de las unidades reales", { skip: !fs.existsSync(FUENTE) }, () => {
  const { unidades } = JSON.parse(fs.readFileSync(FUENTE, "utf8")) as { unidades: Crudo[] };
  const planes = unidades.flatMap((x) => {
    const n = nombreYCategoriaDeUnidad(x);
    return n ? [{ x, ...n }] : [];
  });
  const direcciones = direccionesDeUnidades(
    planes.map((p) => ({
      idWp: p.x.idWp,
      enlace: p.x.enlace,
      categoria: p.categoria,
      nombre: p.nombre,
    })),
  );

  it("ninguna dirección nueva contiene el serial de su unidad ni el de ninguna otra", () => {
    const compacto = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
    const seriales = [...new Set(unidades.map((x) => compacto(x.serial)).filter(Boolean))];
    assert.ok(seriales.length >= 100, "se esperaban ~126 seriales distintos");
    const malas = direcciones.filter((d) => seriales.some((s) => compacto(d.hacia).includes(s)));
    // Solo el id de la unidad, nunca el serial (que no se imprime).
    assert.deepEqual(
      malas.map((d) => d.idWp),
      [],
    );
  });

  it("únicas dentro de la categoría, sin reservadas y con su 301", () => {
    const vistas = new Set(direcciones.map((d) => `${d.categoria}/${d.slug}`));
    assert.equal(vistas.size, direcciones.length);
    assert.equal(
      direcciones.some((d) => d.slug === "pagina" || d.slug === "marcas"),
      false,
    );
    assert.equal(
      direcciones.every((d) => d.desde !== null),
      true,
    );
    assert.equal(new Set(direcciones.map((d) => d.desde)).size, direcciones.length);
  });
});
