"use client";

import { IconChevronDown } from "@tabler/icons-react";
import Link from "next/link";
import { useId, useLayoutEffect, useRef, useState } from "react";

import { CURVA, DURACION_MS } from "@/lib/listado/animaciones";

import { iconoDePestana } from "./iconos";
import estilos from "./listado.module.css";
import type { Pestana } from "./PlantillaListado";

/**
 * Los botones de categoría de la columna izquierda de los listados de usados
 * (cliente, 2026-10-21). Es de cliente por dos cosas que necesitan estado o el
 * navegador:
 *  - las categorías SIN unidades van plegadas tras «Ver más (n)», un botón con
 *    `aria-expanded` que las despliega y las vuelve a plegar con una animación
 *    suave (solo CSS, `listado.module.css`); la actual se ve siempre, aunque
 *    esté vacía;
 *  - en móvil y tablet (fila deslizable), al cargar, la fila se desplaza hasta
 *    dejar visible la categoría actual, sin cambiar el orden.
 * Sin JavaScript, el `<noscript>` enseña todas y quita el botón, que no haría nada.
 *
 * Los enlaces solo cambian el catálogo (`data-catalogo-nav`, `ZonaCatalogo`) y
 * se precargan al pasar el ratón o enfocarlos, no al entrar en pantalla: así
 * cargar la página no dispara una petición por categoría.
 *
 * Con `deslizar` (animación A4, `src/lib/listado/animaciones.ts`), el
 * resaltado de la categoría actual se desliza desde el botón de antes hasta el
 * nuevo (solo `transform`, sobre su `::before`).
 */

/**
 * Dónde estaba el resaltado al elegir otra categoría. Fuera del componente
 * porque, al cambiar de categoría, Next monta la página de nuevo.
 */
let resaltadoAnterior: { caja: DOMRect; cuando: number } | null = null;

/** Pasado este tiempo, el resaltado ya no se desliza (la navegación tardó demasiado). */
const VIGENCIA_DESLIZAR_MS = 5000;
export function CategoriasListado({
  pestanas,
  titulo,
  elemento,
  deslizar = false,
}: {
  pestanas: Pestana[];
  titulo: string;
  elemento: { singular: string; plural: string };
  deslizar?: boolean;
}) {
  const [abiertas, setAbiertas] = useState(false);
  const [precargar, setPrecargar] = useState<string | null>(null);
  const lista = useRef<HTMLUListElement>(null);
  const idLista = useId();
  const ocultables = pestanas.filter((p) => p.nota && !p.activa).length;

  // Antes de pintar: la fila se desplaza hasta la actual y, después, el resaltado se desliza.
  useLayoutEffect(() => {
    const ul = lista.current;
    const actual = ul?.querySelector<HTMLElement>("[aria-current='page']");
    if (!ul || !actual) return;
    // Solo si es la fila deslizable (móvil y tablet) y la actual no se ve entera.
    if (ul.scrollWidth > ul.clientWidth) {
      const margen = 16;
      const izquierda = actual.offsetLeft - ul.offsetLeft;
      const derecha = izquierda + actual.offsetWidth;
      if (izquierda < ul.scrollLeft + margen || derecha > ul.scrollLeft + ul.clientWidth - margen) {
        ul.scrollLeft = izquierda - margen;
      }
    }
    const antes = resaltadoAnterior;
    resaltadoAnterior = null;
    if (
      !deslizar ||
      !antes ||
      Date.now() - antes.cuando > VIGENCIA_DESLIZAR_MS ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const ahora = actual.getBoundingClientRect();
    if (!ahora.width || !ahora.height) return;
    const dx = antes.caja.left - ahora.left;
    const dy = antes.caja.top - ahora.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    actual.animate(
      [
        {
          transform: `translate(${dx}px, ${dy}px) scale(${antes.caja.width / ahora.width}, ${antes.caja.height / ahora.height})`,
        },
        { transform: "none" },
      ],
      { duration: DURACION_MS, easing: CURVA, pseudoElement: "::before" },
    );
  }, [deslizar]);

  /** Al elegir otra categoría, se guarda dónde estaba el resaltado. */
  const recordarResaltado = () => {
    const actual = lista.current?.querySelector("[aria-current='page']");
    resaltadoAnterior = actual
      ? { caja: actual.getBoundingClientRect(), cuando: Date.now() }
      : null;
  };

  return (
    <nav aria-labelledby="categorias-titulo" className={estilos.categorias} data-catalogo-nav="">
      <h2 id="categorias-titulo" className={estilos.categoriasTitulo}>
        {titulo}
      </h2>
      {ocultables ? (
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              "<style>[data-categoria-oculta]{grid-template-rows:1fr!important;grid-template-columns:1fr!important;opacity:1!important;visibility:visible!important;margin:0!important}[data-ver-mas]{display:none!important}</style>",
          }}
        />
      ) : null}
      <ul ref={lista} id={idLista}>
        {pestanas.map((p) => {
          const IconoPestana = iconoDePestana(p.texto);
          const oculta = Boolean(p.nota) && !p.activa;
          return (
            <li
              key={p.href}
              data-categoria-oculta={oculta ? "" : undefined}
              data-plegada={oculta && !abiertas ? "" : undefined}
            >
              {/* La caja que se anima (altura en la lista, ancho en la fila). */}
              <div className={estilos.categoriaPlegable}>
                <Link
                  href={p.href}
                  prefetch={precargar === p.href && !p.activa ? null : false}
                  onMouseEnter={() => setPrecargar(p.href)}
                  onFocus={() => setPrecargar(p.href)}
                  onTouchStart={() => setPrecargar(p.href)}
                  onClick={deslizar && !p.activa ? recordarResaltado : undefined}
                  className={estilos.categoria}
                  aria-current={p.activa ? "page" : undefined}
                >
                  <IconoPestana size={22} stroke={1.5} aria-hidden="true" />
                  <span className={estilos.categoriaTexto}>
                    {p.texto}
                    {p.nota ? (
                      <>
                        <span className="sr-only">, </span>
                        <small className={estilos.pestanaNota}>{p.nota}</small>
                      </>
                    ) : null}
                  </span>
                  {typeof p.cuenta === "number" ? (
                    <span className={estilos.categoriaCuenta}>
                      <span className="sr-only">, </span>
                      {p.cuenta}
                      <span className="sr-only">
                        {" "}
                        {p.cuenta === 1 ? elemento.singular : elemento.plural}
                      </span>
                    </span>
                  ) : null}
                </Link>
              </div>
            </li>
          );
        })}
        {ocultables ? (
          <li data-ver-mas="">
            <button
              type="button"
              className={estilos.verMas}
              aria-expanded={abiertas}
              aria-controls={idLista}
              onClick={() => setAbiertas((a) => !a)}
            >
              <IconChevronDown size={18} stroke={2} aria-hidden="true" />
              {abiertas ? "Ver menos" : `Ver más (${ocultables})`}
              {abiertas ? null : <span className="sr-only"> categorías sin unidades</span>}
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
