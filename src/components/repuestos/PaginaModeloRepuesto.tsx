import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { PieSinTarjeta } from "@/components/layout/PieSinTarjeta";
import { JsonLd } from "@/components/seo/JsonLd";
import { getEmpresa } from "@/lib/queries/getSeo";
import { segmentoDeTipo } from "@/lib/repuestos/anidado";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/jsonLd";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { Marca, ModelosRepuesto, TiposEquipo } from "@/payload-types";

/*
 * El CONTENIDO de la ficha de un modelo de repuestos, común a sus dos rutas:
 * `[marca]/[tipo]/[modelo]` y, para los modelos de un tipo anidado (la
 * «Excavadora» de CASE, `src/lib/repuestos/anidado.ts`), un nivel más.
 */

/** Metadatos de la ficha de un modelo de repuestos. */
export async function metadataModeloRepuesto(
  marca: Marca,
  tipo: TiposEquipo,
  modelo: ModelosRepuesto,
): Promise<Metadata> {
  const imagenes = Array.isArray(modelo.imagenes) ? modelo.imagenes : [];
  const portada = imagenDeMedia(imagenes[0], modelo.nombre);

  return metadataDe({
    nombre: tituloPorDefecto.modeloRepuesto(modelo.nombre),
    path: rutas.modelo(marca.slug, segmentoDeTipo(tipo), modelo.slug),
    descripcion: modelo.descripcion,
    seo: modelo.seo,
    imageUrl: portada?.url,
  });
}

export async function PaginaModeloRepuesto({
  marca,
  tipo,
  modelo,
}: {
  marca: Marca;
  tipo: TiposEquipo;
  modelo: ModelosRepuesto;
}) {
  const empresa = await getEmpresa();
  const seg = segmentoDeTipo(tipo);
  const padre = poblado<TiposEquipo>(tipo.tipoPadre);

  const imagenes = (Array.isArray(modelo.imagenes) ? modelo.imagenes : [])
    .map((img) => imagenDeMedia(img, modelo.nombre))
    .filter((img): img is NonNullable<typeof img> => img !== null);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
    { nombre: "Marcas", path: rutas.marcas() },
    { nombre: marca.nombre, path: rutas.marca(marca.slug) },
    ...(padre && tipo.slugPadre
      ? [{ nombre: padre.nombre, path: rutas.tipo(marca.slug, tipo.slugPadre) }]
      : []),
    { nombre: tipo.nombre, path: rutas.tipo(marca.slug, seg) },
    { nombre: modelo.nombre, path: rutas.modelo(marca.slug, seg, modelo.slug) },
  ];

  const productJsonLd = buildProductJsonLd({
    nombre: modelo.nombre,
    path: rutas.modelo(marca.slug, seg, modelo.slug),
    descripcion: modelo.descripcion,
    marca: marca.nombre,
    codigo: modelo.codigo,
    imagenes: imagenes.map((img) => img.url),
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={[productJsonLd, buildBreadcrumbJsonLd(breadcrumbs)]} />
      {/* La ficha ya tiene su formulario de solicitud: el pie no pinta la tarjeta roja. */}
      <PieSinTarjeta />
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
            <Link href={rutas.tipo(marca.slug, seg)} className="underline hover:text-gray-900">
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
            {imagenes.map((img, i) => (
              <li key={img.url} className="rounded-lg border border-gray-200 p-3">
                <Image
                  src={img.url}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  // La primera foto es el LCP de la ficha del modelo (2026-10-19): carga
                  // inmediata y prioridad alta, como recomienda Next 16 para el LCP. Con
                  // `preload`, Chrome la pedía con prioridad baja (medido).
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : undefined}
                  // `max-w-4xl` en 2 columnas desde 640 px: ~400 px de foto.
                  sizes="(min-width: 896px) 400px, (min-width: 640px) 48vw, 92vw"
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
        origen={rutas.modelo(marca.slug, seg, modelo.slug)}
        siteKey={turnstileSiteKey()}
        whatsapp={enlaceWhatsApp(empresa.whatsapp, `Hola, busco repuestos para ${modelo.nombre}.`)}
        referencia={{ tipo: "modelos-repuesto", id: modelo.id, texto: modelo.nombre }}
        titulo="Solicitar este repuesto"
        descripcion="Dinos qué pieza necesitas y te confirmamos disponibilidad y precio."
        textoBoton="Solicitar repuesto"
      />

      <nav
        className="mt-10 border-t border-gray-200 pt-6 text-sm"
        aria-label="Navegación de catálogo"
      >
        <Link href={rutas.tipo(marca.slug, seg)} className="underline hover:text-gray-900">
          ← Ver todos los modelos de {tipo.nombre.toLowerCase()} {marca.nombre}
        </Link>
      </nav>
    </main>
  );
}
