import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { RichText } from "@/components/layout/RichText";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { JsonLd } from "@/components/seo/JsonLd";
import type { Pagina } from "@/payload-types";
import type { ImagenLista } from "@/lib/utils/relations";
import { buildBreadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/jsonLd";

import marca from "@/components/repuestos/marca.module.css";

import estilos from "./paginaTexto.module.css";

type Seccion = NonNullable<Pagina["secciones"]>[number];

const ANCLA_CONTENIDO = "contenido";

/**
 * LA PÁGINA DE SOLO TEXTO (tanda 26, tarea 6, opción (a) de dirección; pendiente del visto bueno de
 * Juan Pablo): toda página sin bloques que no tenga plantilla propia (las legales y las páginas
 * nuevas: campañas, avisos…). Es la cabecera baja de la página de garantías (`PaginaPolitica`,
 * la de «Trabaja con nosotros», #336), con su «Foto de fondo del encabezado» opcional, y el texto
 * en una tarjeta con la tipografía y los colores del kit de Andrés (tokens de `globals.css`).
 *
 * El texto lo pinta el `RichText` de siempre (títulos h2–h4, listas, citas, enlaces e imágenes con
 * su texto alternativo); los estilos solo cuelgan de las etiquetas, así que sirve para lo que ya
 * hay escrito. Sin JavaScript propio: las «Secciones con ancla» son anclas.
 */
export function PaginaTexto({
  titulo,
  entradilla,
  contenido,
  secciones,
  migas,
  fondo,
}: {
  titulo: string;
  entradilla?: string | null;
  contenido?: unknown;
  secciones: Seccion[];
  migas: BreadcrumbItem[];
  fondo: ImagenLista | null;
}) {
  return (
    <main className={`${marca.pagina} ${estilos.pagina}`}>
      <JsonLd data={buildBreadcrumbJsonLd(migas)} />
      <div className={marca.migas}>
        <Breadcrumbs items={migas} />
      </div>

      <HeroMarca
        vista={{
          antetitulo: "Partequipos",
          linea1: titulo,
          linea2: "",
          descripcion: "",
          fondo,
          logo: null,
        }}
        anclaSiguiente={ANCLA_CONTENIDO}
        etiquetaRaton="Ir al contenido"
        franja={false}
        indice
        bajo
        reservarTitulo
      />

      <div id={ANCLA_CONTENIDO} className={estilos.tarjeta}>
        <div className={estilos.texto}>
          {entradilla ? <p className={estilos.entradilla}>{entradilla}</p> : null}
          {contenido ? <RichText data={contenido} /> : null}

          {/* Índice de secciones: hace visibles y navegables las anclas. */}
          {secciones.length > 1 ? (
            <nav className={estilos.indice} aria-labelledby="indice-heading">
              <h2 id="indice-heading">En esta página</h2>
              <ul>
                {secciones.map((s) => (
                  <li key={s.ancla}>
                    <a href={`#${s.ancla}`}>{s.titulo}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {/* Las anclas son secciones de ESTA página, no rutas propias. */}
          {secciones.map((s) => (
            <section key={s.ancla} id={s.ancla} className={estilos.seccion}>
              <h2>{s.titulo}</h2>
              <RichText data={s.contenido} />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
