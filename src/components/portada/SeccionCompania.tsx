"use client";

import { IconPlayerPlayFilled } from "@tabler/icons-react";
import Image from "next/image";
import { useEffect, useId, useRef } from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { Revelado } from "@/components/movimiento/Revelado";
import { ADELANTOS } from "@/components/movimiento/ritmos";
import { useMovimientoReducido, usePausa } from "@/components/movimiento/useMovimiento";
import type { VideoYouTube } from "@/lib/fields/youtube";
import type { VideoCompania } from "@/lib/portada/seccionesF";

import estilos from "./compania.module.css";
import { DialogoYouTube } from "./DialogoYouTube";

/**
 * SECCIONES 6 Y 7 DE LA PORTADA — «Nuestra Compañía» (ux-9).
 *
 * La 6 de ux-9 no pinta nada: es el código del efecto. Aquí ese efecto va
 * dentro de esta sección, sin GSAP (docs/diseno/decisiones-home-ux9.md §19).
 *
 * COREOGRAFÍA (decisión de dirección del 2026-10-05, §27.5), por scroll y en
 * TODOS los anchos:
 * 1. El vídeo se FIJA (CSS `sticky`) 700 px de scroll y se encoge a 0,4 (0,55 en
 *    móvil) con radio 32, en la primera mitad del recorrido.
 * 2. Mientras termina de encogerse, aparece el texto infinito que tiene detrás.
 * 3. Al soltarse el fijado entra la sección 8, DEBAJO (nunca encima del vídeo),
 *    y su título hace su barrido al entrar.
 *    EN MÓVIL (dirección, 2026-10-06) todo pasa en la misma pantalla: la
 *    vídeo se encoge anclado arriba (a un 6 % del alto) para dejar sitio
 *    debajo; la sección 8 sube para que su título acabe 24 px bajo él
 *    (`catalogo.module.css`), y el encogido termina justo cuando ese título
 *    empieza a entrar por abajo, con la sección todavía fija.
 * Una capa blanca fija entra en el primer 8 % del recorrido y se apaga del 75 al
 * 100 %, como ux-9. Con movimiento reducido, todo estático en su sitio: el
 * vídeo a tamaño completo, el texto debajo y quieto, sin fijado.
 * Sin CLS: el alto del recorrido es fijo en el CSS y solo se mueven
 * `transform` y `opacity`.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): reproduce y pausa el
 * vídeo, escucha el scroll y mide el texto en movimiento.
 *
 * Lo que se aparta de ux-9:
 * - D1: título en `<h2>`, el texto en `<p>` (en ux-9, `<h3>`).
 * - D2: botón de pausa del vídeo y del texto en movimiento; con movimiento
 *   reducido, ni vídeo ni encogido ni texto en movimiento: el póster.
 * - D21: el texto en movimiento no recibe foco (en ux-9 su primer enlace sí,
 *   y queda invisible tras el vídeo). Sigue siendo un enlace con el ratón.
 * - Sin vídeo (producción, mientras el de ux-9 siga en L3): la tarjeta se pinta
 *   en oscuro con su texto. Sin YouTube, sin botón de reproducir.
 */

/** El recorrido fijado (el `.recorrido` del CSS suma estos 700 px). */
const RECORRIDO_PX = 700;
/** Fases, en fracción del recorrido: encogido y aparición del texto infinito. */
const FIN_ENCOGIDO = 0.5;
const TEXTO_DESDE = 0.35;
const TEXTO_HASTA = 0.65;
/** ux-9: `END_SCALE` y `END_RADIUS`; en móvil se queda más grande para que se vea. */
const ESCALA_FINAL = 0.4;
const ESCALA_FINAL_MOVIL = 0.55;
const RADIO_FINAL_PX = 32;
/** Móvil: del pie del vídeo encogido al título de la sección 8 (igual en el CSS). */
const TITULO_BAJO_VIDEO_PX = 24;
/**
 * Móvil: el vídeo se encoge anclado ARRIBA y baja hasta este 6 % del alto
 * (`compania.module.css`), para dejar debajo sitio al título de la 8.
 */
const BAJADA_MOVIL = 0.06;

/**
 * En móvil, la fracción del recorrido en la que acaba el encogido: cuando el
 * título de la sección 8 asoma por abajo. Le quedan por subir lo que mide la
 * franja libre bajo el vídeo encogido menos su hueco.
 */
