import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FichaProducto, type OtraReferencia } from "@/components/ficha/FichaProducto";
import type { FotoFicha } from "@/components/ficha/GaleriaFicha";
import estilos from "@/components/ficha/ficha.module.css";
import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { RichText } from "@/components/layout/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import { DESTACADAS_EN_TARJETA, destacadas, filasCompletas } from "@/lib/maquinaria/fichaTecnica";
import { getFichaProducto } from "@/lib/queries/getFichaProducto";
import {
  getEquipoNuevoPorSlug,
  getEquiposNuevos,
  getMarcaMaquinariaPorSlug,
  getOtrasReferencias,
  getTipoMaquinariaPorSlug,
} from "@/lib/queries/getMaquinaria";
import { getEmpresa } from "@/lib/queries/getSeo";
import { rutas } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo/config";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/jsonLd";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type {
  Documento,
  EquiposNuevo,
  MarcasMaquinaria,
  Media,
  TiposMaquinaria,
} from "@/payload-types";
import { METADATA_404 } from "@/lib/seo/noEncontrada";

/*
 * FICHA DE EQUIPO NUEVO — ficha de producto V2 de ux-9 (export 3166,
 * docs/diseno/decisiones-ficha.md). Las 80 URL de `url-map.csv`, sin cambiar
 * slugs. Server Component salvo la galería y el botón de imprimir.
 */

type Params = { marca: string; tipo: string; modelo: string };

export async function generateStaticParams(): Promise<Params[]> {
  const equipos = await getEquiposNuevos();

  return equipos.flatMap((equipo) => {
    const marca = poblado<MarcasMaquinaria>(equipo.marca);
    const tipo = poblado<TiposMaquinaria>(equipo.tipo);
    if (!marca || !tipo) return [];
    return [{ marca: marca.slug, tipo: tipo.slug, modelo: equipo.slug }];
  });
}

/**
 * Resuelve la cadena completa validando coherencia: el tipo debe pertenecer a la
 * marca y el equipo al tipo. Una combinación cruzada devuelve null → 404.
 */
async function resolver(params: Params) {
  const marca = await getMarcaMaquinariaPorSlug(params.marca);
  if (!marca) return null;

  const tipo = await getTipoMaquinariaPorSlug(marca.id, params.tipo);
  if (!tipo) return null;

  const equipo = await getEquipoNuevoPorSlug(tipo.id, params.modelo);
  if (!equipo) return null;

  return { marca, tipo, equipo };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await resolver(await params);
  if (!data) return METADATA_404;

  const { marca, tipo, equipo } = data;
  const imagenes = Array.isArray(equipo.imagenes) ? equipo.imagenes : [];

  return metadataDe({
    nombre: equipo.nombre,
    path: rutas.equipoNuevo(marca.slug, tipo.slug, equipo.slug),
    descripcion: equipo.entradilla,
    seo: equipo.seo,
    imageUrl: imagenDeMedia(imagenes[0], equipo.nombre)?.url,
  });
}

/** URL del PDF de la ficha técnica, si el equipo lo tiene. */
function urlPdf(equipo: EquiposNuevo): string | null {
  return poblado<Documento>(equipo.fichaTecnicaPdf)?.url ?? null;
}

