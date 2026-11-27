import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  conMensaje,
  enlaceWhatsApp,
  hrefConContexto,
  hrefConUrl,
  mensajeConUrl,
  mensajeWhatsApp,
  urlDePagina,
} from "./whatsapp";

describe("conMensaje", () => {
  it("añade el mensaje al enlace sin cambiar el número ni la etiqueta", () => {
    const base = enlaceWhatsApp("+57 317 000 0000");
    assert.ok(base);
    const r = conMensaje(base, "Hola, quiero cotizar el lubricante Eni X 5W-40.");
    assert.equal(r.etiqueta, base.etiqueta);
    const u = new URL(r.href);
    assert.equal(u.pathname, "/573170000000");
    assert.equal(u.searchParams.get("text"), "Hola, quiero cotizar el lubricante Eni X 5W-40.");
  });
  it("sustituye un mensaje previo", () => {
    const base = enlaceWhatsApp("+57 317 000 0000", "antes");
    assert.ok(base);
    assert.equal(new URL(conMensaje(base, "después").href).searchParams.get("text"), "después");
  });
});

describe("mensajeWhatsApp", () => {
  it("con referencia, nombra lo que se consulta", () => {
    assert.equal(
      mensajeWhatsApp(" Excavadora Hitachi ZX350 ", "Contacto sobre maquinaria Hitachi"),
      "Hola, quiero información sobre Excavadora Hitachi ZX350.",
    );
  });

  it("sin referencia, toma el tema de un título «Contacto sobre …»", () => {
    assert.equal(
      mensajeWhatsApp(undefined, "Contacto sobre repuestos Hitachi"),
      "Hola, quiero información sobre repuestos Hitachi.",
    );
  });

  it("con el texto inicial del formulario (grupo que se cotiza), WhatsApp dice lo mismo", () => {
    assert.equal(
      mensajeWhatsApp(
        undefined,
        "Contacto sobre repuestos Hitachi",
        "Quiero cotizar: Cadena (tren de rodaje). Marca y modelo de la máquina: ",
      ),
      "Hola, quiero cotizar: Cadena (tren de rodaje). Marca y modelo de la máquina:",
    );
    assert.equal(mensajeWhatsApp(undefined, "Escríbenos", "  "), "Hola, quiero información.");
  });

  it("con otro título (Contáctanos), un saludo neutro", () => {
    assert.equal(mensajeWhatsApp(undefined, "Escríbenos"), "Hola, quiero información.");
    assert.equal(mensajeWhatsApp("  ", " "), "Hola, quiero información.");
  });
});

describe("hrefConContexto", () => {
  const base = "https://wa.me/573001234567?text=Hola%2C+vengo+de+la+web.";
  it("añade lo que se mira al mensaje", () => {
    const u = new URL(hrefConContexto(base, " Excavadora Hitachi ZX130-5B 2024 "));
    assert.equal(
      u.searchParams.get("text"),
      "Hola, vengo de la web. Estoy viendo: Excavadora Hitachi ZX130-5B 2024.",
    );
  });
  it("sin contexto, el enlace tal cual", () => {
    assert.equal(hrefConContexto(base, null), base);
    assert.equal(hrefConContexto(base, "  "), base);
  });
});

