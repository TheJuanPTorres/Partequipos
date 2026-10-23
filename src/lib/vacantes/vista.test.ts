import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Vacante } from "./tipos";
import {
  aplicarFiltro,
  ciudadesDe,
  filtroPedido,
  MIN_VACANTES_PARA_FILTRO,
  slugCiudad,
  TEXTOS_TRABAJA,
  vistaTrabaja,
} from "./vista";

const v = (ciudad: string, i: number): Vacante => ({
  cargo: `Cargo ${i}`,
  ciudad,
  enlace: `https://partequipos.buk.co/s/${i}`,
});
const ocho = ["Bogotá", "Bogotá", "Montería", "Cali", "Bogotá", "Medellín", "Cali", "Ibagué"].map(
  v,
);

describe("«Trabaja con nosotros»", () => {
  it("vacía, los textos del diseño de Andrés", () => {
    const vista = vistaTrabaja(null);
    assert.equal(vista.encabezado.linea1, "Trabaja con nosotros");
    assert.equal(vista.encabezado.antetitulo, "Partequipos");
    assert.equal(vista.equipo.titulo, "Únete a nuestro equipo");
    assert.equal(vista.hojaDeVida.titulo, TEXTOS_TRABAJA.tituloHojaDeVida);
    assert.equal(vista.hojaDeVida.parrafos.length, 2);
    assert.equal(vista.hojaDeVida.boton, "Envíanos tu hoja de vida");
    assert.equal(vista.hojaDeVida.imagen, null);
  });

  it("los textos del panel mandan", () => {
    const vista = vistaTrabaja({ titulo: "Únete", tituloEquipo: " Vacantes " });
    assert.equal(vista.encabezado.linea1, "Únete");
    assert.equal(vista.equipo.titulo, "Vacantes");
  });

  it("ciudades por orden alfabético, con su número", () => {
    assert.deepEqual(
      ciudadesDe(ocho).map((c) => `${c.nombre}:${c.cuantas}`),
      ["Bogotá:3", "Cali:2", "Ibagué:1", "Medellín:1", "Montería:1"],
    );
    assert.equal(slugCiudad("Montería"), "monteria");
  });

  it("filtro: solo con 8 o más vacantes; una ciudad que no está, inválida", () => {
    assert.equal(MIN_VACANTES_PARA_FILTRO, 8);
    assert.deepEqual(filtroPedido(ocho, undefined), { tipo: "todas" });
    const f = filtroPedido(ocho, "bogota");
    assert.equal(f.tipo, "ciudad");
    assert.equal(aplicarFiltro(ocho, f).length, 3);
    assert.deepEqual(filtroPedido(ocho, "pasto"), { tipo: "invalido" });
    assert.deepEqual(filtroPedido(ocho, ["bogota", "cali"]), { tipo: "invalido" });
    assert.deepEqual(filtroPedido(ocho.slice(0, 7), "bogota"), { tipo: "invalido" });
  });
});
