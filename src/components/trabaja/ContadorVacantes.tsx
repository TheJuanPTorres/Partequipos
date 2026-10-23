"use client";

import { useEffect, useRef, useState } from "react";

import { DURACION_CONTADOR_MS, frenar, inicioDelContador } from "@/lib/listado/animaciones";

import estilos from "./trabaja.module.css";

/**
 * «N vacantes abiertas» (T4, 2026-10-23). La cifra sube hasta su valor al aparecer en pantalla
 * (la primera vez) y, al cambiar de ciudad, cuenta desde la de antes (`inicioDelContador`, como
 * el contador A5 del listado de usados). Una copia invisible de la cifra final fija el ancho:
 * el texto no se mueve mientras cuenta (CLS 0). El texto de verdad ya es el definitivo para los
 * lectores de pantalla; la cifra que sube va oculta para ellos (`aria-hidden`). Sin T4, sin
 * JavaScript o con «reducir movimiento», la cifra es la final desde el principio.
 */
export function ContadorVacantes({ total }: { total: number }) {
  const raiz = useRef<HTMLParagraphElement>(null);
  const [mostrada, setMostrada] = useState(total);
  const previo = useRef<number | null>(null);
  const vista = useRef(false);

  useEffect(() => {
    const el = raiz.current;
    const anterior = previo.current;
    previo.current = total;
    const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || reducir || !el.closest('[data-anim~="T4"]')) {
      setMostrada(total);
      return;
    }
    let fotograma = 0;
    const contar = (desde: number) => {
      const inicio = performance.now();
      const paso = (ahora: number) => {
        const t = Math.min(1, (ahora - inicio) / DURACION_CONTADOR_MS);
        setMostrada(Math.round(desde + (total - desde) * frenar(t)));
        if (t < 1) fotograma = requestAnimationFrame(paso);
      };
      fotograma = requestAnimationFrame(paso);
    };
    if (anterior !== null) {
      // Cambió de ciudad: cuenta desde la cifra de antes.
      contar(inicioDelContador(anterior, total));
      return () => cancelAnimationFrame(fotograma);
    }
    // Primera vez: empieza en 0 al aparecer en pantalla (si ya se ve, al cargar).
    setMostrada(0);
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting) && !vista.current) {
          vista.current = true;
          observador.disconnect();
          contar(0);
        }
      },
      { threshold: 0.6 },
    );
    observador.observe(el);
    return () => {
      observador.disconnect();
      cancelAnimationFrame(fotograma);
    };
  }, [total]);

  const final = String(total);
  const etiqueta = total === 1 ? "vacante abierta" : "vacantes abiertas";
  return (
    <p ref={raiz} className={estilos.contador}>
      <span className="sr-only">
        {total} {etiqueta}
      </span>
      <span aria-hidden="true">
        <span className={estilos.cifra}>
          <span className={estilos.cifraFija}>{final}</span>
          <span>{mostrada}</span>
        </span>{" "}
        {etiqueta}
      </span>
    </p>
  );
}
