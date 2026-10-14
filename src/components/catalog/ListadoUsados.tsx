import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import type { PaginaDeUsados } from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { paginasVisibles } from "@/lib/usados/paginacion";
import { imagenDeMedia } from "@/lib/utils/relations";
import type { CategoriasUsada } from "@/payload-types";

/** Ancho con el que se piden las miniaturas de las tarjetas (ver el `<Image>`). */
const ANCHO_MINIATURA = 400;

/**
 * El listado de una categoría de maquinaria USADA, una página cada vez. Lo
 * comparten la página 1 (la URL de la categoría) y `…/pagina/<n>/`.
 *
 * Aquí sí se renderiza el inventario: las unidades no tienen URL propia
 * (ADR 0007), así que esta ruta es su único escaparate. Solo se listan las
 * disponibles; las vendidas se marcan, no se borran.
 */
export function ListadoUsados({
  categoria,
  pagina,
  datos,
}: {
  categoria: CategoriasUsada;
  pagina: number;
  datos: PaginaDeUsados;
}) {
  const { unidades, total, paginas } = datos;
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Usada", path: rutas.usada() },
    { nombre: categoria.nombre, path: rutas.categoriaUsada(categoria.slug) },
  ];
  if (pagina > 1) {
    breadcrumbs.push({
      nombre: `Página ${pagina}`,
      path: rutas.categoriaUsadaPagina(categoria.slug, pagina),
    });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">
        {tituloPorDefecto.categoriaUsada(categoria.nombre)}
        {pagina > 1 ? <span className="font-normal text-gray-600"> · página {pagina}</span> : null}
      </h1>

      {categoria.descripcion ? (
        <p className="mt-3 max-w-2xl text-gray-600">{categoria.descripcion}</p>
      ) : null}

      <section className="mt-8" aria-labelledby="unidades-heading">
        <h2 id="unidades-heading" className="text-xl font-medium text-gray-900">
          {total} {total === 1 ? "unidad disponible" : "unidades disponibles"}
          {paginas > 1 ? (
            <span className="font-normal text-gray-600">
              {" "}
              · página {pagina} de {paginas}
            </span>
          ) : null}
        </h2>

        {unidades.length === 0 ? (
          <p className="mt-4 rounded border border-dashed border-gray-300 p-6 text-center text-gray-600">
            No hay unidades disponibles en esta categoría ahora mismo. El inventario cambia con
            frecuencia: escríbenos y te avisamos cuando entre una.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {unidades.map((unidad) => {
              const primera = Array.isArray(unidad.imagenes) ? unidad.imagenes[0] : null;
              const imagen = imagenDeMedia(primera, unidad.nombre);

              return (
                <li key={unidad.id} className="rounded-lg border border-gray-200 p-4">
                  {imagen ? (
                    <Image
                      src={imagen.url}
                      alt={imagen.alt}
                      // Ancho de MINIATURA, no el original: el srcset de 1x/2x
                      // sale de aquí (640 y 828 px), y la tarjeta pinta como
                      // mucho ~394 px de ancho y 160 de alto. Con el ancho
                      // original pedía hasta 4 veces de más; con `sizes`, cada
                      // tarjeta llevaba 12 anchos en el srcset y el HTML del
                      // listado crecía ~65 % (medido en el preview, 2026-10-13).
                      width={ANCHO_MINIATURA}
                      height={Math.round((ANCHO_MINIATURA * imagen.height) / imagen.width)}
                      className="mb-3 h-40 w-full object-contain"
                    />
                  ) : null}

                  <h3 className="font-medium text-gray-900">{unidad.nombre}</h3>

                  <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    {unidad.anio ? (
                      <div className="flex gap-1">
                        <dt className="font-medium">Año:</dt>
                        <dd>{unidad.anio}</dd>
                      </div>
                    ) : null}
                    {typeof unidad.horometro === "number" ? (
                      <div className="flex gap-1">
                        <dt className="font-medium">Horómetro:</dt>
                        <dd>{unidad.horometro.toLocaleString("es-CO")} h</dd>
                      </div>
                    ) : null}
                    {unidad.ubicacion ? (
                      <div className="flex gap-1">
                        <dt className="font-medium">Ubicación:</dt>
                        <dd>{unidad.ubicacion}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {unidad.descripcion ? (
                    <p className="mt-2 text-sm text-gray-700">{unidad.descripcion}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        {paginas > 1 ? <Paginacion slug={categoria.slug} actual={pagina} total={paginas} /> : null}
      </section>
    </main>
  );
}

/**
 * Enlaces normales (`<a href>`), sin JavaScript: así los sigue un rastreador y
 * cada página llega a las demás. Sin precarga: son hasta 20 páginas.
 */
function Paginacion({ slug, actual, total }: { slug: string; actual: number; total: number }) {
  const enlace =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-gray-300 px-3 text-gray-900 hover:bg-gray-50";
  return (
    <nav aria-label="Paginación" className="mt-6">
      <ul className="flex flex-wrap items-center gap-2">
        {actual > 1 ? (
          <li>
            <Link
              href={rutas.categoriaUsadaPagina(slug, actual - 1)}
              prefetch={false}
              rel="prev"
              className={enlace}
            >
              Anterior
            </Link>
          </li>
        ) : null}
        {paginasVisibles(actual, total).map((n, i) =>
          n === "…" ? (
            <li key={`salto-${i}`} aria-hidden="true" className="px-1 text-gray-600">
              …
            </li>
          ) : (
            <li key={n}>
              {n === actual ? (
                <span
                  aria-current="page"
                  className={`${enlace} border-gray-900 bg-gray-900 text-white hover:bg-gray-900`}
                >
                  {n}
                </span>
              ) : (
                <Link
                  href={rutas.categoriaUsadaPagina(slug, n)}
                  prefetch={false}
                  aria-label={`Página ${n}`}
                  className={enlace}
                >
                  {n}
                </Link>
              )}
            </li>
          ),
        )}
        {actual < total ? (
          <li>
            <Link
              href={rutas.categoriaUsadaPagina(slug, actual + 1)}
              prefetch={false}
              rel="next"
              className={enlace}
            >
              Siguiente
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
