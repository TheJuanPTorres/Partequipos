"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { useAhorroDeDatos } from "@/components/movimiento/useAhorroDeDatos";
import { useMovimientoReducido, usePausa } from "@/components/movimiento/useMovimiento";

import estilos from "./marcaLubricante.module.css";

/**
 * VÍDEO DE FONDO DE LA CABECERA de la marca de lubricantes (2026-10-19, cliente).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): decide en el navegador si carga el vídeo
 * y lo reproduce o pausa. La imagen de cabecera está siempre debajo, en el HTML, y es lo que
 * se ve primero y el candidato a LCP; el vídeo es un añadido.
 *
 * Solo en pantallas grandes: en móvil, con ahorro de datos o con «reducir movimiento» no se
 * carga ni se pinta nada, y queda la imagen quieta. Corre solo a la vista, sin sonido, y
 * lleva el botón de pausa de WCAG 2.2.2.
 */
const CONSULTA_GRANDE = "(min-width: 768px)";

function suscribirAncho(avisar: () => void) {
  const m = matchMedia(CONSULTA_GRANDE);
  m.addEventListener("change", avisar);
  return () => m.removeEventListener("change", avisar);
}

export function VideoCabecera({ url, idHero }: { url: string; idHero: string }) {
  const elVideo = useRef<HTMLVideoElement>(null);
  const reducido = useMovimientoReducido();
  const ahorro = useAhorroDeDatos();
  const grande = useSyncExternalStore(
    suscribirAncho,
    () => matchMedia(CONSULTA_GRANDE).matches,
    () => false,
  );
  const { pausado, alternar } = usePausa();
  const conVideo = grande && !reducido && !ahorro;

  useEffect(() => {
    const v = elVideo.current;
    const hero = document.getElementById(idHero);
    if (!conVideo || !v || !hero) return;
    if (pausado) {
      v.pause();
      return;
    }
    const observador = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) void v.play().catch(() => {});
      else v.pause();
    });
    observador.observe(hero);
    return () => observador.disconnect();
  }, [conVideo, pausado, idHero]);

  if (!conVideo) return null;
  return (
    <>
      <video
        ref={elVideo}
        className={estilos.heroVideo}
        src={url}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
      />
      <BotonPausa
        pausado={pausado}
        alPulsar={alternar}
        que="el vídeo"
        controla={idHero}
        className={estilos.pausaVideo}
      />
    </>
  );
}
