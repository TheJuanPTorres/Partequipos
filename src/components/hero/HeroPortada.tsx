"use client";

import { IconCirclePlus } from "@tabler/icons-react";
import Image, { getImageProps } from "next/image";
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
import { preload } from "react-dom";

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
 * - D1: el título va en `<h2>`; el `<h1>` de la portada es el título
 *   descriptivo oculto de `page.tsx` (auditoría de C, I1).
 * - D3: el vidrio no sale de la tarjeta por debajo de 1024 px.
 * - D4: las flechas son botones que funcionan; con una diapositiva no se pintan.
 * - D13 (carrusel, versión «premium» pedida por dirección): fundido cruzado,
 *   Ken Burns, 7 s por diapositiva, texto que entra con fundido y línea de
 *   progreso en el punto activo. ux-9 no tiene carrusel en el hero.
 * - D15 (dirección, pendiente de Andrés): el título va SIEMPRE centrado y en el
 *   mismo sitio, haya o no máquina recortada: en un carrusel el texto no salta.
 *   La máquina se adapta al texto: su caja empieza bajo el título y queda a la
 *   izquierda del vidrio (en ux-9, el título arriba y la máquina debajo).
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

/** Por debajo de este ancho se usa el recorte vertical, si lo hay (CLAUDE.md §10.36). */
const MEDIA_MOVIL = "(max-width: 767px)";
/** El complementario exacto de `MEDIA_MOVIL`: así solo se precarga UNA de las dos. */
const MEDIA_ESCRITORIO = "(min-width: 768px)";

/**
 * FONDO DE UNA DIAPOSITIVA. Sin recorte para móvil, un `<Image>` como siempre.
 * Con recorte, `<picture>`: el navegador elige UNA de las dos fotos por la
 * media query y solo descarga esa. El `preload` de `next/image` no sirve ahí
 * (solo conoce la foto de escritorio y la precargaría también en el móvil, lo
 * advierte la documentación de `getImageProps`), así que la primera emite DOS
 * precargas propias con `media` complementarios: el navegador solo hace caso
 * a la que encaja con su ancho. Mismo `srcset` y `sizes` que el `<picture>`,
 * para que elija el mismo candidato y la descarga se reutilice.
 *
 * El punto focal de cada foto llega por variables CSS: `.fondo` lo aplica a
 * `object-position` y al origen del Ken Burns, y el móvil usa el suyo.
 */
function FondoHero({
  diapositiva: s,
  primera,
  alCargar,
}: {
  diapositiva: DiapositivaHero;
  primera: boolean;
  alCargar?: () => void;
}) {
  const focos = {
    ["--hero-foco" as string]: s.fondo.posicion,
    ["--hero-foco-movil" as string]: (s.fondoMovil ?? s.fondo).posicion,
  };
  const prioridad = primera ? ("high" as const) : ("low" as const);

  if (!s.fondoMovil) {
    return (
      <Image
        src={s.fondo.url}
        alt=""
        fill
        // Por la proporción de la foto: en vertical manda el alto (ver la función).
        sizes={sizesFondoHero(s.fondo.width, s.fondo.height)}
        // SOLO la primera: es el LCP. `preload` y no `priority` (obsoleto en 16.3.5).
        preload={primera}
        fetchPriority={prioridad}
        loading="eager"
        onLoad={alCargar}
        className={estilos.fondo}
        style={focos}
      />
    );
  }

  const {
    props: { srcSet: srcSetMovil, sizes: sizesMovil },
  } = getImageProps({
    src: s.fondoMovil.url,
    alt: "",
    fill: true,
    sizes: sizesFondoHero(s.fondoMovil.width, s.fondoMovil.height),
  });
  const { props: escritorio } = getImageProps({
    src: s.fondo.url,
    alt: "",
    fill: true,
    sizes: sizesFondoHero(s.fondo.width, s.fondo.height),
    fetchPriority: prioridad,
    loading: "eager",
  });

  if (primera) {
    // En el render, no en un efecto: así salen en el <head> del HTML del servidor.
    preload(s.fondoMovil.url, {
      as: "image",
      imageSrcSet: srcSetMovil,
      imageSizes: sizesMovil,
      fetchPriority: "high",
      media: MEDIA_MOVIL,
    });
    preload(s.fondo.url, {
      as: "image",
      imageSrcSet: escritorio.srcSet,
      imageSizes: escritorio.sizes,
      fetchPriority: "high",
      media: MEDIA_ESCRITORIO,
    });
  }

  return (
    <picture>
      <source media={MEDIA_MOVIL} srcSet={srcSetMovil} sizes={sizesMovil} />
      <img
        {...escritorio}
        alt=""
        onLoad={alCargar}
        className={estilos.fondo}
        style={{ ...escritorio.style, ...focos }}
      />
    </picture>
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
                <FondoHero
                  diapositiva={s}
                  primera={i === 0}
                  alCargar={i === 0 ? alCargarPrimera : undefined}
                />
              </div>
            ) : null,
          )}
        </div>

        {/* Fila y hueco en el flujo: conservan el alto de la tarjeta de ux-9. */}
        <div className={estilos.filaTitulo} aria-hidden="true" />

        {/* TÍTULO EN <h2> (D1): siempre centrado y en el mismo sitio (D15). */}
        <div
          className={`${estilos.capaTexto} ${estilos.capaParallax}`}
          // Letras del título activo: el CSS encoge solo el que no cabe.
          style={{ ["--hero-titulo-letras" as string]: String(d.titulo.length) }}
        >
          {titulo}
        </div>

        <div className={estilos.hueco} aria-hidden="true" />

        {/*
         * MÁQUINA RECORTADA: en su propia caja, que se adapta al texto (D15):
         * empieza bajo el bloque del título, a la izquierda del vidrio y por
         * encima de los controles. Nunca se solapa con el texto.
         */}
        <div className={estilos.capaMaquina}>
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
                  sizes="(max-width: 767px) 100vw, (max-width: 1024px) 60vw, 940px"
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
          <div className={`${estilos.vidrio} ${estilos.capaParallax}`}>
            {/*
             * `<div>` y no `<aside>` (auditoría de C, M8): el vidrio es parte
             * del hero, no contenido complementario, y un `<aside>` dentro de
             * otra región no es de primer nivel (axe).
             */}
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
          </div>
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
