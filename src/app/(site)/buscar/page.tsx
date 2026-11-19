import { IconArrowRight, IconBrandWhatsapp, IconSearch } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";

import { LONGITUD_MAXIMA, LONGITUD_MINIMA, normalizarConsulta } from "@/lib/buscador/consulta";
import { ETIQUETA_CLASE } from "@/lib/buscador/etiquetas";
import type { Clase, Estado, Faceta, Filtros } from "@/lib/buscador/motor";
import { buscarEnCatalogo } from "@/lib/buscador/servidor";
import { getCabecera } from "@/lib/queries/getCabecera";
import { getEmpresa } from "@/lib/queries/getSeo";
import { enlaceWhatsApp } from "@/lib/navegacion";

import estilos from "./buscar.module.css";

/**
 * RESULTADOS DE BÚSQUEDA: `/buscar/?q=…` (petición del cliente, diseño de Andrés, 2026-10-14;
 * CLAUDE.md §10.33 p.9). Desde el 2026-11-18 con el motor completo (`src/lib/buscador/`): sin
 * mayúsculas ni tildes, modelos escritos de cualquier forma, errores de escritura, sinónimos y
 * búsquedas compuestas («excavadora volvo usada»).
 *
 * - Chips por tipo de resultado con su número, y filtros por marca, tipo y estado (lateral en
 *   escritorio, panel desplegable en móvil). Todo son ENLACES: funciona sin JavaScript.
 * - `noindex, follow` y FUERA del sitemap (`RUTAS_FUERA_DEL_SITEMAP`).
 * - El `<title>` NO lleva lo que escribió el visitante.
 * - Dinámica por construcción (lee `searchParams`).
 */
type Props = {
  searchParams: Promise<{
    q?: string | string[];
    clase?: string;
    marca?: string;
    tipo?: string;
    estado?: string;
    p?: string;
  }>;
};

const POR_PAGINA = 24;
const POPULARES = [
  "Excavadora Hitachi",
  "Retroexcavadora",
  "Filtros Donaldson",
  "Tren de rodaje",
  "Lubricantes",
];
const CLASES = Object.keys(ETIQUETA_CLASE) as Clase[];

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const buscando = normalizarConsulta(q).estado !== "vacia";
  return {
    title: buscando ? "Resultados de la búsqueda | Partequipos" : "Buscar | Partequipos",
    description: "Busca maquinaria pesada, repuestos y noticias en Partequipos.",
    robots: { index: false, follow: true },
  };
}

/** La dirección de esta misma búsqueda con otros parámetros (vacío = quitar el filtro). */
function enlace(base: Record<string, string | undefined>, cambios: Record<string, string | null>) {
  const p = new URLSearchParams();
  const todo = { ...base, ...cambios, p: undefined };
  for (const [k, v] of Object.entries(todo)) if (v) p.set(k, v);
  return `/buscar/?${p.toString()}`;
}

