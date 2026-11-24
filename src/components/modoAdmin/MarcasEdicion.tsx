"use client";

import { useEffect, useState } from "react";

import type { RespuestaMapa } from "@/lib/modoAdmin/mapa";

import { ALTO_FRANJA } from "./estilos";

/**
 * Los botones «Editar» sobre cada bloque de la página (modo administración, tanda 23).
 *
 * NO TOCAN el marcado ni la maqueta de la página: van en una capa aparte, al final del `<body>`,
 * colocados encima de cada bloque con sus coordenadas. El botón sale al pasar el ratón por el
 * bloque o al llegar a él con el teclado (son enlaces de verdad, en el orden de la página), y abre
 * la ficha del panel en una pestaña nueva.
 *
 * El selector de cada bloque lo da NUESTRO servidor (`mapa.ts`); aun así va en `try`: un selector
 * que el navegador no entienda se salta.
 *
 * «use client»: mide el DOM y escucha el ratón.
 */
type Caja = {
  clave: string;
  etiqueta: string;
  href: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  yBoton: number;
};

const MARGEN = 8;
/** Alto del botón, para que no se salga por abajo de su bloque. */
const ALTO_BOTON = 32;

function buscar(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

export function MarcasEdicion({
  bloques,
  ruta,
}: {
  bloques: RespuestaMapa["bloques"];
  ruta: string;
}) {
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [activa, setActiva] = useState<string | null>(null);
  // El foco del teclado va APARTE del ratón: al bajar la página bajo un ratón quieto, otro bloque
  // «entra» y apagaba el botón enfocado (visto con Tab a 1440, 2026-11-24).
  const [enfocada, setEnfocada] = useState<string | null>(null);

  useEffect(() => {
    const encontrados = bloques.flatMap((b, i) => {
      const elemento = buscar(b.selector);
      return elemento ? [{ ...b, clave: `${i}`, elemento }] : [];
    });

    let pendiente = 0;
    const medir = () => {
      pendiente = 0;
      // Hasta dónde tapan la franja y la cabecera pegada arriba.
      const cabecera = document.querySelector("body > header")?.getBoundingClientRect();
      const tope = Math.max(
        ALTO_FRANJA,
        cabecera && cabecera.top <= ALTO_FRANJA ? cabecera.bottom : 0,
      );
      setCajas(
        encontrados.map(({ clave, etiqueta, href, elemento }) => {
          const r = elemento.getBoundingClientRect();
          // El botón va arriba del bloque; si esa parte ya pasó bajo la cabecera, baja con la
          // pantalla (sin salirse del bloque), para que siempre se pueda pulsar.
          const yBoton = Math.max(
            r.top + MARGEN,
            Math.min(tope + MARGEN, r.bottom - ALTO_BOTON - MARGEN),
          );
          return {
            clave,
            etiqueta,
            href,
            x: r.left + window.scrollX,
            y: r.top + window.scrollY,
            ancho: r.width,
            alto: r.height,
            yBoton: yBoton + window.scrollY,
          };
        }),
      );
    };
    const pedir = () => {
      if (!pendiente) pendiente = window.requestAnimationFrame(medir);
    };

    medir();
    // La página cambia de alto (imágenes, acordeones, secciones pegajosas): se vuelve a medir.
    const observador = new ResizeObserver(pedir);
    observador.observe(document.body);
    for (const { elemento } of encontrados) observador.observe(elemento);
    window.addEventListener("resize", pedir);
    window.addEventListener("scroll", pedir, { passive: true });

    const limpiezas = encontrados.map(({ clave, elemento }) => {
      const entrar = () => setActiva(clave);
      const salir = () => setActiva((antes) => (antes === clave ? null : antes));
      elemento.addEventListener("mouseenter", entrar);
      elemento.addEventListener("mouseleave", salir);
      return () => {
        elemento.removeEventListener("mouseenter", entrar);
        elemento.removeEventListener("mouseleave", salir);
      };
    });

    return () => {
      if (pendiente) window.cancelAnimationFrame(pendiente);
      observador.disconnect();
      window.removeEventListener("resize", pedir);
      window.removeEventListener("scroll", pedir);
      for (const limpiar of limpiezas) limpiar();
    };
  }, [bloques, ruta]);

  return (
    <div className="pqma-capa">
      {cajas.map((c) => (
        <div
          key={c.clave}
          className="pqma-bloque"
          data-activo={activa === c.clave || enfocada === c.clave ? "" : undefined}
          onMouseEnter={() => setActiva(c.clave)}
          onMouseLeave={() => setActiva((antes) => (antes === c.clave ? null : antes))}
        >
          <span
            className="pqma-marco"
            style={{ left: c.x, top: c.y, width: c.ancho, height: c.alto }}
            aria-hidden="true"
          />
          <a
            className="pqma-editar"
            style={{ left: c.x + MARGEN, top: c.yBoton }}
            href={c.href}
            target="_blank"
            rel="noopener"
            onFocus={(e) => {
              setEnfocada(c.clave);
              // Que se vea: la página va hasta el botón, sin animación (también con «reducir movimiento»).
              e.currentTarget.scrollIntoView({ block: "center", behavior: "instant" });
            }}
            onBlur={() => setEnfocada((antes) => (antes === c.clave ? null : antes))}
          >
            Editar {c.etiqueta}
          </a>
        </div>
      ))}
    </div>
  );
}
