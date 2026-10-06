import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Fragment } from "react";

import { ArticuloCuerpo } from "@/components/blog/ArticuloCuerpo";
import { PaginaConBloques } from "@/components/bloques/PaginaConBloques";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { PieSinTarjeta } from "@/components/layout/PieSinTarjeta";
import { RichText } from "@/components/layout/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import { idsDeVideos, vistaDeBloques } from "@/lib/bloques/desdePayload";
import { getArticuloPorSlug, getArticulos } from "@/lib/queries/getBlog";
import {
  SLUG_CONTACTO,
  SLUG_PORTADA,
  getPaginaPorSlug,
  getPaginas,
} from "@/lib/queries/getPaginas";
import { getEmpresa, getHorario } from "@/lib/queries/getSeo";
import { getVideoPorId } from "@/lib/queries/getVideos";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { textoDias, textoHora } from "@/lib/seo/horario";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";

/**
 * Ruta raíz comodín: sirve DOS cosas distintas.
 *
 *   1. Páginas institucionales y legales (`nosotros`, `contactanos`,
 *      `politica-de-garantia-de-repuestos`, `nosotros/trabaja-con-nosotros`…).
 *   2. Artículos del blog.
 *
 * Ambas viven en `/{slug}/`, en la raíz: el rastreo mide los 51 artículos en
 * profundidad 1, sin prefijo `/blog/`, sin fecha y sin categoría en la ruta
 * (permalink «nombre de la entrada» de WordPress). No es una elección de
 * diseño, es la jerarquía existente, que es intocable (CLAUDE.md §3.3).
 *
 * ═══ ORDEN DE PRECEDENCIA: PÁGINA INSTITUCIONAL PRIMERO, LUEGO ARTÍCULO ═══
 *
 * El orden importa y es deliberado. Las páginas institucionales son estructura
 * del sitio (contacto, legales, quiénes somos) y una colisión que las tapara
 * rompería navegación y enlaces del pie; un artículo tapado «solo» deja de ser
 * accesible. Ante la duda, gana lo más estructural.
 *
 * Dicho eso, **esa colisión no debería poder existir**: el hook
 * `slugUnicoFrenteA` la impide al guardar, en las dos direcciones, tanto desde
 * el panel como desde los scripts de importación. Este orden es la segunda
 * línea de defensa, no la primera.
 *
 * No canibaliza el catálogo: las rutas estáticas y dinámicas declaradas tienen
 * prioridad sobre un comodín, así que `/repuestos-…`, `/noticias/`, `/category/…`
 * y `/admin` siguen resueltas por sus propios segmentos.
 */
type Params = { slug: string[] };

export async function generateStaticParams(): Promise<Params[]> {
  const [paginas, articulos] = await Promise.all([getPaginas(), getArticulos()]);

  return [
    ...paginas
      .filter((p) => p.slug !== SLUG_PORTADA) // la portada la sirve `/`
      .map((p) => ({ slug: p.slug.split("/").filter(Boolean) })),
    // Los artículos son siempre de un solo segmento.
    ...articulos.map((a) => ({ slug: [a.slug] })),
  ];
}

/**
 * Resuelve qué documento sirve esta URL, respetando la precedencia explicada
 * arriba. Devuelve `null` si no hay ninguno, y la ruta responde 404.
 */
async function resolver(clave: string) {
  const pagina = await getPaginaPorSlug(clave);
  if (pagina) return { tipo: "pagina" as const, pagina };

  // Los artículos son de un solo segmento: `a/b` nunca puede serlo.
  if (clave.includes("/")) return null;

  const articulo = await getArticuloPorSlug(clave);
  if (articulo) return { tipo: "articulo" as const, articulo };

  return null;
}

/** Une los segmentos en el slug tal como se guarda en Payload. */
const aSlug = (segs: string[]) => segs.filter(Boolean).join("/");

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const resuelto = await resolver(aSlug(slug));
  if (!resuelto) return {};

  if (resuelto.tipo === "articulo") {
    const { articulo } = resuelto;
    return metadataDe({
      nombre: articulo.titulo,
      path: rutas.articulo(articulo.slug),
      descripcion: articulo.entradilla,
      seo: articulo.seo,
      imageUrl: imagenDeMedia(articulo.imagenDestacada, articulo.titulo)?.url,
      // `article`, no `website`: es lo que distingue una entrada de blog para
      // los agregadores y las tarjetas sociales.
      ogType: "article",
    });
  }

  const { pagina } = resuelto;
  return metadataDe({
    nombre: pagina.titulo,
    path: `/${pagina.slug}`,
    descripcion: pagina.entradilla,
    seo: pagina.seo,
    imageUrl: imagenDeMedia(pagina.seo?.ogImage, pagina.titulo)?.url,
  });
}