describe("la URL de la página en el mensaje (tanda 26, punto 28)", () => {
  const BASE = "https://partequipos.com";
  const texto = (href: string) => new URL(href).searchParams.get("text");

  it("urlDePagina: base canónica, ruta con barra final, sin seguimiento ni #, con los filtros", () => {
    assert.equal(
      urlDePagina(BASE, "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras"),
      "https://partequipos.com/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/",
    );
    assert.equal(urlDePagina(`${BASE}/`, "/"), "https://partequipos.com/");
    assert.equal(urlDePagina(BASE, ""), "https://partequipos.com/");
    // Los filtros del listado se quedan; campañas y anuncios, fuera.
    assert.equal(
      urlDePagina(
        BASE,
        "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/",
        "?marca=hitachi&utm_source=google&anio=2019&gclid=abc&fbclid=x&UTM_Campaign=y#arriba",
      ),
      "https://partequipos.com/maquinaria-pesada/maquinaria-pesada-usada/excavadoras/?marca=hitachi&anio=2019",
    );
    // Solo seguimiento: sin «?».
    assert.equal(
      urlDePagina(BASE, "/noticias/", "?utm_medium=cpc"),
      "https://partequipos.com/noticias/",
    );
    // Un valor con tilde, espacio o «&» (como llega del navegador, codificado) sigue codificado.
    assert.equal(
      urlDePagina(BASE, "/buscar/", "?q=pi%C3%B1%C3%B3n+%26+corona"),
      "https://partequipos.com/buscar/?q=pi%C3%B1%C3%B3n+%26+corona",
    );
    // La ruta ya codificada no se toca.
    assert.equal(
      urlDePagina(BASE, "/noticias/qu%C3%A9-es/#x"),
      "https://partequipos.com/noticias/qu%C3%A9-es/",
    );
  });

  it("mensajeConUrl: la URL al final, en su propia línea, y sin duplicar", () => {
    const url = "https://partequipos.com/ficha/";
    assert.equal(
      mensajeConUrl("Hola, quiero información. Estoy viendo: Miniexcavadora ZX40U-5B 2018.", url),
      "Hola, quiero información. Estoy viendo: Miniexcavadora ZX40U-5B 2018.\nhttps://partequipos.com/ficha/",
    );
    const ya = mensajeConUrl("Hola.", url);
    assert.equal(mensajeConUrl(ya, url), ya);
    assert.equal(
      mensajeConUrl("Mira https://partequipos.com/ficha y dime", url),
      "Mira https://partequipos.com/ficha y dime",
    );
    assert.equal(mensajeConUrl("", url), url);
    assert.equal(mensajeConUrl("Hola.  \n", url), `Hola.\n${url}`);
    assert.equal(mensajeConUrl("Hola.", ""), "Hola.");
  });

  it("hrefConUrl: el flotante con contexto (tildes y &) acaba con la URL; sin contexto, también", () => {
    const flotante = enlaceWhatsApp("+57 317 000 0000", "Hola, quiero información.")!.href;
    const url = urlDePagina(
      BASE,
      "/maquinaria-pesada/maquinaria-pesada-usada/miniexcavadoras/miniexcavadora-hitachi-zx40u-5b-2018",
    );
    assert.equal(
      texto(
        hrefConUrl(hrefConContexto(flotante, "Miniexcavadora Hitachi LANDCROS ZX40U-5B 2018"), url),
      ),
      "Hola, quiero información. Estoy viendo: Miniexcavadora Hitachi LANDCROS ZX40U-5B 2018.\nhttps://partequipos.com/maquinaria-pesada/maquinaria-pesada-usada/miniexcavadoras/miniexcavadora-hitachi-zx40u-5b-2018/",
    );
    assert.equal(
      texto(hrefConUrl(hrefConContexto(flotante, "Cargador & retro «Año» 2020"), url))?.split(
        "\n",
      )[0],
      "Hola, quiero información. Estoy viendo: Cargador & retro «Año» 2020.",
    );
    // Sin contexto: el mensaje de siempre y la URL.
    assert.equal(
      texto(hrefConUrl(flotante, urlDePagina(BASE, "/contactanos/"))),
      "Hola, quiero información.\nhttps://partequipos.com/contactanos/",
    );
    // Los filtros (con su «&») van dentro del mensaje, no como parámetros del enlace de WhatsApp.
    const filtrada = hrefConUrl(
      flotante,
      urlDePagina(BASE, "/usada/excavadoras/", "?marca=hitachi&anio=2019"),
    );
    assert.deepEqual([...new URL(filtrada).searchParams.keys()], ["text"]);
    assert.ok(
      texto(filtrada)?.endsWith(
        "\nhttps://partequipos.com/usada/excavadoras/?marca=hitachi&anio=2019",
      ),
    );
    // Dos veces: no se repite.
    assert.equal(
      hrefConUrl(filtrada, urlDePagina(BASE, "/usada/excavadoras/", "?marca=hitachi&anio=2019")),
      filtrada,
    );
  });

  it("hrefConUrl no toca: enlaces sin mensaje, «compartir» (sin número), otros sitios ni basura", () => {
    const url = "https://partequipos.com/x/";
    const sinMensaje = enlaceWhatsApp("+57 317 000 0000")!.href;
    assert.equal(hrefConUrl(sinMensaje, url), sinMensaje);
    const compartir = "https://wa.me/?text=T%C3%ADtulo%3A%20https%3A%2F%2Fpartequipos.com%2Fx%2F";
    assert.equal(hrefConUrl(compartir, url), compartir);
    assert.equal(
      hrefConUrl("https://example.com/?text=hola", url),
      "https://example.com/?text=hola",
    );
    assert.equal(hrefConUrl("/contactanos/", url), "/contactanos/");
    assert.equal(hrefConUrl("", url), "");
  });

  it("el flotante y los demás WhatsApp usan la base canónica del SEO, no el dominio del navegador", () => {
    const flotante = readFileSync("src/components/layout/WhatsAppFlotante.tsx", "utf8");
    assert.ok(!/location\.(origin|host|href)/.test(flotante), "no se usa el origen del navegador");
    assert.ok(flotante.includes("urlDePagina(base, location.pathname, location.search)"));
    assert.ok(
      readFileSync("src/components/layout/WhatsApp.tsx", "utf8").includes("base={getSiteUrl()}"),
    );
  });
});