function Filtro({
  titulo,
  campo,
  valores,
  actual,
  base,
}: {
  titulo: string;
  campo: string;
  valores: Faceta[];
  actual?: string;
  base: Record<string, string | undefined>;
}) {
  if (valores.length === 0) return null;
  return (
    <section aria-labelledby={`f-${campo}`} className={estilos.filtro}>
      <h3 id={`f-${campo}`} className={estilos.filtroTitulo}>
        {titulo}
      </h3>
      <ul className={estilos.filtroLista}>
        {valores.slice(0, 12).map((v) => {
          const activo = actual?.toLowerCase() === v.valor.toLowerCase();
          return (
            <li key={v.valor}>
              <Link
                href={enlace(base, { [campo]: activo ? null : v.valor })}
                className={estilos.filtroEnlace}
                aria-current={activo ? "true" : undefined}
                data-activo={activo ? "" : undefined}
              >
                <span>{v.valor}</span>
                <span className={estilos.cuenta}>{v.total}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default async function BuscarPage({ searchParams }: Props) {
  const sp = await searchParams;
  const consulta = normalizarConsulta(sp.q);
  const texto = consulta.estado === "vacia" ? "" : consulta.texto;

  const filtros: Filtros = {};
  if (sp.marca) filtros.marca = sp.marca.slice(0, 60);
  if (sp.tipo) filtros.tipo = sp.tipo.slice(0, 60);
  if (sp.estado === "nueva" || sp.estado === "usada") filtros.estado = sp.estado as Estado;
  if (sp.clase && (CLASES as string[]).includes(sp.clase)) filtros.clase = sp.clase as Clase;

  const r =
    consulta.estado === "valida" ? await buscarEnCatalogo(consulta.texto, filtros, 600) : null;
  // Los chips de tipo cuentan con los filtros de marca, tipo y estado, sin el de clase.
  const sinClase =
    r && filtros.clase && texto
      ? await buscarEnCatalogo(texto, { ...filtros, clase: undefined }, 1)
      : r;
  const pagina = Math.max(1, Number(sp.p) || 1);
  const visibles = r ? r.resultados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA) : [];
  const paginas = r ? Math.ceil(r.total / POR_PAGINA) : 0;

  const base = {
    q: texto || undefined,
    clase: filtros.clase,
    marca: filtros.marca,
    tipo: filtros.tipo,
    estado: filtros.estado,
  };

  // Sin resultados: WhatsApp con la búsqueda y las secciones del menú.
  const sinResultados = r !== null && r.total === 0;
  const empresa = sinResultados ? await getEmpresa() : null;
  const { enlaces, boton } = sinResultados ? await getCabecera() : { enlaces: [], boton: null };
  const secciones = boton ? [...enlaces, boton] : enlaces;
  const wa = empresa ? enlaceWhatsApp(empresa.whatsapp) : null;
  const linkWhatsApp = (() => {
    if (!wa) return null;
    try {
      const u = new URL(wa);
      u.searchParams.set("text", `Hola, busco: ${texto}`);
      return u.toString();
    } catch {
      return wa;
    }
  })();

  const hayFiltros = Boolean(filtros.marca || filtros.tipo || filtros.estado || filtros.clase);

  return (
    <main className={estilos.seccion}>
      <h1 className={`${estilos.titulo} texto-titulo-seccion`}>
        {texto && r && r.total > 0 ? `Resultados para «${texto}»` : "Buscar"}
      </h1>

      <form role="search" action="/buscar/" method="get" className={estilos.formulario}>
        <label htmlFor="buscar-q" className="sr-only">
          Buscar en el sitio
        </label>
        <input
          id="buscar-q"
          name="q"
          type="search"
          className={estilos.campo}
          defaultValue={texto}
          placeholder="Prueba con «Excavadora Hitachi», «ZX200» o «filtros Donaldson»"
          autoComplete="off"
          maxLength={LONGITUD_MAXIMA}
        />
        <button type="submit" className={`${estilos.boton} texto-etiqueta`}>
          <IconSearch aria-hidden="true" focusable="false" stroke={1.75} />
          Buscar
        </button>
      </form>

      {/* Región viva: el lector de pantalla anuncia el resultado de la búsqueda. */}
      <p role="status" className={estilos.estado}>
        {consulta.estado === "vacia"
          ? "Escribe lo que buscas: un equipo, un repuesto, un modelo o un tema."
          : consulta.estado === "corta"
            ? `Escribe al menos ${LONGITUD_MINIMA} letras para buscar.`
            : r && r.total === 0
              ? `No encontramos resultados para «${consulta.texto}».`
              : r
                ? `${r.total} ${r.total === 1 ? "resultado" : "resultados"} para «${consulta.texto}».${
                    r.completa ? "" : " Se muestran los que más se parecen."
                  }`
                : ""}
      </p>

      {r && r.detectado && (r.detectado.estado || r.detectado.marca) ? (
        <p className={estilos.detectado}>
          Entendimos:{" "}
          {[
            r.detectado.marca ? `marca «${r.detectado.marca}»` : null,
            r.detectado.estado ? `estado «${r.detectado.estado}»` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
          .
        </p>
      ) : null}

      {sinClase && sinClase.total > 0 ? (
        <nav aria-label="Tipos de resultado" className={estilos.chips}>
          <Link
            href={enlace(base, { clase: null })}
            className={estilos.chip}
            data-activo={!filtros.clase ? "" : undefined}
          >
            Todo <span className={estilos.cuenta}>{sinClase.total}</span>
          </Link>
          {CLASES.filter((c) => sinClase.porClase[c]).map((c) => (
            <Link
              key={c}
              href={enlace(base, { clase: c })}
              className={estilos.chip}
              data-activo={filtros.clase === c ? "" : undefined}
            >
              {ETIQUETA_CLASE[c]} <span className={estilos.cuenta}>{sinClase.porClase[c]}</span>
            </Link>
          ))}
        </nav>
      ) : null}

      {r && (r.total > 0 || hayFiltros) ? (
        <div className={estilos.cuerpo}>
          {sinClase &&
          (sinClase.marcas.length + sinClase.tipos.length + sinClase.estados.length > 0 ||
            hayFiltros) ? (
            <details className={estilos.filtros}>
              <summary className={estilos.filtrosResumen}>
                Filtros{hayFiltros ? " (activos)" : ""}
              </summary>
              <div className={estilos.filtrosCuerpo}>
                <Filtro
                  titulo="Estado"
                  campo="estado"
                  valores={sinClase.estados}
                  actual={filtros.estado}
                  base={base}
                />
                <Filtro
                  titulo="Marca"
                  campo="marca"
                  valores={sinClase.marcas}
                  actual={filtros.marca}
                  base={base}
                />
                <Filtro
                  titulo="Tipo"
                  campo="tipo"
                  valores={sinClase.tipos}
                  actual={filtros.tipo}
                  base={base}
                />
                {hayFiltros ? (
                  <Link href={enlace({ q: texto || undefined }, {})} className={estilos.quitar}>
                    Quitar filtros
                  </Link>
                ) : null}
              </div>
            </details>
          ) : null}

          <div className={estilos.resultados}>
            {r.total === 0 ? <p>No hay resultados con esos filtros.</p> : null}
            <ul className={estilos.rejilla}>
              {visibles.map((x) => (
                <li key={x.doc.id} className={estilos.tarjeta}>
                  <Link href={x.doc.href} className={estilos.tarjetaEnlace}>
                    <span className={estilos.tarjetaFoto} aria-hidden="true">
                      {x.doc.imagen ? (
                        // eslint-disable-next-line @next/next/no-img-element -- miniatura con medidas
                        <img
                          src={x.doc.imagen.url}
                          alt=""
                          width={x.doc.imagen.width}
                          height={x.doc.imagen.height}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <IconSearch size={28} stroke={1.25} />
                      )}
                    </span>
                    <span className={estilos.tarjetaTexto}>
                      <span className={estilos.etiqueta}>{ETIQUETA_CLASE[x.doc.clase]}</span>
                      <span className={estilos.tarjetaTitulo}>{x.doc.titulo}</span>
                      {x.doc.detalle ? (
                        <span className={estilos.resultadoDetalle}>{x.doc.detalle}</span>
                      ) : null}
                    </span>
                    <span className={estilos.tarjetaBoton}>
                      Ver más
                      <IconArrowRight aria-hidden="true" size={16} stroke={2.2} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {paginas > 1 ? (
              <nav aria-label="Páginas de resultados" className={estilos.paginas}>
                {pagina > 1 ? (
                  <Link href={`${enlace(base, {})}&p=${pagina - 1}`} rel="prev">
                    ← Anterior
                  </Link>
                ) : null}
                <span>
                  Página {pagina} de {paginas}
                </span>
                {pagina < paginas ? (
                  <Link href={`${enlace(base, {})}&p=${pagina + 1}`} rel="next">
                    Siguiente →
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </div>
        </div>
      ) : null}

      {sinResultados && !hayFiltros ? (
        <div className={estilos.vacio}>
          {r?.sugerencia ? (
            <p className={estilos.sugerencia}>
              ¿Quisiste decir{" "}
              <Link href={`/buscar/?q=${encodeURIComponent(r.sugerencia)}`}>{r.sugerencia}</Link>?
            </p>
          ) : null}
          <p className={estilos.seccionesTitulo}>Búsquedas populares</p>
          <ul className={estilos.chips}>
            {POPULARES.map((p) => (
              <li key={p}>
                <Link href={`/buscar/?q=${encodeURIComponent(p)}`} className={estilos.chip}>
                  {p}
                </Link>
              </li>
            ))}
          </ul>
          {linkWhatsApp ? (
            <a
              href={linkWhatsApp}
              className={estilos.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandWhatsapp aria-hidden="true" size={20} stroke={1.75} />
              Pregúntanos por WhatsApp
            </a>
          ) : null}
          {secciones.length > 0 ? (
            <nav aria-label="Secciones principales" className={estilos.secciones}>
              <p className={estilos.seccionesTitulo}>O entra por una sección:</p>
              <ul className={estilos.chips}>
                {secciones.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} className={estilos.chip}>
                      {s.etiqueta}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
