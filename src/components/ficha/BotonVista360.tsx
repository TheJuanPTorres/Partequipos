"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";

import { VentanaFicha } from "./VentanaFicha";
import estilos from "./ventanaFicha.module.css";

/**
 * «VER EN VISTA 360» (2026-10-21): solo sale si el equipo tiene el enlace
 * («Vista 360» en el panel). Abre la vista 360 de su proveedor en un marco,
 * dentro de una ventana emergente; el marco solo existe con la ventana abierta,
 * así que la página no carga nada del proveedor hasta que se pulsa.
 *
 * MEJORA PROGRESIVA: es un enlace, así que sin JavaScript —o con Ctrl, ⌘,
 * Mayús o el botón central— abre la vista 360 en otra pestaña.
 */
export function BotonVista360({
  url,
  nombre,
  className,
  children,
}: {
  url: string;
  /** El nombre del equipo, para el título de la ventana y del marco. */
  nombre: string;
  className?: string;
  children: ReactNode;
}) {
  const [abierta, setAbierta] = useState(false);
  const [montada, setMontada] = useState(false);
  const enlace = useRef<HTMLAnchorElement>(null);
  const titulo = `Vista 360: ${nombre}`;

  function alPulsar(e: MouseEvent<HTMLAnchorElement>) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    setMontada(true);
    setAbierta(true);
  }

  return (
    <>
      <a
        ref={enlace}
        href={url}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        onClick={alPulsar}
        aria-haspopup="dialog"
      >
        {children}
      </a>
      {montada ? (
        <VentanaFicha
          abierta={abierta}
          titulo={titulo}
          variante="360"
          alCerrar={() => {
            setAbierta(false);
            enlace.current?.focus();
          }}
        >
          <iframe
            src={url}
            title={titulo}
            className={estilos.marco360}
            allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </VentanaFicha>
      ) : null}
    </>
  );
}
