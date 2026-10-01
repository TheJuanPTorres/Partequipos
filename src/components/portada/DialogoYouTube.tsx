"use client";

import { IconX } from "@tabler/icons-react";
import { useRef, useState, type ReactNode } from "react";

import { urlInsercion, type VideoYouTube } from "@/lib/fields/youtube";

import estilos from "./dialogoYouTube.module.css";

/**
 * VÍDEO DE YOUTUBE EN UNA VENTANA (secciones 7 y 10 de ux-9).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): abre y cierra un diálogo.
 *
 * - NADA de YouTube hasta pulsar: el iframe se crea al abrir y se destruye al
 *   cerrar (y con él el sonido). Siempre desde `youtube-nocookie.com`.
 * - `<dialog>` nativo con `showModal()`: encierra el foco, cierra con Escape y
 *   lo devuelve al botón que lo abrió. ux-9 solo lo devolvía si se abrió con
 *   teclado (D20).
 * - El nombre accesible del botón dice QUÉ vídeo abre: la forma visible puede
 *   ser solo un icono, o repetirse («Ver vídeo») en varias tarjetas.
 */
type Props = {
  video: VideoYouTube;
  /** Nombre accesible del botón, p. ej. «Ver el vídeo de Partequipos». */
  etiqueta: string;
  /** Título del iframe, para el lector de pantalla. */
  titulo: string;
  className?: string;
  children: ReactNode;
};

export function DialogoYouTube({ video, etiqueta, titulo, className, children }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);

  const abrir = () => {
    setAbierto(true);
    dialogo.current?.showModal();
  };
  const cerrar = () => dialogo.current?.close();

  return (
    <>
      <button
        ref={boton}
        type="button"
        className={className}
        aria-label={etiqueta}
        aria-haspopup="dialog"
        onClick={abrir}
      >
        {children}
      </button>
      <dialog
        ref={dialogo}
        className={estilos.dialogo}
        aria-label={titulo}
        onClose={() => {
          setAbierto(false);
          boton.current?.focus();
        }}
        // Pulsar fuera del vídeo (en el fondo) también cierra.
        onClick={(e) => {
          if (e.target === e.currentTarget) cerrar();
        }}
      >
        <div className={estilos.marco}>
          <button
            type="button"
            className={estilos.cerrar}
            onClick={cerrar}
            aria-label="Cerrar el vídeo"
          >
            <IconX aria-hidden="true" focusable="false" stroke={2} />
          </button>
          {abierto ? (
            <iframe
              className={estilos.iframe}
              src={urlInsercion(video)}
              title={titulo}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}
