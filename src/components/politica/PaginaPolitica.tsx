import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { RichText } from "@/components/layout/RichText";
import { Revelado } from "@/components/movimiento/Revelado";
import { BarraSeries } from "@/components/repuestos/BarraSeries";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { ZonaAnimada } from "@/components/repuestos/ZonaAnimada";
import { JsonLd } from "@/components/seo/JsonLd";
import { ANIMACIONES_POLITICA, etiquetaCorta } from "@/lib/politica/animaciones";
import type { Pagina } from "@/payload-types";
import { buildBreadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/jsonLd";

import marca from "@/components/repuestos/marca.module.css";

import estilos from "./politica.module.css";

type Seccion = NonNullable<Pagina["secciones"]>[number];

/** Donde lleva el icono del ratón de la cabecera: el selector (o la primera sección). */
const ANCLA_INICIO = "politicas";

/**
 * LA PÁGINA DE GARANTÍAS (`/politica-de-garantia-de-repuestos/`, dirección, 2026-10-23): la
 * cabecera baja de «Trabaja con nosotros» (#336) con el título de la página y su alto reservado,
 * y cada «Sección con ancla» (hoy, garantía y devolución, cada una con su visor de PDF) con su
 * título de sección. Las mejoras V1–V4 llevan su interruptor (`ANIMACIONES_POLITICA`): su CSS
 * cuelga de `[data-anim~="V…"]` de `ZonaAnimada`.
 *
 * Los visores, los PDF, el SEO y la URL no cambian: el contenido de cada sección se pinta con el
 * mismo `RichText` de siempre. Sin JavaScript, todo se ve y el selector son anclas.
 */
export function PaginaPolitica({
  titulo,
  entradilla,
  contenido,
  secciones,
  migas,
}: {
  titulo: string;
  entradilla?: string | null;
  contenido?: unknown;
  secciones: Seccion[];
  migas: BreadcrumbItem[];
}) {
  const conSelector = secciones.length > 1;
  return (
    <main className={`${marca.pagina} ${estilos.pagina}`}>
      <JsonLd data={buildBreadcrumbJsonLd(migas)} />
      <div className={marca.migas}>
        <Breadcrumbs items={migas} />
      </div>

      <ZonaAnimada
        interruptores={ANIMACIONES_POLITICA}
        permitirUrl={process.env.VERCEL_ENV !== "production"}
        entrada="V2"
      >
        <HeroMarca
          vista={{
            antetitulo: "Partequipos",
            linea1: titulo,
            linea2: "",
            descripcion: "",
            fondo: null,
            logo: null,
          }}
          anclaSiguiente={ANCLA_INICIO}
          franja={false}
          indice
          bajo
          reservarTitulo
        />

        <div id={ANCLA_INICIO} className={estilos.cuerpo}>
          {entradilla ? <p className={estilos.entradilla}>{entradilla}</p> : null}
          {contenido ? (
            <div className={estilos.contenido}>
              <RichText data={contenido} />
            </div>
          ) : null}

          {conSelector ? (
            <>
              {/* V3: el selector. Sin V3, el índice de siempre. */}
              <BarraSeries
                series={secciones.map((s) => ({ ancla: s.ancla, titulo: etiquetaCorta(s.titulo) }))}
                etiqueta="Secciones de esta página"
                entrada={false}
                className={estilos.selector}
              />
              <nav className={estilos.indice} aria-labelledby="indice-heading">
                <h2 id="indice-heading" className={estilos.indiceTitulo}>
                  En esta página
                </h2>
                <ul>
                  {secciones.map((s) => (
                    <li key={s.ancla}>
                      <a href={`#${s.ancla}`}>{s.titulo}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            </>
          ) : null}

          {/* Las anclas son secciones de ESTA página, no rutas propias. */}
          {secciones.map((s) => (
            <section
              key={s.ancla}
              id={s.ancla}
              className={estilos.seccion}
              aria-labelledby={`${s.ancla}-titulo`}
            >
              {/* Con el alto reservado (CLS): la copia invisible va en `data-reserva`. */}
              <div className={estilos.titulo} data-reserva={s.titulo}>
                <Revelado
                  como="h2"
                  id={`${s.ancla}-titulo`}
                  texto={s.titulo}
                  ritmo="titulo"
                  className={estilos.heredado}
                />
              </div>
              {/* V2: la lista de un elemento que entra al llegar (`ZonaAnimada`). */}
              <div data-entrada="">
                <div className={estilos.marco}>
                  <RichText data={s.contenido} />
                </div>
              </div>
            </section>
          ))}
        </div>
      </ZonaAnimada>
    </main>
  );
}
