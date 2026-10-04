import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TOPE_ANIMACION_BYTES,
  formatoDeAnimacionPermitido,
  veredictoLottie,
} from "./formatoDeAnimacionPermitido";

type Argumentos = Parameters<typeof formatoDeAnimacionPermitido>[0];

const capa = { ty: 4, ks: { o: { a: 0, k: 100 } }, ip: 0, op: 180 };
const base = { v: "5.5.2", fr: 30, ip: 0, op: 180, w: 1073, h: 1536, layers: [capa] };
const json = (o: unknown) => Buffer.from(JSON.stringify(o));

function llamar(data: Buffer, name = "mapa.json") {
  const args: { data?: Record<string, unknown> } = { data: { descripcion: "Mapa" } };
  formatoDeAnimacionPermitido({
    args,
    operation: "create",
    req: { file: { data, name, mimetype: "application/json", size: data.length } },
  } as unknown as Argumentos);
  return args.data;
}

describe("formato de animación Lottie", () => {
  it("acepta una animación válida y devuelve su tamaño y duración", () => {
    assert.deepEqual(veredictoLottie(json(base)), {
      valido: true,
      ancho: 1073,
      alto: 1536,
      duracionSeg: 6,
    });
  });

  it("rechaza lo que no es JSON, un JSON cualquiera y uno sin capas", () => {
    assert.equal(veredictoLottie(Buffer.from("no { es json")).valido, false);
    assert.equal(veredictoLottie(json({ hola: 1 })).valido, false);
    assert.equal(veredictoLottie(json([1, 2])).valido, false);
    assert.equal(veredictoLottie(json({ ...base, layers: [] })).valido, false);
    assert.equal(veredictoLottie(json({ ...base, op: 0 })).valido, false);
    assert.equal(veredictoLottie(json({ ...base, w: 0 })).valido, false);
  });

  it("rechaza una animación con expresiones: la versión ligera no las ejecuta", () => {
    const conExpresion = {
      ...base,
      layers: [{ ...capa, ks: { o: { a: 0, k: 100, x: "var $bm_rt = time * 10;" } } }],
    };
    const v = veredictoLottie(json(conExpresion));
    assert.equal(v.valido, false);
    assert.match(v.valido ? "" : v.motivo, /expresiones/);
  });

  it("no confunde la coordenada `x` numérica con una expresión", () => {
    const conX = { ...base, layers: [{ ...capa, ks: { p: { a: 0, k: [1, 2], x: 3 } } }] };
    assert.equal(veredictoLottie(json(conX)).valido, true);
  });

  it("rechaza imágenes externas y acepta las embebidas", () => {
    const externa = { ...base, assets: [{ id: "i", u: "img/", p: "foto.png" }] };
    const embebida = { ...base, assets: [{ id: "i", u: "", p: "data:image/png;base64,AAAA" }] };
    assert.equal(veredictoLottie(json(externa)).valido, false);
    assert.equal(veredictoLottie(json(embebida)).valido, true);
  });

  it("rechaza por encima del tope, que queda bajo el límite de 4,5 MB de Vercel", () => {
    assert.ok(TOPE_ANIMACION_BYTES < 4_500_000);
    const grande = Buffer.alloc(TOPE_ANIMACION_BYTES + 1, 0x20);
    const v = veredictoLottie(grande);
    assert.equal(v.valido, false);
    assert.match(v.valido ? "" : v.motivo, /el máximo es 4 MB/);
  });

  it("el gancho deja ancho y alto en los datos", () => {
    assert.deepEqual(llamar(json(base)), { descripcion: "Mapa", ancho: 1073, alto: 1536 });
  });

  it("el gancho rechaza en español un fichero que no es .json o no es Lottie", () => {
    assert.throws(() => llamar(json(base), "mapa.png"), /no es un fichero \.json/);
    assert.throws(() => llamar(json({ hola: 1 })), /no es una animación Lottie/);
  });
});
