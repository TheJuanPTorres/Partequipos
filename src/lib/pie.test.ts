import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ORDEN_REDES,
  PIE_INICIAL,
  columnasDelPie,
  hrefTelefono,
  redDelPie,
  redesDelPie,
  validarDestinoPie,
  validarDocumentoPie,
} from "./pie";

describe("pie: columnas", () => {
  it("el contenido inicial da las tres columnas de ux-9, con el teléfono de seoConfig", () => {
    const c = columnasDelPie(PIE_INICIAL.columnas, "+57 317 670 7071");
    assert.deepEqual(
      c.map((x) => x.titulo),
      ["Maquinaria pesada", "Navegación", "Contacto"],
    );
    const call = c[2]!.enlaces[0]!;
    assert.deepEqual(call, { etiqueta: "Call center", href: "tel:+573176707071", interno: false });
  });

  it("descarta enlaces sin etiqueta o con destino inválido, y columnas vacías", () => {
    const c = columnasDelPie(
      [
        {
          titulo: "A",
          enlaces: [
            { etiqueta: "", tipo: "pagina", destino: "/x/" },
            { etiqueta: "Malo", tipo: "pagina", destino: "javascript:alert(1)" },
            { etiqueta: "Bueno", tipo: "pagina", destino: "/bueno/" },
          ],
        },
        { titulo: "Vacía", enlaces: [{ etiqueta: "Sin destino", tipo: "pagina", destino: "" }] },
        { titulo: "  ", enlaces: [{ etiqueta: "X", tipo: "pagina", destino: "/x/" }] },
      ],
      "1",
    );
    assert.deepEqual(c, [
      { titulo: "A", enlaces: [{ etiqueta: "Bueno", href: "/bueno/", interno: true }] },
    ]);
  });
});

describe("pie: validación del destino", () => {
  it("obligatorio para una página; ignorado para el teléfono", () => {
    assert.notEqual(validarDestinoPie("", { siblingData: { tipo: "pagina" } }), true);
    assert.equal(validarDestinoPie("", { siblingData: { tipo: "telefono" } }), true);
    assert.equal(validarDestinoPie("/nosotros/", { siblingData: { tipo: "pagina" } }), true);
    assert.notEqual(validarDestinoPie("//otro.com", { siblingData: { tipo: "pagina" } }), true);
  });

  it("el href de teléfono conserva solo el + y los dígitos", () => {
    assert.equal(hrefTelefono("+57 317 670 7071"), "tel:+573176707071");
  });
});

describe("pie: redes", () => {
  it("reconoce las cinco redes de ux-9 y la nuestra (Instagram), por su host", () => {
    assert.equal(redDelPie("https://www.linkedin.com/company/partequipos/"), "LinkedIn");
    assert.equal(redDelPie("https://co.linkedin.com/company/partequipos/"), "LinkedIn");
    assert.equal(redDelPie("https://x.com/partequipos"), "X");
    assert.equal(redDelPie("https://twitter.com/partequipos"), "X");
    assert.equal(redDelPie("https://www.facebook.com/partequip0s"), "Facebook");
    assert.equal(redDelPie("https://www.instagram.com/partequipos_sas/"), "Instagram");
    assert.equal(redDelPie("https://www.tiktok.com/@partequipos"), "TikTok");
    assert.equal(
      redDelPie(" https://www.youtube.com/channel/UCiUU1dE8QvchvTKv47KuDVw "),
      "YouTube",
    );
  });

  it("no confunde una red con otra dirección que la nombra", () => {
    assert.equal(redDelPie("https://ejemplo.com/facebook.html"), null);
    assert.equal(redDelPie("https://box.com/partequipos"), null);
    assert.equal(redDelPie("https://www.pinterest.com/partequipos/"), null);
    assert.equal(redDelPie("http://www.facebook.com/partequip0s"), null);
  });
});

