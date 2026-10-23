import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  datosDeCabecera,
  enlaceVista360,
  iconoPorEtiqueta,
  normalizar,
  tituloEscritorio,
  tituloOtras,
  validarVista360,
} from "./fichaNueva";
import type { FilaFicha } from "./fichaTecnica";

const fila = (etiqueta: string, valor: string, destacar = false, icono?: string): FilaFicha => ({
  etiqueta,
  valor,
  destacar,
  icono: icono ?? null,
});

describe("datosDeCabecera (regla del cliente: máximo 5, por prioridad)", () => {
  const ver = (filas: FilaFicha[], max?: number) =>
    datosDeCabecera(filas, max).map((d) => `${d.etiqueta}: ${d.valor}`);

  it("1150M Tier4: los cinco de prioridad, en su orden, con el nombre uniforme y el valor tal cual", () => {
    assert.deepEqual(
      ver([
        fila("POTENCIA NETA", "138 hp"),
        fila("FUERZA DE TRACCIÓN MÁXIMA", "213,5 kN"),
        fila("PESO OPERATIVO", "14,3 t"),
        fila("ANCHO DE LA ZAPATA", "22/26/30 in (según requerimiento cliente)"),
        fila("MOTOR", "FPT F4HFE613F"),
      ]),
      [
        "Potencia neta: 138 hp",
        "Peso operativo: 14,3 t",
        "Motor: FPT F4HFE613F",
        "Fuerza de tracción máxima: 213,5 kN",
        "Ancho de la zapata: 22/26/30 in (según requerimiento cliente)",
      ],
    );
  });

  it("si falta alguna, completa con otras filas reales en el orden guardado (relleno: su etiqueta tal cual)", () => {
    assert.deepEqual(
      ver([
        fila("POTENCIA NETA", "98 hp"),
        fila("ALANCE MAXIMO EN EL SUELO", "8,65m"),
        fila("PESO OPERATIVO", "13 t"),
        fila("PROFUNDIDAD MÁXIMA DE EXCAVACIÓN", "6,0m"),
        fila("MOTOR", "Isuzu AM-4JJ1X"),
        fila("Cilindros", "4"),
      ]),
      [
        "Potencia neta: 98 hp",
        "Peso operativo: 13 t",
        "Motor: Isuzu AM-4JJ1X",
        "ALANCE MAXIMO EN EL SUELO: 8,65m",
        "PROFUNDIDAD MÁXIMA DE EXCAVACIÓN: 6,0m",
      ],
    );
  });

  it("1150M: «Barra de tracción parada» es la fuerza de tracción máxima; «Barra de tracción - versión XLT», no", () => {
    assert.deepEqual(
      ver([
        fila("Ancho de la pala", '120" I 3.048mm'),
        fila("Potencia bruta del motor a RPM", "138 hp (103 kW)"),
        fila("Marca y modelo del motor", "F4HFA613L"),
        fila("Peso operacional", "31.134 lb (14.122 kg)"),
        fila("Barra de tracción parada", "48.000 lb-ft I 213,5 kN"),
        fila("Ancho de la zapata", '22" I 559 mm'),
        fila("Potencia neta del motor", "127,4 hp (95 kW)"),
      ]),
      [
        "Potencia neta: 127,4 hp (95 kW)",
        "Peso operativo: 31.134 lb (14.122 kg)",
        "Motor: F4HFA613L",
        "Fuerza de tracción máxima: 48.000 lb-ft I 213,5 kN",
        'Ancho de la zapata: 22" I 559 mm',
      ],
    );
    assert.deepEqual(ver([fila("Barra de tracción - versión XLT", "66 kg")]), [
      "Barra de tracción - versión XLT: 66 kg",
    ]);
  });

  it("con menos de 5 filas, las que haya: nunca se inventa", () => {
    assert.deepEqual(ver([fila("MOTOR", "Kubota – 25 hp"), fila("PESO OPERATIVO", "2,6 Ton")]), [
      "Peso operativo: 2,6 Ton",
      "Motor: Kubota – 25 hp",
    ]);
    assert.deepEqual(ver([]), []);
    assert.deepEqual(ver(null as unknown as FilaFicha[]), []);
  });

  it("empareja las variantes de WordPress: mayúsculas, tildes, «(SAE J1349)», «Potencia» a secas", () => {
    const d = datosDeCabecera([
      fila("Potência neta (SAE J1349)", "92 hp"),
      fila("Peso de Operación", "5,25 t"),
      fila("Marca y modelo del motor", "FPT 445TA"),
      fila("Fuerza de tracción", "100 kN"),
      fila("Ancho de la zapata:", "500 mm"),
    ]);
    assert.deepEqual(
      d.map((x) => x.icono),
      ["potencia", "peso", "motor", "otro", "alcance"],
    );
    assert.equal(ver([fila("Potencia", "64 hp")])[0], "Potencia neta: 64 hp");
  });

  it("la potencia BRUTA no ocupa el sitio de la neta: va de relleno, con su etiqueta", () => {
    assert.deepEqual(
      ver([
        fila("Potencia bruta (SAE J1349)", "130 hp"),
        fila("Peso operativo", "13 t"),
        fila("Potencia neta (SAE J1349)", "118 hp"),
      ]),
      ["Potencia neta: 118 hp", "Peso operativo: 13 t", "Potencia bruta (SAE J1349): 130 hp"],
    );
  });

  it("«Motor de arranque» no es el motor; «Destacar» no cambia la ficha", () => {
    const d = datosDeCabecera([
      fila("Motor de arranque", "12 V", true, "otro"),
      fila("Motor", "Yanmar 4TNV88C"),
    ]);
    assert.deepEqual(
      d.map((x) => x.etiqueta),
      ["Motor", "Motor de arranque"],
    );
  });

  it("las tarjetas piden 3: los 3 primeros de los mismos 5", () => {
    assert.deepEqual(
      ver(
        [
          fila("Motor", "M"),
          fila("Peso operativo", "P"),
          fila("Potencia neta", "N"),
          fila("Ancho de la zapata", "Z"),
        ],
        3,
      ),
      ["Potencia neta: N", "Peso operativo: P", "Motor: M"],
    );
  });
});

