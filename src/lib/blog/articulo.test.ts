import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  autorVisible,
  enlacesCompartir,
  mismaImagen,
  postRecientes,
  sinImagenPrincipal,
} from "./articulo";
import type { ArticuloLista } from "./indice";

type N = { type: string; value?: unknown; text?: string; children?: N[] };
const img = (id: number, filename: string) => ({ id, filename });
const subida = (value: unknown): N => ({ type: "upload", value });
const parrafo = (...children: N[]): N => ({ type: "paragraph", children });
const texto = (t: string): N => ({ type: "text", text: t });
const doc = (...children: N[]) => ({ root: { type: "root", children } });

describe("autorVisible", () => {
  it("un usuario interno o vacío firma la empresa; un nombre, el nombre", () => {
    assert.equal(autorVisible("3e6ll", "Partequipos"), "Partequipos");
    assert.equal(autorVisible("admin", "Partequipos"), "Partequipos");
    assert.equal(autorVisible("  ", "Partequipos"), "Partequipos");
    assert.equal(autorVisible(null, "Partequipos"), "Partequipos");
    assert.equal(autorVisible("Partequipos", "Partequipos"), "Partequipos");
    assert.equal(autorVisible("Laura Gómez", "Partequipos"), "Laura Gómez");
    assert.equal(autorVisible("Andrés", "Partequipos"), "Andrés");
  });
});

describe("mismaImagen", () => {
  it("por id, por fichero o por fichero sin el sufijo aleatorio del Blob", () => {
    assert.ok(mismaImagen(286, img(286, "a.jpg")));
    assert.ok(mismaImagen(img(1, "foto.jpg"), img(2, "foto.jpg")));
    assert.ok(
      mismaImagen(
        img(1, "wp-foto-1-aB3dE5fG7hJ9kL1mN3pQ.jpg"),
        img(2, "wp-foto-1-ZZZZZZZZZZZZZZZZZZZZZZZZ.jpg"),
      ),
    );
    assert.ok(!mismaImagen(img(1, "wp-foto-1.jpg"), img(2, "wp-foto-2.jpg")));
    assert.ok(!mismaImagen(img(1, "a.jpg"), null));
  });
});

describe("sinImagenPrincipal", () => {
  const principal = img(286, "wp-llanta-gVYBvzCGklKmJSlpSWMMsDUx5nkbAC.jpeg");

  it("quita la primera imagen si es la principal (al principio)", () => {
    const c = doc(subida(principal), parrafo(texto("Hola")), subida(img(9, "otra.jpg")));
    const r = sinImagenPrincipal(c, principal);
    assert.deepEqual(
      r.root.children.map((n) => n.type),
      ["paragraph", "upload"],
    );
    assert.equal(c.root.children.length, 3, "no muta el original");
  });

  it("también tras un párrafo, y dentro de un párrafo que se queda vacío", () => {
    const c = doc(parrafo(texto("Intro")), parrafo(subida(286)), parrafo(texto("Más")));
    assert.deepEqual(
      sinImagenPrincipal(c, principal).root.children.map((n) => n.children![0]!.type),
      ["text", "text"],
    );
  });

  it("dentro de un párrafo con texto, quita solo la imagen", () => {
    const c = doc(parrafo(texto("Antes"), subida(principal)));
    const r = sinImagenPrincipal(c, principal);
    assert.deepEqual(r.root.children[0]!.children, [texto("Antes")]);
  });

  it("si la primera imagen es otra, no toca nada (ni la principal más abajo)", () => {
    const c = doc(subida(img(9, "otra.jpg")), subida(principal));
    assert.equal(sinImagenPrincipal(c, principal), c);
  });

  it("sin imagen principal o sin contenido, igual", () => {
    const c = doc(subida(principal));
    assert.equal(sinImagenPrincipal(c, null), c);
    assert.equal(sinImagenPrincipal(null, principal), null);
  });
});

describe("postRecientes", () => {
  const a = (id: number, fecha: string) => ({ id, fecha }) as ArticuloLista;
  it("los 3 más recientes sin el actual", () => {
    const lista = [
      a(1, "2026-01-01"),
      a(2, "2026-05-01"),
      a(3, "2026-03-01"),
      a(4, "2026-04-01"),
      a(5, "2025-01-01"),
    ];
    assert.deepEqual(
      postRecientes(lista, 2).map((x) => x.id),
      [4, 3, 1],
    );
  });
});

describe("enlacesCompartir", () => {
  it("las 5 redes, con la URL codificada", () => {
    const e = enlacesCompartir("https://x.co/a/?b=1", "Título & más");
    assert.deepEqual(
      e.map((x) => x.red),
      ["facebook", "x", "linkedin", "correo", "whatsapp"],
    );
    for (const x of e) assert.ok(x.href.includes("https%3A%2F%2Fx.co%2Fa%2F%3Fb%3D1"), x.red);
    assert.ok(e[1].href.includes("T%C3%ADtulo%20%26%20m%C3%A1s"));
  });
});
