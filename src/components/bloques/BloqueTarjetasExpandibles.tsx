"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { Revelado } from "@/components/movimiento/Revelado";
import { usePausa } from "@/components/movimiento/useMovimiento";
import type { BloqueTarjetasExpandibles as Datos } from "@/lib/bloques/vista";

import { BotonBloque } from "./BotonBloque";
import estilos from "./tarjetasExpandibles.module.css";

/** ux-9 (`autoplay_delay` por defecto del widget): 4 s por tarjeta. */
const DEMORA_MS = 4000;
/** ux-9 (`responsive_breakpoint`): a 500 px o menos, en columna y sin rotación. */
const CONSULTA_COLUMNA = "(max-width: 500px)";

/**
 * BLOQUE «TARJETAS EXPANDIBLES» — antetítulo, título y N tarjetas con foto:
 * una abierta, las demás plegadas en una tira con el título en vertical
 * (Nosotros de ux-9, widget «Expanding Content Cards» `5872e232`).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): qué tarjeta está abierta
 * y la rotación automática son estado.
 *
 * Comportamiento, LEÍDO del JS del widget exportado
 * (`wordpress/widgtes/expanding_content_cards_elementor.zip`):
 * - Se abre una tarjeta al pulsarla; la rotación avanza cada 4 s con una barra
 *   de progreso y vuelve a contar desde cero tras una pulsación.
 * - La rotación se para con el ratón encima, con el foco dentro, con menos del
 *   20 % a la vista, con la pestaña oculta y a 500 px o menos.
 *
 * Lo que se aparta de ux-9 (docs/diseno/decisiones-nosotros.md §4):
 * - D2: botón de pausa; con movimiento reducido arranca parada.
 * - Teclado: cada tarjeta plegada es un `<button>` con `aria-expanded`; la
 *   abierta, el enlace (si lo tiene). Al abrir con el teclado, el foco pasa al
 *   enlace de la tarjeta abierta, que ocupa el mismo sitio.
 * - Sin la entrada con desenfoque de ux-9 (movimiento de una sola vez).
 */
