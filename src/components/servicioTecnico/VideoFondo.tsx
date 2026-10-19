"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { useAhorroDeDatos } from "@/components/movimiento/useAhorroDeDatos";
import { useMovimientoReducido, usePausa } from "@/components/movimiento/useMovimiento";
import type { VideoBloque } from "@/lib/bloques/vista";

const ESCRITORIO = "(min-width: 768px)";

function suscribir(avisar: () => void) {
  const m = matchMedia(ESCRITORIO);
  m.addEventListener("change", avisar);
  return () => m.removeEventListener("change", avisar);
}

/**
 * VÍDEO DE FONDO de la página de servicio técnico (cabecera y alistamiento).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): reproduce y pausa el vídeo.
 *
 * Ligero en móvil: el vídeo SOLO se pide en pantallas de 768 px o más, sin
 * «reducir movimiento» y sin ahorro de datos; en los demás casos se queda la
 * foto que el servidor pinta debajo (el póster). Solo corre a la vista y lleva
 * su botón de pausa (WCAG 2.2.2). Va encima de la foto, sin ocupar sitio propio:
 * no mueve nada al aparecer (CLS 0).
 */
export function VideoFondo({
  video,
  claseCaja,
  claseVideo,
  clasePausa,
}: {
  video: VideoBloque;
  claseCaja?: string;
  claseVideo?: string;
  clasePausa?: string;
}) {
  const elVideo = useRef<HTMLVideoElement>(null);
  const caja = useRef<HTMLDivElement>(null);
  const id = useId();
  const reducido = useMovimientoReducido();
  const ahorro = useAhorroDeDatos();
  const escritorio = useSyncExternalStore(
    suscribir,
    () => matchMedia(ESCRITORIO).matches,
    () => false,
  );
  const { pausado, alternar } = usePausa();
  const activo = escritorio && !reducido && !ahorro;

  useEffect(() => {
    const v = elVideo.current;
    const c = caja.current;
    if (!v || !c) return;
    if (pausado) {
      v.pause();
      return;
    }
    const observador = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) void v.play().catch(() => {});
      else v.pause();
    });
    observador.observe(c);
    return () => observador.disconnect();
  }, [pausado, activo]);

  return (
    <div ref={caja} id={id} className={claseCaja}>
      {activo ? (
        <>
          <video
            ref={elVideo}
            className={claseVideo}
            src={video.url}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden={video.decorativo ? true : undefined}
            aria-label={video.decorativo ? undefined : video.descripcion}
          />
          <BotonPausa
            pausado={pausado}
            alPulsar={alternar}
            que="el vídeo de fondo"
            controla={id}
            className={clasePausa}
          />
        </>
      ) : null}
    </div>
  );
}
