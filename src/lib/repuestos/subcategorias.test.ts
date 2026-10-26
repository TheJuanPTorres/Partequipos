import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CategoriasTecnica } from "@/payload-types";

import { accesosDe, esCategoriaPrincipal, rutaDeCategoriaTecnica } from "./subcategorias";

const filtracion = { id: 4, slug: "filtracion-para-maquinaria-pesada", nombre: "Filtración" };
const cat = (c: Partial<CategoriasTecnica>) => c as CategoriasTecnica;

describe("páginas dentro de una categoría técnica", () => {
  it("la dirección de una subpágina es la de su categoría seguida de la suya", () => {
    assert.equal(
      rutaDeCategoriaTecnica(
        cat({ slug: "filtros-donaldson-maquinaria-pesada", padre: cat(filtracion) }),
      ),
      "/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtracion-para-maquinaria-pesada/filtros-donaldson-maquinaria-pesada",
    );
    assert.equal(
      rutaDeCategoriaTecnica(cat({ slug: "filtracion-para-maquinaria-pesada", padre: null })),
      "/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtracion-para-maquinaria-pesada",
    );
  });

  it("sin la categoría de la que cuelga poblada, sin dirección (mejor que un enlace roto)", () => {
    assert.equal(rutaDeCategoriaTecnica(cat({ slug: "x", padre: 4 })), null);
    assert.equal(esCategoriaPrincipal(cat({ padre: 4 })), false);
    assert.equal(esCategoriaPrincipal(cat({})), true);
  });

  it("los accesos de una categoría: solo sus subpáginas, con la tinta que mejor se lee", () => {
    const todas = [
      cat({
        id: 9,
        slug: "filtros-donaldson-maquinaria-pesada",
        nombre: "Filtros Donaldson",
        padre: cat(filtracion),
        colorMarca: "#007CC4",
      }),
      cat({ id: 10, slug: "otra", nombre: "Otra", padre: cat({ id: 7, slug: "x" }) }),
      cat({ ...filtracion, padre: null }),
    ];
    const a = accesosDe(4, todas);
    assert.equal(a.length, 1);
    assert.equal(a[0]?.nombre, "Filtros Donaldson");
    assert.equal(a[0]?.color, "#007cc4");
    // Negro sobre #007cc4 (4,6:1) se lee mejor que blanco (4,5:1): AA en los dos casos.
    assert.match(a[0]?.tinta ?? "", /^#(000000|ffffff)$/);
  });
});