export default async function PaginaRaizPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const clave = aSlug(slug);

  // La portada vive en `/`; servirla también aquí duplicaría contenido.
  if (clave === SLUG_PORTADA) notFound();

  const resuelto = await resolver(clave);
  if (!resuelto) notFound();

  if (resuelto.tipo === "articulo") return <ArticuloCuerpo articulo={resuelto.articulo} />;

  const { pagina } = resuelto;
  const secciones = pagina.secciones ?? [];
  const horario = clave === SLUG_CONTACTO ? await getHorario() : [];
  const empresa = clave === SLUG_CONTACTO ? await getEmpresa() : null;

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: pagina.titulo, path: `/${pagina.slug}` },
  ];

  /*
   * PÁGINA CON BLOQUES (docs/diseno/decisiones-nosotros.md): migas, bloques y
   * JSON-LD; su «Contenido» y sus «Secciones con ancla» no se pintan. Sin
   * bloques, la plantilla de siempre, sin ningún cambio.
   */
  if (pagina.bloques?.length) {
    const videos = await Promise.all(idsDeVideos(pagina.bloques).map((id) => getVideoPorId(id)));
    const porId = new Map(videos.flatMap((v) => (v ? [[v.id, v] as const] : [])));
    return (
      <PaginaConBloques
        titulo={pagina.titulo}
        migas={breadcrumbs}
        bloques={vistaDeBloques(pagina.bloques, porId)}
      />
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      {/* /contactanos/ ya tiene su formulario: el pie no pinta la tarjeta roja. */}
      {clave === SLUG_CONTACTO ? <PieSinTarjeta /> : null}
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">{pagina.titulo}</h1>
      {pagina.entradilla ? (
        <p className="mt-3 max-w-2xl text-gray-600">{pagina.entradilla}</p>
      ) : null}

      {pagina.contenido ? (
        <div className="mt-6">
          <RichText data={pagina.contenido} />
        </div>
      ) : null}

      {/* Índice de secciones: hace visibles y navegables las anclas. */}
      {secciones.length > 1 ? (
        <nav
          className="mt-8 rounded-lg border border-gray-200 p-4"
          aria-labelledby="indice-heading"
        >
          <h2 id="indice-heading" className="text-sm font-semibold text-gray-900">
            En esta página
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            {secciones.map((seccion) => (
              <li key={seccion.ancla}>
                <a
                  href={`#${seccion.ancla}`}
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  {seccion.titulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {/* Las anclas son secciones de ESTA página, no rutas propias. */}
      {secciones.map((seccion) => (
        <section key={seccion.ancla} id={seccion.ancla} className="mt-10 scroll-mt-8">
          <h2 className="text-xl font-medium text-gray-900">{seccion.titulo}</h2>
          <div className="mt-3">
            <RichText data={seccion.contenido} />
          </div>
        </section>
      ))}

      {/* Horario de atención (global `seo`), solo en /contactanos/. Sin tramos, no se pinta. */}
      {clave === SLUG_CONTACTO && horario.length > 0 ? (
        <section className="mt-10" aria-labelledby="horario-heading">
          <h2 id="horario-heading" className="text-xl font-medium text-gray-900">
            Horario de atención
          </h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-gray-700">
            {horario.map((t) => (
              <Fragment key={`${t.dias.join("-")}-${t.abre}`}>
                <dt className="first-letter:uppercase">{textoDias(t.dias)}</dt>
                <dd>
                  <time dateTime={t.abre}>{textoHora(t.abre)}</time> a{" "}
                  <time dateTime={t.cierra}>{textoHora(t.cierra)}</time>
                </dd>
              </Fragment>
            ))}
          </dl>
        </section>
      ) : null}

      {/*
       * Formulario de contacto. Solo en /contactanos/: es la página que el
       * usuario busca cuando quiere escribirnos, y meterlo en todas las
       * institucionales (garantías, ética…) sería ruido.
       */}
      {clave === SLUG_CONTACTO ? (
        <FormularioSolicitud
          tipo="contacto"
          origen={`/${pagina.slug}`}
          siteKey={turnstileSiteKey()}
          whatsapp={empresa ? enlaceWhatsApp(empresa.whatsapp) : undefined}
          titulo="Escríbenos"
          descripcion="Cuéntanos qué necesitas y te respondemos en horario de oficina."
          textoBoton="Enviar solicitud"
        />
      ) : null}
    </main>
  );
}
