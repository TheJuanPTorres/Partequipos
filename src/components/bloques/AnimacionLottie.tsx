"use client";

import type { AnimationItem } from "lottie-web";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { useMovimientoReducido } from "@/components/movimiento/useMovimiento";

import estilos from "./presentacionImagen.module.css";

type Props = {
  /** URL del JSON en el Blob. */
  src: string;
  /** Relación ancho/alto de la caja, la misma que la de la imagen fija. */
  proporcion: number;
  /** Qué se pausa, para el nombre accesible del botón: «la animación del mapa». */
  que?: string;
  /** La imagen fija (de servidor): se ve hasta que la animación está lista y siempre que no se anime. */
  children?: ReactNode;
};

type Estado = "esperando" | "lista" | "reproduciendo" | "pausada" | "terminada" | "fallo";

/**
 * ANIMACIÓN LOTTIE con imagen fija de respaldo (el mapa de sedes de Nosotros).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (§3.1): observa el scroll, carga una
 * biblioteca en el navegador y lleva el botón de pausa.
 *
 * Comportamiento, medido en la página de ux-9 (decisiones-nosotros.md §4):
 * espera en el fotograma 0 hasta que la caja asoma a la pantalla, se reproduce
 * UNA vez (6 s el mapa) y se queda en el último fotograma; no se repite.
 *
 * - **Carga perezosa:** lottie-web (versión ligera) y el JSON se piden por
 *   import dinámico y `fetch` SOLO cuando la caja está a menos de una pantalla.
 *   Ninguna otra página los descarga.
 * - **Sin CLS:** la caja tiene el tamaño de la imagen fija en todos los casos;
 *   la animación se pinta encima, en una capa absoluta.
 * - **Movimiento reducido o fallo de carga:** no se anima; queda la imagen.
 *   La imagen no se quita nunca del árbol de accesibilidad (solo se vuelve
 *   transparente): su texto alternativo es el nombre de lo que se ve.
 * - **Pausa (WCAG 2.2.2, desviación N4):** dura más de 5 s, así que mientras
 *   se mueve lleva botón de pausa. ux-9 no lo tiene.
 */
export function AnimacionLottie({ src, proporcion, que = "la animación", children }: Props) {
  const caja = useRef<HTMLDivElement>(null);
  const capa = useRef<HTMLDivElement>(null);
  const anim = useRef<AnimationItem | null>(null);
  const visible = useRef(false);
  const [estado, setEstado] = useState<Estado>("esperando");
  const [conFoco, setConFoco] = useState(false);
  const reducido = useMovimientoReducido();

  // Carga cuando la caja se acerca (una pantalla de margen).
  useEffect(() => {
    const el = caja.current;
    const destino = capa.current;
    if (!el || !destino || reducido) return;
    let cancelado = false;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        Promise.all([
          import("lottie-web/build/player/lottie_light"),
          fetch(src).then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json() as Promise<unknown>;
          }),
        ])
          .then(([{ default: lottie }, datos]) => {
            if (cancelado) return;
            const a = lottie.loadAnimation({
              container: destino,
              renderer: "svg",
              loop: false,
              autoplay: false,
              animationData: datos,
              rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
            });
            anim.current = a;
            a.addEventListener("DOMLoaded", () => {
              if (cancelado) return;
              if (visible.current) {
                a.play();
                setEstado("reproduciendo");
              } else {
                setEstado("lista");
              }
            });
            a.addEventListener("complete", () => setEstado("terminada"));
            a.addEventListener("data_failed", () => setEstado("fallo"));
          })
          .catch((e: unknown) => {
            if (cancelado) return;
            console.error("[animacion] no cargó; queda la imagen fija:", e);
            setEstado("fallo");
          });
      },
      { rootMargin: "100% 0px" },
    );
    obs.observe(el);
    return () => {
      cancelado = true;
      obs.disconnect();
      anim.current?.destroy();
      anim.current = null;
    };
  }, [src, reducido]);

  // Arranca al asomar a la pantalla (como ux-9: basta un píxel).
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        visible.current = entradas.some((e) => e.isIntersecting);
        if (visible.current && anim.current && estado === "lista") {
          anim.current.play();
          setEstado("reproduciendo");
        }
      },
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [estado]);

  useEffect(() => {
    if (estado === "fallo") {
      anim.current?.destroy();
      anim.current = null;
    }
  }, [estado]);

  const alternar = () => {
    const a = anim.current;
    if (!a) return;
    if (estado === "reproduciendo") {
      a.pause();
      setEstado("pausada");
    } else if (estado === "pausada") {
      a.play();
      setEstado("reproduciendo");
    } else if (estado === "terminada") {
      // Solo se ve si el botón tenía el foco al terminar: «Reproducir» la repite.
      a.goToAndPlay(0, true);
      setEstado("reproduciendo");
    }
  };

  const animada = !reducido && estado !== "esperando" && estado !== "fallo";
  const conBoton =
    !reducido &&
    (estado === "reproduciendo" || estado === "pausada" || (estado === "terminada" && conFoco));

  return (
    <div
      ref={caja}
      className={estilos.caja}
      style={{ aspectRatio: proporcion }}
      data-animada={animada ? "" : undefined}
      onFocus={() => setConFoco(true)}
      onBlur={() => setConFoco(false)}
    >
      {children}
      <div ref={capa} className={estilos.capaAnimacion} aria-hidden="true" />
      {conBoton ? (
        <BotonPausa
          pausado={estado !== "reproduciendo"}
          alPulsar={alternar}
          que={que}
          className={estilos.pausa}
        />
      ) : null}
    </div>
  );
}
