import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildMetadata } from "./buildMetadata";
import { absoluteUrl, seoConfig } from "./config";
import { buildBreadcrumbJsonLd, buildOrganizationJsonLd, buildProductJsonLd } from "./jsonLd";

// Las pruebas fijan la base para que las URLs absolutas sean deterministas.
process.env.NEXT_PUBLIC_SERVER_URL = "https://partequipos.com";

describe("absoluteUrl", () => {
  it("absolutiza una ruta relativa", () => {
    assert.equal(absoluteUrl("/repuestos/cat"), "https://partequipos.com/repuestos/cat/");
  });

  it("añade la barra faltante", () => {
    assert.equal(absoluteUrl("repuestos/cat"), "https://partequipos.com/repuestos/cat/");
  });

  it("deja intacta una URL ya absoluta (imagen del CDN)", () => {
    const cdn = "https://abc.public.blob.vercel-storage.com/logo.png";
    assert.equal(absoluteUrl(cdn), cdn);
  });

  it("nunca devuelve una ruta relativa", () => {
    for (const input of ["", "/", "algo"]) {
      assert.match(absoluteUrl(input), /^https?:\/\//);
    }
  });
});

describe("buildMetadata", () => {
  it("usa los campos SEO del CMS cuando existen", () => {
    const meta = buildMetadata({
      nombre: "Caterpillar 320D",
      path: "/m/320d",
      descripcion: "Descripción de la entidad.",
      seo: { metaTitle: "Título SEO", metaDescription: "Descripción SEO." },
    });

    assert.equal(meta.title, "Título SEO");
    assert.equal(meta.description, "Descripción SEO.");
  });

  it("cae al nombre y a la descripción de la entidad si no hay campos SEO", () => {
    const meta = buildMetadata({
      nombre: "Caterpillar 320D",
      path: "/m/320d",
      descripcion: "Repuestos para excavadora.",
    });

    assert.equal(meta.title, "Caterpillar 320D");
    assert.equal(meta.description, "Repuestos para excavadora.");
  });

  it("cae a la descripción por defecto si no hay ninguna", () => {
    const meta = buildMetadata({ nombre: "Marca", path: "/marca" });
    assert.equal(meta.description, seoConfig.defaultDescription);
  });

  it("ignora los campos SEO vacíos y usa el fallback", () => {
    const meta = buildMetadata({
      nombre: "Komatsu",
      path: "/komatsu",
      descripcion: "Desc entidad.",
      seo: { metaTitle: "   ", metaDescription: "" },
    });

    assert.equal(meta.title, "Komatsu");
    assert.equal(meta.description, "Desc entidad.");
  });

  it("emite canonical absoluto", () => {
    const meta = buildMetadata({ nombre: "X", path: "/a/b" });
    assert.equal(meta.alternates?.canonical, "https://partequipos.com/a/b/");
  });

  it("emite Open Graph completo con locale es_CO", () => {
    const meta = buildMetadata({ nombre: "X", path: "/a" });
    const og = meta.openGraph;

    assert.ok(og);
    assert.equal(og.locale, seoConfig.locale);
    assert.equal(og.siteName, seoConfig.siteName);
    assert.equal("url" in og ? og.url : undefined, "https://partequipos.com/a/");
    assert.equal("type" in og ? og.type : undefined, "website");
    assert.ok(Array.isArray(og.images) && og.images.length > 0);
  });

  it("emite Twitter card", () => {
    const meta = buildMetadata({ nombre: "X", path: "/a" });
    const twitter = meta.twitter;

    assert.ok(twitter);
    // `Twitter` es una unión en Next; se estrecha antes de leer `card`.
    assert.equal("card" in twitter ? twitter.card : undefined, "summary_large_image");
  });

  it("prioriza imageUrl sobre seo.ogImage y sobre la imagen por defecto", () => {
    const cdn = "https://abc.public.blob.vercel-storage.com/foto.png";
    const meta = buildMetadata({
      nombre: "X",
      path: "/a",
      imageUrl: cdn,
      seo: { ogImage: { url: "/otra.png" } },
    });

    const images = meta.openGraph?.images;
    assert.deepEqual(images, [{ url: cdn, alt: "X" }]);
  });

  it("usa seo.ogImage cuando no hay imageUrl", () => {
    const meta = buildMetadata({
      nombre: "X",
      path: "/a",
      seo: { ogImage: { url: "https://cdn.test/og.png" } },
    });

    assert.deepEqual(meta.openGraph?.images, [{ url: "https://cdn.test/og.png", alt: "X" }]);
  });

  it("recorta descripciones muy largas", () => {
    const meta = buildMetadata({ nombre: "X", path: "/a", descripcion: "a".repeat(300) });
    assert.ok((meta.description ?? "").length <= 160);
  });
});

describe("buildProductJsonLd", () => {
  it("genera un Product con la forma correcta", () => {
    const jsonLd = buildProductJsonLd({
      nombre: "Caterpillar 320D",
      path: "/repuestos/cat/excavadora/320d",
      descripcion: "Repuestos para excavadora Caterpillar 320D.",
      marca: "Caterpillar",
      codigo: "320D",
      imagenes: ["https://abc.public.blob.vercel-storage.com/320d.png"],
    });

    assert.equal(jsonLd["@context"], "https://schema.org");
    assert.equal(jsonLd["@type"], "Product");
    assert.equal(jsonLd.name, "Caterpillar 320D");
    assert.equal(jsonLd.url, "https://partequipos.com/repuestos/cat/excavadora/320d/");
    assert.equal(jsonLd.sku, "320D");
    assert.deepEqual(jsonLd.brand, { "@type": "Brand", name: "Caterpillar" });
    assert.deepEqual(jsonLd.image, ["https://abc.public.blob.vercel-storage.com/320d.png"]);
  });

  it("omite los campos opcionales ausentes en vez de emitirlos vacíos", () => {
    const jsonLd = buildProductJsonLd({ nombre: "Modelo", path: "/m" });

    assert.equal("brand" in jsonLd, false);
    assert.equal("sku" in jsonLd, false);
    assert.equal("image" in jsonLd, false);
    assert.equal("description" in jsonLd, false);
  });

  it("es serializable a JSON", () => {
    const jsonLd = buildProductJsonLd({ nombre: "M", path: "/m" });
    assert.doesNotThrow(() => JSON.stringify(jsonLd));
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("numera las posiciones desde 1 y absolutiza los items", () => {
    const jsonLd = buildBreadcrumbJsonLd([
      { nombre: "Inicio", path: "/" },
      { nombre: "Caterpillar", path: "/cat" },
      { nombre: "320D", path: "/cat/320d" },
    ]);

    assert.equal(jsonLd["@type"], "BreadcrumbList");

    const items = jsonLd.itemListElement as Array<Record<string, unknown>>;
    assert.equal(items.length, 3);
    assert.equal(items[0]?.position, 1);
    assert.equal(items[2]?.position, 3);
    assert.equal(items[1]?.name, "Caterpillar");
    assert.equal(items[1]?.item, "https://partequipos.com/cat/");
    assert.equal(items[0]?.["@type"], "ListItem");
  });

  it("soporta una lista vacía sin romperse", () => {
    const jsonLd = buildBreadcrumbJsonLd([]);
    assert.deepEqual(jsonLd.itemListElement, []);
  });
});

describe("buildOrganizationJsonLd", () => {
  it("toma los datos de negocio de la configuración, sin valores quemados", () => {
    const jsonLd = buildOrganizationJsonLd();

    assert.equal(jsonLd["@type"], "Organization");
    assert.equal(jsonLd.name, seoConfig.siteName);
    assert.equal(jsonLd.url, "https://partequipos.com");
    assert.match(String(jsonLd.logo), /^https?:\/\//);
  });

  it("incluye la dirección real con país, calle y ciudad", () => {
    const address = buildOrganizationJsonLd().address as Record<string, unknown>;

    assert.equal(address["@type"], "PostalAddress");
    assert.equal(address.addressCountry, seoConfig.country);
    assert.equal(address.streetAddress, seoConfig.contact.streetAddress);
    assert.equal(address.addressLocality, seoConfig.contact.addressLocality);
  });

  it("incluye los datos de contacto públicos", () => {
    const jsonLd = buildOrganizationJsonLd();

    assert.equal(jsonLd.email, seoConfig.contact.email);
    assert.equal(jsonLd.telephone, seoConfig.contact.phone);
  });

  it("emite sameAs con los perfiles sociales configurados", () => {
    const jsonLd = buildOrganizationJsonLd();

    assert.equal("sameAs" in jsonLd, seoConfig.sameAs.length > 0);
    if (seoConfig.sameAs.length > 0) {
      assert.deepEqual(jsonLd.sameAs, [...seoConfig.sameAs]);
    }
  });

  it("omite legalName y taxID mientras estén pendientes de confirmar", () => {
    const jsonLd = buildOrganizationJsonLd();

    // Nunca deben publicarse vacíos ni con un valor inventado: o hay dato real,
    // o el campo no se emite.
    assert.equal("legalName" in jsonLd, Boolean(seoConfig.legalName));
    assert.equal("taxID" in jsonLd, Boolean(seoConfig.taxId));
    if ("legalName" in jsonLd) assert.notEqual(jsonLd.legalName, "");
    if ("taxID" in jsonLd) assert.notEqual(jsonLd.taxID, "");
  });
});
