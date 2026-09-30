"use client";

import { IconCirclePlus } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { Revelado } from "@/components/movimiento/Revelado";
import { useMovimientoReducido, usePausa } from "@/components/movimiento/useMovimiento";
import { sizesFondoHero, type DiapositivaHero } from "@/lib/portada/hero";

import estilos from "./hero.module.css";

/**
 * HERO DE LA PORTADA — sección 1 de la home de ux-9 (ADR 0009).
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): el carrusel tiene estado,
 * pase automático y gestos, y el parallax escucha el scroll. El marcado se
 * prerenderiza igual: el título y el párrafo de la primera diapositiva están
 * en el HTML inicial.
 *
 * NO HAY VALORES DE DISEÑO EN ESTE FICHERO: viven en `hero.module.css`.
 *
 * Lo que se aparta de ux-9, todo documentado en docs/diseno/decisiones-home-ux9.md:
 * - D1: el título va en `<h2>`; el `<h1>` de la portada es el logo.
 * - D3: el vidrio no sale de la tarjeta por debajo de 1024 px.
 * - D4: las flechas son botones que funcionan; con una diapositiva no se pintan.
 * - D12 (carrusel): ux-9 no tiene carrusel en el hero; se copia el de su
 *   sección 2 (Swiper, MEDIDO): pase cada 5 s, deslizamiento de 500 ms, bucle,
 *   flechas, puntos y gesto, y se detiene al interactuar. Además: botón de
 *   pausa (WCAG 2.2.2), espera mientras el foco está dentro, y sin pase
 *   automático con movimiento reducido (empieza en pausa, D2). Como en ux-9
 *   pintado, el ratón encima NO lo pausa: el hero ocupa casi toda la pantalla.
 *
 * REVELADO SIN PARPADEO: título y párrafo usan `Revelado` con `alCargar`, que
 * anima por CSS desde el primer pintado.
 *
 * CARGA DE IMÁGENES: el fondo de la primera diapositiva es el LCP y es la única
 * que se precarga. Las demás NO se pintan en el HTML: se añaden después del
 * evento `load` de la página, cuando el navegador está libre, y siempre la
 * siguiente a la activa, para que el deslizamiento no enseñe un hueco.
 */

type Props = { diapositivas: DiapositivaHero[] };

/** Ritmo MEDIDO en el carrusel de ux-9 (Swiper: `autoplay.delay`, `speed`). */
const PASE_MS = 5000;
const DESLIZAMIENTO_MS = 500;
/** Desplazamiento mínimo del dedo para contar como gesto, en px. */
const GESTO_PX = 50;

