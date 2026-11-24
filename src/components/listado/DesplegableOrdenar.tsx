"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import estilos from "./listado.module.css";

/** Ancho a partir del cual «Ordenar» es un desplegable junto al botón; por debajo, un panel inferior. */
const MOVIL = "(max-width: 767px)";

/**
 * «ORDENAR» DE LOS LISTADOS (tanda 21, tarea 8, 2026-11-23). A 390 px el desplegable se abría hacia
 * la izquierda desde el borde derecho del botón y se salía de la pantalla, con las opciones cortadas.
 *
 * - **Móvil (< 768 px):** un panel inferior a todo el ancho, con fondo atenuado (solo CSS).
 * - **Tablet y escritorio:** el desplegable junto al botón. Si no cabe hacia la izquierda, se abre
 *   hacia la derecha (`data-lado`); y nunca pasa del ancho de la pantalla.
 *
 * Por qué es de cliente: `<details>` no se cierra con Escape ni al pulsar fuera, y en el panel
 * inferior el foco tiene que ir a la opción elegida. Sin JavaScript sigue siendo un `<details>` que
 * se abre y se cierra con su botón, y las opciones son enlaces.
 */
export function DesplegableOrdenar({
  etiqueta,
  children,
}: {
  /** El orden elegido, para el lector de pantalla («Ordenar: Recomendados»). */
  etiqueta: string;
  /** La lista de opciones (enlaces), de servidor. */
  children: ReactNode;
}) {
  const caja = useRef<HTMLDetailsElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [lado, setLado] = useState<"derecha" | "izquierda">("derecha");

  useEffect(() => {
    const d = caja.current;
    if (!abierto || !d) return;
    const movil = matchMedia(MOVIL).matches;
    // El panel (posicionado), no la lista de dentro.
    const lista = d.querySelector<HTMLElement>(`.${estilos.ordenarPanel}`);
    if (!movil && lista) {
      // Anclado a la derecha del botón; si así se sale por la izquierda, se ancla a su izquierda.
      setLado("derecha");
      requestAnimationFrame(() => {
        if (lista.getBoundingClientRect().left < 8) setLado("izquierda");
      });
    }
    if (movil) {
      const elegida =
        d.querySelector<HTMLAnchorElement>('a[aria-current="true"]') ?? d.querySelector("a");
      elegida?.focus();
    }
    const cerrar = (devolverFoco: boolean) => {
      d.removeAttribute("open");
      if (devolverFoco) d.querySelector("summary")?.focus();
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cerrar(true);
      }
    };
    const fuera = (e: PointerEvent) => {
      const t = e.target as Node;
      // El fondo atenuado del panel inferior es el propio `<details>` (su `::before`): cuenta como fuera.
      if (t === d || !d.contains(t)) cerrar(false);
    };
    document.addEventListener("keydown", tecla);
    document.addEventListener("pointerdown", fuera);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.removeEventListener("pointerdown", fuera);
    };
  }, [abierto]);

  return (
    <details
      ref={caja}
      className={estilos.ordenar}
      data-lado={lado}
      onToggle={(e) => setAbierto((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        Ordenar
        <span className="sr-only">: {etiqueta}</span>
        <IconChevronDown size={18} stroke={2} aria-hidden="true" />
      </summary>
      <div className={estilos.ordenarPanel} role="group" aria-label="Ordenar por">
        <p className={estilos.ordenarTitulo} aria-hidden="true">
          Ordenar por
        </p>
        {children}
      </div>
    </details>
  );
}
