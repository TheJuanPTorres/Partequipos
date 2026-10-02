"use client";

import { Children, useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { useMovimientoReducido } from "@/components/movimiento/useMovimiento";

/**
 * TARJETAS APILADAS de la sección 5 (ux-9, widget «Stacking Cards» con
 * `scroll_related_animation`), sin GSAP.
 *
 * El apilado es CSS (`position: sticky`, en `repuestos.module.css`). Aquí va
 * lo ligado al scroll, leído del `js.tpl` del widget (paso 4, 2026-10-02):
 * cada tarjeta, con `scrub`, va de su estado normal a escala
 * `1 − 0,03 × (tarjetas que le caen encima)` y `grayscale(30 % × las mismas)`
 * (valores por defecto `scale_end` −0,3 y `greyscale_end` 30, que el export
 * no cambia). Tramo: empieza cuando el `i/n` del alto de la lista llega
 * arriba (`${i/n·100}% top`) y acaba cuando el final de la lista llega al
 * centro de la ventana (`bottom center`). Curva: la de GSAP por defecto,
 * `power1.out`.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): escucha el scroll. Las
 * tarjetas llegan hechas del servidor (`children`) y el HTML es el mismo.
 *
 * Movimiento ligado al scroll, no automático: no lleva pausa (WCAG 2.2.2 es de
 * lo que se mueve solo). Con `prefers-reduced-motion`, sin escala: solo se
 * apilan. Solo escucha mientras la lista está a la vista.
 */

/** Cuánto encoge cada tarjeta por cada una que se le apila encima (ux-9: 0,03). */
const ENCOGIDO_POR_TARJETA = 0.03;
/** Cuánto se agrisa, en %, por cada una que se le apila encima (ux-9: 30). */
const GRIS_POR_TARJETA = 30;

type Props = { children: ReactNode; className?: string; claseItem?: string };

export function TarjetasApiladas({ children, className, claseItem }: Props) {
  const lista = useRef<HTMLOListElement>(null);
  const reducido = useMovimientoReducido();
  const items = Children.toArray(children);
  const total = items.length;

  useEffect(() => {
    const ol = lista.current;
    if (!ol || reducido || total < 2) return;
    const lis = [...ol.children] as HTMLElement[];

    let altoLista = 0;
    let inicioLista = 0;
    let frame = 0;

    // Posiciones ESTÁTICAS: las de los <li> se mueven con el sticky, la de la lista no.
    const medir = () => {
      const caja = ol.getBoundingClientRect();
      altoLista = caja.height;
      inicioLista = caja.top + scrollY;
    };

    const pintar = () => {
      frame = 0;
      const fin = inicioLista + altoLista - innerHeight / 2;
      lis.forEach((li, i) => {
        const encima = total - 1 - i;
        if (encima === 0) return;
        const inicio = inicioLista + (i / total) * altoLista;
        const t =
          fin > inicio
            ? Math.min(1, Math.max(0, (scrollY - inicio) / (fin - inicio)))
            : Number(scrollY >= inicio);
        const conFreno = 1 - (1 - t) * (1 - t);
        li.style.setProperty(
          "--apilada-escala",
          String(1 - ENCOGIDO_POR_TARJETA * encima * conFreno),
        );
        li.style.setProperty("--apilada-gris", `${GRIS_POR_TARJETA * encima * conFreno}%`);
      });
    };
    const alScroll = () => {
      if (!frame) frame = requestAnimationFrame(pintar);
    };
    const alRedimensionar = () => {
      medir();
      alScroll();
    };

    let escuchando = false;
    const observador = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting && !escuchando) {
        medir();
        pintar();
        addEventListener("scroll", alScroll, { passive: true });
        escuchando = true;
      } else if (!e?.isIntersecting && escuchando) {
        removeEventListener("scroll", alScroll);
        escuchando = false;
      }
    });
    observador.observe(ol);
    addEventListener("resize", alRedimensionar);

    return () => {
      observador.disconnect();
      removeEventListener("scroll", alScroll);
      removeEventListener("resize", alRedimensionar);
      if (frame) cancelAnimationFrame(frame);
      lis.forEach((li) => {
        li.style.removeProperty("--apilada-escala");
        li.style.removeProperty("--apilada-gris");
      });
    };
  }, [reducido, total]);

  return (
    <ol ref={lista} className={className}>
      {items.map((hijo, i) => (
        <li key={i} className={claseItem} style={{ "--apilada-i": i } as CSSProperties}>
          {hijo}
        </li>
      ))}
    </ol>
  );
}
