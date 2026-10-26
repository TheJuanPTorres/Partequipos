"use client";

import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  modoDeCinta,
  REM_TARJETA_CINTA,
  repeticionesDeCinta,
  type ModoCinta,
  type SeccionKit,
} from "@/lib/nueva/paginaKit";

import estilos from "./kit.module.css";

/**
 * «Nuestra línea de equipos {marca} incluye:» con la CINTA CONTINUA de tarjetas por tipo
 * (render arriba, nombre abajo), y debajo las líneas de cierre. Cada tarjeta baja a la sección de
 * su tipo. Tres modos según el ancho (`modoDeCinta`, se recalcula al cambiarlo):
 *
 * - QUIETA: los tipos no llenan el ancho; una sola serie, centrada, sin animación.
 * - A MANO: lo llenan pero son pocos para un bucle; una sola serie que se desliza.
 * - BUCLE: la lista va dos veces y la pista se desplaza la mitad (CSS, sin salto); solo la
 *   primera serie es navegable y las copias son `aria-hidden`. Se pausa con el ratón o el foco
 *   encima; con «reducir movimiento» queda quieta y se desplaza a mano.
 *
 * Sin JavaScript (y hasta medir) se pinta el modo que daría el ancho de un escritorio.
 * Fuera del bucle no hay copias, así que un lector de pantalla no oye tarjetas repetidas.
 */
export function CintaKit({
  id,
  titulo,
  nombre,
  tipos,
  cierre,
}: {
  id: string;
  titulo: string;
  nombre: string;
  tipos: SeccionKit[];
  cierre: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  // Antes de medir: el ancho de un escritorio (1440), el mismo en servidor y cliente.
  const [modo, setModo] = useState<ModoCinta>(() =>
    modoDeCinta({
      tipos: tipos.length,
      anchoDisponible: 1440,
      anchoTarjeta: REM_TARJETA_CINTA * 16,
    }),
  );

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setModo(
        modoDeCinta({
          tipos: tipos.length,
          anchoDisponible: el.clientWidth,
          anchoTarjeta: REM_TARJETA_CINTA * rem,
        }),
      );
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [tipos.length]);

  const enBucle = modo === "bucle";
  const veces = repeticionesDeCinta(tipos.length);
  const vuelta = Array.from({ length: veces }, () => tipos).flat();
  const pista = enBucle ? [...vuelta, ...vuelta] : tipos;
  const lineas = cierre
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className={estilos.linea}>
      <h2 id={`${id}-titulo`} className={estilos.lineaTitulo}>
        {titulo}
      </h2>

      <div
        ref={caja}
        className={`${estilos.cinta} ${modo === "quieta" ? estilos.cintaQuieta : ""} ${modo === "manual" ? estilos.cintaManual : ""}`}
      >
        <ul aria-label={`Tipos de máquina ${nombre}`} className={estilos.pista}>
          {pista.map((t, i) => {
            // Solo la primera serie es navegable; el resto son copias para el bucle.
            const copia = i >= tipos.length;
            return (
              <li
                key={`${t.clave}-${i}`}
                aria-hidden={copia || undefined}
                className={estilos.cintaItem}
              >
                <a
                  href={`#${t.clave}`}
                  tabIndex={copia ? -1 : undefined}
                  className={estilos.tarjetaTipo}
                >
                  <span className={estilos.renderCaja}>
                    {t.render ? (
                      <Image
                        src={t.render.imagen.url}
                        alt=""
                        fill
                        sizes="280px"
                        className={`${estilos.renderImg} ${t.render.recortado ? "" : estilos.renderFoto}`}
                        style={
                          t.render.recortado
                            ? undefined
                            : { objectPosition: t.render.imagen.posicion }
                        }
                      />
                    ) : null}
                  </span>
                  <span className={estilos.tipoPie}>
                    <span className={estilos.tipoNombre}>{t.titulo}</span>
                    <span aria-hidden="true" className={estilos.tipoFlecha}>
                      <IconArrowRight size={18} stroke={2} />
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      {lineas.length > 0 ? (
        <p className={estilos.cierre}>
          {lineas.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </p>
      ) : null}
    </section>
  );
}
