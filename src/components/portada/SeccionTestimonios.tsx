"use client";

import { IconPlayerPlayFilled } from "@tabler/icons-react";
import Image from "next/image";
import { useState, type CSSProperties, type PointerEvent } from "react";

import { Revelado } from "@/components/movimiento/Revelado";
import { ADELANTOS } from "@/components/movimiento/ritmos";
import { tarjetaInicial, type TarjetaTestimonio } from "@/lib/portada/seccionesH";

import { DialogoYouTube } from "./DialogoYouTube";
import estilos from "./testimonios.module.css";

/**
 * SECCIÓN 10 DE LA PORTADA — testimonios en acordeón (ux-9, widget de Andrés
 * «Acordeón de vídeo con popup», leído en su código).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): la tarjeta abierta es
 * estado, y cambia al pasar el ratón.
 *
 * Como ux-9: pista de 560 px con 12 de hueco; la abierta (la segunda al
 * cargar) crece ×3; las demás, desenfocadas 14 px. Con ratón se abre al pasar
 * por encima y al salir vuelve a la inicial; con dedo o teclado, al pulsar.
 * Por debajo de 768 px se apilan: 96 px cerradas, 460 la abierta.
 *
 * SIN DESPLAZAMIENTO DE LAYOUT (CLS) AL PASAR EL RATÓN. El widget de ux-9
 * cambia el `flex-grow`: cada pasada movía las tarjetas y sumaba ~0,19 de CLS
 * medido (mover el ratón no es una «entrada» que lo excluya). Aquí, a 768 px o
 * más, todas miden lo que la abierta y se colocan con `transform`; la parte
 * visible la recorta `clip-path`. Ninguna de las dos mueve el layout. Con
 * `cover`, el recorte centrado de la caja ancha enseña lo mismo que la caja
 * estrecha de ux-9 (§20).
 *
 * Lo que se aparta (docs/diseno/decisiones-home-ux9.md §20):
 * - D1: el título en `<h2>` y cada testimonio en `<h3>`.
 * - D20: el vídeo en el `<dialog>` común (foco dentro y devuelto siempre).
 * - D23: cada tarjeta es un botón con `aria-expanded`; el texto de las
 *   cerradas, oculto también al lector. «Ver Video» dice de quién es.
 * - D2: con movimiento reducido, sin la transición ni el desenfoque animado.
 */
export type TextosTestimonios = { titulo: string; verVideoTexto: string };

type Props = { tarjetas: TarjetaTestimonio[]; textos: TextosTestimonios };

/** Ancho pintado de la foto: la abierta, ~660 px a 1440; en móvil, toda. */
const SIZES_FOTO = "(max-width: 767px) 100vw, 50vw";

export function SeccionTestimonios({ tarjetas, textos }: Props) {
  const inicial = tarjetaInicial(tarjetas.length);
  const [activa, setActiva] = useState(inicial);
  if (tarjetas.length === 0) return null;

  const conRaton = (e: PointerEvent) => e.pointerType === "mouse";

  return (
    <section className={estilos.seccion} aria-labelledby="portada-testimonios-titulo">
      {textos.titulo ? (
        <Revelado
          adelanto={ADELANTOS.bajo}
          como="h2"
          id="portada-testimonios-titulo"
          texto={textos.titulo}
          ritmo="titulo"
          disparo={0.95}
          className={`${estilos.titulo} texto-titulo-seccion`}
        />
      ) : null}
      <div
        className={estilos.pista}
        style={{ "--testimonios-n": tarjetas.length } as CSSProperties}
        onPointerLeave={(e) => {
          if (conRaton(e)) setActiva(inicial);
        }}
      >
        {tarjetas.map((t, i) => {
          const abierta = i === activa;
          const idTitulo = `portada-testimonio-${i + 1}`;
          const idContenido = `${idTitulo}-texto`;
          return (
            <article
              key={t.id}
              className={estilos.tarjeta}
              data-activa={abierta ? "" : undefined}
              aria-labelledby={idTitulo}
              style={
                {
                  "--i": i,
                  "--abierta": abierta ? 1 : 0,
                  "--tras-abierta": i > activa ? 1 : 0,
                } as CSSProperties
              }
              onPointerEnter={(e) => {
                if (conRaton(e)) setActiva(i);
              }}
            >
              <div className={estilos.medio}>
                {t.foto ? (
                  <Image
                    src={t.foto.url}
                    alt={t.foto.alt}
                    fill
                    sizes={SIZES_FOTO}
                    className={estilos.img}
                    style={{ objectPosition: t.foto.posicion }}
                  />
                ) : null}
              </div>
              <div className={estilos.sombra} aria-hidden="true" />
              {/* Toda la tarjeta se abre con este botón; el nombre lo da su título. */}
              <button
                type="button"
                className={estilos.abrir}
                aria-expanded={abierta}
                aria-controls={idContenido}
                aria-labelledby={idTitulo}
                onClick={() => setActiva(i)}
              />
              {t.youtube ? (
                <DialogoYouTube
                  video={t.youtube}
                  etiqueta={`Ver el vídeo de ${t.titulo}`}
                  titulo={`Testimonio de ${t.titulo}`}
                  miniatura={t.foto}
                  className={estilos.ver}
                >
                  <IconPlayerPlayFilled aria-hidden="true" focusable="false" />
                  <span aria-hidden="true">{textos.verVideoTexto}</span>
                </DialogoYouTube>
              ) : null}
              <div id={idContenido} className={estilos.contenido} aria-hidden={!abierta}>
                <h3 id={idTitulo} className={estilos.nombre}>
                  {t.titulo}
                </h3>
                {t.subtitulo ? <p className={estilos.lugar}>{t.subtitulo}</p> : null}
                <p className={estilos.texto}>{t.texto}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