function IconoFlecha({ hacia }: { hacia: "anterior" | "siguiente" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path
        d={hacia === "siguiente" ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeroPortada({ diapositivas }: Props) {
  const [activo, setActivo] = useState(0);
  /** Diapositiva que sale y sentido del paso, mientras dura el deslizamiento. */
  const [saliente, setSaliente] = useState<{ indice: number; sentido: 1 | -1 } | null>(null);
  /** Fondos que ya pueden pintarse. Al cargar, solo el primero (el LCP). */
  const [cargadas, setCargadas] = useState<ReadonlySet<number>>(() => new Set([0]));
  /** Foco dentro: el pase espera (no cuenta como pausa del usuario). */
  const [dentro, setDentro] = useState(false);
  /*
   * El anuncio solo se escribe DESPUÉS de una acción del usuario: con texto
   * desde el principio, el lector lo leería al cargar, y el título ya está.
   * Con el pase automático no se anuncia nada: sería un anuncio cada 5 s.
   */
  const [anuncio, setAnuncio] = useState("");
  const raiz = useRef<HTMLElement>(null);
  const capas = useRef<(HTMLDivElement | null)[]>([]);
  const gesto = useRef<{ x: number; y: number } | null>(null);
  const idTitulo = useId();
  const reducido = useMovimientoReducido();
  const { pausado, alternar, pausar } = usePausa();
  const total = diapositivas.length;
  const hayVarias = total > 1;
  const d = diapositivas[activo];

  const cargar = useCallback((...indices: number[]) => {
    setCargadas((antes) => {
      if (indices.every((i) => antes.has(i))) return antes;
      const nuevas = new Set(antes);
      for (const i of indices) nuevas.add(i);
      return nuevas;
    });
  }, []);

  const ir = useCallback(
    (destino: number, sentido: 1 | -1, porUsuario: boolean) => {
      const siguiente = (destino + total) % total;
      if (siguiente === activo) return;
      cargar(siguiente, (siguiente + 1) % total);
      setSaliente({ indice: activo, sentido });
      setActivo(siguiente);
      if (porUsuario) {
        // Como Swiper con `disableOnInteraction`: quien toca, toma el control.
        pausar();
        setAnuncio(`Diapositiva ${siguiente + 1} de ${total}: ${diapositivas[siguiente]!.titulo}`);
      }
    },
    [activo, cargar, diapositivas, pausar, total],
  );

  const mover = (paso: 1 | -1) => ir(activo + paso, paso, true);

  const alPulsar = (e: KeyboardEvent<HTMLElement>) => {
    if (!hayVarias) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      mover(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      mover(1);
    }
  };

  /*
   * PRECARGA DIFERIDA: la siguiente diapositiva, solo cuando la página ya ha
   * cargado (el LCP ya se pintó) y el navegador está libre.
   */
  useEffect(() => {
    if (!hayVarias) return;
    let idle = 0;
    const tras = () => {
      const ric = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 200));
      idle = ric(() => cargar(1 % total));
    };
    if (document.readyState === "complete") tras();
    else addEventListener("load", tras, { once: true });
    return () => {
      removeEventListener("load", tras);
      (window.cancelIdleCallback ?? clearTimeout)(idle);
    };
  }, [cargar, hayVarias, total]);

  /* PASE AUTOMÁTICO: 5 s por diapositiva; se reinicia en cada cambio. */
  useEffect(() => {
    if (!hayVarias || pausado || dentro) return;
    const t = window.setTimeout(() => ir(activo + 1, 1, false), PASE_MS);
    return () => window.clearTimeout(t);
  }, [activo, dentro, hayVarias, ir, pausado]);

  /*
   * DESLIZAMIENTO: la que entra viene del lado del paso y la que sale se va
   * por el contrario, a la vez. Con movimiento reducido, el cambio es seco.
   */
  useEffect(() => {
    if (!saliente) return;
    const entra = capas.current[activo];
    const sale = capas.current[saliente.indice];
    if (reducido || !entra || !sale || typeof entra.animate !== "function") {
      setSaliente(null);
      return;
    }
    const opciones: KeyframeAnimationOptions = { duration: DESLIZAMIENTO_MS, easing: "ease" };
    const desde = `${saliente.sentido * 100}%`;
    const hasta = `${saliente.sentido * -100}%`;
    const a = entra.animate(
      [{ transform: `translateX(${desde})` }, { transform: "translateX(0)" }],
      opciones,
    );
    const b = sale.animate(
      [{ transform: "translateX(0)" }, { transform: `translateX(${hasta})` }],
      opciones,
    );
    let vivo = true;
    b.finished.then(
      () => vivo && setSaliente(null),
      () => undefined,
    );
    return () => {
      vivo = false;
      a.cancel();
      b.cancel();
    };
  }, [activo, reducido, saliente]);

  /*
   * PARALLAX. Un listener pasivo con rAF que escribe el avance en una variable
   * CSS; la distancia de cada capa la decide el CSS. Nada con movimiento reducido.
   */
  useEffect(() => {
    const el = raiz.current;
    if (!el || reducido) return;

    let pendiente = false;
    const alDesplazar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        const caja = el.getBoundingClientRect();
        const avance = Math.min(Math.max(-caja.top / Math.max(caja.height, 1), 0), 1);
        el.style.setProperty("--hero-parallax-base", String(avance));
      });
    };

    alDesplazar();
    addEventListener("scroll", alDesplazar, { passive: true });
    return () => {
      removeEventListener("scroll", alDesplazar);
      el.style.removeProperty("--hero-parallax-base");
    };
  }, [reducido]);

  /* GESTO: solo con el dedo, y solo si el trazo es más horizontal que vertical. */
  const alTocar = (e: PointerEvent<HTMLElement>) => {
    if (hayVarias && e.pointerType !== "mouse") gesto.current = { x: e.clientX, y: e.clientY };
  };
  const alSoltar = (e: PointerEvent<HTMLElement>) => {
    const inicio = gesto.current;
    gesto.current = null;
    if (!inicio) return;
    const dx = e.clientX - inicio.x;
    if (Math.abs(dx) >= GESTO_PX && Math.abs(dx) > Math.abs(e.clientY - inicio.y)) {
      mover(dx < 0 ? 1 : -1);
    }
  };

  if (!d) return null;

  return (
    <section
      ref={raiz}
      className={estilos.hero}
      aria-roledescription={hayVarias ? "carrusel" : undefined}
      aria-labelledby={idTitulo}
      onKeyDown={alPulsar}
      onFocus={() => setDentro(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDentro(false);
      }}
    >
      <div
        className={estilos.tarjeta}
        onPointerDown={alTocar}
        onPointerUp={alSoltar}
        onPointerCancel={() => (gesto.current = null)}
      >
        {/* El marco recorta los fondos con el radio; el vidrio queda fuera. */}
        <div className={estilos.marco}>
          {diapositivas.map((s, i) => (
            <div
              key={`${s.fondo.url}-${i}`}
              ref={(el) => {
                capas.current[i] = el;
              }}
              className={estilos.capaFondo}
              // La que sale sigue visible mientras se desliza, por debajo.
              hidden={i !== activo && i !== saliente?.indice}
              data-saliente={i === saliente?.indice ? "" : undefined}
            >
              {cargadas.has(i) ? (
                <Image
                  src={s.fondo.url}
                  alt=""
                  fill
                  // Por la proporción de la foto: en vertical manda el alto (ver la función).
                  sizes={sizesFondoHero(s.fondo.width, s.fondo.height)}
                  /*
                   * SOLO la primera: es el LCP. `preload` y no `priority` (obsoleto
                   * en Next 16.3.5); `fetchPriority` para que vaya por delante.
                   * Las demás no existen en el HTML hasta después del `load`.
                   */
                  preload={i === 0}
                  fetchPriority={i === 0 ? "high" : "low"}
                  loading="eager"
                  className={estilos.fondo}
                  // Punto focal del panel: qué parte de la foto se ve.
                  style={{ objectPosition: s.fondo.posicion }}
                />
              ) : null}
            </div>
          ))}
        </div>

        {/*
         * TÍTULO EN <h2> (D1). Solo el de la diapositiva activa: al cambiar, el
         * `key` monta uno nuevo y la animación vuelve a correr.
         */}
        <div
          className={`${estilos.filaTitulo} ${estilos.capaParallax}`}
          // Letras del título activo: el CSS encoge solo el que no cabe.
          style={{ ["--hero-titulo-letras" as string]: String(d.titulo.length) }}
        >
          <Revelado
            key={`titulo-${activo}`}
            id={idTitulo}
            como="h2"
            ritmo="portada"
            alCargar
            texto={d.titulo}
            className={estilos.titulo}
          />
        </div>

        {/*
         * HUECO DE LA MÁQUINA. Mide siempre lo mismo, tenga o no la diapositiva
         * una imagen recortada: el título y las flechas no saltan al cambiar.
         */}
        <div className={estilos.hueco}>
          {diapositivas.map((s, i) =>
            s.frontal && cargadas.has(i) ? (
              <div
                key={`${s.frontal.url}-${i}`}
                className={estilos.capaFrontal}
                hidden={i !== activo}
              >
                <Image
                  src={s.frontal.url}
                  alt={s.frontal.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1024px) 631px, 809px"
                  className={estilos.frontal}
                />
              </div>
            ) : null,
          )}
        </div>

        {/* Con una diapositiva no hay controles; la fila conserva su alto. */}
        <div className={estilos.fila}>
          {hayVarias ? (
            <div className={estilos.flechas}>
              <button
                type="button"
                className={estilos.flecha}
                onClick={() => mover(-1)}
                aria-label="Diapositiva anterior"
                aria-controls={idTitulo}
              >
                <IconoFlecha hacia="anterior" />
              </button>
              <button
                type="button"
                className={estilos.flecha}
                onClick={() => mover(1)}
                aria-label="Diapositiva siguiente"
                aria-controls={idTitulo}
              >
                <IconoFlecha hacia="siguiente" />
              </button>
              <BotonPausa
                pausado={pausado}
                alPulsar={alternar}
                que="el pase de diapositivas"
                controla={idTitulo}
                className={estilos.pausa}
              />
              <ul className={estilos.puntos}>
                {diapositivas.map((s, i) => (
                  <li key={`punto-${i}`}>
                    <button
                      type="button"
                      className={estilos.punto}
                      onClick={() => ir(i, i > activo ? 1 : -1, true)}
                      aria-label={`Diapositiva ${i + 1} de ${total}: ${s.titulo}`}
                      aria-current={i === activo ? "true" : undefined}
                      aria-controls={idTitulo}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* VIDRIO: oculto en móvil por CSS, como en el diseño. */}
        {d.parrafo || d.enlace ? (
          <aside className={`${estilos.vidrio} ${estilos.capaParallax}`}>
            {d.parrafo ? (
              <Revelado
                key={`parrafo-${activo}`}
                como="p"
                ritmo="titulo"
                alCargar
                texto={d.parrafo}
                className={estilos.parrafo}
              />
            ) : null}
            {d.enlace ? (
              <Link href={d.enlace.href} className={estilos.mas} aria-label={d.enlace.nombre}>
                <IconCirclePlus aria-hidden="true" focusable="false" stroke={1.5} />
              </Link>
            ) : null}
          </aside>
        ) : null}
      </div>

      {hayVarias ? (
        <p className={estilos.soloLector} aria-live="polite" aria-atomic="true">
          {anuncio}
        </p>
      ) : null}
    </section>
  );
}
