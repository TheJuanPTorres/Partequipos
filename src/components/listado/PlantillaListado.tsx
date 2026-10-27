import { IconAdjustmentsHorizontal, IconChevronDown, IconX } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Paginacion } from "@/components/catalog/filtros/Paginacion";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  chipsDe,
  conConsulta,
  enlaceCon,
  ordenesDe,
  type Catalogo,
  type ResultadoListado,
} from "@/lib/filtros";
import type { Animacion } from "@/lib/listado/animaciones";
import type { LogoMarca } from "@/lib/marca/logoMarca";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";

import { CambioDeVista } from "./CambioDeVista";
import { CategoriasListado } from "./CategoriasListado";
import { iconoDePestana } from "./iconos";
import estilos from "./listado.module.css";
import { NumeroAnimado } from "./NumeroAnimado";
import { PanelFiltrosListado } from "./PanelFiltrosListado";
import { TransicionCatalogo } from "./TransicionCatalogo";
import { ZonaCatalogo } from "./ZonaCatalogo";

/**
 * La plantilla «Categoría secundaria» de ux-9, COMÚN a los listados de
 * maquinaria nueva (índice y categorías, `ListadoNueva`) y de usada
 * (categorías y marcas, `ListadoUsados`; 2026-10-18, petición del cliente):
 * cabecera con migas y `<h1>`, pestañas opcionales, barra con el recuento, los
 * filtros elegidos, «Ordenar» y el conmutador lista/rejilla, el lateral
 * «Filtrar» y la lista de tarjetas (`TarjetaListado`) con su paginación.
 *
 * Los filtros son los del módulo común de C (`src/lib/filtros/`); aquí solo se
 * pintan. Todo de servidor salvo el conmutador (`CambioDeVista`).
 */

export type Miga = { nombre: string; path: string };
export type Pestana = {
  href: string;
  texto: string;
  activa: boolean;
  /** Marca discreta bajo el texto («Sin unidades por ahora» en las categorías de usados vacías). */
  nota?: string;
  /** Número de elementos de la pestaña (las categorías de usados con unidades). */
  cuenta?: number;
};

