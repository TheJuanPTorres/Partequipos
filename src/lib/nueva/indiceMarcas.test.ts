import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EquiposNuevo, MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

import { marcasDelIndice, totalesDelIndice } from "./indiceMarcas";

const marca = (id: number, nombre: string, orden?: number) =>
  ({ id, nombre, slug: nombre.toLowerCase(), ordenPortada: orden ?? null }) as MarcasMaquinaria;
const tipo = (id: number, m: number, nombre: string, subtipos: number[] = []) =>
  ({ id, marca: m, nombre, slug: nombre.toLowerCase(), subtipos }) as unknown as TiposMaquinaria;
const equipo = (id: number, m: number, t: number) => ({ id, marca: m, tipo: t }) as EquiposNuevo;

describe("índice de marcas de maquinaria nueva", () => {
  const marcas = [
    marca(1, "Hitachi", 2),
    marca(2, "Case", 1),
    marca(3, "Vacia"),
    marca(4, "Ammann"),
  ];
  const tipos = [
    tipo(10, 1, "Excavadoras"),
    tipo(11, 1, "Vacio"),
    tipo(20, 2, "Compactadores", [21]),
    tipo(21, 2, "Rodillos"),
    tipo(40, 4, "Vibros"),
  ];
  const equipos = [equipo(1, 1, 10), equipo(2, 1, 10), equipo(3, 2, 21), equipo(4, 4, 40)];
  const v = marcasDelIndice(marcas, tipos, equipos);

  it("solo las marcas con equipos, por su orden y después por nombre", () => {
    assert.deepEqual(
      v.map((m) => m.nombre),
      ["Case", "Hitachi", "Ammann"],
    );
  });

  it("cuenta los equipos de la marca y lista sus tipos con equipos (el paraguas suma sus subtipos)", () => {
    const hitachi = v.find((m) => m.nombre === "Hitachi")!;
    assert.equal(hitachi.equipos, 2);
    assert.deepEqual(
      hitachi.tipos.map((t) => [t.nombre, t.equipos]),
      [["Excavadoras", 2]],
    );
    const caseM = v.find((m) => m.nombre === "Case")!;
    assert.equal(caseM.equipos, 1);
    assert.deepEqual(
      caseM.tipos.map((t) => [t.nombre, t.equipos]),
      [
        ["Compactadores", 1],
        ["Rodillos", 1],
      ],
    );
    assert.match(caseM.href, /\/case\/$/);
  });

  it("los totales no cuentan dos veces un equipo", () => {
    assert.deepEqual(totalesDelIndice(v), { marcas: 3, equipos: 4, tipos: 4 });
  });
});
