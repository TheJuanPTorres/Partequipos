import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMarcaPorSlug } from "@/lib/queries/getMarcas";
import { getModeloPorSlug, getModelos } from "@/lib/queries/getModelos";
import { getTipoPorSlug } from "@/lib/queries/getTipos";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/jsonLd";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { Marca, TiposEquipo } from "@/payload-types";

type Params = { marca: string; tipo: string; modelo: string };

export async function generateStaticParams(): Promise<Params[]> {
  const modelos = await getModelos();

  return modelos.flatMap((modelo) => {
    const marca = poblado<Marca>(modelo.marca);
    const tipo = poblado<TiposEquipo>(modelo.tipo);
    if (!marca || !tipo) return [];
    return [{ marca: marca.slug, tipo: tipo.slug, modelo: modelo.slug }];
  });
}

/**
 * Resuelve marca + tipo + modelo validando la coherencia de toda la cadena:
 * el tipo debe pertenecer a la marca y el modelo al tipo. Una combinación
 * inventada (marca real + tipo de otra marca, p. ej.) devuelve null -> 404.
 */
async function resolver(params: Params) {
  const marca = await getMarcaPorSlug(params.marca);
  if (!marca) return null;

  const tipo = await getTipoPorSlug(marca.id, params.tipo);
  if (!tipo) return null;

  const modelo = await getModeloPorSlug(tipo.id, params.modelo);
  if (!modelo) return null;

  return { marca, tipo, modelo };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await resolver(await params);
  if (!data) return {};

  const { marca, tipo, modelo } = data;
  const imagenes = Array.isArray(modelo.imagenes) ? modelo.imagenes : [];
  const portada = imagenDeMedia(imagenes[0], modelo.nombre);

  return buildMetadata({
    nombre: `Repuestos ${modelo.nombre}`,
    path: rutas.modelo(marca.slug, tipo.slug, modelo.slug),
    descripcion: modelo.descripcion,
    seo: modelo.seo,
    imageUrl: portada?.url,
  });
}

export default async function ModeloPage({ params }: { params: Promise<Params> }) {
  const data = await resolver(await params);
  if (!data) notFound();

  const { marca, tipo, modelo } = data;

  const imagenes = (Array.isArray(modelo.imagenes) ? modelo.imagenes : [])
    .map((img) => imagenDeMedia(img, modelo.nombre))
    .filter((img): img is NonNullable<typeof img> => img !== null);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
    { nombre: "Marcas", path: rutas.marcas() },
    { nombre: marca.nombre, path: rutas.marca(marca.slug) },
    { nombre: tipo.nombre, path: rutas.tipo(marca.slug, tipo.slug) },
    { nombre: modelo.nombre, path: rutas.modelo(marca.slug, tipo.slug, modelo.slug) },
  ];

  const productJsonLd = buildProductJsonLd({
    nombre: modelo.nombre,
    path: rutas.modelo(marca.slug, tipo.slug, modelo.slug),
    descripcion: modelo.descripcion,
    marca: marca.nombre,
    codigo: modelo.codigo,
    imagenes: imagenes.map((img) => img.url),
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={[productJsonLd, buildBreadcrumbJsonLd(breadcrumbs)]} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">Repuestos {modelo.nombre}</h1>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm text-gray-600">
        <div className="flex gap-2">
          <dt className="font-medium text-gray-900">Marca:</dt>
          <dd>
            <Link href={rutas.marca(marca.slug)} className="underline hover:text-gray-900">
              {marca.nombre}
            </Link>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-gray-900">Tipo de equipo:</dt>
          <dd>
            <Link
              href={rutas.tipo(marca.slug, tipo.slug)}
              className="underline hover:text-gray-900"
            >
              {tipo.nombre}
            </Link>
          </dd>
        </div>
        {modelo.codigo ? (
          <div className="flex gap-2">
            <dt className="font-medium text-gray-900">Código:</dt>
            <dd>{modelo.codigo}</dd>
          </div>
        ) : null}
      </dl>

      {modelo.descripcion ? (
        <p className="mt-6 max-w-2xl text-gray-700">{modelo.descripcion}</p>
      ) : null}

      {/* Los modelos sin imagen simplemente no renderizan la galería. */}
      {imagenes.length > 0 ? (
        <section className="mt-8" aria-labelledby="galeria-heading">
          <h2 id="galeria-heading" className="text-xl font-medium text-gray-900">
            Imágenes
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {imagenes.map((img) => (
              <li key={img.url} className="rounded-lg border border-gray-200 p-3">
                <Image
                  src={img.url}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  className="h-auto w-full object-contain"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/*
       * Solicitud del repuesto, con el modelo ya preseleccionado. La ficha de
       * repuestos no publica precio ni existencias: el objetivo de la página es
       * exactamente esta solicitud.
       */}
      <FormularioSolicitud
        tipo="repuesto"
        origen={rutas.modelo(marca.slug, tipo.slug, modelo.slug)}
        siteKey={turnstileSiteKey()}
        whatsapp={enlaceWhatsApp(`Hola, busco repuestos para ${modelo.nombre}.`)}
        referencia={{ tipo: "modelos-repuesto", id: modelo.id, texto: modelo.nombre }}
        titulo="Solicitar este repuesto"
        descripcion="Dinos qué pieza necesitas y te confirmamos disponibilidad y precio."
        textoBoton="Solicitar repuesto"
      />

      <nav
        className="mt-10 border-t border-gray-200 pt-6 text-sm"
        aria-label="Navegación de catálogo"
      >
        <Link href={rutas.tipo(marca.slug, tipo.slug)} className="underline hover:text-gray-900">
          ← Ver todos los modelos de {tipo.nombre.toLowerCase()} {marca.nombre}
        </Link>
      </nav>
    </main>
  );
}
