import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Media } from "@/payload-types";

import {
  fotoMasReciente,
  tarjetasDeCategoriasUsada,
  tarjetasDeMarcasUsada,
  textoUnidades,
  type UnidadDelIndice,
} from "./indice";

const foto = (url: string) => ({ url, alt: "", width: 800, height: 600, focalX: 50, focalY: 50 });
const media = (url: string) => ({ id: 1, url, alt: "Imagen", width: 800, height: 600 }) as Media;
const unidad = (
  categoria: number,
  marcaUsada: number | null,
  fechaPublicacion: string,
  url: string | null,
): UnidadDelIndice => ({ categoria, marcaUsada, fechaPublicacion, foto: url ? foto(url) : null });

const ruta = (slug: string) => `/usada/${slug}`;

describe("índice de usados", () => {
  const unidades = [
    unidad(1, 10, "2026-01-01", "/vieja.jpg"),
    unidad(1, 10, "2026-05-01", "/nueva.jpg"),
    unidad(1, 20, "2026-06-01", null), // la más reciente, sin foto
    unidad(2, null, "2026-02-01", "/otra.jpg"),
  ];

  it("la foto es la de la unidad más reciente que tenga foto", () => {
    assert.equal(fotoMasReciente(unidades.filter((u) => u.categoria === 1))?.url, "/nueva.jpg");
    assert.equal(fotoMasReciente([unidad(1, null, "2026-01-01", null)]), null);
  });

  it("una tarjeta por categoría con unidades; las vacías no salen", () => {
    const t = tarjetasDeCategoriasUsada(
      [
        { id: 1, nombre: "Excavadoras", slug: "excavadoras", imagen: null },
        { id: 2, nombre: "Grúas", slug: "gruas", imagen: media("/propia.jpg") },
        { id: 3, nombre: "Vacía", slug: "vacia", imagen: null },
      ],
      unidades,
      ruta,
    );
    assert.deepEqual(
      t.map((x) => [x.titulo, x.href, x.imagen?.url, x.detalle]),
      [
        ["Excavadoras", "/usada/excavadoras/", "/nueva.jpg", "3 unidades disponibles"],
        // La imagen elegida en el panel manda sobre la de la unidad.
        ["Grúas", "/usada/gruas/", "/propia.jpg", "1 unidad disponible"],
      ],
    );
  });

  it("en el índice, también las vacías: después y con «Sin unidades por ahora»", () => {
    const t = tarjetasDeCategoriasUsada(
      [
        { id: 3, nombre: "Cargadores", slug: "cargadores", imagen: null },
        { id: 1, nombre: "Excavadoras", slug: "excavadoras", imagen: null },
      ],
      unidades,
      ruta,
      { incluirVacias: true },
    );
    assert.deepEqual(
      t.map((x) => [x.titulo, x.detalle, x.imagen?.url ?? null]),
      [
        ["Excavadoras", "3 unidades disponibles", "/nueva.jpg"],
        ["Cargadores", "Sin unidades por ahora", null],
      ],
    );
  });

  it("una tarjeta por marca con unidades: el logo si lo tiene; si no, la foto más reciente", () => {
    const t = tarjetasDeMarcasUsada(
      [
        { id: 10, nombre: "Hitachi", slug: "hitachi", logo: null },
        { id: 20, nombre: "Komatsu", slug: "komatsu", logo: media("/logo.png") },
        { id: 30, nombre: "Sin unidades", slug: "sin", logo: null },
      ],
      unidades,
      ruta,
    );
    assert.deepEqual(
      t.map((x) => [x.titulo, x.imagen?.url ?? null, x.logo?.url ?? null, x.detalle]),
      [
        ["Hitachi", "/nueva.jpg", null, "2 unidades disponibles"],
        ["Komatsu", null, "/logo.png", "1 unidad disponible"],
      ],
    );
  });

  it("el logo de la marca de repuestos con su nombre manda (un solo logo por marca)", () => {
    const logos = new Map([
      ["hitachi", { url: "/rep.png", width: 419, height: 100, oscuro: true }],
    ]);
    const [t] = tarjetasDeMarcasUsada(
      [{ id: 10, nombre: "Hitachi", slug: "hitachi", logo: null }],
      unidades,
      ruta,
      logos,
    );
    assert.deepEqual(t?.logo, { url: "/rep.png", width: 419, height: 100, oscuro: true });
    assert.equal(t?.imagen, null);
  });

  it("singular y plural", () => {
    assert.equal(textoUnidades(1), "1 unidad disponible");
    assert.equal(textoUnidades(2), "2 unidades disponibles");
  });
});