function finEncogidoMovil(alto: number): number {
  const subida = (1 - BAJADA_MOVIL - ESCALA_FINAL_MOVIL) * alto - TITULO_BAJO_VIDEO_PX;
  return Math.min(0.9, Math.max(FIN_ENCOGIDO, 1 - subida / RECORRIDO_PX));
}
/** ux-9: `scrub: 0.6` — el efecto alcanza al scroll en ~0,6 s. */
const ALCANCE_S = 0.6;
/** ux-9: `MQ_SPEED`. */
const MARQUEE_PX_S = 90;
const MARQUEE_REPETICIONES = 3;

export type TextosCompania = {
  titulo: string;
  texto: string;
  marquesina: string;
  marquesinaEnlace: string;
};

type Props = { video: VideoCompania | null; youtube: VideoYouTube | null; textos: TextosCompania };

/** La capa blanca de ux-9: entra en el primer 8 %, se apaga del 75 % al 100 %. */
function opacidadFondo(p: number): number {
  if (p <= 0 || p >= 1) return 0;
  if (p < 0.08) return p / 0.08;
  if (p < 0.75) return 1;
  return 1 - (p - 0.75) / 0.25;
}

const tramo = (p: number, desde: number, hasta: number) =>
  Math.min(1, Math.max(0, (p - desde) / (hasta - desde)));

