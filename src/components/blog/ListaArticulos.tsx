import Image from "next/image";
import Link from "next/link";

import { rutas } from "@/lib/routes";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import type { Articulo, CategoriasBlog } from "@/payload-types";

/**
 * Lista de artículos para el índice y los archivos de categoría.
 *
 * SIN PAGINACIÓN, a propósito: el sitio actual no tiene ni una URL paginada
 * (0 con `/page/N` o `?paged` entre las 648 medidas). Añadirla inventaría URLs
 * que nadie ha indexado. Se revisa cuando el volumen lo pida; 51 artículos
 * caben de sobra en una página.
 */
export function ListaArticulos({ articulos, vacio }: { articulos: Articulo[]; vacio: string }) {
  if (articulos.length === 0) {
    return (
      <p className="rounded border border-dashed border-gray-300 p-6 text-center text-gray-600">
        {vacio}
      </p>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {articulos.map((articulo) => {
        const imagen = imagenDeMedia(articulo.imagenDestacada, articulo.titulo);
        const categoria = poblado<CategoriasBlog>(articulo.categoria);

        return (
          <li key={articulo.slug} className="rounded-lg border border-gray-200 p-4">
            {imagen ? (
              <Image
                src={imagen.url}
                alt={imagen.alt}
                width={imagen.width}
                height={imagen.height}
                className="mb-3 h-40 w-full rounded object-cover"
              />
            ) : null}

            {/*
             * h3 y no h2: el índice ya usa h2 para el encabezado de la sección,
             * y saltarse un nivel rompe el esquema del documento.
             */}
            <h3 className="font-medium text-gray-900">
              <Link href={`${rutas.articulo(articulo.slug)}/`} className="hover:underline">
                {articulo.titulo}
              </Link>
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              <time dateTime={articulo.fechaPublicacion}>
                {new Date(articulo.fechaPublicacion).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </time>
              {categoria ? <> · {categoria.nombre}</> : null}
            </p>

            {articulo.entradilla ? (
              <p className="mt-2 text-sm text-gray-700">{articulo.entradilla}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
