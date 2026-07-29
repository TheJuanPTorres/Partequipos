import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RichText } from "@/components/layout/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import { enlaceWhatsApp, navegacionPrincipal } from "@/lib/navegacion";
import { SLUG_PORTADA, getPaginaPorSlug } from "@/lib/queries/getPaginas";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { seoConfig } from "@/lib/seo/config";
import { buildOrganizationJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia } from "@/lib/utils/relations";

/**
 * Portada. El contenido es editable desde Payload (documento con slug
 * `inicio`); aquí no hay texto de negocio quemado.
 */
export async function generateMetadata(): Promise<Metadata> {
  const pagina = await getPaginaPorSlug(SLUG_PORTADA);
  if (!pagina) return {};

  return buildMetadata({
    nombre: pagina.titulo,
    path: "/",
    descripcion: pagina.entradilla,
    seo: pagina.seo,
    imageUrl: imagenDeMedia(pagina.seo?.ogImage, pagina.titulo)?.url,
  });
}

export default async function HomePage() {
  const pagina = await getPaginaPorSlug(SLUG_PORTADA);
  if (!pagina) notFound();

  const { contact } = seoConfig;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <JsonLd data={buildOrganizationJsonLd()} />

      <h1 className="text-4xl font-semibold text-gray-900">{pagina.titulo}</h1>
      {pagina.entradilla ? (
        <p className="mt-4 max-w-2xl text-lg text-gray-600">{pagina.entradilla}</p>
      ) : null}

      {/* Acceso a las secciones principales del sitio. */}
      <nav className="mt-10" aria-labelledby="secciones-heading">
        <h2 id="secciones-heading" className="text-xl font-medium text-gray-900">
          Qué encontrarás aquí
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {navegacionPrincipal.map((item) => (
            <li key={item.href} className="rounded-lg border border-gray-200">
              <Link href={item.href} className="block p-4 hover:bg-gray-50">
                <span className="font-medium text-gray-900">{item.etiqueta}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {pagina.contenido ? (
        <section className="mt-12" aria-labelledby="propuesta-heading">
          <h2 id="propuesta-heading" className="text-xl font-medium text-gray-900">
            Sobre Partequipos
          </h2>
          <div className="mt-4">
            <RichText data={pagina.contenido} />
          </div>
        </section>
      ) : null}

      {/* Secciones con ancla, si el editor las define para la portada. */}
      {(pagina.secciones ?? []).map((seccion) => (
        <section key={seccion.ancla} id={seccion.ancla} className="mt-12 scroll-mt-8">
          <h2 className="text-xl font-medium text-gray-900">{seccion.titulo}</h2>
          <div className="mt-4">
            <RichText data={seccion.contenido} />
          </div>
        </section>
      ))}

      <section className="mt-12 border-t border-gray-200 pt-8" aria-labelledby="contacto-heading">
        <h2 id="contacto-heading" className="text-xl font-medium text-gray-900">
          Contacto
        </h2>
        <address className="mt-3 space-y-1 not-italic text-gray-700">
          <p>
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="underline">
              {contact.phone}
            </a>{" "}
            ·{" "}
            <a
              href={enlaceWhatsApp(contact.phone)}
              className="underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              WhatsApp
            </a>
          </p>
          <p>
            <a href={`mailto:${contact.email}`} className="underline">
              {contact.email}
            </a>
          </p>
          <p>
            {contact.streetAddress}, {contact.addressLocality}
          </p>
        </address>
        <p className="mt-2 text-sm text-gray-600">{contact.openingHours}</p>
      </section>
    </main>
  );
}
