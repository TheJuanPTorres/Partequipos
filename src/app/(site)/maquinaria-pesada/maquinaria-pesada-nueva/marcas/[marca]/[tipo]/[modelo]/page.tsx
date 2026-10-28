import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { FichaNueva, type PdfVisor, type TarjetaOtra } from "@/components/ficha/FichaNueva";
import type { FotoFicha } from "@/components/ficha/GaleriaFicha";
import { RichText } from "@/components/layout/RichText";
import { SeccionTestimonios } from "@/components/portada/diferidos";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { JsonLd } from "@/components/seo/JsonLd";
import { vistaDeDocumento } from "@/lib/documentos/visor";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import {
  datosDeCabecera,
  enlaceVista360,
  tituloEscritorio,
  tituloOtras,
} from "@/lib/maquinaria/fichaNueva";
import { DESTACADAS_EN_TARJETA, filasCompletas } from "@/lib/maquinaria/fichaTecnica";
import { reservaDescripcion } from "@/lib/maquinaria/reservaTexto";
import { COLOR_SIN_MARCA } from "@/lib/marca/colorMarca";
import { conAlt, logoDeMarca } from "@/lib/marca/logoMarca";
import { tarjetasDeTestimonios } from "@/lib/portada/seccionesH";
import { getDocumentosParaVisor } from "@/lib/queries/getDocumentos";
import { getFichaProducto } from "@/lib/queries/getFichaProducto";
import { getLogosMarca } from "@/lib/queries/getLogosMarca";
import {
  getEquipoNuevoPorSlug,
  getEquiposNuevos,
  getMarcaMaquinariaPorSlug,
  getOtrasReferencias,
  getTipoMaquinariaPorSlug,
} from "@/lib/queries/getMaquinaria";
import { getTestimoniosDePortada } from "@/lib/queries/getPortadaH";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { vistaBanner } from "@/lib/nueva/bannerMarca";
import { usaDisenoKit } from "@/lib/nueva/paginaAditamentos";
import { acentoDeMarca, mediosDeKit } from "@/lib/nueva/paginaKit";
import { productoVisible } from "@/lib/nueva/visibilidad";
import { rutas } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo/config";
import { articuloDefinido } from "@/lib/seo/porDefecto";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/jsonLd";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { EquiposNuevo, MarcasMaquinaria, Media, TiposMaquinaria } from "@/payload-types";

/*
 * FICHA DE EQUIPO NUEVO — plantilla de Andrés «Ficha maquinaria nueva»
 * (elementor 4036, 2026-10-21; docs/diseno/decisiones-ficha-nueva.md). La usan
 * los equipos nuevos y los aditamentos nuevos; la usada sigue con la V2. Las
 * URL, el SEO (metadatos y JSON-LD) y los datos no cambian.
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
  // Un equipo oculto redirige a su tipo: no se indexa (`conProductoVisible`, visibilidad.ts).
  if (!data || !productoVisible(data.equipo)) return METADATA_404;

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

/** Id del documento de la ficha técnica en PDF, si el equipo lo tiene. */
function idPdf(equipo: EquiposNuevo): number | null {
  const v = equipo.fichaTecnicaPdf;
  return typeof v === "number" ? v : (v?.id ?? null);
}

/** Ancla del contacto: «Contáctanos» baja aquí sin JavaScript. */
const ANCLA_CONTACTO = "contacto-equipo";

const texto = (v: string | null | undefined) => v?.trim() ?? "";

