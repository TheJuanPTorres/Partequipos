"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { Revelado } from "@/components/movimiento/Revelado";
import { useMovimientoReducido, usePausa } from "@/components/movimiento/useMovimiento";
import type { BloqueCabeceraVideo as Datos } from "@/lib/bloques/vista";

import estilos from "./cabeceraVideo.module.css";

/**
 * BLOQUE «CABECERA CON VÍDEO» — la tarjeta de arriba de Nosotros en ux-9
 * (contenedor `36e8a780`): vídeo de fondo en bucle, velo negro y el título de
 * la página. Lleva el ÚNICO `<h1>` de una página con bloques.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): reproduce y pausa el vídeo.
 *
 * - La imagen (el póster del vídeo, o la del bloque) se pinta siempre debajo,
 *   con prioridad: es lo primero que se ve y el candidato a LCP.
 * - El vídeo solo corre a la vista. Lo que se aparta de ux-9
 *   (docs/diseno/decisiones-nosotros.md §4): botón de pausa (D2) y, con
 *   movimiento reducido, ni vídeo: la imagen quieta.
 * - El antetítulo es un `<p>` (en ux-9, un `div`) y el título el `<h1>`.
 */
export function BloqueCabeceraVideo({ antetitulo, titulo, video, imagen }: Datos) {
  const elVideo = useRef<HTMLVideoElement>(null);
  const tarjeta = useRef<HTMLDivElement>(null);
  const reducido = useMovimientoReducido();
  const { pausado, alternar } = usePausa();
  const idTarjeta = useId();
  const fondo = video?.poster ?? imagen;
  const conVideo = video !== null && !reducido;

  useEffect(() => {
    const v = elVideo.current;
    const t = tarjeta.current;
    if (!v || !t) return;
    if (pausado) {
      v.pause();
      return;
    }
    const observador = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) void v.play().catch(() => {});
      else v.pause();
    });
    observador.observe(t);
    return () => observador.disconnect();
  }, [pausado, conVideo]);

  return (
    <section className={estilos.seccion}>
      <div ref={tarjeta} id={idTarjeta} className={estilos.tarjeta}>
        {fondo ? (
          <Image
            src={fondo.url}
            alt=""
            fill
            priority
            sizes="97vw"
            className={estilos.medio}
            style={{ objectPosition: fondo.posicion }}
          />
        ) : null}
        {conVideo ? (
          <video
            ref={elVideo}
            className={estilos.medio}
            src={video.url}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden={video.decorativo ? true : undefined}
            aria-label={video.decorativo ? undefined : video.descripcion}
          />
        ) : null}
        <div className={estilos.velo} aria-hidden="true" />
        <div className={estilos.contenido}>
          {antetitulo ? (
            <Revelado
              como="p"
              texto={antetitulo}
              alCargar
              className={`${estilos.texto} texto-titulo-4`}
            />
          ) : null}
          <Revelado
            como="h1"
            texto={titulo}
            alCargar
            className={`${estilos.texto} texto-titulo-seccion`}
          />
        </div>
        {conVideo ? (
          <BotonPausa
            pausado={pausado}
            alPulsar={alternar}
            que="el vídeo"
            controla={idTarjeta}
            className={estilos.pausa}
          />
        ) : null}
      </div>
    </section>
  );
}
