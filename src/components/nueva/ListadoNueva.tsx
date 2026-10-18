import {
  IconAdjustmentsHorizontal,
  IconBackhoe,
  IconBolt,
  IconBulldozer,
  IconChevronDown,
  IconEngine,
  IconEye,
  IconFileDescription,
  IconFilter,
  IconPlus,
  IconTools,
  IconTractor,
  IconTruckLoading,
  IconWeight,
  IconX,
  type Icon,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { Paginacion } from "@/components/catalog/filtros/Paginacion";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  chipsDe,
  conConsulta,
  enlaceCon,
  ordenesDe,
  type FacetaPintada,
  type ResultadoListado,
} from "@/lib/filtros";
import { CATALOGO_NUEVA } from "@/lib/nueva/filtros";
import type { AmbitoNueva } from "@/lib/nueva/listado";
import type { EquipoNuevoListado, FotoDeTarjeta } from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";

import { CambioDeVista } from "./CambioDeVista";
import estilos from "./listado.module.css";

/**
 * El listado de maquinaria NUEVA con la plantilla «Categoría secundaria» de
 * ux-9: el índice de nueva y cada categoría, una página cada vez
 * (`src/lib/nueva/listado.ts`). Los filtros son los del módulo común de C
 * (`src/lib/filtros/`); aquí solo se pintan con el aspecto de ux-9.
 *
 * Todo de servidor salvo el conmutador lista/rejilla (`CambioDeVista`). El
 * panel de filtros es un formulario GET, sin JavaScript, como el de C.
 */

/** Icono de cada pestaña (presentación, como los iconos del menú del panel). */
const ICONO_PESTANA: Record<string, Icon> = {
  Excavadoras: IconBackhoe,
  Cargadores: IconTruckLoading,
  Compactadores: IconTractor,
  Aditamentos: IconTools,
  Miniexcavadoras: IconBackhoe,
};

/**
 * Tamaño en que se pinta la foto de la tarjeta, para que el optimizador sirva
 * la que toca (medición de C, 2026-10-14). La foto va con `contain` en una
 * caja que, desde 640 px de pantalla, no pasa de 343 px (columna de 391 px
 * menos 48 de relleno; entre 640 y 1024, unos 341). Por debajo de 640, la
 * tarjeta ocupa la columna: pantalla − 100 px (márgenes y relleno). La rejilla
 * pinta más pequeño, así que también queda cubierta.
 * Sin `sizes`, con un ancho fijo de 420, se pedía w=640 (y w=1080 en 2×) en
 * cualquier pantalla.
 */
const SIZES_FOTO = "(min-width: 640px) 343px, calc(100vw - 100px)";
/** Solo para la proporción de la foto: el ancho que se pide lo decide `sizes`. */
const ANCHO_FOTO = 384;
const ID_TARJETAS = "tarjetas-nueva";

