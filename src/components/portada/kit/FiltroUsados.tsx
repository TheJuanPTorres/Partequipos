"use client";

import Image from "next/image";
import { useId, useRef, useState, type ReactNode } from "react";

import type { ImagenLista } from "@/lib/utils/relations";

import { Flecha } from "./Flecha";
import estilos from "./usadosKit.module.css";

/**
 * EL FILTRO DE LA SECCIÓN DE USADOS (diseño del cliente, 2026-10-26): tres tarjetas-botón y,
 * debajo, el carrusel de la elegida. Siempre hay una elegida (la primera al cargar), así que no
 * hace falta «Todos».
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): el filtro tiene estado. Los carruseles de las
 * tres categorías llegan YA PINTADOS desde el servidor (`paneles`): aquí solo se esconden los que
 * no tocan, con `hidden`, así están en el HTML para buscadores y sin JavaScript se ve el primero.
 */
export function FiltroUsados({
  filtros,
  paneles,
}: {
  filtros: { clave: string; nombre: string; imagen: ImagenLista | null }[];
  paneles: ReactNode[];
}) {
  const [elegido, setElegido] = useState(0);
  const listado = useRef<HTMLDivElement>(null);
  const base = useId();

  function elegir(i: number) {
    setElegido(i);
    // En escritorio el listado puede quedar bajo el pliegue: solo lo necesario para que se vea.
    const suave = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    listado.current?.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "nearest" });
  }

  return (
    <>
      <ul className={estilos.filtros} aria-label="Categorías">
        {filtros.map((f, i) => {
          const activo = i === elegido;
          return (
            <li key={f.clave}>
              <button
                type="button"
                className={estilos.filtro}
                aria-pressed={activo}
                aria-controls={`${base}-${i}`}
                data-activo={activo ? "" : undefined}
                onClick={() => elegir(i)}
              >
                <span className={estilos.filtroImagen}>
                  {f.imagen ? (
                    <Image
                      src={f.imagen.url}
                      alt=""
                      fill
                      sizes="120px"
                      className={estilos.filtroImg}
                    />
                  ) : null}
                </span>
                <span className={estilos.filtroNombre}>{f.nombre}</span>
                <span className={estilos.filtroFlecha} aria-hidden="true">
                  <Flecha />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div ref={listado} className={estilos.listado}>
        {paneles.map((p, i) => (
          <div
            key={filtros[i]?.clave ?? i}
            id={`${base}-${i}`}
            className={estilos.panelFiltro}
            hidden={i !== elegido}
          >
            {p}
          </div>
        ))}
      </div>
    </>
  );
}
