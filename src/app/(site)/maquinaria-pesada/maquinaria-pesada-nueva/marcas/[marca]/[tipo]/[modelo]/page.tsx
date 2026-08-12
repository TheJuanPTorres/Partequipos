import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { RichText } from "@/components/layout/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getEquipoNuevoPorSlug,
  getEquiposNuevos,
  getMarcaMaquinariaPorSlug,
  getTipoMaquinariaPorSlug,
} from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/jsonLd";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

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
  if (!data) return {};

  const { marca, tipo, equipo } = data;
  const imagenes = Array.isArray(equipo.imagenes) ? equipo.imagenes : [];

  return buildMetadata({
    nombre: equipo.nombre,
    path: rutas.equipoNuevo(marca.slug, tipo.slug, equipo.slug),
    descripcion: equipo.entradilla,
    seo: equipo.seo,
    imageUrl: imagenDeMedia(imagenes[0], equipo.nombre)?.url,
  });
}

export default async function EquipoNuevoPage({ params }: { params: Promise<Params> }) {
  const data = await resolver(await params);
  if (!data) notFound();

  const { marca, tipo, equipo } = data;

  const imagenes = (Array.isArray(equipo.imagenes) ? equipo.imagenes : [])
    .map((img) => imagenDeMedia(img, equipo.nombre))
    .filter((img): img is NonNullable<typeof img> => img !== null);

  const destacados = (equipo.destacados ?? []).filter((d) => d.texto?.trim());
  const especificaciones = (equipo.fichaTecnica ?? []).filter((e) => e.etiqueta && e.valor);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nueva() },
    { nombre: "Marcas", path: rutas.marcasMaquinaria() },
    { nombre: marca.nombre, path: rutas.marcaMaquinaria(marca.slug) },
    { nombre: tipo.nombre, path: rutas.tipoMaquinaria(marca.slug, tipo.slug) },
    { nombre: equipo.nombre, path: rutas.equipoNuevo(marca.slug, tipo.slug, equipo.slug) },
  ];

  const productJsonLd = buildProductJsonLd({
    nombre: equipo.nombre,
    path: rutas.equipoNuevo(marca.slug, tipo.slug, equipo.slug),
    descripcion: equipo.entradilla,
    marca: marca.nombre,
    codigo: equipo.codigo,
    imagenes: imagenes.map((img) => img.url),
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={[productJsonLd, buildBreadcrumbJsonLd(breadcrumbs)]} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">{equipo.nombre}</h1>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm text-gray-600">
        <div className="flex gap-2">
          <dt className="font-medium text-gray-900">Marca:</dt>
          <dd>
            <Link href={`${rutas.marcaMaquinaria(marca.slug)}/`} className="underline">
              {marca.nombre}
            </Link>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-gray-900">Tipo:</dt>
          <dd>
            <Link href={`${rutas.tipoMaquinaria(marca.slug, tipo.slug)}/`} className="underline">
              {tipo.nombre}
            </Link>
          </dd>
        </div>
        {equipo.codigo ? (
          <div className="flex gap-2">
            <dt className="font-medium text-gray-900">Código:</dt>
            <dd>{equipo.codigo}</dd>
          </div>
        ) : null}
      </dl>

      {equipo.entradilla ? (
        <p className="mt-6 max-w-2xl text-lg text-gray-700">{equipo.entradilla}</p>
      ) : null}

      {/* Un equipo sin galería no rompe: la sección simplemente no aparece. */}
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

      {destacados.length > 0 ? (
        <section className="mt-8" aria-labelledby="destacados-heading">
          <h2 id="destacados-heading" className="text-xl font-medium text-gray-900">
            Puntos destacados
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-gray-700">
            {destacados.map((d) => (
              <li key={d.id ?? d.texto}>{d.texto}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {equipo.descripcion ? (
        <section className="mt-8" aria-labelledby="descripcion-heading">
          <h2 id="descripcion-heading" className="text-xl font-medium text-gray-900">
            Descripción
          </h2>
          <div className="mt-3">
            <RichText data={equipo.descripcion} />
          </div>
        </section>
      ) : null}

      {/* Ficha técnica: pares etiqueta/valor tal como los publica el fabricante. */}
      {especificaciones.length > 0 ? (
        <section className="mt-8" aria-labelledby="ficha-heading">
          <h2 id="ficha-heading" className="text-xl font-medium text-gray-900">
            Ficha técnica
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody>
                {especificaciones.map((e) => (
                  <tr key={e.id ?? e.etiqueta} className="border-b border-gray-200">
                    <th scope="row" className="py-2 pr-6 font-medium text-gray-900">
                      {e.etiqueta}
                    </th>
                    <td className="py-2 text-gray-700">{e.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/*
       * Cotización con el equipo ya preseleccionado: quien llega hasta aquí ya
       * sabe qué quiere, y volver a escribirlo es fricción que cuesta leads.
       */}
      <FormularioSolicitud
        tipo="cotizacion"
        origen={rutas.equipoNuevo(marca.slug, tipo.slug, equipo.slug)}
        siteKey={turnstileSiteKey()}
        whatsapp={enlaceWhatsApp(`Hola, quiero cotizar la ${equipo.nombre}.`)}
        referencia={{ tipo: "equipos-nuevos", id: equipo.id, texto: equipo.nombre }}
        titulo="Solicitar cotización"
        descripcion="Te enviamos precio, disponibilidad y condiciones de entrega."
        textoBoton="Pedir cotización"
      />

      <nav
        className="mt-10 border-t border-gray-200 pt-6 text-sm"
        aria-label="Navegación de maquinaria"
      >
        <Link href={`${rutas.tipoMaquinaria(marca.slug, tipo.slug)}/`} className="underline">
          ← Ver todos los equipos de {tipo.nombre} {marca.nombre}
        </Link>
      </nav>
    </main>
  );
}
