"use client";

import { useEffect, useRef } from "react";

import estilos from "./whatsappFlotante.module.css";

/**
 * BOTÓN FLOTANTE DE WHATSAPP (2026-10-17, dirección): fijo abajo a la
 * izquierda en todo el sitio público (no en el panel: vive en el layout de
 * `(site)`). Abre `wa.me` con el número del global de la empresa, el mismo de
 * «Habla con un experto», en una pestaña nueva.
 *
 * El logo es el SVG del cliente (`partequipos-diseno/assets/whatsapp/`),
 * OPTIMIZADO e INCRUSTADO: sin los grupos vacíos de SVGRepo y con el `viewBox`
 * ajustado al círculo. Ninguna petición a otro dominio.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): para NO TAPAR los
 * controles del hero, que van abajo a la izquierda de su tarjeta. Cualquier
 * elemento con `data-evita-flotante` que caiga donde está el botón lo hace
 * subir lo justo (con `transform`: un elemento fijo que se desplaza así no
 * cuenta como CLS). El pie no lo necesita: la franja legal reserva su sitio
 * (`pie.module.css`).
 */

/** Aire entre el botón y lo que esquiva, en px. */
const AIRE = 8;

export function WhatsAppFlotante({ href }: { href: string }) {
  const enlace = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const a = enlace.current;
    if (!a) return;
    let frame = 0;

    const colocar = () => {
      frame = 0;
      // La caja SIN desplazar: la de ahora menos lo que ya se subió.
      const subido = Number(a.dataset.subido ?? 0);
      const caja = a.getBoundingClientRect();
      const arriba = caja.top + subido;
      const abajo = caja.bottom + subido;
      let subir = 0;
      for (const el of document.querySelectorAll<HTMLElement>("[data-evita-flotante]")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const pisa =
          r.left < caja.right + AIRE &&
          r.right > caja.left - AIRE &&
          r.top < abajo + AIRE &&
          r.bottom > arriba - AIRE;
        if (pisa) subir = Math.max(subir, abajo - r.top + AIRE);
      }
      a.dataset.subido = String(Math.round(subir));
      a.style.setProperty("--flotante-subida", `${-Math.round(subir)}px`);
    };
    const pedir = () => {
      if (!frame) frame = requestAnimationFrame(colocar);
    };

    colocar();
    addEventListener("scroll", pedir, { passive: true });
    addEventListener("resize", pedir);
    return () => {
      removeEventListener("scroll", pedir);
      removeEventListener("resize", pedir);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <a
      ref={enlace}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className={estilos.flotante}
    >
      <svg viewBox="-8 -8 471.73 471.73" aria-hidden="true" focusable="false">
        <circle cx="227.865" cy="227.865" r="235.865" fill="#1BD741" />
        <path
          fill="#fff"
          d="M68.494,387.41l22.323-79.284c-14.355-24.387-21.913-52.134-21.913-80.638 c0-87.765,71.402-159.167,159.167-159.167s159.166,71.402,159.166,159.167c0,87.765-71.401,159.167-159.166,159.167 c-27.347,0-54.125-7-77.814-20.292L68.494,387.41z M154.437,337.406l4.872,2.975c20.654,12.609,44.432,19.274,68.762,19.274 c72.877,0,132.166-59.29,132.166-132.167S300.948,95.321,228.071,95.321S95.904,154.611,95.904,227.488 c0,25.393,7.217,50.052,20.869,71.311l3.281,5.109l-12.855,45.658L154.437,337.406z"
        />
        <path
          fill="#fff"
          d="M183.359,153.407l-10.328-0.563c-3.244-0.177-6.426,0.907-8.878,3.037 c-5.007,4.348-13.013,12.754-15.472,23.708c-3.667,16.333,2,36.333,16.667,56.333c14.667,20,42,52,90.333,65.667 c15.575,4.404,27.827,1.435,37.28-4.612c7.487-4.789,12.648-12.476,14.508-21.166l1.649-7.702c0.524-2.448-0.719-4.932-2.993-5.98 l-34.905-16.089c-2.266-1.044-4.953-0.384-6.477,1.591l-13.703,17.764c-1.035,1.342-2.807,1.874-4.407,1.312 c-9.384-3.298-40.818-16.463-58.066-49.687c-0.748-1.441-0.562-3.19,0.499-4.419l13.096-15.15 c1.338-1.547,1.676-3.722,0.872-5.602l-15.046-35.201C187.187,154.774,185.392,153.518,183.359,153.407z"
        />
      </svg>
    </a>
  );
}