export function SeccionCompania({ video, youtube, textos }: Props) {
  const recorrido = useRef<HTMLDivElement>(null);
  const encoge = useRef<HTMLDivElement>(null);
  const fondo = useRef<HTMLDivElement>(null);
  const tarjeta = useRef<HTMLDivElement>(null);
  const pista = useRef<HTMLDivElement>(null);
  const marquee = useRef<HTMLDivElement>(null);
  const grupo = useRef<HTMLDivElement>(null);
  const elVideo = useRef<HTMLVideoElement>(null);
  const reducido = useMovimientoReducido();
  const { pausado, alternar } = usePausa();
  const idTarjeta = useId();

  // Vídeo: solo suena a la vista y si nadie lo ha pausado.
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
  }, [pausado]);

  // Texto en movimiento a 90 px/s: la duración sale del ancho real del grupo.
  useEffect(() => {
    const g = grupo.current;
    const p = pista.current;
    if (!g || !p) return;
    const medir = () => {
      const ancho = g.getBoundingClientRect().width;
      if (ancho > 0) p.style.setProperty("--marquee-duracion", `${ancho / MARQUEE_PX_S}s`);
    };
    void document.fonts?.ready.then(medir);
    medir();
    addEventListener("resize", medir);
    return () => removeEventListener("resize", medir);
  }, []);

  // Coreografía ligada al scroll, en todos los anchos, si hay movimiento.
  useEffect(() => {
    const zona = recorrido.current;
    const caja = encoge.current;
    const blanco = fondo.current;
    const texto = marquee.current;
    if (!zona || !caja || !blanco || !texto || reducido) return;
    const mq = matchMedia("(max-width: 767px)");
    let frame = 0;
    let actual = 0;
    let antes = 0;

    const objetivo = () => {
      const inicio = zona.getBoundingClientRect().top + scrollY;
      return Math.min(1, Math.max(0, (scrollY - inicio) / RECORRIDO_PX));
    };
    const pintar = (ahora: number) => {
      const meta = objetivo();
      const dt = antes ? (ahora - antes) / 1000 : 1;
      antes = ahora;
      // Alcanza a la meta en ~0,6 s, como el `scrub` de ux-9.
      actual += (meta - actual) * Math.min(1, dt / (ALCANCE_S / 4));
      if (Math.abs(meta - actual) < 0.001) actual = meta;
      const fin = mq.matches ? finEncogidoMovil(innerHeight) : FIN_ENCOGIDO;
      // El texto infinito aparece alrededor del final del encogido (0,35–0,65 en escritorio).
      const desdeTexto = fin - (FIN_ENCOGIDO - TEXTO_DESDE);
      const hastaTexto = Math.min(1, fin + (TEXTO_HASTA - FIN_ENCOGIDO));
      const encogido = tramo(actual, 0, fin);
      const final = mq.matches ? ESCALA_FINAL_MOVIL : ESCALA_FINAL;
      caja.style.setProperty("--compania-escala", String(1 - (1 - final) * encogido));
      caja.style.setProperty("--compania-encogido", String(encogido));
      caja.style.setProperty("--compania-radio", `${RADIO_FINAL_PX * encogido}px`);
      texto.style.opacity = String(tramo(actual, desdeTexto, hastaTexto));
      blanco.style.opacity = String(opacidadFondo(actual));
      frame = actual === meta ? 0 : requestAnimationFrame(pintar);
    };
    const alScroll = () => {
      if (!frame) {
        antes = 0;
        frame = requestAnimationFrame(pintar);
      }
    };

    let escuchando = false;
    const observador = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting && !escuchando) {
        addEventListener("scroll", alScroll, { passive: true });
        escuchando = true;
        alScroll();
      } else if (!e?.isIntersecting && escuchando) {
        removeEventListener("scroll", alScroll);
        escuchando = false;
      }
    });
    observador.observe(zona);
    mq.addEventListener("change", alScroll);
    return () => {
      observador.disconnect();
      removeEventListener("scroll", alScroll);
      mq.removeEventListener("change", alScroll);
      if (frame) cancelAnimationFrame(frame);
      caja.style.removeProperty("--compania-escala");
      caja.style.removeProperty("--compania-encogido");
      caja.style.removeProperty("--compania-radio");
      texto.style.removeProperty("opacity");
      blanco.style.opacity = "0";
    };
  }, [reducido]);

  const grupoMarquee = (oculto: boolean) => (
    <div ref={oculto ? undefined : grupo} className={estilos.grupo}>
      {Array.from({ length: MARQUEE_REPETICIONES }, (_, i) => (
        <a
          key={i}
          href={textos.marquesinaEnlace || undefined}
          className={estilos.item}
          tabIndex={-1}
        >
          {textos.marquesina}
          <span className={estilos.separador}>•</span>
        </a>
      ))}
    </div>
  );

  return (
    <section
      className={estilos.seccion}
      aria-labelledby="portada-compania-titulo"
      data-con-video={video ? "" : undefined}
    >
      <div ref={fondo} className={estilos.fondoBlanco} aria-hidden="true" />
      <div ref={recorrido} className={estilos.recorrido}>
        <div className={estilos.fijado}>
          {/* Detrás del vídeo: se descubre al encogerse. Decorativo para el lector (D21). */}
          <div
            ref={marquee}
            className={estilos.marquee}
            aria-hidden="true"
            data-pausado={pausado ? "" : undefined}
          >
            <div ref={pista} className={estilos.pista}>
              {grupoMarquee(false)}
              {grupoMarquee(true)}
            </div>
          </div>
          <div ref={encoge} className={estilos.encoge}>
            <div ref={tarjeta} id={idTarjeta} className={estilos.tarjeta}>
              {video?.poster ? (
                <Image
                  src={video.poster.url}
                  alt=""
                  fill
                  sizes="100vw"
                  className={estilos.medio}
                  style={{ objectPosition: video.poster.posicion }}
                />
              ) : null}
              {video ? (
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
              <div className={estilos.contenido}>
                <Revelado
                  adelanto={ADELANTOS.medio}
                  como="h2"
                  id="portada-compania-titulo"
                  texto={textos.titulo}
                  ritmo="pausado"
                  disparo={0.85}
                  className={`${estilos.titulo} texto-titulo-seccion`}
                />
                <Revelado
                  adelanto={ADELANTOS.medio}
                  como="p"
                  texto={textos.texto}
                  ritmo="pausado"
                  disparo={0.85}
                  className={`${estilos.texto} texto-destacado`}
                />
                {youtube ? (
                  <DialogoYouTube
                    video={youtube}
                    etiqueta="Ver el vídeo de Partequipos"
                    titulo="Vídeo de Partequipos"
                    className={estilos.reproducir}
                  >
                    <IconPlayerPlayFilled aria-hidden="true" focusable="false" />
                  </DialogoYouTube>
                ) : null}
              </div>
              {/* Sin vídeo, el texto en movimiento (solo > 768 px) sigue necesitando pausa. */}
              <BotonPausa
                pausado={pausado}
                alPulsar={alternar}
                que={video ? "el vídeo y el texto en movimiento" : "el texto en movimiento"}
                controla={idTarjeta}
                className={estilos.pausa}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