export function ListadoNueva({
  ambito,
  pagina,
  listado,
}: {
  ambito: AmbitoNueva;
  pagina: number;
  listado: Extract<ResultadoListado<EquipoNuevoListado>, { tipo: "listado" }>;
}) {
  const { elementos, total, totalSinFiltros, paginas, seleccion, facetas, consulta } = listado;
  const rutaDe = (n: number) => `${ambito.ruta(n)}/`;
  const rutaBase = rutaDe(1);

  const migas = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Maquinaria pesada nueva", path: rutas.nueva() },
    ...(ambito.tipo === "categoria" && ambito.slug
      ? [{ nombre: ambito.nombre, path: rutas.categoriaNueva(ambito.slug) }]
      : []),
  ];
  if (pagina > 1) migas.push({ nombre: `Página ${pagina}`, path: ambito.ruta(pagina) });

  // Los logos de las marcas salen de los propios equipos (la marca los lleva).
  const logoDeMarca = new Map<string, FotoDeTarjeta>();
  for (const e of ambito.equipos) {
    if (e.marcaRef && e.logo) logoDeMarca.set(e.marcaRef.slug, e.logo);
  }
  const chips = chipsDe(rutaBase, CATALOGO_NUEVA, seleccion, facetas);
  const ordenes = ordenesDe(rutaBase, CATALOGO_NUEVA, seleccion);
  const ordenActual = ordenes.find((o) => o.activa) ?? ordenes[0];

  const recuento =
    listado.filtrado && total !== totalSinFiltros
      ? `${total} de ${totalSinFiltros} ${totalSinFiltros === 1 ? "equipo disponible" : "equipos disponibles"}`
      : `${total} ${total === 1 ? "equipo disponible" : "equipos disponibles"}`;

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
            {ambito.titulo}
            {pagina > 1 ? <small>Página {pagina}</small> : null}
          </h1>
        </div>
      </header>

      <nav aria-label="Categorías de maquinaria nueva" className={estilos.pestanas}>
        <ul>
          {ambito.pestanas.map((p) => {
            const IconoPestana = ICONO_PESTANA[p.texto] ?? IconBulldozer;
            return (
              <li key={p.href}>
                <Link
                  href={p.href}
                  className={estilos.pestana}
                  aria-current={p.activa ? "page" : undefined}
                >
                  <IconoPestana size={30} stroke={1.4} aria-hidden="true" />
                  {p.texto}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={estilos.barra}>
        <p className={estilos.resumen} aria-live="polite">
          {chips.length ? <strong>Selección actual:</strong> : null}
          <span>
            {recuento}
            {paginas > 1 ? ` · página ${pagina} de ${paginas}` : ""}
          </span>
        </p>
        <div className={estilos.acciones}>
          {chips.length ? (
            <>
              <ul className={estilos.chips} aria-label="Filtros elegidos">
                {chips.map((c) => (
                  <li key={c.clave}>
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
                href={enlaceCon(rutaBase, CATALOGO_NUEVA, seleccion, { limpiar: true })}
                prefetch={false}
                rel="nofollow"
                className={estilos.limpiar}
              >
                <IconAdjustmentsHorizontal size={18} stroke={1.8} aria-hidden="true" />
                Limpiar filtro
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
          {elementos.length > 1 ? <CambioDeVista idLista={ID_TARJETAS} /> : null}
        </div>
      </div>

      <div className={estilos.cuerpo}>
        {totalSinFiltros > 0 ? (
          <aside aria-label="Filtros">
            <PanelFiltrosNueva
              accion={rutaBase}
              facetas={facetas}
              orden={seleccion.orden}
              logoDeMarca={logoDeMarca}
            />
          </aside>
        ) : null}

        <section aria-labelledby="equipos-titulo" className={estilos.resultados}>
          <h2 id="equipos-titulo" className="sr-only">
            Equipos
          </h2>
          {elementos.length === 0 ? (
            <p className={estilos.vacio}>
              {totalSinFiltros === 0
                ? "Todavía no hay equipos publicados aquí."
                : "Ningún equipo cumple estos filtros. Quita alguno para ver más."}
            </p>
          ) : (
            <ul id={ID_TARJETAS} className={estilos.tarjetas} data-vista="lista">
              {elementos.map((e, i) => (
                <TarjetaEquipo key={e.id} equipo={e} prioridad={i === 0} />
              ))}
            </ul>
          )}
          <Paginacion
            actual={pagina}
            total={paginas}
            hrefDe={(n) => conConsulta(rutaDe(n), consulta)}
          />
        </section>
      </div>
    </main>
  );
}

/**
 * El lateral «Filtrar» con el aspecto de ux-9: marcas con logo y casilla,
 * tramos de peso en píldoras y «Tipo de equipo» y «Modelo» en acordeones.
 * Es un formulario GET con casillas, sin JavaScript (como `PanelFiltros` de
 * C): lo que envía ya está en la forma canónica de la URL.
 */
function PanelFiltrosNueva({
  accion,
  facetas,
  orden,
  logoDeMarca,
}: {
  accion: string;
  facetas: FacetaPintada[];
  orden: string;
  logoDeMarca: Map<string, FotoDeTarjeta>;
}) {
  if (!facetas.length) return null;
  const faceta = (clave: string) => facetas.find((f) => f.clave === clave);
  const marcas = faceta("marca");
  const peso = faceta("peso");
  const acordeones = [
    { f: faceta("tipo"), icono: IconBulldozer },
    { f: faceta("modelo"), icono: IconFileDescription },
  ];
  const cuentaSr = (n: number) => `, ${n} ${n === 1 ? "equipo" : "equipos"}`;
  return (
    <details className={estilos.filtros}>
      <summary>
        Filtrar
        <IconFilter size={22} stroke={1.6} aria-hidden="true" />
      </summary>
      <form method="get" action={accion}>
        {marcas?.opciones.length ? (
          <fieldset className={estilos.grupo}>
            <legend>{marcas.etiqueta}</legend>
            <ul className={estilos.marcas}>
              {marcas.opciones.map((o) => {
                const logo = logoDeMarca.get(o.valor);
                return (
                  <li key={o.valor}>
                    <label className={estilos.marca}>
                      {logo?.url && logo.width && logo.height ? (
                        <Image
                          src={logo.url}
                          alt=""
                          width={112}
                          height={Math.round((112 * logo.height) / logo.width)}
                          className={estilos.marcaLogo}
                        />
                      ) : null}
                      <span>
                        {o.etiqueta}{" "}
                        <span className={estilos.cuenta} aria-hidden="true">
                          ({o.cuenta})
                        </span>
                        <span className="sr-only">{cuentaSr(o.cuenta)}</span>
                      </span>
                      <input
                        type="checkbox"
                        name={marcas.clave}
                        value={o.valor}
                        defaultChecked={o.activa}
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ) : null}

        {peso?.opciones.length ? (
          <fieldset className={estilos.grupo}>
            <legend>{peso.etiqueta} (t)</legend>
            <ul className={estilos.tramos}>
              {peso.opciones.map((o) => (
                <li key={o.valor}>
                  <label className={estilos.tramo}>
                    <input
                      type="checkbox"
                      name={peso.clave}
                      value={o.valor}
                      defaultChecked={o.activa}
                    />
                    {o.etiqueta}
                    <span className={estilos.cuenta} aria-hidden="true">
                      ({o.cuenta})
                    </span>
                    <span className="sr-only">{cuentaSr(o.cuenta)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : null}

        {acordeones.map(({ f, icono: IconoAcordeon }) =>
          f?.opciones.length ? (
            <details
              key={f.clave}
              className={estilos.acordeon}
              open={f.opciones.some((o) => o.activa)}
            >
              <summary>
                <span className={estilos.icono}>
                  <IconoAcordeon size={18} stroke={1.8} aria-hidden="true" />
                </span>
                {f.etiqueta}
                <IconPlus size={16} className={estilos.mas} aria-hidden="true" />
              </summary>
              <fieldset className={estilos.grupo} style={{ marginTop: 0 }}>
                <legend className="sr-only">{f.etiqueta}</legend>
                <ul>
                  {f.opciones.map((o) => (
                    <li key={o.valor}>
                      <label>
                        <input
                          type="checkbox"
                          name={f.clave}
                          value={o.valor}
                          defaultChecked={o.activa}
                        />
                        {o.etiqueta}
                        <span className={estilos.cuenta} aria-hidden="true">
                          ({o.cuenta})
                        </span>
                        <span className="sr-only">{cuentaSr(o.cuenta)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            </details>
          ) : null,
        )}

        {orden !== CATALOGO_NUEVA.ordenes[0].valor ? (
          <input type="hidden" name="orden" value={orden} />
        ) : null}
        <button type="submit" className={estilos.aplicar}>
          Aplicar filtros
        </button>
      </form>
    </details>
  );
}

/** Una tarjeta de equipo: en lista (por defecto) o en rejilla, según `data-vista`. */
function TarjetaEquipo({ equipo, prioridad }: { equipo: EquipoNuevoListado; prioridad: boolean }) {
  const { foto, logo, datos } = equipo;
  const titulo = [equipo.tipoRef?.nombre, equipo.marcaRef?.nombre].filter(Boolean).join(" ");
  const filas: { icono: Icon; texto: string; valor: string | null }[] = [
    { icono: IconWeight, texto: "Peso operativo", valor: datos.peso },
    { icono: IconBolt, texto: "Potencia", valor: datos.potencia },
    { icono: IconEngine, texto: "Motor", valor: datos.motor },
  ];
  return (
    <li className={estilos.tarjeta}>
      <div className={estilos.foto}>
        {foto?.url && foto.width && foto.height ? (
          <Image
            src={foto.url}
            alt={foto.alt || equipo.nombre}
            width={ANCHO_FOTO}
            height={Math.round((ANCHO_FOTO * foto.height) / foto.width)}
            sizes={SIZES_FOTO}
            priority={prioridad}
          />
        ) : null}
        {logo?.url && logo.width && logo.height ? (
          <span className={estilos.logo}>
            <Image
              src={logo.url}
              alt={equipo.marcaRef?.nombre ?? ""}
              width={96}
              height={Math.round((96 * logo.height) / logo.width)}
            />
          </span>
        ) : null}
      </div>
      <div className={estilos.datos}>
        <h3 className={estilos.nombre}>
          <Link href={equipo.href}>{titulo || equipo.nombre}</Link>
        </h3>
        {equipo.codigo ? <p className={estilos.modelo}>{equipo.codigo}</p> : null}
        <hr className={estilos.linea} />
        <ul className={estilos.lista}>
          {filas
            .filter((f) => f.valor)
            .map(({ icono: IconoFila, texto, valor }) => (
              <li key={texto}>
                <span className={estilos.circulo}>
                  <IconoFila size={16} stroke={1.8} aria-hidden="true" />
                </span>
                {texto}: {valor}
              </li>
            ))}
        </ul>
        {/* Como ux-9: en lista, «Ver producto» y «Cotizar»; en rejilla, «Ver más» y «Ficha técnica». */}
        <div className={estilos.botones}>
          <Link
            href={equipo.href}
            className={`${estilos.boton} ${estilos.botonRojo} ${estilos.soloLista}`}
          >
            <IconEye size={18} stroke={1.8} aria-hidden="true" />
            Ver producto<span className="sr-only">: {equipo.nombre}</span>
          </Link>
          <Link
            href={`${equipo.href}#cotizar`}
            className={`${estilos.boton} ${estilos.botonNegro} ${estilos.soloLista}`}
          >
            Cotizar<span className="sr-only">: {equipo.nombre}</span>
          </Link>
          <Link
            href={equipo.href}
            className={`${estilos.boton} ${estilos.botonRojo} ${estilos.soloRejilla}`}
          >
            Ver más<span className="sr-only">: {equipo.nombre}</span>
          </Link>
          {equipo.pdf ? (
            <a
              href={equipo.pdf}
              className={`${estilos.boton} ${estilos.botonNegro} ${estilos.soloRejilla}`}
            >
              <IconFileDescription size={18} stroke={1.8} aria-hidden="true" />
              Ficha técnica<span className="sr-only"> de {equipo.nombre} (PDF)</span>
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}
