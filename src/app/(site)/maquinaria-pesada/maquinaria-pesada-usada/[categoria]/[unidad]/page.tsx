import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";

import { FichaProducto, type OtraReferencia } from "@/components/ficha/FichaProducto";
import type { FotoFicha } from "@/components/ficha/GaleriaFicha";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFichaProducto } from "@/lib/queries/getFichaProducto";
import { getInventarioUsados, getUnidadUsadaPorSlug } from "@/lib/queries/getMaquinaria";
import { getEmpresa } from "@/lib/queries/getSeo";
import { productoVisible } from "@/lib/nueva/visibilidad";
import { rutas } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo/config";
import { articuloDefinido } from "@/lib/seo/porDefecto";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/jsonLd";
import { metadataDe } from "@/lib/seo/metadata";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { turnstileSiteKey } from "@/lib/turnstile";
import { camposDeAditamento } from "@/lib/usados/aditamentos";
import { datosDeUnidad, parrafos } from "@/lib/usados/ficha";
import { imagenDeMedia, poblado, posicionFocal, type ImagenLista } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { Documento, Media } from "@/payload-types";

/*
 * PÁGINA DE UNA UNIDAD DE MAQUINARIA USADA (2026-10-16, decisión de dirección).
 *
 * La MISMA ficha de producto V2 que la maquinaria nueva (`FichaProducto`):
 * cambian los datos. Datos destacados: peso, año, horómetro y ubicación; sin
 * ficha técnica en filas y sin PDF salvo que la unidad lo tenga; JSON-LD
 * `Product` sin precio. EL NÚMERO DE SERIE NO SALE, salvo el campo «Serial»
 * de un ADITAMENTO (2026-10-23, dirección), como un dato más.
 *
 * Una unidad no disponible (vendida) redirige con permanentRedirect a su
 * categoría; solo una dirección que no existe da 404. Las disponibles se
 * generan en el build y se revalidan al guardar la unidad.
 */

/** La primera foto del inventario (`FotoDeTarjeta`) como imagen de la ficha; sin ella o sin medidas, `null`. */
function fotoDeTarjeta(
  foto: Awaited<ReturnType<typeof getInventarioUsados>>[number]["foto"],
  alt: string,
): ImagenLista | null {
  if (!foto?.url || !foto.width || !foto.height) return null;
  return {
    url: foto.url,
    alt: foto.alt || alt,
    width: foto.width,
    height: foto.height,
    posicion: posicionFocal(foto.focalX, foto.focalY),
  };
}

type Params = { categoria: string; unidad: string };