describe("pie: orden de las redes (ux-9)", () => {
  it("LinkedIn, X, Facebook, TikTok, YouTube y después Instagram, se escriban como se escriban", () => {
    const urls = [
      "https://www.youtube.com/@partequipos",
      "https://www.instagram.com/partequipos_sas/",
      "https://www.facebook.com/partequip0s",
      "https://www.tiktok.com/@partequipos",
      "https://x.com/partequipos",
      "https://www.linkedin.com/company/partequipos/",
    ];
    assert.deepEqual(
      redesDelPie(urls).map((r) => r.nombre),
      ["LinkedIn", "X", "Facebook", "TikTok", "YouTube", "Instagram"],
    );
    assert.deepEqual([...ORDEN_REDES].slice(0, 5), [
      "LinkedIn",
      "X",
      "Facebook",
      "TikTok",
      "YouTube",
    ]);
  });

  it("sin repetidas (sale la primera) y sin las que el pie no pinta", () => {
    const r = redesDelPie([
      " https://www.facebook.com/primera ",
      "https://www.facebook.com/segunda",
      "https://www.pinterest.com/partequipos/",
    ]);
    assert.deepEqual(r, [{ nombre: "Facebook", url: "https://www.facebook.com/primera" }]);
  });
});

describe("pie: enlaces externos, documento en el visor y WhatsApp (2026-10-22)", () => {
  const columna = (enlaces: unknown[]) =>
    columnasDelPie([{ titulo: "Navegación", enlaces }] as never, "+57 300 000 0000")[0]?.enlaces;

  it("una dirección https:// de otro sitio es externa (pestaña nueva); una ruta o el propio sitio, no", () => {
    const e = columna([
      {
        etiqueta: "Zona de clientes",
        tipo: "pagina",
        destino: "https://portal.ejemplo.com/#/sap/x",
      },
      { etiqueta: "Nosotros", tipo: "pagina", destino: "/nosotros/" },
      { etiqueta: "Propio", tipo: "pagina", destino: "https://partequipos.com/nosotros/" },
    ]);
    assert.deepEqual(
      e?.map((x) => [x.etiqueta, x.externo ?? false]),
      [
        ["Zona de clientes", true],
        ["Nosotros", false],
        ["Propio", false],
      ],
    );
  });

  it("«Documento en el visor»: el enlace es el PDF y lleva sus páginas; sin documento poblado, no sale", () => {
    const documento = {
      id: 9,
      titulo: "Línea ética",
      url: "https://blob.ejemplo.com/linea-etica.pdf",
      filesize: 92_192,
      paginas: [{ id: 3, url: "https://blob.ejemplo.com/p1.webp", width: 1600, height: 2071 }],
    };
    const e = columna([
      { etiqueta: "Línea Ética", tipo: "documento", documento },
      { etiqueta: "Sin poblar", tipo: "documento", documento: 9 },
    ]);
    assert.equal(e?.length, 1);
    assert.equal(e?.[0]?.href, documento.url);
    assert.equal(e?.[0]?.documento?.titulo, "Línea Ética");
    assert.equal(e?.[0]?.documento?.paginas.length, 1);
  });

  it("el documento es obligatorio solo con ese tipo; el destino no se pide con él", () => {
    assert.equal(validarDocumentoPie(null, { siblingData: { tipo: "pagina" } }), true);
    assert.notEqual(validarDocumentoPie(null, { siblingData: { tipo: "documento" } }), true);
    assert.equal(validarDocumentoPie(9, { siblingData: { tipo: "documento" } }), true);
    assert.equal(validarDestinoPie("", { siblingData: { tipo: "documento" } }), true);
  });

  it("WhatsApp sale del número de la empresa, al final de las redes", () => {
    const r = redesDelPie(
      ["https://www.youtube.com/@x", "https://www.linkedin.com/company/x/"],
      "+57 317 000 0000",
    );
    assert.deepEqual(
      r.map((x) => x.nombre),
      ["LinkedIn", "YouTube", "WhatsApp"],
    );
    assert.equal(r.at(-1)?.url, "https://wa.me/573170000000");
    assert.equal(redesDelPie(["https://www.youtube.com/@x"], "").length, 1);
  });
});