export default async function EquipoNuevoPage({ params }: { params: Promise<Params> }) {
  const data = await resolver(await params);
  if (!data) notFound();
  const { marca, tipo, equipo } = data;
  // «Mostrar en la web» desmarcada: redirección TEMPORAL (307) a la página de su tipo.
  if (!productoVisible(equipo)) redirect(`${rutas.tipoMaquinaria(marca.slug, tipo.slug)}/`);

  const [empresa, ficha, otras, logos, global, testimonios] = await Promise.all([
    getEmpresa(),
    getFichaProducto(),
    getOtrasReferencias(tipo.id, equipo.id),
    getLogosMarca(),
    getRepuestosMarca(),
    getTestimoniosDePortada(),
  ]);
  // El PDF del equipo y el de cada tarjeta, con sus páginas, en una sola consulta.
  const documentos = await getDocumentosParaVisor(
    [equipo, ...otras].flatMap((e) => idPdf(e) ?? []),
  );
  const pdfDe = (e: EquiposNuevo): PdfVisor | null => {
    const id = idPdf(e);
    const vista = vistaDeDocumento(documentos.find((d) => d.id === id));
    return vista ? { url: vista.pdf.url, tamano: vista.pdf.tamano, paginas: vista.paginas } : null;
  };

  const ruta = rutas.equipoNuevo(marca.slug, tipo.slug, equipo.slug);
  const urlFicha = absoluteUrl(ruta);

  const fotos: FotoFicha[] = (Array.isArray(equipo.imagenes) ? equipo.imagenes : [])
    .map((img) => imagenDeMedia(img, equipo.nombre))
    .filter((img): img is NonNullable<typeof img> => img !== null)
    .map(({ url, alt, width, height }) => ({ url, alt, width, height }));

  // Máximo 5 características (regla del cliente): las de prioridad y, si faltan, otras reales.
  const datos = datosDeCabecera(equipo.fichaTecnica);
  const especificaciones = filasCompletas(equipo.fichaTecnica);
  const imagenContacto = imagenDeMedia(ficha.imagenContacto, "");
  // Un PNG es el recorte de ux-9 (sobresale del recuadro); otra cosa, una foto que lo llena.
  const contactoEsFoto = poblado<Media>(ficha.imagenContacto)?.mimeType !== "image/png";

  // «el»/«la» con el género del tipo (antes siempre «la»: «cotizar la Compactador…»).
  const articulo = articuloDefinido(tipo.nombre);
  const experto = enlaceWhatsApp(
    empresa.whatsapp,
    `Hola, quiero hablar con un experto sobre ${articulo} ${equipo.nombre}: ${urlFicha}`,
  );
  const whatsapp = enlaceWhatsApp(
    empresa.whatsapp,
    `Hola, quiero cotizar ${articulo} ${equipo.nombre}.`,
  );

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nuevaTipos() },
    { nombre: "Marcas", path: rutas.marcasMaquinaria() },
    { nombre: marca.nombre, path: rutas.marcaMaquinaria(marca.slug) },
    { nombre: tipo.nombre, path: rutas.tipoMaquinaria(marca.slug, tipo.slug) },
    { nombre: equipo.nombre, path: ruta },
  ];

  // El JSON-LD no cambia: todas las filas de la ficha técnica, como antes (no se toca el SEO).
  const productJsonLd = buildProductJsonLd({
    nombre: equipo.nombre,
    path: ruta,
    descripcion: equipo.entradilla,
    marca: marca.nombre,
    codigo: equipo.codigo,
    imagenes: fotos.map((f) => f.url),
    propiedades: especificaciones.map((e) => ({ nombre: e.etiqueta, valor: e.valor })),
  });

  const entradilla = texto(equipo.entradilla);
  const descripcion =
    entradilla || equipo.descripcion ? (
      <>
        {entradilla ? <p>{entradilla}</p> : null}
        {equipo.descripcion ? <RichText data={equipo.descripcion} /> : null}
      </>
    ) : null;

  // Nuestro formulario (Ciudad y «¿Qué necesitas?», sin n.º de documento), con el equipo.
  const contacto = {
    origen: ruta,
    siteKey: turnstileSiteKey(),
    whatsapp,
    boton: texto(global.contactoBoton),
    marca: marca.nombre,
    equipo: { id: equipo.id, nombre: equipo.nombre },
    formulario: {
      titulo: `Cotización: ${equipo.nombre}`,
      conCiudad: true,
      etiquetaMensaje: "¿Qué necesitas?",
    },
  };

  const tarjetas: TarjetaOtra[] = otras.map((o) => ({
    id: o.id,
    nombre: o.nombre,
    href: `${rutas.equipoNuevo(marca.slug, tipo.slug, o.slug)}/`,
    foto: imagenDeMedia(Array.isArray(o.imagenes) ? o.imagenes[0] : null, o.nombre),
    datos: datosDeCabecera(o.fichaTecnica, DESTACADAS_EN_TARJETA),
    pdf: pdfDe(o),
  }));

  // La marca con «Kit de marca»: la cabecera del kit (su color, su logo, su foto y su emblema).
  const logo = conAlt(logoDeMarca(marca, logos), `Logo de ${marca.nombre}`);
  const kit = usaDisenoKit(marca)
    ? { ...acentoDeMarca(marca, COLOR_SIN_MARCA), ...mediosDeKit(marca), logo }
    : null;

  return (
    <FichaNueva
      kit={kit}
      nombre={equipo.nombre}
      tituloEscritorio={tituloEscritorio(marca.nombre, equipo.codigo)}
      migas={breadcrumbs}
      fotos={fotos}
      descripcion={descripcion}
      reservaDescripcion={reservaDescripcion(entradilla, equipo.descripcion)}
      datos={datos}
      pdf={pdfDe(equipo)}
      vista360={enlaceVista360(equipo.vista360)}
      experto={experto ?? null}
      otras={{
        titulo: tituloOtras(tipo.nombre),
        // El banner de marca del #385: logo (el único del sitio), color y foto de la marca.
        logo,
        tarjetas,
        vista: vistaBanner(marca),
        marca: { nombre: marca.nombre, href: `${rutas.tipoMaquinaria(marca.slug, tipo.slug)}/` },
      }}
      imagenContacto={imagenContacto}
      contactoEsFoto={contactoEsFoto}
      formulario={configContactoMarca(contacto)}
      anclaContacto={ANCLA_CONTACTO}
      jsonLd={<JsonLd data={[productJsonLd, buildBreadcrumbJsonLd(breadcrumbs)]} />}
      cierre={
        <>
          <ContactoMarca
            id={ANCLA_CONTACTO}
            titulo={texto(global.contactoTitulo)}
            subtitulo={texto(global.contactoSubtitulo)}
            {...contacto}
          />
          <SeccionTestimonios
            tarjetas={tarjetasDeTestimonios(testimonios)}
            textos={{
              titulo: texto(global.testimoniosTitulo),
              verVideoTexto: texto(global.verVideoTexto),
            }}
          />
        </>
      }
    />
  );
}
