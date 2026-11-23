import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  enlaceVistaPrevia,
  RUTAS_EN_EL_SITIO,
  rutaEnElSitio,
  type BuscarSlug,
} from "./verEnElSitio";

/** Base falsa: colección → id → slug. */
const base: Record<string, Record<string, string>> = {
  marcas: { "1": "caterpillar" },
  "tipos-equipo": { "2": "excavadora" },
  "marcas-maquinaria": { "3": "hitachi" },
  "tipos-maquinaria": { "4": "excavadoras" },
  "marcas-lubricante": { "5": "lubricantes-eni" },
};
const buscar: BuscarSlug = async (c, id) => base[c]?.[String(id)] ?? null;

describe("rutaEnElSitio", () => {
  it("modelo de repuesto: marca, tipo y modelo", async () => {
    assert.equal(
      await rutaEnElSitio("modelos-repuesto", { slug: "cat-320d", marca: 1, tipo: 2 }, buscar),
      "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/caterpillar/excavadora/cat-320d/",
    );
  });

  it("acepta la relación como documento", async () => {
    assert.equal(
      await rutaEnElSitio(
        "tipos-equipo",
        { slug: "excavadora", marca: { id: 1, slug: "caterpillar" } },
        buscar,
      ),
      "/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/caterpillar/excavadora/",
    );
  });

  it("equipo nuevo y categoría de lubricante", async () => {
    assert.equal(
      await rutaEnElSitio("equipos-nuevos", { slug: "zx350", marca: 3, tipo: 4 }, buscar),
      "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras/zx350/",
    );
    assert.equal(
      await rutaEnElSitio("categorias-lubricante", { slug: "auto-liviano", marca: 5 }, buscar),
      "/lubricantes/lubricantes-eni/auto-liviano/",
    );
  });

  it("páginas: el botón abre la vista previa del borrador; sin guardar o sin dirección, nada", async () => {
    assert.equal(
      await enlaceVistaPrevia("paginas", { id: 7, slug: "nosotros" }),
      "/api/borrador/?pagina=7",
    );
    assert.equal(await enlaceVistaPrevia("paginas", { slug: "nosotros" }), null);
    assert.equal(await enlaceVistaPrevia("paginas", { id: 7, slug: "" }), null);
    assert.equal(await enlaceVistaPrevia("articulos", { id: 7, slug: "a" }), undefined);
  });

  it("páginas: la portada es la raíz; artículos en la raíz", async () => {
    assert.equal(await rutaEnElSitio("paginas", { slug: "inicio" }, buscar), "/");
    assert.equal(
      await rutaEnElSitio("paginas", { slug: "nosotros/trabaja-con-nosotros" }, buscar),
      "/nosotros/trabaja-con-nosotros/",
    );
    assert.equal(
      await rutaEnElSitio("articulos", { slug: "usas-la-grasa" }, buscar),
      "/usas-la-grasa/",
    );
  });

  it("sin botón si falta el slug o no se encuentra la relación", async () => {
    assert.equal(await rutaEnElSitio("marcas", {}, buscar), null);
    assert.equal(
      await rutaEnElSitio("modelos-repuesto", { slug: "x", marca: 99, tipo: 2 }, buscar),
      null,
    );
  });

  it("sin botón en colecciones sin página propia", async () => {
    assert.equal(await rutaEnElSitio("equipos-usados", { slug: "x" }, buscar), null);
    assert.equal(await rutaEnElSitio("solicitudes", { slug: "x" }, buscar), null);
  });

  it("cubre exactamente las colecciones con página pública", () => {
    assert.deepEqual(Object.keys(RUTAS_EN_EL_SITIO).sort(), [
      "articulos",
      "categorias-blog",
      "categorias-lubricante",
      "categorias-maquinaria",
      "categorias-usada",
      "equipos-nuevos",
      "equipos-usados",
      "marcas",
      "marcas-lubricante",
      "marcas-maquinaria",
      "marcas-usada",
      "modelos-repuesto",
      "paginas",
      "tipos-equipo",
      "tipos-maquinaria",
    ]);
  });
});
