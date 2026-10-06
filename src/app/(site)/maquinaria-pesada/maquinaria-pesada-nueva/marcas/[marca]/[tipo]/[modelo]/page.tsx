import { IconBrandWhatsapp, IconCirclePlus, IconFileTypePdf, IconMail } from "@tabler/icons-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BotonImprimir } from "@/components/ficha/BotonImprimir";
import { EngranajeMarca } from "@/components/ficha/EngranajeMarca";
import { GaleriaFicha, type FotoFicha } from "@/components/ficha/GaleriaFicha";
import { IconoDato } from "@/components/ficha/IconoDato";
import estilos from "@/components/ficha/ficha.module.css";
import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { PieSinTarjeta } from "@/components/layout/PieSinTarjeta";
import { RichText } from "@/components/layout/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  DESTACADAS_EN_TARJETA,
  destacadas,
  filasCompletas,
  type DatoDestacado,
} from "@/lib/maquinaria/fichaTecnica";
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
import type { Documento, EquiposNuevo, MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

/*
 * FICHA DE EQUIPO NUEVO — ficha de producto V2 de ux-9 (export 3166,
 * docs/diseno/decisiones-ficha.md). Las 80 URL de `url-map.csv`, sin cambiar
 * slugs. Server Component salvo la galería y el botón de imprimir.
 */

type Params = { marca: string; tipo: string; modelo: string };

/** Ancla del formulario de cotización: «Cotizar el equipo» y «Contáctanos» bajan aquí. */
const ANCLA_COTIZAR = "cotizar";

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
  if (!data) return {};

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

/**
 * Datos con icono: la tarjeta principal (4) y las de otras referencias (3).
 * En la tarjeta principal la etiqueta y el valor van en líneas aparte
 * (`apilado`): así, al llegar Inter, el valor no salta de línea (CLS).
 */
function ListaDatos({
  datos,
  clase,
  apilado = false,
}: {
  datos: DatoDestacado[];
  clase: string;
  apilado?: boolean;
}) {
  if (datos.length === 0) return null;
  return (
    <ul className={clase}>
      {datos.map((d) => (
        <li key={`${d.etiqueta}-${d.valor}`}>
          <IconoDato icono={d.icono} className={estilos.iconoDato} />
          <span className={apilado ? estilos.datoApilado : undefined}>
            <b>{d.etiqueta}:</b> {d.valor}
          </span>
        </li>
      ))}
    </ul>
  );
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

  const experto = enlaceWhatsApp(
    empresa.whatsapp,
    `Hola, quiero hablar con un experto sobre la ${equipo.nombre}: ${urlFicha}`,
  );
  const compartirWhatsApp = `https://wa.me/?text=${encodeURIComponent(`${equipo.nombre}: ${urlFicha}`)}`;
  const compartirCorreo = `mailto:?subject=${encodeURIComponent(equipo.nombre)}&body=${encodeURIComponent(urlFicha)}`;

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

  return (
    <main className={estilos.pagina}>
      <JsonLd data={[productJsonLd, buildBreadcrumbJsonLd(breadcrumbs)]} />
      {/* La ficha ya tiene su llamada a la acción: el pie no pinta la tarjeta roja. */}
      <PieSinTarjeta />

      {/* 1. TARJETA PRINCIPAL: galería, migas, título, datos y botones. */}
      <section
        className={estilos.principal}
        data-sin-fotos={fotos.length === 0 ? "" : undefined}
        aria-labelledby="ficha-titulo"
      >
        {fotos.length > 0 ? (
          <div className={estilos.columnaGaleria}>
            <GaleriaFicha fotos={fotos} nombre={equipo.nombre} />
          </div>
        ) : null}

        <div className={estilos.columnaDatos}>
          {/* Migas: la ruta COMPLETA en la píldora (desviación aprobada, decisiones-ficha.md). */}
          <nav aria-label="Ruta de navegación" className={estilos.migas}>
            <ol>
              {breadcrumbs.map((m, i) =>
                i === breadcrumbs.length - 1 ? (
                  <li key={m.path}>
                    <span aria-current="page">{m.nombre}</span>
                  </li>
                ) : (
                  <li key={m.path}>
                    <Link href={`${m.path}${m.path.endsWith("/") ? "" : "/"}`}>{m.nombre}</Link>
                    <span aria-hidden="true"> / </span>
                  </li>
                ),
              )}
            </ol>
          </nav>

          <h1 id="ficha-titulo" className={`${estilos.titulo} texto-titulo-bloque`}>
            {equipo.nombre}
          </h1>

          <ListaDatos datos={datos} clase={`${estilos.datos} texto-destacado`} apilado />

          <div className={`${estilos.botones} ${estilos.noImprimir}`}>
            <a href={`#${ANCLA_COTIZAR}`} className={`${estilos.boton} texto-etiqueta`}>
              <IconCirclePlus aria-hidden="true" stroke={1.75} />
              Cotizar el equipo
            </a>
            {experto ? (
              <a
                href={experto.href}
                className={`${estilos.boton} ${estilos.botonOscuro} texto-etiqueta`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconBrandWhatsapp aria-hidden="true" stroke={1.75} />
                Habla con un experto
                <span className="sr-only"> (abre WhatsApp)</span>
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* 2. DESCRIPCIÓN Y FICHA TÉCNICA. */}
      <section className={estilos.descripcion} aria-labelledby="ficha-tecnica">
        <div className={estilos.columnaTexto}>
          {logo ? (
            <Image
              src={logo.url}
              alt={`Logo de ${marca.nombre}`}
              width={logo.width}
              height={logo.height}
              sizes="95px"
              className={estilos.logoMarca}
            />
          ) : null}
          <div className={`${estilos.texto} texto-cuerpo`}>
            {equipo.entradilla ? <p>{equipo.entradilla}</p> : null}
            {equipo.descripcion ? <RichText data={equipo.descripcion} /> : null}
            {puntos.length > 0 ? (
              <ul className={estilos.puntos}>
                {puntos.map((p) => (
                  <li key={p.id ?? p.texto}>{p.texto}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className={estilos.columnaFicha}>
          <h2 id="ficha-tecnica" className={`${estilos.subtitulo} texto-titulo-3`}>
            Ficha técnica
          </h2>
          {especificaciones.length > 0 ? (
            <dl className={`${estilos.especificaciones} texto-cuerpo`}>
              {especificaciones.map((e) => (
                <div key={e.id ?? e.etiqueta}>
                  <dt>{e.etiqueta}:</dt> <dd>{e.valor}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {pdf ? (
            <a
              href={pdf}
              className={`${estilos.boton} ${estilos.noImprimir} texto-etiqueta`}
              target="_blank"
              rel="noopener"
            >
              <IconFileTypePdf aria-hidden="true" stroke={1.75} />
              Descargar ficha técnica completa
              <span className="sr-only"> (PDF)</span>
            </a>
          ) : null}
          <ul className={`${estilos.compartir} ${estilos.noImprimir}`} aria-label="Compartir">
            <li>
              <a
                href={compartirWhatsApp}
                className={estilos.botonCompartir}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartir por WhatsApp"
              >
                <IconBrandWhatsapp aria-hidden="true" stroke={1.75} />
              </a>
            </li>
            <li>
              <a
                href={compartirCorreo}
                className={estilos.botonCompartir}
                aria-label="Compartir por correo"
              >
                <IconMail aria-hidden="true" stroke={1.75} />
              </a>
            </li>
            <li>
              <BotonImprimir className={estilos.botonCompartir} />
            </li>
          </ul>
        </div>
      </section>

      {/* 3. OTRAS REFERENCIAS DE ESTA CATEGORÍA (sin otros equipos, no sale). */}
      {otras.length > 0 ? (
        <section
          className={`${estilos.otras} ${estilos.noImprimir}`}
          aria-labelledby="otras-referencias"
        >
          <h2 id="otras-referencias" className={`${estilos.tituloOtras} texto-titulo-bloque`}>
            Otras referencias de esta categoría
          </h2>
          <ul className={estilos.tarjetas}>
            {otras.map((o) => {
              const foto = imagenDeMedia(
                Array.isArray(o.imagenes) ? o.imagenes[0] : null,
                o.nombre,
              );
              const pdfOtro = urlPdf(o);
              return (
                <li key={o.id} className={estilos.tarjeta}>
                  {foto ? (
                    <Image
                      src={foto.url}
                      alt={foto.alt}
                      width={foto.width}
                      height={foto.height}
                      sizes="(min-width: 1025px) 26vw, (min-width: 768px) 40vw, 78vw"
                      className={estilos.fotoTarjeta}
                    />
                  ) : null}
                  <h3 className={`${estilos.nombreTarjeta} texto-destacado-negrita`}>{o.nombre}</h3>
                  <ListaDatos
                    datos={destacadas(o.fichaTecnica, DESTACADAS_EN_TARJETA)}
                    clase={`${estilos.datosTarjeta} texto-cuerpo`}
                  />
                  <div className={estilos.botonesTarjeta}>
                    <Link
                      href={`${rutas.equipoNuevo(marca.slug, tipo.slug, o.slug)}/`}
                      className={`${estilos.boton} texto-etiqueta`}
                    >
                      Ver más<span className="sr-only"> sobre {o.nombre}</span>
                    </Link>
                    {pdfOtro ? (
                      <a
                        href={pdfOtro}
                        className={`${estilos.boton} ${estilos.botonOscuro} texto-etiqueta`}
                        target="_blank"
                        rel="noopener"
                      >
                        Ficha técnica<span className="sr-only"> de {o.nombre} (PDF)</span>
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* 4. LLAMADA A CONTACTAR y, debajo, el formulario de cotización. */}
      <section className={`${estilos.contacto} ${estilos.noImprimir}`} aria-labelledby="asesoria">
        <div className={estilos.recuadroContacto}>
          <div className={estilos.textoContacto}>
            <h2 id="asesoria" className={`${estilos.tituloContacto} texto-titulo-seccion`}>
              Contáctanos para recibir asesoría
            </h2>
            <div className={estilos.botonesContacto}>
              <a href={`#${ANCLA_COTIZAR}`} className={`${estilos.boton} texto-etiqueta`}>
                <IconMail aria-hidden="true" stroke={1.75} />
                Contáctanos
              </a>
              {experto ? (
                <a
                  href={experto.href}
                  className={`${estilos.boton} texto-etiqueta`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconBrandWhatsapp aria-hidden="true" stroke={1.75} />
                  WhatsApp<span className="sr-only"> (abre WhatsApp)</span>
                </a>
              ) : null}
            </div>
          </div>
          <div className={estilos.imagenContacto}>
            <EngranajeMarca className={estilos.engranaje} />
            {imagenContacto ? (
              <Image
                src={imagenContacto.url}
                alt=""
                width={imagenContacto.width}
                height={imagenContacto.height}
                sizes="(min-width: 1025px) 430px, (min-width: 768px) 305px, 210px"
                className={estilos.fotoContacto}
              />
            ) : null}
          </div>
        </div>

        <div id={ANCLA_COTIZAR} className={estilos.formulario}>
          {/*
           * Cotización con el equipo ya preseleccionado: quien llega hasta aquí ya
           * sabe qué quiere, y volver a escribirlo es fricción que cuesta leads.
           */}
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
        </div>
      </section>
    </main>
  );
}