export function PlantillaListado<T>({
  migas,
  titulo,
  pagina,
  descripcion,
  enlaces = [],
  pestanas = [],
  etiquetaPestanas,
  pestanasEnLateral = false,
  navegacionCliente = false,
  animaciones = [],
  catalogo,
  listado,
  rutaDe,
  elemento,
  logoDeMarca,
  idLista,
  vacio,
  children,
}: {
  migas: Miga[];
  titulo: string;
  pagina: number;
  /** Texto bajo el `<h1>` (la descripción de la categoría o la marca). */
  descripcion?: string | null;
  /** Enlaces bajo el título (la misma marca en otras líneas). */
  enlaces?: { href: string; texto: string }[];
  pestanas?: Pestana[];
  etiquetaPestanas?: string;
  /**
   * Las pestañas, como lista vertical en la columna izquierda encima de
   * «Filtrar» (en móvil y tablet, una fila deslizable sobre «Filtrar»), y la
   * barra del recuento sobre el listado. Listados de usados (cliente, 2026-10-21).
   */
  pestanasEnLateral?: boolean;
  /**
   * Categorías, filtros, orden y paginación cambian solo el catálogo, sin
   * recargar ni volver arriba (`ZonaCatalogo`). Listados de usados (cliente, 2026-10-21).
   */
  navegacionCliente?: boolean;
  /**
   * Las animaciones del listado (`src/lib/listado/animaciones.ts`), solo con
   * `navegacionCliente`. Usados (dirección, 2026-10-21); nueva, ninguna.
   */
  animaciones?: Animacion[];
  catalogo: Catalogo<T>;
  listado: Extract<ResultadoListado<T>, { tipo: "listado" }>;
  /** Ruta de la página n, CON su barra final. */
  rutaDe: (n: number) => string;
  /** «equipo» / «unidad», para el recuento («12 equipos disponibles»). */
  elemento: { singular: string; plural: string };
  /** Logos de las opciones de la faceta «marca», por su valor. */
  logoDeMarca?: Map<string, LogoMarca>;
  idLista: string;
  /** Lo que se pinta si el listado no tiene nada (sin contar los filtros). */
  vacio: ReactNode;
  /** Las tarjetas (`<TarjetaListado>`), ya en su orden. */
  children: ReactNode;
}) {
  const { elementos, total, totalSinFiltros, paginas, seleccion, facetas, consulta } = listado;
  const rutaBase = rutaDe(1);
  const chips = chipsDe(rutaBase, catalogo, seleccion, facetas);
  const ordenes = ordenesDe(rutaBase, catalogo, seleccion);
  const ordenActual = ordenes.find((o) => o.activa) ?? ordenes[0];
  const disponibles = (n: number) =>
    `${n === 1 ? elemento.singular : elemento.plural} ${n === 1 ? "disponible" : "disponibles"}`;
  const anim = new Set(navegacionCliente ? animaciones : []);
  // El total va aparte: con la animación A5, cuenta hasta el valor nuevo.
  const restoRecuento =
    listado.filtrado && total !== totalSinFiltros
      ? ` de ${totalSinFiltros} ${disponibles(totalSinFiltros)}`
      : ` ${disponibles(total)}`;

  // Sin nada que listar, ni recuento ni orden: lo dice el estado vacío.
  const barra =
    totalSinFiltros > 0 ? (
      <div className={estilos.barra} data-catalogo-nav="">
        <p className={estilos.resumen} aria-live={navegacionCliente ? undefined : "polite"}>
          {chips.length ? <strong>Selección actual:</strong> : null}
          <span>
            {anim.has("A5") ? <NumeroAnimado valor={total} /> : total}
            {restoRecuento}
            {paginas > 1 ? ` · página ${pagina} de ${paginas}` : ""}
          </span>
        </p>
        <div className={estilos.acciones}>
          {chips.length ? (
            <>
              <ul className={estilos.chips} aria-label="Filtros elegidos">
                {chips.map((c) => (
                  <li key={c.clave} data-etiqueta-filtro={c.clave}>
                    <Link
                      href={c.href}
                      prefetch={false}
                      rel="nofollow"
                      className={estilos.chip}
                      aria-label={`Quitar el filtro ${c.etiqueta}`}
                    >
                      <IconX size={14} stroke={2.4} aria-hidden="true" />
                      {c.etiqueta}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={enlaceCon(rutaBase, catalogo, seleccion, { limpiar: true })}
                prefetch={false}
                rel="nofollow"
                className={estilos.limpiar}
              >
                <IconAdjustmentsHorizontal size={18} stroke={1.8} aria-hidden="true" />
                Limpiar filtros
              </Link>
            </>
          ) : null}
          {total > 1 && ordenActual ? (
            <details className={estilos.ordenar}>
              <summary>
                Ordenar
                <span className="sr-only">: {ordenActual.etiqueta}</span>
                <IconChevronDown size={18} stroke={2} aria-hidden="true" />
              </summary>
              <ul>
                {ordenes.map((o) => (
                  <li key={o.valor}>
                    <Link
                      href={o.href}
                      prefetch={false}
                      rel="nofollow"
                      aria-current={o.activa ? "true" : undefined}
                    >
                      {o.etiqueta}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          {elementos.length > 1 ? (
            <CambioDeVista idLista={idLista} recolocar={anim.has("A8")} />
          ) : null}
        </div>
      </div>
    ) : null;

  const catalogoPintado =
    totalSinFiltros === 0 ? (
      // Un texto, en el recuadro de siempre; un estado vacío diseñado (usados) trae su marco.
      typeof vacio === "string" ? (
        <p className={estilos.vacio}>{vacio}</p>
      ) : (
        vacio
      )
    ) : elementos.length === 0 ? (
      <div className={estilos.vacio} data-catalogo-nav="">
        <p>
          Ningún{elemento.singular === "unidad" ? "a" : ""} {elemento.singular} cumple estos
          filtros. Quita alguno para ver más.
        </p>
        <p>
          <Link
            href={enlaceCon(rutaBase, catalogo, seleccion, { limpiar: true })}
            prefetch={false}
            rel="nofollow"
          >
            Limpiar filtros
          </Link>
          {elemento.singular === "unidad" ? (
            <>
              {" o "}
              <Link href="/contactanos/">avísame cuando llegue una</Link>
            </>
          ) : null}
          .
        </p>
      </div>
    ) : (
      <ul id={idLista} className={estilos.tarjetas} data-vista="lista">
        {children}
      </ul>
    );

  const resultados = (
    <section aria-labelledby="listado-titulo" className={estilos.resultados}>
      <h2 id="listado-titulo" className="sr-only" tabIndex={-1}>
        {elemento.plural.charAt(0).toUpperCase() + elemento.plural.slice(1)}
      </h2>
      {anim.has("A2") ? (
        <>
          <TransicionCatalogo>{catalogoPintado}</TransicionCatalogo>
          {elementos.length ? <EsqueletoCatalogo /> : null}
        </>
      ) : (
        catalogoPintado
      )}
      <div data-catalogo-nav="">
        <Paginacion
          actual={pagina}
          total={paginas}
          hrefDe={(n) => conConsulta(rutaDe(n), consulta)}
        />
      </div>
    </section>
  );

  const listaLateral =
    pestanasEnLateral && pestanas.length ? (
      <CategoriasListado
        pestanas={pestanas}
        titulo={etiquetaPestanas ?? "Categorías"}
        elemento={elemento}
        deslizar={anim.has("A4")}
      />
    ) : null;

  const cuerpo = (
    <>
      {navegacionCliente && totalSinFiltros > 0 ? (
        // Anuncio de los resultados tras cada cambio en vivo; el nodo es el mismo entre cambios.
        <p className="sr-only" role="status">
          {total === 0
            ? `Ningún ${elemento.singular} cumple los filtros`
            : `${total} ${total === 1 ? elemento.singular : elemento.plural} ${total === 1 ? "disponible" : "disponibles"}`}
          {paginas > 1 ? `, página ${pagina} de ${paginas}` : ""}
        </p>
      ) : null}
      {listaLateral ? (
        <div className={estilos.lateral}>
          {listaLateral}
          {totalSinFiltros > 0 ? (
            <aside aria-label="Filtros">
              <PanelFiltrosListado
                accion={rutaBase}
                facetas={facetas}
                orden={seleccion.orden}
                ordenPorDefecto={catalogo.ordenes[0].valor}
                elemento={elemento}
                logoDeMarca={logoDeMarca}
                enVivo={navegacionCliente}
              />
            </aside>
          ) : null}
        </div>
      ) : totalSinFiltros > 0 ? (
        <aside aria-label="Filtros">
          <PanelFiltrosListado
            accion={rutaBase}
            facetas={facetas}
            orden={seleccion.orden}
            ordenPorDefecto={catalogo.ordenes[0].valor}
            elemento={elemento}
            logoDeMarca={logoDeMarca}
            enVivo={navegacionCliente}
          />
        </aside>
      ) : null}

      {pestanasEnLateral ? (
        <div className={estilos.columnaResultados} data-inicio-listado="">
          {barra}
          {resultados}
        </div>
      ) : (
        resultados
      )}
    </>
  );

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(migas)} />

      <header className={estilos.cabecera}>
        <div>
          <nav aria-label="Migas de pan" className={estilos.migas}>
            {migas.map((m, i) => (
              <span key={m.path}>
                {i > 0 ? " / " : null}
                {i < migas.length - 1 ? (
                  <Link href={`${m.path === "/" ? "" : m.path}/`}>{m.nombre}</Link>
                ) : (
                  <span aria-current="page">{m.nombre}</span>
                )}
              </span>
            ))}
          </nav>
          <h1 className={estilos.titulo}>
            {titulo}
            {pagina > 1 ? <small>Página {pagina}</small> : null}
          </h1>
          {descripcion ? <p className={estilos.descripcion}>{descripcion}</p> : null}
          {enlaces.length ? (
            <ul className={estilos.enlaces}>
              {enlaces.map((e) => (
                <li key={e.href}>
                  <Link href={e.href}>{e.texto}</Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      {pestanas.length && !pestanasEnLateral ? (
        <nav aria-label={etiquetaPestanas} className={estilos.pestanas}>
          <ul>
            {pestanas.map((p) => {
              const IconoPestana = iconoDePestana(p.texto);
              return (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    className={estilos.pestana}
                    aria-current={p.activa ? "page" : undefined}
                  >
                    <IconoPestana size={30} stroke={1.4} aria-hidden="true" />
                    {p.nota ? (
                      <span className={estilos.pestanaTexto}>
                        {p.texto}
                        <span className="sr-only">, </span>
                        <small className={estilos.pestanaNota}>{p.nota}</small>
                      </span>
                    ) : (
                      p.texto
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : (
        <div className={estilos.sinPestanas} />
      )}

      {pestanasEnLateral ? null : barra}

      {navegacionCliente ? (
        <ZonaCatalogo
          clave={conConsulta(rutaDe(pagina), consulta)}
          className={estilos.cuerpo}
          lateral={pestanasEnLateral}
          animaciones={[...anim]}
        >
          {cuerpo}
        </ZonaCatalogo>
      ) : (
        <div className={estilos.cuerpo} data-lateral={pestanasEnLateral ? "" : undefined}>
          {cuerpo}
        </div>
      )}
    </main>
  );
}

/**
 * Tarjetas «esqueleto» con la forma de las reales (en lista o en rejilla,
 * según la vista), encima del catálogo mientras llega uno nuevo que tarda
 * (animación A2; `ZonaCatalogo` las enseña pasados ~300 ms). Fuera del flujo:
 * no desplazan nada. Ocultas para los lectores de pantalla.
 */
function EsqueletoCatalogo() {
  return (
    <div className={estilos.esqueleto} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className={estilos.esqueletoTarjeta}>
          <span className={estilos.esqueletoFoto} />
          <span className={estilos.esqueletoDatos}>
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
      ))}
    </div>
  );
}
