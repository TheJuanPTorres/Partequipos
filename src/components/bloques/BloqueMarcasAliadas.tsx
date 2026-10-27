"use client";

import Image from "next/image";
import { useEffect, useId, useState, type CSSProperties } from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { usePausa } from "@/components/movimiento/useMovimiento";
import type { TarjetaAliada, VistaMarcasAliadas as Datos } from "@/lib/bloques/vista";

import estilos from "./marcasAliadas.module.css";

/** Cada foto del fondo se ve 6 s y se releva con un fundido de 1,2 s. */
const POR_FOTO_MS = 6000;

/**
 * BLOQUE «MARCAS ALIADAS» (Nosotros) — diseño del cliente: las fotos de la franja de fondo, tenues
 * y en relevo lento, un velo oscuro, el título en blanco y una tarjeta por empresa del grupo.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): el relevo de fotos y el botón de pausa tienen
 * estado. Las tarjetas son enlaces normales, con el HTML completo desde el servidor.
 *
 * - Las fotos del fondo son decorativas (`alt` vacío); el relevo y el zoom se paran con el botón
 *   de pausa (WCAG 2.2.2) y con «reducir movimiento» el fondo queda quieto en su primera foto.
 * - Cada tarjeta abre la web de la empresa en una pestaña nueva (`noopener`) y lo avisa en su
 *   nombre accesible.
 */
export function BloqueMarcasAliadas({ titulo, fondos, tarjetas }: Datos) {
  const { pausado, alternar } = usePausa();
  const idFondo = useId();
  const idTitulo = useId();
  const [actual, setActual] = useState(0);

  useEffect(() => {
    if (pausado || fondos.length < 2) return;
    const reloj = window.setTimeout(() => setActual((i) => (i + 1) % fondos.length), POR_FOTO_MS);
    return () => window.clearTimeout(reloj);
  }, [actual, pausado, fondos.length]);

  return (
    <section className={estilos.seccion} aria-labelledby={idTitulo}>
      <div className={estilos.contenedor} data-pausado={pausado ? "" : undefined}>
        {fondos.length > 0 ? (
          <div className={estilos.fondo} aria-hidden="true">
            <div id={idFondo} className={estilos.fotos}>
              {fondos.map((f, i) => (
                <Image
                  key={f.url}
                  src={f.url}
                  alt=""
                  fill
                  sizes="100vw"
                  priority={i === 0}
                  data-actual={i === actual ? "" : undefined}
                  className={estilos.foto}
                  style={{ objectPosition: f.posicion }}
                />
              ))}
            </div>
            <span className={estilos.velo} />
          </div>
        ) : null}
        {fondos.length > 0 ? (
          <BotonPausa
            pausado={pausado}
            alPulsar={alternar}
            que="las fotos de fondo"
            controla={idFondo}
            className={estilos.pausa}
          />
        ) : null}

        <h2 id={idTitulo} className={estilos.titulo}>
          {titulo}
        </h2>

        <ul className={estilos.lista}>
          {tarjetas.map((t, i) => (
            <li key={t.id ?? i} className={estilos.item}>
              <Tarjeta aliada={t} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Tarjeta({ aliada: a }: { aliada: TarjetaAliada }) {
  const contenido = (
    <>
      <span className={estilos.logo}>
        {a.logo ? (
          <Image
            src={a.logo.url}
            alt=""
            width={a.logo.width}
            height={a.logo.height}
            sizes="200px"
            className={estilos.logoImagen}
          />
        ) : (
          a.nombre
        )}
      </span>
      <span className={estilos.visual}>
        {a.foto ? (
          <Image
            src={a.foto.url}
            alt=""
            fill
            sizes="(max-width: 559px) 100vw, (max-width: 1279px) 33vw, 20vw"
            className={estilos.fotoTarjeta}
            style={{ objectPosition: a.foto.posicion }}
          />
        ) : null}
        <span className={estilos.tinte} aria-hidden="true" />
        <span className={estilos.sombra} aria-hidden="true" />
        <span className={estilos.pie}>
          <span className={estilos.textos}>
            <span className={estilos.nombre}>{a.nombre}</span>
            {a.texto ? <span className={estilos.frase}>{a.texto}</span> : null}
          </span>
          {a.href ? (
            <span className={estilos.flecha} aria-hidden="true">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3.5 10.5 8 6 12.5" />
              </svg>
            </span>
          ) : null}
        </span>
      </span>
    </>
  );
  const estilo = a.color ? ({ "--aliada": a.color } as CSSProperties) : undefined;

  // Sin enlace (el editor no lo escribió) la tarjeta se ve igual, pero no es un enlace.
  return a.href ? (
    <a
      href={a.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${a.nombre}${a.texto ? `: ${a.texto}` : ""} (abre su sitio en una pestaña nueva)`}
      className={estilos.tarjeta}
      style={estilo}
    >
      {contenido}
    </a>
  ) : (
    <div className={estilos.tarjeta} style={estilo}>
      {contenido}
    </div>
  );
}
