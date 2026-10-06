import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { RichText } from "@/components/layout/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLogo } from "@/lib/queries/getSeo";
import { rutas } from "@/lib/routes";
import { seoConfig } from "@/lib/seo/config";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import type { Articulo, CategoriasBlog } from "@/payload-types";

import cabecera from "./cabeceraArticulo.module.css";

/** Entre fecha, firma y categoría: «·» con un espacio de media eme a cada lado. */
const SEPARADOR = " · ";

/**
 * Cuerpo de un artículo del blog.
 *
 * Vive en un componente aparte porque la ruta que lo sirve es `[...slug]`, la
 * misma que las páginas institucionales: mantener ahí todo el marcado del
 * artículo mezclaría dos plantillas distintas en un archivo.
 */

/** Fecha legible en español; el `dateTime` del `<time>` va en ISO. */
function fechaLegible(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function ArticuloCuerpo({ articulo }: { articulo: Articulo }) {
  const logo = await getLogo();
  const categoria = poblado<CategoriasBlog>(articulo.categoria);
  const imagen = imagenDeMedia(articulo.imagenDestacada, articulo.titulo);
  const fecha = fechaLegible(articulo.fechaPublicacion);
  const autor = articulo.autor?.trim() || seoConfig.siteName;
  /* El texto de la línea de fecha, tal como se ve: es su copia invisible. */
  const meta = [fecha, `Por ${autor}`, categoria?.nombre].filter(Boolean).join(SEPARADOR);

  /*
   * La miga de la categoría se omite cuando su nombre coincide con el del
   * índice. Hoy pasa siempre —la única categoría se llama «Noticias», igual que
   * el índice—, y repetirla daría «Inicio / Noticias / Noticias / …», que no
   * informa de nada y ensucia el JSON-LD. Con una categoría distinta sí aparece.
   */
  const INDICE = "Noticias";
  const migaCategoria =
    categoria && categoria.nombre !== INDICE
      ? [{ nombre: categoria.nombre, path: rutas.categoriaBlog(categoria.slug) }]
      : [];

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: INDICE, path: rutas.blog() },
    ...migaCategoria,
    { nombre: articulo.titulo, path: rutas.articulo(articulo.slug) },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd
        data={[
          buildArticleJsonLd({
            titulo: articulo.titulo,
            path: rutas.articulo(articulo.slug),
            descripcion: articulo.entradilla,
            fechaPublicacion: articulo.fechaPublicacion,
            fechaModificacion: articulo.updatedAt,
            autor: articulo.autor,
            imagenUrl: imagen?.url,
            logoUrl: logo.buscadores,
          }),
          buildBreadcrumbJsonLd(breadcrumbs),
        ]}
      />
      <Breadcrumbs items={breadcrumbs} />

      {/* `<article>` porque es contenido autónomo, no una sección de la página. */}
      <article>
        {/*
         * Título, línea de fecha y entradilla con su alto fijado por una copia
         * invisible del texto (`data-reserva`): así no se desplazan al llegar
         * Inter. La copia tiene que decir EXACTAMENTE lo mismo que lo visible.
         */}
        <header>
          <h1
            className={`${cabecera.reserva} text-3xl font-semibold text-gray-900`}
            data-reserva={articulo.titulo}
          >
            <span>{articulo.titulo}</span>
          </h1>

          <p className={`${cabecera.reserva} mt-3 text-sm text-gray-600`} data-reserva={meta}>
            <span>
              <time dateTime={articulo.fechaPublicacion}>{fecha}</time>
              <span aria-hidden="true">{SEPARADOR}</span>
              {/* Sin firma, la de la empresa (decisión de dirección, 2026-10-06). */}
              <span>Por {autor}</span>
              {categoria ? (
                <>
                  <span aria-hidden="true">{SEPARADOR}</span>
                  <Link href={`${rutas.categoriaBlog(categoria.slug)}/`} className="underline">
                    {categoria.nombre}
                  </Link>
                </>
              ) : null}
            </span>
          </p>

          {articulo.entradilla ? (
            <p
              className={`${cabecera.reserva} mt-4 text-lg text-gray-700`}
              data-reserva={articulo.entradilla}
            >
              <span>{articulo.entradilla}</span>
            </p>
          ) : null}
        </header>

        {imagen ? (
          <Image
            src={imagen.url}
            alt={imagen.alt}
            width={imagen.width}
            height={imagen.height}
            className="mt-6 h-auto w-full rounded-lg object-cover"
            style={{ objectPosition: imagen.posicion }}
            preload
          />
        ) : null}

        {articulo.contenido ? (
          <div className="mt-8">
            <RichText data={articulo.contenido} />
          </div>
        ) : null}
      </article>

      <nav className="mt-10 border-t border-gray-200 pt-6 text-sm" aria-label="Navegación del blog">
        <Link href={`${rutas.blog()}/`} className="underline">
          ← Ver todas las noticias
        </Link>
      </nav>
    </main>
  );
}
