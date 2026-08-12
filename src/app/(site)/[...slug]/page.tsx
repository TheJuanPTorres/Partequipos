import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { RichText } from "@/components/layout/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  SLUG_CONTACTO,
  SLUG_PORTADA,
  getPaginaPorSlug,
  getPaginas,
} from "@/lib/queries/getPaginas";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";

/**
 * Páginas institucionales y legales.
 *
 * Es una ruta comodín porque sus slugs no siguen ningún patrón (`nosotros`,
 * `politica-de-garantia-de-repuestos`, `nosotros/trabaja-con-nosotros`…) y hay
 * que reproducirlos EXACTAMENTE como están indexados (CLAUDE.md §3.3).
 *
 * No canibaliza el catálogo: las rutas estáticas y dinámicas declaradas tienen
 * prioridad sobre un comodín, así que `/repuestos-…` y `/admin` siguen resueltas
 * por sus propios segmentos.
 */
type Params = { slug: string[] };

export async function generateStaticParams(): Promise<Params[]> {
  const paginas = await getPaginas();

  return paginas
    .filter((p) => p.slug !== SLUG_PORTADA) // la portada la sirve `/`
    .map((p) => ({ slug: p.slug.split("/").filter(Boolean) }));
}

/** Une los segmentos en el slug tal como se guarda en Payload. */
const aSlug = (segs: string[]) => segs.filter(Boolean).join("/");

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const pagina = await getPaginaPorSlug(aSlug(slug));
  if (!pagina) return {};

  return buildMetadata({
    nombre: pagina.titulo,
    path: `/${pagina.slug}`,
    descripcion: pagina.entradilla,
    seo: pagina.seo,
    imageUrl: imagenDeMedia(pagina.seo?.ogImage, pagina.titulo)?.url,
  });
}

export default async function PaginaInstitucionalPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const clave = aSlug(slug);

  // La portada vive en `/`; servirla también aquí duplicaría contenido.
  if (clave === SLUG_PORTADA) notFound();

  const pagina = await getPaginaPorSlug(clave);
  if (!pagina) notFound();

  const secciones = pagina.secciones ?? [];

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: pagina.titulo, path: `/${pagina.slug}` },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
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
          whatsapp={enlaceWhatsApp()}
          titulo="Escríbenos"
          descripcion="Cuéntanos qué necesitas y te respondemos en horario de oficina."
          textoBoton="Enviar solicitud"
        />
      ) : null}
    </main>
  );
}
