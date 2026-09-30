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
  type AnimationEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
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
 * NO HAY VALORES DE DISEÑO EN ESTE FICHERO: tiempos y curvas viven en
 * `hero.module.css`.
 *
 * Lo que se aparta de ux-9, todo documentado en docs/diseno/decisiones-home-ux9.md:
 * - D1: el título va en `<h2>`; el `<h1>` de la portada es el logo.
 * - D3: el vidrio no sale de la tarjeta por debajo de 1024 px.
 * - D4: las flechas son botones que funcionan; con una diapositiva no se pintan.
 * - D13 (carrusel, versión «premium» pedida por dirección): fundido cruzado,
 *   Ken Burns, 7 s por diapositiva, texto que entra con fundido y línea de
 *   progreso en el punto activo. ux-9 no tiene carrusel en el hero.
 * - D15: en las diapositivas SIN máquina recortada, el título va centrado en la
 *   tarjeta (en ux-9, pegado arriba). CON máquina, la composición de ux-9: el
 *   título arriba, en su posición medida, y la máquina debajo.
 *
 * EL TIEMPO LO MARCA LA LÍNEA DE PROGRESO: cuando su animación CSS termina,
 * pasa la diapositiva. Así la pausa (botón, ratón o foco dentro) detiene a la
 * vez la línea, el Ken Burns y el pase, sin dos relojes que se desincronicen.
 *
 * CARGA DE IMÁGENES: el fondo de la primera diapositiva es el LCP y es el único
 * que se precarga. Los demás NO están en el HTML: se añaden desde código cuando
 * la primera foto ha terminado de cargar, y siempre la siguiente a la activa.
 */

type Props = { diapositivas: DiapositivaHero[] };

