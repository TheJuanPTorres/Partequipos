"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";

import { CURVA, CURVA_FRENADA, DURACION_DESLIZAR_MS, DURACION_MS } from "@/lib/listado/animaciones";

import mejoras from "./mejoras.module.css";

/**
 * R2 (dirección, 2026-10-21): la BARRA DE SERIES de la página de tipo de repuestos. Va dentro de
 * la sección de modelos y, al bajar, se queda fija bajo la cabecera del sitio (`sticky`, sin
 * JavaScript ni CLS) con «Serie EX (11) · Serie ZAXIS (15)…». Marca la serie que se está
 * viendo (`aria-current`) y lleva a cada una con desplazamiento suave. En móvil, una fila que se
 * desliza de lado. Solo con 2 o más series.
 *
 * ANIMACIÓN DEL CAMBIO DE SERIE (dirección, 2026-10-22), con las utilidades del listado de usados
 * (#320, `src/lib/listado/animaciones.ts`), sin duplicarlas:
 * - el RESALTADO se desliza de una serie a otra, como su A4: el fondo de la serie actual (su
 *   `::before`) viaja desde el botón de antes, con `DURACION_DESLIZAR_MS` y `CURVA_FRENADA`;
 * - al elegir una serie, el desplazamiento es suave y, mientras dura, el resaltado va directo a
 *   la elegida (no pasa por las de en medio);
 * - las tarjetas de la serie elegida que se ven ENTRAN ESCALONADAS al llegar, como su A1
 *   (`DURACION_MS`, `CURVA`, 40 ms entre una y otra, hasta 8).
 * Solo `transform` y `opacity`. Con «reducir movimiento», nada: el salto es directo.
 *
 * Sin JavaScript son anclas normales: la barra se queda fija y lleva a cada serie igual.
 *
 * También es el selector «Garantía · Devolución» de la página de garantías (V3, 2026-10-23):
 * sin cuenta, con su nombre accesible y sin la entrada escalonada (`entrada={false}`).
 */
