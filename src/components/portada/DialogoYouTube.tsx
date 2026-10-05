"use client";

import { IconPlayerPlayFilled, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";

import { urlInsercion, type VideoYouTube } from "@/lib/fields/youtube";

import estilos from "./dialogoYouTube.module.css";

/**
 * VÍDEO DE YOUTUBE EN UNA VENTANA (secciones 7 y 10 de ux-9).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): abre y cierra un diálogo.
 *
 * LA VERSIÓN MÁS LIMPIA DE YOUTUBE (decisión de dirección del 2026-10-05,
 * decisiones-home-ux9.md §27.6):
 * - NADA de YouTube hasta que la persona pulsa REPRODUCIR. Al abrir la
 *   ventana se ve NUESTRA miniatura (la foto del testimonio) con nuestro botón;
 *   el iframe se crea al pulsarlo y se destruye al cerrar (y con él el sonido).
 * - Siempre desde `youtube-nocookie.com`, con `rel=0`. El único `autoplay` es
 *   el de ese clic: nada arranca solo.
 * - Con el iframe puesto, nada nuestro lo tapa: el botón de cerrar va FUERA
 *   del marco (lo exigen las condiciones de la API de YouTube).
 * - `<dialog>` nativo con `showModal()`, CENTRADO: encierra el foco, cierra con
 *   Escape y lo devuelve al botón que lo abrió (D20).
 * - El nombre accesible del botón dice QUÉ vídeo abre.
 */
type Miniatura = { url: string; alt: string; posicion?: string };

type Props = {
  video: VideoYouTube;
  /** Nombre accesible del botón, p. ej. «Ver el vídeo de Partequipos». */
  etiqueta: string;
  /** Título del iframe, para el lector de pantalla. */
  titulo: string;
  /** Nuestra imagen hasta que se pulse reproducir. Sin ella, fondo oscuro. */
  miniatura?: Miniatura | null;
  className?: string;
  children: ReactNode;
};

export function DialogoYouTube({ video, etiqueta, titulo, miniatura, className, children }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [reproduciendo, setReproduciendo] = useState(false);

  const abrir = () => {
    setAbierto(true);
    setReproduciendo(false);
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
          setReproduciendo(false);
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
          {abierto && reproduciendo ? (
            <iframe
              className={estilos.iframe}
              src={urlInsercion(video)}
              title={titulo}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : abierto ? (
            <button
              type="button"
              className={estilos.fachada}
              onClick={() => setReproduciendo(true)}
              aria-label={`Reproducir: ${titulo}`}
              // El foco va aquí al abrir (es lo único que se puede hacer).
              autoFocus
            >
              {miniatura ? (
                <Image
                  src={miniatura.url}
                  alt=""
                  fill
                  sizes="(max-width: 1132px) 100vw, 1100px"
                  className={estilos.miniatura}
                  style={{ objectPosition: miniatura.posicion }}
                />
              ) : null}
              <span className={estilos.play} aria-hidden="true">
                <IconPlayerPlayFilled focusable="false" />
              </span>
            </button>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
