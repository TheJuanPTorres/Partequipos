import { IconArrowRight, IconSearch } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";

import { LONGITUD_MAXIMA, LONGITUD_MINIMA, normalizarConsulta } from "@/lib/buscador/consulta";
import { buscar, type GrupoBusqueda } from "@/lib/queries/getBusqueda";
import { getCabecera } from "@/lib/queries/getCabecera";

import estilos from "./buscar.module.css";

/**
 * RESULTADOS DE BÚSQUEDA: `/buscar/?q=…` (petición del cliente, diseño de
 * Andrés, 2026-10-14; CLAUDE.md §10.33 p.9). Formulario GET que funciona sin
 * JavaScript: el de aquí, el de la cabecera y el del pie envían a esta página.
 *
 * - `noindex, follow` y FUERA del sitemap (`RUTAS_FUERA_DEL_SITEMAP`): una
 *   página por cada texto que alguien escriba no es contenido que indexar.
 * - El `<title>` NO lleva lo que escribió el visitante: un texto ajeno dentro
 *   del título de una página del sitio no aporta nada y no se refleja.
 * - Dinámica por construcción (lee `searchParams`).
 */
export const metadata: Metadata = {
  title: "Buscar | Partequipos",
  description: "Busca maquinaria pesada, repuestos y noticias en Partequipos.",
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ q?: string | string[] }> };

const GRUPOS: { clave: "nuevos" | "usados" | "modelos" | "articulos"; titulo: string }[] = [
  { clave: "nuevos", titulo: "Maquinaria nueva" },
  { clave: "usados", titulo: "Maquinaria usada" },
  { clave: "modelos", titulo: "Repuestos" },
  { clave: "articulos", titulo: "Noticias" },
];

function Grupo({ clave, titulo, grupo }: { clave: string; titulo: string; grupo: GrupoBusqueda }) {
  if (grupo.items.length === 0) return null;
  return (
    <section aria-labelledby={`grupo-${clave}`} className={estilos.grupo}>
      <h2 id={`grupo-${clave}`} className={estilos.grupoTitulo}>
        {titulo} <span className={estilos.cuenta}>({grupo.total})</span>
      </h2>
      <ul className={estilos.lista}>
        {grupo.items.map((r) => (
          <li key={`${r.href}-${r.id}`}>
            <Link href={r.href} className={estilos.resultado}>
              <span className={estilos.resultadoTexto}>
                <span className={estilos.resultadoTitulo}>{r.titulo}</span>
                {r.detalle ? <span className={estilos.resultadoDetalle}>{r.detalle}</span> : null}
              </span>
              <IconArrowRight aria-hidden="true" focusable="false" stroke={1.75} />
            </Link>
          </li>
        ))}
      </ul>
      {grupo.total > grupo.items.length ? (
        <p className={estilos.mas}>
          Se muestran {grupo.items.length} de {grupo.total}. Afina la búsqueda para ver el resto.
        </p>
      ) : null}
    </section>
  );
}

export default async function BuscarPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const consulta = normalizarConsulta(q);
  const texto = consulta.estado === "vacia" ? "" : consulta.texto;
  const resultados = consulta.estado === "valida" ? await buscar(consulta.texto) : null;
  const total = resultados ? GRUPOS.reduce((suma, g) => suma + resultados[g.clave].total, 0) : 0;

  // Sin resultados se ofrecen las secciones del menú (global `cabecera` del panel).
  const { enlaces, boton } =
    resultados && total === 0 ? await getCabecera() : { enlaces: [], boton: null };
  const secciones = boton ? [...enlaces, boton] : enlaces;

  return (
    <main className={estilos.seccion}>
      <h1 className={`${estilos.titulo} texto-titulo-seccion`}>Buscar</h1>

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
          placeholder="Escribe los términos de búsqueda…"
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
          ? "Escribe lo que buscas: un equipo, un repuesto o un tema."
          : consulta.estado === "corta"
            ? `Escribe al menos ${LONGITUD_MINIMA} letras para buscar.`
            : total === 0
              ? `No encontramos resultados para «${consulta.texto}».`
              : `${total} ${total === 1 ? "resultado" : "resultados"} para «${consulta.texto}».`}
      </p>

      {resultados && total > 0 ? (
        <div className={estilos.grupos}>
          {GRUPOS.map((g) => (
            <Grupo key={g.clave} clave={g.clave} titulo={g.titulo} grupo={resultados[g.clave]} />
          ))}
        </div>
      ) : null}

      {resultados && total === 0 && secciones.length > 0 ? (
        <nav aria-label="Secciones principales" className={estilos.secciones}>
          <p className={estilos.seccionesTitulo}>
            Prueba con otra palabra o entra por una sección:
          </p>
          <ul className={estilos.lista}>
            {secciones.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className={estilos.resultado}>
                  <span className={estilos.resultadoTitulo}>{s.etiqueta}</span>
                  <IconArrowRight aria-hidden="true" focusable="false" stroke={1.75} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </main>
  );
}
