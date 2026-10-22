"use client";

import { useLayoutEffect, useRef } from "react";

import { DURACION_CONTADOR_MS, frenar, inicioDelContador } from "@/lib/listado/animaciones";

import estilos from "./listado.module.css";

/**
 * El último valor pintado. Fuera del componente porque, al cambiar de
 * categoría, Next monta la página de nuevo y el estado se perdería.
 */
let ultimoValor: number | null = null;

const escribir = (span: HTMLSpanElement, n: number) => {
  if (span.firstChild) span.firstChild.nodeValue = String(n);
};

/**
 * El número de unidades del recuento, que cuenta hasta el valor nuevo en unos
 * 700 ms, frenando al acercarse al final (animación A5 del listado de usados, `src/lib/listado/animaciones.ts`).
 * El lector de pantalla solo oye el valor final: los números intermedios van
 * ocultos para él. La caja tiene desde el principio el ancho del valor final
 * (cifras de ancho fijo) y nunca cuenta con más cifras, así que no empuja el
 * texto. Con «reducir movimiento», salta al valor final.
 */
export function NumeroAnimado({ valor }: { valor: number }) {
  // Los números intermedios se escriben en el mismo nodo de texto que pinta
  // React (así sus cambios siguen llegando), sin volver a pintar.
  const visible = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const desde = inicioDelContador(ultimoValor, valor);
    ultimoValor = valor;
    const span = visible.current;
    if (!span) return;
    // Siempre se parte del valor real, aunque una cuenta anterior quedara a medias.
    escribir(span, valor);
    if (desde === valor || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let marco = 0;
    const inicio = performance.now();
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / DURACION_CONTADOR_MS);
      escribir(span, Math.round(desde + (valor - desde) * frenar(t)));
      if (t < 1) marco = requestAnimationFrame(paso);
    };
    escribir(span, desde);
    marco = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(marco);
  }, [valor]);
  return (
    <span className={estilos.numeroAnimado} style={{ width: `${String(valor).length}ch` }}>
      <span ref={visible} aria-hidden="true">
        {valor}
      </span>
      <span className="sr-only">{valor}</span>
    </span>
  );
}