export default async function EquipoNuevoPage({ params }: { params: Promise<Params> }) {
  const data = await resolver(await params);
  if (!data) notFound();
  const { marca, tipo, equipo } = data;

  const [empresa, ficha, otras] = await Promise.all([
    getEmpresa(),
    getFichaProducto(),
    getOtrasReferencias(tipo.id, equipo.id),
  ]);

  const ruta = rutas.equipoNuevo(marca.slug, tipo.slug, equipo.slug);
  const urlFicha = absoluteUrl(ruta);

  const fotos: FotoFicha[] = (Array.isArray(equipo.imagenes) ? equipo.imagenes : [])
    .map((img) => imagenDeMedia(img, equipo.nombre))
    .filter((img): img is NonNullable<typeof img> => img !== null)
    .map(({ url, alt, width, height }) => ({ url, alt, width, height }));

  const datos = destacadas(equipo.fichaTecnica);
  const especificaciones = filasCompletas(equipo.fichaTecnica);
  const puntos = (equipo.destacados ?? []).filter((d) => d.texto?.trim());
  const pdf = urlPdf(equipo);
  const logo = imagenDeMedia(marca.logo, marca.nombre);
  const imagenContacto = imagenDeMedia(ficha.imagenContacto, "");
  // Un PNG es el recorte de ux-9 (sobresale del recuadro); otra cosa, una foto que lo llena.
  const contactoEsFoto = poblado<Media>(ficha.imagenContacto)?.mimeType !== "image/png";

  const experto = enlaceWhatsApp(
    empresa.whatsapp,
    `Hola, quiero hablar con un experto sobre la ${equipo.nombre}: ${urlFicha}`,
  );

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nueva() },
    { nombre: "Marcas", path: rutas.marcasMaquinaria() },
    { nombre: marca.nombre, path: rutas.marcaMaquinaria(marca.slug) },
    { nombre: tipo.nombre, path: rutas.tipoMaquinaria(marca.slug, tipo.slug) },
    { nombre: equipo.nombre, path: ruta },
  ];

  const productJsonLd = buildProductJsonLd({
    nombre: equipo.nombre,
    path: ruta,
    descripcion: equipo.entradilla,
    marca: marca.nombre,
    codigo: equipo.codigo,
    imagenes: fotos.map((f) => f.url),
    propiedades: especificaciones.map((e) => ({ nombre: e.etiqueta, valor: e.valor })),
  });

  const cuerpo = (
    <>
      {equipo.entradilla ? <p>{equipo.entradilla}</p> : null}
      {equipo.descripcion ? <RichText data={equipo.descripcion} /> : null}
      {puntos.length > 0 ? (
        <ul className={estilos.puntos}>
          {puntos.map((p) => (
            <li key={p.id ?? p.texto}>{p.texto}</li>
          ))}
        </ul>
      ) : null}
    </>
  );

  const otrasReferencias: OtraReferencia[] = otras.map((o) => ({
    id: o.id,
    nombre: o.nombre,
    href: `${rutas.equipoNuevo(marca.slug, tipo.slug, o.slug)}/`,
    foto: imagenDeMedia(Array.isArray(o.imagenes) ? o.imagenes[0] : null, o.nombre),
    datos: destacadas(o.fichaTecnica, DESTACADAS_EN_TARJETA),
    pdf: urlPdf(o),
  }));

  return (
    <FichaProducto
      nombre={equipo.nombre}
      urlFicha={urlFicha}
      migas={breadcrumbs}
      fotos={fotos}
      datos={datos}
      experto={experto}
      logo={
        logo
          ? {
              url: logo.url,
              alt: `Logo de ${marca.nombre}`,
              width: logo.width,
              height: logo.height,
            }
          : null
      }
      cuerpo={cuerpo}
      especificaciones={especificaciones.map((e) => ({
        id: e.id,
        etiqueta: e.etiqueta ?? "",
        valor: e.valor ?? "",
      }))}
      pdf={pdf}
      tituloOtras="Otras referencias de esta categoría"
      textoVerMas="Ver más"
      otras={otrasReferencias}
      imagenContacto={imagenContacto}
      contactoEsFoto={contactoEsFoto}
      jsonLd={<JsonLd data={[productJsonLd, buildBreadcrumbJsonLd(breadcrumbs)]} />}
      formulario={
        <FormularioSolicitud
          tipo="cotizacion"
          origen={ruta}
          siteKey={turnstileSiteKey()}
          whatsapp={enlaceWhatsApp(empresa.whatsapp, `Hola, quiero cotizar la ${equipo.nombre}.`)}
          referencia={{ tipo: "equipos-nuevos", id: equipo.id, texto: equipo.nombre }}
          titulo="Solicitar cotización"
          descripcion="Te enviamos precio, disponibilidad y condiciones de entrega."
          textoBoton="Pedir cotización"
        />
      }
    />
  );
}