export function BarraSeries({
  series,
  etiqueta = "Series",
  entrada = true,
  className,
}: {
  /** `total` es opcional: sin él, la pastilla lleva solo el título (la página de garantías). */
  series: { ancla: string; titulo: string; total?: number }[];
  /** Nombre accesible de la barra. */
  etiqueta?: string;
  /** `false`: al llegar a una sección, sus tarjetas no entran escalonadas (no hay tarjetas). */
  entrada?: boolean;
  /** Clase extra del `<nav>` (la página de garantías la usa para su interruptor V3). */
  className?: string;
}) {
  const [actual, setActual] = useState<string | null>(null);
  const barra = useRef<HTMLElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  /** La serie elegida mientras dura el desplazamiento: manda sobre lo que se ve. */
  const destino = useRef<string | null>(null);
  /** Dónde estaba el resaltado antes del cambio, respecto a la lista. */
  const anterior = useRef<{ izquierda: number; ancho: number } | null>(null);
  /** Al elegir una serie: comprueba si ya llegó (en cada fotograma de desplazamiento). */
  const comprobarLlegada = useRef<(() => void) | null>(null);

  useEffect(() => {
    let pendiente = 0;
    const medir = () => {
      pendiente = 0;
      if (destino.current) {
        comprobarLlegada.current?.();
        return;
      }
      // La serie llega 40 px bajo la barra (32 en móvil, `scroll-margin-top`): margen de sobra.
      const limite = (barra.current?.getBoundingClientRect().bottom ?? 0) + 64;
      let elegida: string | null = null;
      for (const s of series) {
        const g = document.getElementById(s.ancla);
        if (g && g.getBoundingClientRect().top <= limite) elegida = s.ancla;
      }
      cambiar(elegida);
    };
    const alMover = () => {
      if (!pendiente) pendiente = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", alMover, { passive: true });
    window.addEventListener("resize", alMover);
    return () => {
      window.removeEventListener("scroll", alMover);
      window.removeEventListener("resize", alMover);
      if (pendiente) cancelAnimationFrame(pendiente);
    };
  }, [series]);

  /** Cambia la serie actual guardando antes dónde estaba el resaltado (para deslizarlo). */
  function cambiar(ancla: string | null) {
    setActual((previa) => {
      if (previa === ancla) return previa;
      const ul = lista.current;
      const a = previa ? ul?.querySelector<HTMLElement>(`a[href="#${previa}"]`) : null;
      anterior.current = a ? { izquierda: a.offsetLeft, ancho: a.offsetWidth } : null;
      return ancla;
    });
  }

  // El resaltado viaja desde el botón de antes (como A4 del listado de usados).
  useLayoutEffect(() => {
    const antes = anterior.current;
    anterior.current = null;
    const a = actual ? lista.current?.querySelector<HTMLElement>(`a[href="#${actual}"]`) : null;
    if (!antes || !a || !suave() || !a.offsetWidth) return;
    const dx = antes.izquierda - a.offsetLeft;
    if (Math.abs(dx) < 1) return;
    a.animate(
      [
        { transform: `translateX(${dx}px) scaleX(${antes.ancho / a.offsetWidth})` },
        { transform: "none" },
      ],
      { duration: DURACION_DESLIZAR_MS, easing: CURVA_FRENADA, pseudoElement: "::before" },
    );
  }, [actual]);

  // En móvil, la serie marcada a la vista dentro de la fila (solo de lado: la página no se mueve).
  useEffect(() => {
    const ul = lista.current;
    const a = actual ? ul?.querySelector<HTMLElement>(`a[href="#${actual}"]`) : null;
    if (!ul || !a || ul.scrollWidth <= ul.clientWidth) return;
    const izquierda = a.offsetLeft - (ul.clientWidth - a.offsetWidth) / 2;
    ul.scrollTo({ left: izquierda, behavior: suave() ? "smooth" : "auto" });
  }, [actual]);

  function irA(e: MouseEvent<HTMLAnchorElement>, ancla: string) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const grupo = document.getElementById(ancla);
    if (!grupo) return;
    e.preventDefault();
    const animar = suave();
    cambiar(ancla);
    history.replaceState(history.state, "", `#${ancla}`);
    // El foco va a la serie (sin mover la página otra vez): el teclado sigue desde ahí.
    if (!grupo.hasAttribute("tabindex")) grupo.setAttribute("tabindex", "-1");
    if (!animar) {
      grupo.scrollIntoView({ behavior: "auto", block: "start" });
      grupo.focus({ preventScroll: true });
      return;
    }
    destino.current = ancla;
    const entradas = entrada ? entradaEscalonada(grupo) : [];
    grupo.scrollIntoView({ behavior: "smooth", block: "start" });
    grupo.focus({ preventScroll: true });
    let hecho = false;
    const llegar = () => {
      if (hecho) return;
      hecho = true;
      window.removeEventListener("scrollend", llegar);
      comprobarLlegada.current = null;
      destino.current = null;
      for (const animacion of entradas) animacion.play();
    };
    // Llega cuando la serie está en su sitio (bajo la barra, `scroll-margin-top`), con
    // `scrollend` donde exista o, como red, a los 900 ms.
    const margen =
      (parseFloat(getComputedStyle(grupo).scrollMarginTop) || 0) +
      (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
    comprobarLlegada.current = () => {
      if (Math.abs(grupo.getBoundingClientRect().top - margen) < 4) llegar();
    };
    window.addEventListener("scrollend", llegar, { once: true });
    window.setTimeout(llegar, 900);
    // Si la serie ya estaba en su sitio, no habrá desplazamiento: entran ya.
    requestAnimationFrame(() => comprobarLlegada.current?.());
  }

  return (
    <nav
      ref={barra}
      className={`${mejoras.barraSeries} ${className ?? ""}`}
      aria-label={etiqueta}
      data-mejora="R2"
    >
      <ul ref={lista} className={mejoras.barraLista}>
        {series.map((s) => (
          <li key={s.ancla}>
            <a
              href={`#${s.ancla}`}
              className={mejoras.barraEnlace}
              aria-current={actual === s.ancla ? "true" : undefined}
              onClick={(e) => irA(e, s.ancla)}
            >
              {s.titulo}
              {s.total === undefined ? null : (
                <>
                  {" "}
                  <span className={mejoras.barraCuenta}>({s.total})</span>
                </>
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * La entrada escalonada de las tarjetas de una serie (como A1 del listado de usados): las que se
 * ven (hasta 8), preparadas y en pausa —quedan transparentes— hasta llegar a la serie.
 */
function entradaEscalonada(grupo: HTMLElement): Animation[] {
  const tarjetas = [...grupo.querySelectorAll<HTMLElement>("ul > li")]
    .filter((li) => li.offsetParent !== null)
    .slice(0, 8);
  return tarjetas.map((li, i) => {
    const animacion = li.animate(
      [
        { opacity: 0, transform: "translateY(10px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: DURACION_MS, easing: CURVA, delay: i * 40, fill: "backwards" },
    );
    animacion.pause();
    return animacion;
  });
}

function suave() {
  return !matchMedia("(prefers-reduced-motion: reduce)").matches;
}