export function BloqueTarjetasExpandibles({ antetitulo, titulo, tarjetas, boton }: Datos) {
  const [activa, setActiva] = useState(0);
  const { pausado, alternar } = usePausa();
  const base = useId();
  const lista = useRef<HTMLUListElement>(null);
  const barras = useRef<(HTMLSpanElement | null)[]>([]);
  const enfocables = useRef<(HTMLElement | null)[]>([]);
  const activaRef = useRef(0);
  const enfocar = useRef<number | null>(null);
  const estado = useRef({ transcurrido: 0, encima: false, foco: false, visible: true });
  const total = tarjetas.length;

  // Al cambiar de tarjeta: barras a cero y, si se abrió con el teclado, el foco.
  useEffect(() => {
    activaRef.current = activa;
    for (const b of barras.current) if (b) b.style.transform = "scaleX(0)";
    if (enfocar.current === activa) {
      enfocables.current[activa]?.focus();
      enfocar.current = null;
    }
  }, [activa]);

  // Rotación automática.
  useEffect(() => {
    const raiz = lista.current;
    if (!raiz || pausado || total < 2) return;
    const columna = matchMedia(CONSULTA_COLUMNA);
    const s = estado.current;
    const observador = new IntersectionObserver(
      ([e]) => {
        s.visible = !!e?.isIntersecting;
      },
      { threshold: 0.2 },
    );
    observador.observe(raiz);

    let frame = 0;
    let antes: number | null = null;
    const tick = (ahora: number) => {
      frame = requestAnimationFrame(tick);
      if (antes === null) {
        antes = ahora;
        return;
      }
      const delta = Math.min(ahora - antes, 100);
      antes = ahora;
      if (document.hidden || s.encima || s.foco || !s.visible || columna.matches) return;
      s.transcurrido += delta;
      const barra = barras.current[activaRef.current];
      if (barra) barra.style.transform = `scaleX(${Math.min(s.transcurrido / DEMORA_MS, 1)})`;
      if (s.transcurrido >= DEMORA_MS) {
        s.transcurrido = 0;
        setActiva((a) => (a + 1) % total);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observador.disconnect();
    };
  }, [pausado, total]);

  if (total === 0) return null;

  const abrir = (i: number, e: MouseEvent) => {
    estado.current.transcurrido = 0;
    // `detail` 0: la pulsación vino del teclado (Intro o Espacio).
    if (e.detail === 0) enfocar.current = i;
    setActiva(i);
  };

  const idTitulo = `${base}-titulo`;
  const idLista = `${base}-lista`;

  return (
    <section className={estilos.seccion} aria-labelledby={idTitulo}>
      <div className={estilos.interior}>
        {antetitulo ? <p className={`${estilos.antetitulo} texto-etiqueta`}>{antetitulo}</p> : null}
        <Revelado
          como="h2"
          id={idTitulo}
          texto={titulo}
          disparo={0.95}
          className={`${estilos.titulo} texto-titulo-seccion`}
        />
        <div className={estilos.caja}>
          <ul
            ref={lista}
            id={idLista}
            className={estilos.tarjetas}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") estado.current.encima = true;
            }}
            onPointerLeave={() => {
              estado.current.encima = false;
            }}
            onFocus={() => {
              estado.current.foco = true;
            }}
            onBlur={(e) => {
              estado.current.foco = e.currentTarget.contains(e.relatedTarget as Node | null);
            }}
          >
            {tarjetas.map((t, i) => {
              const abierta = i === activa;
              const idTexto = `${base}-texto-${i}`;
              const guardar = (el: HTMLElement | null) => {
                enfocables.current[i] = el;
              };
              return (
                /*
                 * Toda la tarjeta plegada se abre con el ratón, como en ux-9.
                 * Es solo una ayuda al puntero: el control accesible es el
                 * botón del título, que recibe el foco y el teclado.
                 */
                <li
                  key={t.id ?? i}
                  className={estilos.tarjeta}
                  data-abierta={abierta ? "" : undefined}
                  onClick={abierta ? undefined : (e) => abrir(i, e)}
                >
                  {t.imagen ? (
                    <Image
                      src={t.imagen.url}
                      alt=""
                      fill
                      sizes="(max-width: 500px) 92vw, 85vw"
                      className={estilos.foto}
                      style={{ objectPosition: t.imagen.posicion }}
                    />
                  ) : null}
                  <div className={estilos.sombra} aria-hidden="true" />
                  {total > 1 ? (
                    <div className={estilos.progreso} aria-hidden="true">
                      <span
                        ref={(el) => {
                          barras.current[i] = el;
                        }}
                      />
                    </div>
                  ) : null}
                  <div className={estilos.etiqueta}>
                    <h3 className={estilos.nombre}>
                      {abierta && t.href ? (
                        <a ref={guardar} href={t.href} className={estilos.disparador}>
                          {t.titulo}
                        </a>
                      ) : (
                        <button
                          ref={guardar}
                          type="button"
                          className={estilos.disparador}
                          aria-expanded={abierta}
                          aria-controls={t.texto ? idTexto : undefined}
                          onClick={(e) => {
                            // El `<li>` también abre: sin esto, la pulsación contaría dos veces.
                            e.stopPropagation();
                            abrir(i, e);
                          }}
                        >
                          {t.titulo}
                        </button>
                      )}
                    </h3>
                    {t.texto ? (
                      <p id={idTexto} className={estilos.texto} hidden={!abierta}>
                        {t.texto}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {boton || total > 1 ? (
        <div className={estilos.pie}>
          {boton ? <BotonBloque boton={boton} /> : null}
          {total > 1 ? (
            <BotonPausa
              pausado={pausado}
              alPulsar={alternar}
              que="la rotación de las tarjetas"
              controla={idLista}
              className={estilos.pausa}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
