"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";

import estilos from "./movimiento.module.css";
import {
  curvaAproximada,
  curvaCss,
  margenDeDisparo,
  partirEnPalabras,
  pasoElDisparo,
  resolverRitmo,
  textoPlano,
  type NombreRitmo,
  type Ritmo,
} from "./ritmos";
import { useMovimientoReducido } from "./useMovimiento";

type Etiqueta = "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span";

type Props = Partial<Ritmo> & {
  /** El texto. `\n` fuerza un salto de línea, como el `<br>` del widget. */
  texto: string;
  /** Etiqueta real. Por defecto `h2`, como el widget. */
  como?: Etiqueta;
  /** Uno de los tres ritmos de ux-9; `disparo`, `curva`… lo ajustan por instancia. */
  ritmo?: NombreRitmo;
  className?: string;
  id?: string;
};

const ES_ENCABEZADO = new Set<Etiqueta>(["h1", "h2", "h3", "h4"]);

/**
 * TEXTO QUE SE REVELA POR PALABRAS AL LLEGAR CON EL SCROLL — sin GSAP.
 *
 * Replica el widget de Andrés (ver `ritmos.ts`): máscara por palabra,
 * `translateY` en % del alto de la palabra y opacidad, con escalón. Lo mueve una
 * TRANSICIÓN de CSS; aquí solo se decide CUÁNDO, con un IntersectionObserver.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (§3.1): necesita IntersectionObserver y
 * `matchMedia`. El texto se prerenderiza igual en el servidor: está entero en el
 * HTML, así que lo ven buscadores y quien no tenga JavaScript.
 *
 * TRES GARANTÍAS, y el porqué de cada una:
 *
 * 1. SIN JAVASCRIPT SE VE. El estado «oculto para animar» NO está en el HTML: lo
 *    pone este componente al montarse. Si el JS no llega, no hay nada oculto.
 * 2. CON `prefers-reduced-motion` SE VE ENTERO Y QUIETO. No se prepara nada, y
 *    además el CSS lo fuerza por si la preferencia cambia a mitad de animación.
 * 3. EL LECTOR DE PANTALLA LEE UNA FRASE, NO PALABRAS SUELTAS. En encabezados el
 *    nombre accesible es el texto entero (`aria-label`) y las cajas por palabra
 *    se ocultan al árbol de accesibilidad. En un párrafo `aria-label` no está
 *    permitido, así que ahí se dejan las palabras legibles.
 *
 * LIMITACIÓN CONOCIDA: un bloque que ya está a la vista AL CARGAR se pinta
 * visible, se oculta al hidratar y se revela. Es el precio de la garantía 1; en
 * la home solo afecta al hero, y se decide con él (fase C).
 */
export function Revelado({
  texto,
  como = "h2",
  ritmo = "titulo",
  className,
  id,
  ...ajustes
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reducido = useMovimientoReducido();
  const r = resolverRitmo(ritmo, ajustes);
  const lineas = partirEnPalabras(texto);
  const encabezado = ES_ENCABEZADO.has(como);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducido) {
      el.dataset.revelado = "visible";
      return;
    }

    el.dataset.revelado = "preparado";
    const decidir = () => {
      const dentro = pasoElDisparo(el.getBoundingClientRect().top, innerHeight, r.disparo);
      if (dentro) el.dataset.revelado = "visible";
      else if (!r.unaVez) el.dataset.revelado = "preparado";
      return dentro;
    };

    const observador = new IntersectionObserver(
      () => {
        if (decidir() && r.unaVez) observador.disconnect();
      },
      { rootMargin: margenDeDisparo(r.disparo) },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, [reducido, r.disparo, r.unaVez]);

  const variables = {
    "--revelado-escalon": `${r.escalon}s`,
    "--revelado-duracion": `${r.duracion}s`,
    "--revelado-distancia": `${r.distancia}%`,
    "--revelado-curva": curvaCss(r.curva),
    "--revelado-curva-aprox": curvaAproximada(r.curva),
  } as CSSProperties;

  let indice = 0;
  const Tag = como;
  return (
    <Tag
      ref={ref as never}
      id={id}
      className={`${estilos.revelado} ${className ?? ""}`}
      style={variables}
      aria-label={encabezado ? textoPlano(texto) : undefined}
    >
      {lineas.map((palabras, l) => (
        <Fragment key={l}>
          {palabras.map((palabra, p) => (
            <Fragment key={p}>
              {/*
               * EL ESPACIO VA FUERA DE LA MÁSCARA, como texto real: dentro de una
               * caja `inline-block` se colapsa y las palabras salen pegadas (se vio
               * en el prototipo del hero); y fuera permite partir la línea ahí.
               */}
              <span className={estilos.mascara} aria-hidden={encabezado || undefined}>
                <span className={estilos.palabra} style={{ "--indice": indice++ } as CSSProperties}>
                  {palabra}
                </span>
              </span>
              {p < palabras.length - 1 ? " " : null}
            </Fragment>
          ))}
          {l < lineas.length - 1 ? <br /> : null}
        </Fragment>
      ))}
    </Tag>
  );
}
