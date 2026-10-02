"use client";

import { useEffect, useRef } from "react";

import { pasoElDisparo } from "@/components/movimiento/ritmos";
import { useMovimientoReducido } from "@/components/movimiento/useMovimiento";
import { formatearCifra, valorContador } from "@/lib/bloques/vista";

import estilos from "./cifras.module.css";

/** ux-9: contador de Elementor, 2000 ms, curva «swing» (medido pintado). */
const DURACION_MS = 2000;
/** Arranca cuando el borde superior cruza el 90 % del alto de la ventana. */
const DISPARO = 0.9;

type Props = { numero: number; prefijo?: string | null; sufijo?: string | null };

/**
 * NÚMERO QUE CUENTA DESDE 0 AL LLEGAR CON EL SCROLL (widget «Counter» de
 * Elementor en ux-9).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): IntersectionObserver y
 * `requestAnimationFrame`. La cuenta se escribe en el DOM, sin estado de
 * React: un render por fotograma no aporta nada.
 *
 * Tres garantías, las mismas que el revelado:
 * 1. SIN JAVASCRIPT se ve la cifra final: el «0» de partida lo pone el cliente.
 * 2. CON MOVIMIENTO REDUCIDO se ve la cifra final, quieta.
 * 3. SIN DESPLAZAMIENTOS (CLS 0): la cifra final reserva la caja y la que
 *    cuenta se pinta encima, en la misma celda. El lector de pantalla oye
 *    siempre la final (`sr-only`); lo que se ve va oculto a su árbol.
 */
export function Contador({ numero, prefijo, sufijo }: Props) {
  const caja = useRef<HTMLSpanElement>(null);
  const cuenta = useRef<HTMLSpanElement>(null);
  const reducido = useMovimientoReducido();
  const antes = prefijo ?? "";
  const despues = sufijo ?? "";

  useEffect(() => {
    const el = caja.current;
    const texto = cuenta.current;
    if (!el || !texto || reducido) return;
    // Ya pasado (se entró con el scroll bajado o por un ancla): sin animación.
    if (el.getBoundingClientRect().bottom < 0) return;

    const pintar = (v: number) => {
      texto.textContent = `${antes}${formatearCifra(v)}${despues}`;
    };
    el.dataset.contando = "";
    pintar(0);

    let frame = 0;
    const terminar = () => {
      delete el.dataset.contando;
      texto.textContent = "";
    };
    const arrancar = () => {
      const inicio = performance.now();
      const paso = (ahora: number) => {
        const t = (ahora - inicio) / DURACION_MS;
        if (t >= 1) return terminar();
        pintar(valorContador(numero, t));
        frame = requestAnimationFrame(paso);
      };
      frame = requestAnimationFrame(paso);
    };
    const observador = new IntersectionObserver(() => {
      if (pasoElDisparo(el.getBoundingClientRect().top, innerHeight, DISPARO)) {
        observador.disconnect();
        arrancar();
      }
    });
    observador.observe(el);
    return () => {
      observador.disconnect();
      cancelAnimationFrame(frame);
      terminar();
    };
  }, [numero, antes, despues, reducido]);

  const final = `${antes}${formatearCifra(numero)}${despues}`;
  return (
    <span className={estilos.numero}>
      <span className="sr-only">{final}</span>
      <span ref={caja} className={estilos.celda} aria-hidden="true">
        <span className={estilos.reserva}>{final}</span>
        <span ref={cuenta} className={estilos.cuenta} />
      </span>
    </span>
  );
}
