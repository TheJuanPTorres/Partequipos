import { IconArrowRight, IconSearch } from "@tabler/icons-react";
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
import type { AnimacionBlog } from "@/lib/animacionesBlog";
import { rutas } from "@/lib/routes";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { paginasVisibles } from "@/lib/usados/paginacion";

import { fechaBreve } from "./fecha";
import estilos from "./indiceBlog.module.css";
import { ZonaBlog } from "./ZonaBlog";

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
  activas,
}: {
  ambito: AmbitoBlog;
  pagina: number;
  listado: Extract<ResultadoListado<ArticuloLista>, { tipo: "listado" }>;
  catalogo: Catalogo<ArticuloLista>;
  categoria: { slug: string; nombre: string } | null;
  busqueda: string;
  /** Las mejoras N1–N4 que se pintan (`ANIMACIONES_BLOG`, y `?anim=` en un preview). */
  activas: AnimacionBlog[];
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

  const categorias = facetas.find((f) => f.clave === "categoria");
  // Las pastillas de categoría, solo si hay más de una.
  const pastillas = categorias && categorias.opciones.length > 1 ? categorias.opciones : null;
  // N1: el más reciente, grande arriba, solo en la primera página y sin búsqueda ni filtros.
  const conDestacado = activas.includes("N1") && pagina === 1 && !hayFiltros;
  const destacado = conDestacado ? (elementos[0] ?? null) : null;
  const resto = destacado ? elementos.slice(1) : elementos;
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

      <ZonaBlog clave={`${base}|${pagina}|${listado.consulta}|${busqueda}`} activas={activas}>
        <div className={estilos.zona}>
          <section
            id="blog-articulos"
            className={estilos.principal}
            aria-label="Artículos del blog"
          >
            <div className={estilos.barra}>
              <p className={estilos.resumen} aria-live="polite">
                {hayFiltros && total !== totalSinFiltros
                  ? `${total} de ${totalSinFiltros} artículos`
                  : `${total} ${total === 1 ? "artículo" : "artículos"}`}
              </p>

              <form
                method="get"
                action={base}
                role="search"
                aria-label="Buscar en el blog"
                data-blog-buscar=""
                className={estilos.buscador}
              >
                {/* Sin JavaScript, la categoría elegida viaja con la búsqueda. */}
                {categorias?.opciones
                  .filter((o) => o.activa)
                  .map((o) => (
                    <input key={o.valor} type="hidden" name={categorias.clave} value={o.valor} />
                  ))}
                <label htmlFor="blog-buscar" className="sr-only">
                  Buscar en el blog
                </label>
                <input
                  id="blog-buscar"
                  type="search"
                  name={CLAVE_BUSQUEDA}
                  data-blog-buscar-campo=""
                  defaultValue={busqueda}
                  maxLength={MAX_BUSQUEDA}
                  placeholder="Buscar artículos…"
                  autoComplete="off"
                />
                <button type="submit" className={estilos.lupa} aria-label="Buscar">
                  <IconSearch aria-hidden="true" size={18} stroke={2.2} />
                </button>
              </form>

              {hayFiltros ? (
                <Link href={base} prefetch={false} className={estilos.limpiar} data-blog-nav="">
                  Limpiar filtros
                </Link>
              ) : null}
            </div>

            {pastillas ? (
              <ul className={estilos.pastillas} aria-label="Categorías">
                <li>
                  <Link
                    href={enlace({ limpiar: true })}
                    prefetch={false}
                    data-blog-nav=""
                    aria-current={pastillas.every((o) => !o.activa) ? "true" : undefined}
                  >
                    Todas
                  </Link>
                </li>
                {pastillas.map((o) => (
                  <li key={o.valor}>
                    <Link
                      href={enlace({ alternar: { clave: "categoria", valor: o.valor } })}
                      prefetch={false}
                      data-blog-nav=""
                      aria-current={o.activa ? "true" : undefined}
                    >
                      {o.etiqueta}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            {elementos.length === 0 ? (
              <p className={estilos.vacio}>
                {hayFiltros
                  ? "No encontramos artículos con esos filtros. Prueba con otra palabra o limpia los filtros."
                  : "Todavía no hay artículos publicados."}
              </p>
            ) : (
              <>
                {destacado ? (
                  <ul className={estilos.destacadaLista} data-blog-tarjetas="">
                    <TarjetaArticulo articulo={destacado} prioridad destacada />
                  </ul>
                ) : null}
                {resto.length ? (
                  <ul className={estilos.rejilla} data-blog-tarjetas="">
                    {resto.map((a, i) => (
                      <TarjetaArticulo
                        key={a.id}
                        articulo={a}
                        prioridad={pagina === 1 && i < 3 && !destacado}
                      />
                    ))}
                  </ul>
                ) : null}
              </>
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
      </ZonaBlog>
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
  destacada = false,
}: {
  articulo: ArticuloLista;
  prioridad?: boolean;
  nivel?: "h2" | "h3";
  /** N1: la tarjeta grande de arriba. */
  destacada?: boolean;
}) {
  const href = `${rutas.articulo(articulo.slug)}/`;
  const { imagen } = articulo;
  return (
    <li className={`${estilos.tarjeta} ${destacada ? estilos.destacada : ""}`}>
      {imagen ? (
        <div className={estilos.fotoCaja}>
          <Link href={href} tabIndex={-1} aria-hidden="true" className={estilos.foto}>
            <Image
              src={imagen.url}
              alt=""
              fill
              sizes={
                destacada
                  ? "(max-width: 767px) 92vw, (max-width: 1024px) 90vw, 640px"
                  : "(max-width: 767px) 92vw, (max-width: 1024px) 45vw, 380px"
              }
              className={estilos.fotoImg}
              style={{ objectPosition: imagen.posicion }}
              priority={prioridad}
            />
          </Link>
          {/* N4: la categoría sobre la foto (el CSS la oculta si la mejora está apagada). */}
          {articulo.categoria ? (
            <span className={estilos.etiqueta}>{articulo.categoria.nombre}</span>
          ) : null}
        </div>
      ) : null}
      <div className={estilos.contenido}>
        <p className={estilos.meta}>
          <time dateTime={articulo.fecha}>{fechaBreve(articulo.fecha)}</time>
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          {articulo.minutos} min<span className="sr-only"> de lectura</span>
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
