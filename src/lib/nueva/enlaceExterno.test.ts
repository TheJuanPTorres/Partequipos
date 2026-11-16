import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  destinoDeMarca,
  enlaceExternoDe,
  migasDeMarca,
  normalizarEnlaceExterno,
  tienePaginaPropia,
  validarEnlaceExterno,
} from "./enlaceExterno";

describe("enlace externo de una marca de nueva", () => {
  it("vale una dirección https de otro sitio, normalizada", () => {
    assert.equal(normalizarEnlaceExterno("  https://maquitecno.co  "), "https://maquitecno.co/");
    assert.equal(validarEnlaceExterno("https://maquitecno.co/"), true);
  });

  it("vacío vale y significa «con página propia»", () => {
    for (const v of [undefined, null, "", "   "]) {
      assert.equal(validarEnlaceExterno(v), true);
      assert.equal(normalizarEnlaceExterno(v as string | null | undefined), null);
    }
    assert.equal(tienePaginaPropia({}), true);
    assert.equal(tienePaginaPropia({ enlaceExterno: "" }), true);
  });

  it("rechaza lo que no es https a otro sitio", () => {
    for (const v of [
      "http://maquitecno.co/",
      "maquitecno.co",
      "javascript:alert(1)",
      "/contactanos/",
      "https://localhost/",
      "https://usuario:clave@maquitecno.co/",
      "https://partequipos.com/contactanos/",
      "https://partequipos-abc.vercel.app/",
    ]) {
      assert.equal(normalizarEnlaceExterno(v), null, v);
      assert.equal(typeof validarEnlaceExterno(v), "string", v);
    }
  });

  it("una marca con enlace externo no tiene página propia", () => {
    const liugong = { enlaceExterno: "https://maquitecno.co/" };
    assert.equal(enlaceExternoDe(liugong), "https://maquitecno.co/");
    assert.equal(tienePaginaPropia(liugong), false);
  });

  it("«Ver marca» lleva al enlace externo, en pestaña nueva, si la marca no tiene página", () => {
    const pagina = "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/liugong/";
    assert.deepEqual(destinoDeMarca({ enlaceExterno: "https://maquitecno.co" }, pagina), {
      href: "https://maquitecno.co/",
      externo: true,
    });
    // Con página propia (o un enlace no válido, que no cuenta), a su página.
    for (const marca of [{}, { enlaceExterno: "" }, { enlaceExterno: "http://maquitecno.co/" }]) {
      assert.deepEqual(destinoDeMarca(marca, pagina), { href: pagina, externo: false });
    }
  });

  it("las migas no llevan el nivel de una marca sin página propia", () => {
    const item = {
      nombre: "LiuGong",
      path: "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/liugong",
    };
    assert.deepEqual(migasDeMarca({ enlaceExterno: "https://maquitecno.co/" }, item), []);
    assert.deepEqual(migasDeMarca({ enlaceExterno: null }, item), [item]);
  });
});
