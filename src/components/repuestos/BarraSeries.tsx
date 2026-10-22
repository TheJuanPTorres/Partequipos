"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

import mejoras from "./mejoras.module.css";

/**
 * R2 (dirección, 2026-10-21): la BARRA DE SERIES de la página de tipo de repuestos. Va dentro de
 * la sección de modelos y, al bajar, se queda fija bajo la cabecera del sitio (`sticky`, sin
 * JavaScript ni CLS) con «Serie EX (11) · Serie ZAXIS (15)…». Marca la serie que se está
 * viendo (`aria-current`) y lleva a cada una con desplazamiento suave (salvo con «reducir
 * movimiento»). En móvil, una fila que se desliza de lado. Solo con 2 o más series.
 *
 * Sin JavaScript son anclas normales: la barra se queda fija y lleva a cada serie igual.
 */
export function BarraSeries({
  series,
}: {
  series: { ancla: string; titulo: string; total: number }[];
}) {
  const [actual, setActual] = useState<string | null>(null);
  const barra = useRef<HTMLElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let pendiente = 0;
    const medir = () => {
      pendiente = 0;
      const limite = (barra.current?.getBoundingClientRect().bottom ?? 0) + 24;
      let elegida: string | null = null;
      for (const s of series) {
        const g = document.getElementById(s.ancla);
        if (g && g.getBoundingClientRect().top <= limite) elegida = s.ancla;
      }
      setActual(elegida);
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
    const destino = document.getElementById(ancla);
    if (!destino) return;
    e.preventDefault();
    destino.scrollIntoView({ behavior: suave() ? "smooth" : "auto", block: "start" });
    history.replaceState(history.state, "", `#${ancla}`);
    // El foco va a la serie (sin mover la página otra vez): el teclado sigue desde ahí.
    if (!destino.hasAttribute("tabindex")) destino.setAttribute("tabindex", "-1");
    destino.focus({ preventScroll: true });
  }

  return (
    <nav ref={barra} className={mejoras.barraSeries} aria-label="Series" data-mejora="R2">
      <ul ref={lista} className={mejoras.barraLista}>
        {series.map((s) => (
          <li key={s.ancla}>
            <a
              href={`#${s.ancla}`}
              className={mejoras.barraEnlace}
              aria-current={actual === s.ancla ? "true" : undefined}
              onClick={(e) => irA(e, s.ancla)}
            >
              {s.titulo} <span className={mejoras.barraCuenta}>({s.total})</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function suave() {
  return !matchMedia("(prefers-reduced-motion: reduce)").matches;
}