/** Desplazamiento mínimo del dedo para contar como gesto, en px. */
const GESTO_PX = 50;
/** Lo que dura el fundido (`--hero-fundido` en el CSS), para soltar la saliente. */
const FUNDIDO_MS = 1200;

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
  /** La que se va: sigue opaca DEBAJO mientras la nueva aparece encima. */
  const [saliente, setSaliente] = useState<number | null>(null);
  /** Hubo ya un cambio: el texto de la primera se pinta sin animación. */
  const [cambiado, setCambiado] = useState(false);
  /** Fondos que ya pueden pintarse. Al cargar, solo el primero (el LCP). */
  const [cargadas, setCargadas] = useState<ReadonlySet<number>>(() => new Set([0]));
  /** Ratón o foco dentro: el pase espera (no cuenta como pausa del usuario). */
  const [dentro, setDentro] = useState(false);
  /*
   * El anuncio solo se escribe DESPUÉS de una acción del usuario: con texto
   * desde el principio, el lector lo leería al cargar, y el título ya está.
   * Con el pase automático no se anuncia nada: sería un anuncio cada 7 s.
   */
  const [anuncio, setAnuncio] = useState("");
  const raiz = useRef<HTMLElement>(null);
  const gesto = useRef<{ x: number; y: number } | null>(null);
  const idTitulo = useId();
  const reducido = useMovimientoReducido();
  const { pausado, alternar, pausar } = usePausa();
  const total = diapositivas.length;
  const hayVarias = total > 1;
  const hayEnlaces = diapositivas.some((s) => s.enlace);
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
    (destino: number, porUsuario: boolean) => {
      const siguiente = (destino + total) % total;
      if (siguiente === activo) return;
      cargar(siguiente, (siguiente + 1) % total);
      setSaliente(activo);
      setActivo(siguiente);
      setCambiado(true);
      if (porUsuario) {
        // Quien toca, toma el control: el pase se detiene (como Swiper en ux-9).
        pausar();
        setAnuncio(`Diapositiva ${siguiente + 1} de ${total}: ${diapositivas[siguiente]!.titulo}`);
      }
    },
    [activo, cargar, diapositivas, pausar, total],
  );

  const mover = (paso: 1 | -1) => ir(activo + paso, true);

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

  /* La saliente se suelta cuando el fundido ha terminado. */
  useEffect(() => {
    if (saliente === null) return;
    const t = window.setTimeout(() => setSaliente(null), reducido ? 0 : FUNDIDO_MS);
    return () => window.clearTimeout(t);
  }, [reducido, saliente]);

  /*
   * PRECARGA DIFERIDA: la segunda foto, solo cuando la primera ha terminado de
   * cargar (el LCP ya se pintó) y el navegador está libre.
   */
  const alCargarPrimera = useCallback(() => {
    if (!hayVarias) return;
    const ric = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 200));
    ric(() => cargar(1 % total));
  }, [cargar, hayVarias, total]);

  /* Fin de la línea de progreso del punto activo: pasa a la siguiente. */
  const alTerminarProgreso = (e: AnimationEvent<HTMLElement>) => {
    if (e.animationName.includes("progreso")) ir(activo + 1, false);
  };

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

  const estadoDe = (i: number) =>
    i === activo ? "activa" : i === saliente ? "saliente" : "oculta";
  const entra = cambiado ? ` ${estilos.entra}` : "";
  const titulo = (
    <h2 key={`titulo-${activo}`} id={idTitulo} className={`${estilos.titulo}${entra}`}>
      {d.titulo}
    </h2>
  );

  return (
    <section
      ref={raiz}
      className={estilos.hero}
      aria-roledescription={hayVarias ? "carrusel" : undefined}
      aria-labelledby={idTitulo}
      // Todo lo que se mueve solo se detiene aquí: línea, Ken Burns y pase.
      data-pausado={pausado || dentro ? "" : undefined}
      onKeyDown={alPulsar}
      onMouseEnter={() => setDentro(true)}
      onMouseLeave={() => setDentro(false)}
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
          {diapositivas.map((s, i) =>
            cargadas.has(i) ? (
              <div
                key={`${s.fondo.url}-${i}`}
                className={estilos.capaFondo}
                data-estado={estadoDe(i)}
                aria-hidden={i !== activo}
              >
                <Image
                  src={s.fondo.url}
                  alt=""
                  fill
                  // Por la proporción de la foto: en vertical manda el alto (ver la función).
                  sizes={sizesFondoHero(s.fondo.width, s.fondo.height)}
                  /*
                   * SOLO la primera: es el LCP. `preload` y no `priority` (obsoleto
                   * en Next 16.3.5); `fetchPriority` para que vaya por delante.
                   * Las demás no existen en el HTML hasta que carga la primera.
                   */
                  preload={i === 0}
                  fetchPriority={i === 0 ? "high" : "low"}
                  loading="eager"
                  onLoad={i === 0 ? alCargarPrimera : undefined}
                  className={estilos.fondo}
                  // Punto focal del panel: qué parte se ve, y desde dónde crece el Ken Burns.
                  style={{ objectPosition: s.fondo.posicion, transformOrigin: s.fondo.posicion }}
                />
              </div>
            ) : null,
          )}
        </div>

        {/*
         * TÍTULO EN <h2> (D1). CON máquina recortada va en el flujo, en la
         * posición de ux-9 (esta fila conserva además el alto de la tarjeta);
         * SIN ella, en su capa, centrado (D15).
         */}
        <div
          className={`${estilos.filaTitulo} ${estilos.capaParallax}`}
          style={{ ["--hero-titulo-letras" as string]: String(d.titulo.length) }}
        >
          {d.frontal ? titulo : null}
        </div>

        {d.frontal ? null : (
          <div
            className={`${estilos.capaTexto} ${estilos.capaParallax}`}
            // Letras del título activo: el CSS encoge solo el que no cabe.
            style={{ ["--hero-titulo-letras" as string]: String(d.titulo.length) }}
          >
            {titulo}
          </div>
        )}

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
                      onClick={() => ir(i, true)}
                      onAnimationEnd={i === activo ? alTerminarProgreso : undefined}
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
            {/*
             * TODOS los párrafos en la misma celda y solo el activo visible: el
             * vidrio mide siempre lo del más largo y no cambia de alto al pasar
             * (medido: un párrafo más largo movía el vidrio, CLS 0,009–0,018).
             */}
            <div className={estilos.textosVidrio}>
              {diapositivas.map((s, i) =>
                s.parrafo ? (
                  <p
                    key={i === activo ? `parrafo-${activo}` : `parrafo-quieto-${i}`}
                    className={`${estilos.parrafo}${i === activo ? entra : ""}`}
                    aria-hidden={i !== activo}
                  >
                    {s.parrafo}
                  </p>
                ) : null,
              )}
            </div>
            {d.enlace ? (
              <Link href={d.enlace.href} className={estilos.mas} aria-label={d.enlace.nombre}>
                <IconCirclePlus aria-hidden="true" focusable="false" stroke={1.5} />
              </Link>
            ) : hayEnlaces ? (
              // Hueco del «+» si otra diapositiva lo tiene: el párrafo no cambia de ancho.
              <span className={`${estilos.mas} ${estilos.masVacio}`} aria-hidden="true">
                <IconCirclePlus focusable="false" stroke={1.5} />
              </span>
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