export async function generateStaticParams(): Promise<Params[]> {
  const inventario = await getInventarioUsados();
  return inventario.flatMap((u) =>
    u.slug && u.categoriaRef ? [{ categoria: u.categoriaRef.slug, unidad: u.slug }] : [],
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { categoria, unidad: slug } = await params;
  const data = await getUnidadUsadaPorSlug(categoria, slug);
  // Si la unidad está vendida la página redirige: no hacen falta metadatos propios.
  if (!data || !productoVisible(data.unidad)) return METADATA_404;
  const { unidad } = data;
  const fotos = Array.isArray(unidad.imagenes) ? unidad.imagenes : [];

  return metadataDe({
    nombre: unidad.nombre,
    path: rutas.unidadUsada(categoria, slug),
    descripcion: unidad.descripcion,
    seo: unidad.seo,
    imageUrl: imagenDeMedia(fotos[0], unidad.nombre)?.url,
  });
}

export default async function UnidadUsadaPage({ params }: { params: Promise<Params> }) {
  const { categoria: categoriaSlug, unidad: slug } = await params;
  const data = await getUnidadUsadaPorSlug(categoriaSlug, slug);
  if (!data) notFound();
  const { unidad, categoria } = data;
  // Vendida: su categoría es el sitio más parecido a lo que buscaba quien llega aquí.
  if (!unidad.disponible) permanentRedirect(`${rutas.categoriaUsada(categoria.slug)}/`);
  // Oculta («Mostrar en la web» desmarcada): a la misma categoría, pero de forma TEMPORAL (307).
  if (!productoVisible(unidad)) redirect(`${rutas.categoriaUsada(categoria.slug)}/`);

  const [empresa, ficha, inventario] = await Promise.all([
    getEmpresa(),
    getFichaProducto(),
    getInventarioUsados(),
  ]);

  const ruta = rutas.unidadUsada(categoria.slug, slug);
  const urlFicha = absoluteUrl(ruta);

  const fotos: FotoFicha[] = (Array.isArray(unidad.imagenes) ? unidad.imagenes : [])
    .map((img) => imagenDeMedia(img, unidad.nombre))
    .filter((img): img is NonNullable<typeof img> => img !== null)
    .map(({ url, alt, width, height }) => ({ url, alt, width, height }));

  const datos = datosDeUnidad({
    ...unidad,
    serial: camposDeAditamento(categoria.slug, unidad).serial,
  });
  const pdf = poblado<Documento>(unidad.fichaTecnicaPdf)?.url ?? null;
  const marca = poblado<{ id: number; nombre: string }>(unidad.marcaUsada)?.nombre ?? unidad.marca;
  const imagenContacto = imagenDeMedia(ficha.imagenContacto, "");
  const contactoEsFoto = poblado<Media>(ficha.imagenContacto)?.mimeType !== "image/png";

  // «el»/«la» con el género de la categoría (antes siempre «la»).
  const articulo = articuloDefinido(categoria.nombre);
  const experto = enlaceWhatsApp(
    empresa.whatsapp,
    `Hola, quiero hablar con un experto sobre ${articulo} ${unidad.nombre}: ${urlFicha}`,
  );

  const migas = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Usada", path: rutas.usada() },
    { nombre: categoria.nombre, path: rutas.categoriaUsada(categoria.slug) },
    { nombre: unidad.nombre, path: ruta },
  ];

  const productJsonLd = buildProductJsonLd({
    nombre: unidad.nombre,
    path: ruta,
    descripcion: unidad.descripcion,
    marca,
    imagenes: fotos.map((f) => f.url),
    propiedades: datos.map((d) => ({ nombre: d.etiqueta, valor: d.valor })),
    condicion: "usada",
  });

  const otras: OtraReferencia[] = inventario
    .filter((u) => u.categoria === categoria.id && u.id !== unidad.id && u.slug)
    .slice(0, 3)
    .map((u) => ({
      id: u.id,
      nombre: u.nombre,
      href: `${rutas.unidadUsada(categoria.slug, u.slug!)}/`,
      foto: fotoDeTarjeta(u.foto, u.nombre),
      datos: datosDeUnidad({ ...u, serial: camposDeAditamento(categoria.slug, u).serial }, 3),
      pdf: null,
    }));

  return (
    <FichaProducto
      nombre={unidad.nombre}
      urlFicha={urlFicha}
      migas={migas}
      fotos={fotos}
      datos={datos}
      experto={experto}
      logo={null}
      cuerpo={parrafos(unidad.descripcion).map((t) => (
        <p key={t}>{t}</p>
      ))}
      especificaciones={[]}
      pdf={pdf}
      ocultarTituloSinFicha
      tituloOtras="Otras unidades de esta categoría"
      textoVerMas="Ver unidad"
      otras={otras}
      imagenContacto={imagenContacto}
      contactoEsFoto={contactoEsFoto}
      jsonLd={<JsonLd data={[productJsonLd, buildBreadcrumbJsonLd(migas)]} />}
      formulario={{
        tipo: "cotizacion",
        origen: ruta,
        siteKey: turnstileSiteKey(),
        whatsapp: enlaceWhatsApp(
          empresa.whatsapp,
          `Hola, quiero cotizar ${articulo} ${unidad.nombre}.`,
        ),
        referencia: { texto: unidad.nombre },
        titulo: "Solicitar cotización",
        descripcion: "Te enviamos precio, disponibilidad y condiciones de entrega.",
        textoBoton: "Pedir cotización",
      }}
    />
  );
}
