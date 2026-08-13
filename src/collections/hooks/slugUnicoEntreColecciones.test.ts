import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { comprobarSlugLibre } from "./slugUnicoEntreColecciones";

/**
 * El guardarraíl se prueba EN AMBAS DIRECCIONES porque el choque se puede crear
 * desde cualquiera de las dos colecciones, y una implementación instalada en un
 * solo lado dejaría la mitad del agujero abierto.
 */

/** Buscador falso: existe cualquier slug de la lista. */
const buscadorCon = (existentes: string[]) => async (slug: string) => existentes.includes(slug);

describe("comprobarSlugLibre — dirección artículo → página institucional", () => {
  const paginas = buscadorCon(["nosotros", "contactanos", "nosotros/trabaja-con-nosotros"]);

  it("rechaza un artículo que taparía una página institucional", async () => {
    const error = await comprobarSlugLibre("nosotros", "una página institucional", paginas);
    assert.ok(error, "debería rechazarlo");
    assert.match(error, /ya lo usa una página institucional/);
    assert.match(error, /nosotros/);
  });

  it("acepta un slug de artículo que no choca", async () => {
    assert.equal(
      await comprobarSlugLibre("cuidado-del-motor-en-la-maquinaria-pesada", "una página", paginas),
      null,
    );
  });
});

describe("comprobarSlugLibre — dirección página institucional → artículo", () => {
  const articulos = buscadorCon(["usas-la-grasa-correcta", "excavadoras-funciones-partes-marcas"]);

  it("rechaza una página que taparía un artículo", async () => {
    const error = await comprobarSlugLibre("usas-la-grasa-correcta", "un artículo", articulos);
    assert.ok(error, "debería rechazarlo");
    assert.match(error, /ya lo usa un artículo/);
  });

  it("acepta una página cuyo slug está libre", async () => {
    assert.equal(await comprobarSlugLibre("servicio-tecnico", "un artículo", articulos), null);
  });
});

describe("comprobarSlugLibre — casos límite", () => {
  const cualquiera = buscadorCon(["ocupado"]);

  it("no consulta nada si el slug está vacío: de eso se encarga `required`", async () => {
    let consultas = 0;
    const contador = async () => {
      consultas++;
      return true;
    };

    for (const vacio of ["", "   ", undefined, null]) {
      assert.equal(await comprobarSlugLibre(vacio, "otra cosa", contador), null);
    }
    assert.equal(consultas, 0);
  });

  it("recorta los espacios antes de comparar", async () => {
    assert.ok(await comprobarSlugLibre("  ocupado  ", "un artículo", cualquiera));
  });

  it("distingue mayúsculas: el slug ya viene normalizado por formatSlugHook", async () => {
    assert.equal(await comprobarSlugLibre("OCUPADO", "un artículo", cualquiera), null);
  });

  it("incluye el slug conflictivo en el mensaje, para poder diagnosticarlo", async () => {
    const error = await comprobarSlugLibre("ocupado", "un artículo", cualquiera);
    assert.match(error ?? "", /"ocupado"/);
  });

  it("explica por qué importa, no solo que falla", async () => {
    const error = await comprobarSlugLibre("ocupado", "un artículo", cualquiera);
    assert.match(error ?? "", /inalcanzable/);
  });
});
