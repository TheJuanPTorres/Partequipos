import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EquiposUsado } from "@/payload-types";

import { piezasFichaUsada } from "./fichaUsada";

const GUARDADA = { id: 3, slug: "excavadoras", nombre: "Excavadoras" };
const EMPRESA = { telefono: "317 000 0000", whatsapp: "573170000000" };
const url = (r: string) => `https://ejemplo.test${r}/`;

const foto = {
  id: 9,
  url: "https://blob.test/foto.webp",
  alt: "Foto de ejemplo",
  width: 1200,
  height: 800,
} as unknown as NonNullable<EquiposUsado["imagenes"]>[number];

describe("vista previa en vivo de una unidad usada: piezas de la ficha", () => {
  it("lo que se escribe sale en la ficha: nombre, migas, datos y párrafos", () => {
    const p = piezasFichaUsada(
      {
        nombre: "Excavadora de ejemplo ZX0 2020",
        slug: "excavadora-de-ejemplo-zx0-2020",
        anio: 2020,
        horometro: 5000,
        descripcion: "Primer párrafo.\n\nSegundo párrafo.",
        categoria: 3,
        imagenes: [foto],
      },
      GUARDADA,
      EMPRESA,
      url,
    );
    assert.equal(p.nombre, "Excavadora de ejemplo ZX0 2020");
    assert.equal(
      p.ruta,
      "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/excavadora-de-ejemplo-zx0-2020",
    );
    assert.equal(p.migas.at(-1)?.nombre, "Excavadora de ejemplo ZX0 2020");
    assert.equal(p.migas[3]?.nombre, "Excavadoras");
    assert.deepEqual(p.parrafos, ["Primer párrafo.", "Segundo párrafo."]);
    assert.ok(p.datos.some((d) => d.valor.includes("2020")));
    assert.equal(p.fotos.length, 1);
    assert.ok(p.experto);
  });

  it("una relación aún sin poblar (solo el id) no rompe: categoría guardada, sin foto ni PDF", () => {
    const p = piezasFichaUsada(
      { nombre: "  ", categoria: 99, imagenes: [12], fichaTecnicaPdf: 4 },
      GUARDADA,
      EMPRESA,
      url,
    );
    assert.equal(p.nombre, "Sin nombre");
    assert.equal(p.ruta, "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras");
    assert.deepEqual(p.fotos, []);
    assert.equal(p.pdf, null);
  });

  it("una categoría poblada nueva cambia la ruta y las migas", () => {
    const p = piezasFichaUsada(
      {
        nombre: "Cargador",
        slug: "cargador",
        categoria: { id: 5, slug: "cargadores", nombre: "Cargadores" } as EquiposUsado["categoria"],
      },
      GUARDADA,
      EMPRESA,
      url,
    );
    assert.equal(p.ruta, "/maquinaria-pesada/maquinaria-pesada-usada/cargadores/cargador");
    assert.equal(p.migas[3]?.nombre, "Cargadores");
  });

  it("el teléfono de la empresa no se repite en la descripción", () => {
    const p = piezasFichaUsada(
      { nombre: "X", descripcion: "Buena máquina.\n📞 317 000 0000 — Cotiza ya" },
      GUARDADA,
      EMPRESA,
      url,
    );
    assert.ok(!p.parrafos.join(" ").includes("317 000 0000"));
  });
});
