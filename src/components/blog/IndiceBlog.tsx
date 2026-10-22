import { IconArrowRight, IconSearch, IconX } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import marca from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { CLAVE_BUSQUEDA, MAX_BUSQUEDA, type ArticuloLista } from "@/lib/blog/indice";
import { consultaDeBusqueda, rutaDeBlog, type AmbitoBlog } from "@/lib/blog/listadoBlog";
import {
  aplicarCambio,
  conConsulta,
  consultaCanonica,
  type Cambio,
  type Catalogo,
  type ResultadoListado,
} from "@/lib/filtros";
import { rutas } from "@/lib/routes";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { paginasVisibles } from "@/lib/usados/paginacion";

import { fechaCorta } from "./fecha";
import estilos from "./indiceBlog.module.css";

/**
 * ÍNDICE DEL BLOG con la plantilla «Blog» de Andrés (2026-10-21,
 * `Blog.json`): cabecera «Partequipos / Nuestro Blog» con el revelado por
 * palabras, columna lateral con «Categorías», buscador y casillas, y la zona
 * principal con los filtros activos, «Limpiar filtros», la rejilla de
 * artículos (foto, título, extracto de unos 100 caracteres y «Leer») y la
 * paginación.
 *
 * Todo es de servidor y funciona SIN JavaScript: el lateral es un formulario
 * GET cuya query ya está en la forma canónica (`consultaCanonica`), y cada
 * filtro, chip y página es un enlace normal. Las vistas filtradas no se
 * indexan (`metadataIndiceBlog`).
 */
