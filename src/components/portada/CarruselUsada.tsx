"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { usePausa } from "@/components/movimiento/useMovimiento";
import {
  INTERVALO_MS,
  TRANSICION_MS,
  alFrente,
  avanzaSolo,
  hayQueVolver,
  siguiente,
} from "@/lib/portada/carruselMarcas";

import estilos from "./maquinariaUsada.module.css";

/**
 * CARRUSEL DE LAS PESTAÑAS DE «MAQUINARIA PESADA USADA» (2026-10-17, dirección).
 *
 * Misma mecánica que el de marcas de «Máquinas nuevas» (`CarruselMarcas`,
 * lógica común en `src/lib/portada/carruselMarcas.ts`): 3 tarjetas a la vista
 * en escritorio, 2 en tablet y 1 en móvil, avance solo cada 5 s en bucle con
 * una copia inerte detrás, puntos de 24 px y botón de pausa; se para con el
 * puntero encima, el foco dentro, fuera de la vista y con «reducir movimiento».
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): avance, puntos y pausa.
 * Las tarjetas llegan hechas desde el servidor y están enteras en el HTML; la
 * posición la pone el CSS (`--indice`), así que no hay salto al hidratar. Con
 * tantas tarjetas como caben (o menos) no hay movimiento, ni copias, ni
 * controles: lo decide el CSS por `data-total`, sin depender de JavaScript, y
 * los controles conservan su alto (visibility) para no desplazar nada (CLS).
 */

type Props = {
  id: string;
  etiqueta: string;
  /** Nombre de cada tarjeta, para los puntos y la etiqueta de cada una. */
  nombres: string[];
  tarjetas: ReactNode[];
  /** Las mismas tarjetas con ids propios: la copia del bucle. */
  copias: ReactNode[];
};

const CORTES = ["(max-width: 767px)", "(max-width: 1024px)"] as const;

/** Tarjetas a la vista en el corte actual (3 · 2 · 1). En el servidor, 3. */
function usePorVista(): number {
  return useSyncExternalStore(
    (avisar) => {
      const lista = CORTES.map((c) => matchMedia(c));
      for (const mq of lista) mq.addEventListener("change", avisar);
      return () => {
        for (const mq of lista) mq.removeEventListener("change", avisar);
      };
    },
    () => (matchMedia(CORTES[0]).matches ? 1 : matchMedia(CORTES[1]).matches ? 2 : 3),
    () => 3,
  );
}

export function CarruselUsada({ id, etiqueta, nombres, tarjetas, copias }: Props) {
  const total = tarjetas.length;
  const porVista = usePorVista();
  const seMueve = total > porVista;
  const region = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);
  const [animar, setAnimar] = useState(true);
  const [dentro, setDentro] = useState(false);
  const [visible, setVisible] = useState(false);
  const { pausado, alternar } = usePausa();
  const inicioGesto = useRef<number | null>(null);

  // Fuera de la vista (o en una pestaña oculta) no avanza.
  useEffect(() => {
    const el = region.current;
    if (!el) return;
    const observador = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  const avanza = avanzaSolo({ total: seMueve ? total : 1, pausado, dentro, visible });
  useEffect(() => {
    if (!avanza) return;
    const reloj = setInterval(() => {
      setAnimar(true);
      setIndice((i) => siguiente(i, total));
    }, INTERVALO_MS);
    return () => clearInterval(reloj);
  }, [avanza, total]);

  // En la copia de la primera: tras la transición, a la original sin animar.
  useEffect(() => {
    if (!seMueve || !hayQueVolver(indice, total)) return;
    const t = setTimeout(() => {
      setAnimar(false);
      setIndice(0);
    }, TRANSICION_MS);
    return () => clearTimeout(t);
  }, [indice, total, seMueve]);

  const ir = (i: number) => {
    setAnimar(true);
    setIndice(i);
  };

  const frente = alFrente(seMueve ? indice : 0, total);

  // Gesto en móvil: deslizar a un lado u otro mueve una tarjeta.
  const alSoltar = (x: number) => {
    const desde = inicioGesto.current;
    inicioGesto.current = null;
    if (!seMueve || desde === null || Math.abs(x - desde) < 40) return;
    ir(x < desde ? siguiente(frente, total) : (frente - 1 + total) % total);
  };

  return (
    <div
      ref={region}
      className={estilos.carrusel}
      data-total={total}
      role="region"
      aria-roledescription="carrusel"
      aria-label={etiqueta}
      onMouseEnter={() => setDentro(true)}
      onMouseLeave={() => setDentro(false)}
      onFocus={() => setDentro(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDentro(false);
      }}
    >
      <div
        className={estilos.marco}
        onPointerDown={(e) => (inicioGesto.current = e.clientX)}
        onPointerUp={(e) => alSoltar(e.clientX)}
        onPointerCancel={() => (inicioGesto.current = null)}
      >
        {/* Diapositivas en `div` con `role="group"` (patrón de carrusel de WAI-ARIA): un
            `<li>` con `role="group"` deja una lista con hijos no válidos (Lighthouse, 2026-10-19). */}
        <div
          id={`${id}-pista`}
          className={`${estilos.pista} ${animar ? "" : estilos.sinTransicion}`}
          style={{ "--indice": seMueve ? indice : 0 } as CSSProperties}
        >
          {tarjetas.map((t, i) => (
            <div
              key={`t-${i}`}
              className={estilos.diapositiva}
              role="group"
              aria-roledescription="tarjeta"
              aria-label={`${i + 1} de ${total}: ${nombres[i] ?? ""}`}
              // Al tabular hasta una tarjeta que no se ve, se trae a la vista.
              onFocus={() => seMueve && (i < frente || i >= frente + porVista) && ir(i)}
            >
              {t}
            </div>
          ))}
          {total > 1
            ? copias.map((t, i) => (
                <div
                  key={`c-${i}`}
                  className={`${estilos.diapositiva} ${estilos.copia}`}
                  aria-hidden
                  inert
                >
                  {t}
                </div>
              ))
            : null}
        </div>
      </div>
      {/* Siempre en el marcado: reserva el alto de los controles y no hay salto al hidratar. */}
      <div className={estilos.controles}>
        {total > 1 ? (
          <>
            <ul className={estilos.puntos}>
              {nombres.map((nombre, i) => (
                <li key={`p-${i}`}>
                  <button
                    type="button"
                    className={estilos.punto}
                    onClick={() => ir(i)}
                    aria-label={`Ir a ${nombre}`}
                    aria-current={i === frente ? "true" : undefined}
                    aria-controls={`${id}-pista`}
                  />
                </li>
              ))}
            </ul>
            <BotonPausa
              pausado={pausado}
              alPulsar={alternar}
              que="el carrusel de unidades usadas"
              controla={`${id}-pista`}
              className={estilos.pausa}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