describe("normalizar e iconoPorEtiqueta", () => {
  it("compara sin tildes, mayúsculas ni «:» final", () => {
    assert.equal(normalizar("  FUERZA DE TRACCIÓN  MÁXIMA: "), "fuerza de traccion maxima");
  });

  it("los datos de relleno llevan el icono que se les parece", () => {
    assert.equal(iconoPorEtiqueta("Profundidad de dragado"), "profundidad");
    assert.equal(iconoPorEtiqueta("Capacidad del cucharón"), "capacidad");
    assert.equal(iconoPorEtiqueta("Certificación"), "otro");
  });
});

describe("tituloOtras", () => {
  it("«Otros modelos de {tipo}», sin género: vale en singular y en plural", () => {
    assert.equal(tituloOtras("Excavadora"), "Otros modelos de Excavadora");
    assert.equal(tituloOtras(" Bulldozer "), "Otros modelos de Bulldozer");
    assert.equal(tituloOtras("Pavimentadora Dynapac"), "Otros modelos de Pavimentadora Dynapac");
    assert.equal(tituloOtras("Excavadoras"), "Otros modelos de Excavadoras");
  });
});

describe("tituloEscritorio", () => {
  it("marca y referencia; sin referencia, null (se pinta el nombre completo)", () => {
    assert.deepEqual(tituloEscritorio("Hitachi", " ZX130-5B "), {
      marca: "Hitachi",
      modelo: "ZX130-5B",
    });
    assert.equal(tituloEscritorio("Aditamentos", null), null);
    assert.equal(tituloEscritorio("Aditamentos", "  "), null);
  });
});

describe("validarVista360", () => {
  it("vacío vale (sin botón); solo https y sin credenciales", () => {
    assert.equal(validarVista360(""), true);
    assert.equal(validarVista360(null), true);
    assert.equal(validarVista360("https://my.matterport.com/show/?m=abc"), true);
    assert.match(String(validarVista360("http://ejemplo.com/360")), /https/);
    assert.match(String(validarVista360("javascript:alert(1)")), /https/);
    assert.match(String(validarVista360("no es un enlace")), /válido/);
    assert.match(String(validarVista360("https://u:p@ejemplo.com/")), /contraseña/);
  });

  it("enlaceVista360 solo devuelve enlaces válidos", () => {
    assert.equal(enlaceVista360(" https://ejemplo.com/360 "), "https://ejemplo.com/360");
    assert.equal(enlaceVista360("http://ejemplo.com/360"), null);
    assert.equal(enlaceVista360(null), null);
  });
});