export function IndiceBlog({
  ambito,
  pagina,
  listado,
  catalogo,
  categoria,
  busqueda,
}: {
  ambito: AmbitoBlog;
  pagina: number;
  listado: Extract<ResultadoListado<ArticuloLista>, { tipo: "listado" }>;
  catalogo: Catalogo<ArticuloLista>;
  categoria: { slug: string; nombre: string } | null;
  busqueda: string;
}) {
  const { elementos, total, totalSinFiltros, paginas, seleccion, facetas } = listado;
  const base = `${rutaDeBlog(ambito, 1)}/`;
  const hayFiltros = listado.filtrado || busqueda !== "";

  /** La página 1 con un cambio aplicado a la selección, conservando la búsqueda. */
  const enlace = (cambio: Cambio | null, conBusqueda = true) =>
    conConsulta(
      base,
      consultaCanonica(cambio ? aplicarCambio(seleccion, cambio) : seleccion, catalogo),
      conBusqueda ? consultaDeBusqueda(busqueda) : "",
    );
  const hrefPagina = (n: number) =>
    conConsulta(`${rutaDeBlog(ambito, n)}/`, listado.consulta, consultaDeBusqueda(busqueda));

  const chips = facetas.flatMap((f) =>
    f.opciones
      .filter((o) => o.activa)
      .map((o) => ({
        clave: `${f.clave}=${o.valor}`,
        etiqueta: o.etiqueta,
        href: enlace({ quitar: { clave: f.clave, valor: o.valor } }),
      })),
  );
  const categorias = facetas.find((f) => f.clave === "categoria");
  const nombreCategoria = categoria && categoria.nombre !== "Noticias" ? categoria.nombre : null;

  const migas = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Noticias", path: rutas.blog() },
    ...(nombreCategoria && categoria
      ? [{ nombre: nombreCategoria, path: rutas.categoriaBlog(categoria.slug) }]
      : []),
  ];

  return (
    <main className={marca.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(migas)} />
      <div className={marca.migas}>
        <Breadcrumbs items={migas} />
      </div>

      <HeroMarca
        vista={{
          linea1: "Partequipos",
          linea2: nombreCategoria ?? "Nuestro Blog",
          descripcion: "",
          fondo: null,
          logo: null,
        }}
        anclaSiguiente="blog-articulos"
        franja={false}
        bajaSinFoto
        indice
        etiquetaRaton="Ir a los artículos"
      />

      <div className={estilos.zona}>
        <aside className={estilos.lateral} aria-label="Buscar y filtrar el blog">
          <h2 className={estilos.tituloLateral}>Categorías</h2>
          <form method="get" action={base} className={estilos.formulario}>
            <div className={estilos.buscador}>
              <label htmlFor="blog-buscar" className="sr-only">
                Buscar en el blog
              </label>
              <input
                id="blog-buscar"
                type="search"
                name={CLAVE_BUSQUEDA}
                defaultValue={busqueda}
                maxLength={MAX_BUSQUEDA}
                placeholder="Buscar..."
                autoComplete="off"
              />
              <IconSearch aria-hidden="true" size={20} stroke={2} className={estilos.lupa} />
            </div>

            {categorias && categorias.opciones.length ? (
              <fieldset className={estilos.categorias}>
                <legend className="sr-only">Filtrar por categoría</legend>
                <ul>
                  {categorias.opciones.map((o) => (
                    <li key={o.valor}>
                      <label>
                        <input
                          type="checkbox"
                          name={categorias.clave}
                          value={o.valor}
                          defaultChecked={o.activa}
                        />
                        <span className={estilos.casilla} aria-hidden="true" />
                        <span>
                          {o.etiqueta}{" "}
                          <span className={estilos.cuenta} aria-hidden="true">
                            ({o.cuenta})
                          </span>
                          <span className="sr-only">
                            , {o.cuenta} {o.cuenta === 1 ? "artículo" : "artículos"}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            ) : null}

            <button type="submit" className={estilos.aplicar}>
              Aplicar
            </button>
          </form>
          {ambito.tipo === "categoria" ? (
            <p className={estilos.todas}>
              <Link href={`${rutas.blog()}/`}>Ver todas las categorías</Link>
            </p>
          ) : null}
        </aside>

        <section id="blog-articulos" className={estilos.principal} aria-label="Artículos del blog">
          <div className={estilos.barra}>
            <div className={estilos.activos}>
              <p className={estilos.resumen} aria-live="polite">
                {hayFiltros && total !== totalSinFiltros
                  ? `${total} de ${totalSinFiltros} artículos`
                  : `${total} ${total === 1 ? "artículo" : "artículos"}`}
              </p>
              {chips.length || busqueda ? (
                <ul className={estilos.chips} aria-label="Filtros activos">
                  {chips.map((c) => (
                    <li key={c.clave}>
                      <Link
                        href={c.href}
                        prefetch={false}
                        aria-label={`Quitar el filtro ${c.etiqueta}`}
                      >
                        {c.etiqueta}
                        <IconX aria-hidden="true" size={14} stroke={2.4} />
                      </Link>
                    </li>
                  ))}
                  {busqueda ? (
                    <li>
                      <Link
                        href={enlace(null, false)}
                        prefetch={false}
                        aria-label={`Quitar la búsqueda ${busqueda}`}
                      >
                        «{busqueda}»
                        <IconX aria-hidden="true" size={14} stroke={2.4} />
                      </Link>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
            {hayFiltros ? (
              <Link href={base} prefetch={false} className={estilos.limpiar}>
                Limpiar filtros
              </Link>
            ) : null}
          </div>

          {elementos.length === 0 ? (
            <p className={estilos.vacio}>
              {hayFiltros
                ? "No encontramos artículos con esos filtros. Prueba con otra palabra o limpia los filtros."
                : "Todavía no hay artículos publicados."}
            </p>
          ) : (
            <ul className={estilos.rejilla}>
              {elementos.map((a, i) => (
                <TarjetaArticulo key={a.id} articulo={a} prioridad={pagina === 1 && i < 3} />
              ))}
            </ul>
          )}

          {paginas > 1 ? (
            <nav aria-label="Paginación del blog" className={estilos.paginacion}>
              <ul>
                {pagina > 1 ? (
                  <li>
                    <Link
                      href={hrefPagina(pagina - 1)}
                      prefetch={false}
                      rel="prev"
                      aria-label="Página anterior"
                    >
                      ‹
                    </Link>
                  </li>
                ) : null}
                {paginasVisibles(pagina, paginas).map((n, i) =>
                  n === "…" ? (
                    <li key={`salto-${i}`} aria-hidden="true" className={estilos.salto}>
                      …
                    </li>
                  ) : (
                    <li key={n}>
                      {n === pagina ? (
                        <span aria-current="page" className={estilos.actual}>
                          {n}
                        </span>
                      ) : (
                        <Link href={hrefPagina(n)} prefetch={false} aria-label={`Página ${n}`}>
                          {n}
                        </Link>
                      )}
                    </li>
                  ),
                )}
                {pagina < paginas ? (
                  <li>
                    <Link
                      href={hrefPagina(pagina + 1)}
                      prefetch={false}
                      rel="next"
                      aria-label="Página siguiente"
                    >
                      ›
                    </Link>
                  </li>
                ) : null}
              </ul>
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  );
}

/**
 * La tarjeta de un artículo (también en «Artículos relacionados»): foto con
 * esquinas redondeadas, fecha y minutos de lectura, título, extracto de unos
 * 100 caracteres y «Leer». `Leer` y el título llevan al mismo sitio; el botón
 * dice a qué artículo con texto solo para lectores de pantalla.
 */
export function TarjetaArticulo({
  articulo,
  prioridad = false,
  nivel: Nivel = "h2",
}: {
  articulo: ArticuloLista;
  prioridad?: boolean;
  nivel?: "h2" | "h3";
}) {
  const href = `${rutas.articulo(articulo.slug)}/`;
  const { imagen } = articulo;
  return (
    <li className={estilos.tarjeta}>
      {imagen ? (
        <Link href={href} tabIndex={-1} aria-hidden="true" className={estilos.foto}>
          <Image
            src={imagen.url}
            alt=""
            fill
            sizes="(max-width: 767px) 92vw, (max-width: 1024px) 45vw, 270px"
            className={estilos.fotoImg}
            style={{ objectPosition: imagen.posicion }}
            priority={prioridad}
          />
        </Link>
      ) : null}
      <div className={estilos.contenido}>
        <p className={estilos.meta}>
          <time dateTime={articulo.fecha}>{fechaCorta(articulo.fecha)}</time>
          <span aria-hidden="true"> · </span>
          {articulo.minutos} min de lectura
        </p>
        <Nivel className={estilos.titulo}>
          <Link href={href}>{articulo.titulo}</Link>
        </Nivel>
        {articulo.extracto ? <p className={estilos.extracto}>{articulo.extracto}</p> : null}
        <Link href={href} className={estilos.leer}>
          Leer
          <span className="sr-only">: {articulo.titulo}</span>
          <IconArrowRight aria-hidden="true" size={16} stroke={2.6} />
        </Link>
      </div>
    </li>
  );
}
