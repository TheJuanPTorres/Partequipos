"use client";

import Image, { getImageProps } from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
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
import {
  MIME_FUENTE,
  fuentesDelHero,
  posicionDelTitulo,
  reglasFontFace,
  tamanosDelTitulo,
  variablesDeLetra,
} from "@/lib/portada/tipografia";

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
 * - D15 (dirección): el título va SIEMPRE en el mismo sitio, haya o no máquina:
 *   en un carrusel el texto no salta. Desde el diseño de sliders de Andrés
 *   (2026-10-14, docs/diseno/decisiones-hero-sliders.md) ese sitio es ARRIBA y
 *   la máquina va debajo, en el mismo flujo; con «sobre», en escritorio cruza
 *   el título. El título puede ir en varias líneas o partido en escritorio, y
 *   cada diapositiva puede llevar un texto circular decorativo.
 *
 * EL TIEMPO LO MARCA LA LÍNEA DE PROGRESO: cuando su animación CSS termina,
 * pasa la diapositiva. Así la pausa (botón, ratón o foco dentro) detiene a la
 * vez la línea, el Ken Burns y el pase, sin dos relojes que se desincronicen.
 *
 * CARGA DE IMÁGENES: el fondo de la primera diapositiva es el LCP y es el único
 * que se precarga. Los demás NO están en el HTML ni se piden al abrir
 * (2026-10-19): la SIGUIENTE se pide `ANTICIPO_MS` antes de que le toque, con
 * el pase en marcha, y la de destino al acercarse a una flecha o a un punto.
 * Si al cambiar la foto de destino aún no ha llegado, el cambio la ESPERA
 * (hasta `ESPERA_MAX_MS`): nunca se ve la tarjeta en blanco.
 */

type Props = { diapositivas: DiapositivaHero[] };

/** Desplazamiento mínimo del dedo para contar como gesto, en px. */
const GESTO_PX = 50;
/**
 * Letras a partir de las que el párrafo se considera largo: en el diseño de
 * sliders, el de Hitachi (128) va en un vidrio de 400 px y el de CASE (131), en
 * uno de 500.
 */
const PARRAFO_LARGO = 130;
/** Lo que dura el fundido (`--hero-fundido` en el CSS), para soltar la saliente. */
const FUNDIDO_MS = 1200;
/** Lo que dura cada diapositiva (`--hero-pase` en el CSS). */
const PASE_MS = 7000;
/** Con cuánta antelación se pide la foto de la siguiente diapositiva. */
const ANTICIPO_MS = 3000;
/** Lo máximo que un cambio espera a que llegue la foto de destino; después cambia igual. */
const ESPERA_MAX_MS = 3000;

/**
 * CHEVRÓN MACIZO de las flechas de la Home V2 (2026-10-16): la misma silueta
 * que el de su diseño (Font Awesome, que no usamos), dibujada aquí con un
 * trazo grueso y redondeado en su caja de 320 × 512.
 */
function IconoFlecha({ hacia }: { hacia: "anterior" | "siguiente" }) {
  return (
    <svg viewBox="0 0 320 512" fill="none" aria-hidden="true" focusable="false">
      <path
        d={hacia === "siguiente" ? "M74 84l170 172-170 172" : "M246 84 76 256l170 172"}
        stroke="currentColor"
        strokeWidth="80"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** El «+» de la Home V2: aro y cruz con trazo de 2 (de 24), redondeados. */
function IconoMas() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * TEXTO CIRCULAR (el `text-path` de la diapositiva 1 del diseño): el texto
 * repetido alrededor de un círculo, girando despacio. Decorativo: oculto al
 * lector. El giro lo para la pausa del hero y «reducir movimiento» (CSS).
 * `textLength` reparte el texto en la vuelta entera, sea cual sea su largo.
 */
function TextoCircular({ texto }: { texto: string }) {
  const id = useId();
  const radio = 40;
  return (
    <div className={estilos.circular} aria-hidden="true">
      <svg viewBox="0 0 100 100" focusable="false">
        <defs>
          <path
            id={id}
            d={`M 50,50 m -${radio},0 a ${radio},${radio} 0 1,1 ${radio * 2},0 a ${radio},${radio} 0 1,1 -${radio * 2},0`}
          />
        </defs>
        <text>
          <textPath href={`#${id}`} textLength={String(Math.floor(2 * Math.PI * radio) - 2)}>
            {`${texto} `}
          </textPath>
        </text>
      </svg>
    </div>
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
  /** Fondos cuya foto ya llegó (su `onLoad`). La primera viene en el HTML. */
  const [listas, setListas] = useState<ReadonlySet<number>>(() => new Set([0]));
  /** Cambio que espera a que llegue la foto de su destino, y su temporizador de respaldo. */
  const pendiente = useRef<{ destino: number; porUsuario: boolean; espera: number } | null>(null);
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
  /*
   * FUENTES PROPIAS DEL TÍTULO (2026-10-17): se DECLARAN las del hero, pero el
   * navegador solo descarga la que pinta el título visible. La de la primera
   * se precarga (es lo primero que se ve); la de la siguiente se pide junto a
   * su foto (ver el efecto de abajo), así llega antes de que se vea.
   */
  const fuentes = useMemo(() => fuentesDelHero(diapositivas), [diapositivas]);
  const primeraFuente = diapositivas[0]?.tipografia?.fuente;
  if (primeraFuente) {
    preload(primeraFuente.url, {
      as: "font",
      type: MIME_FUENTE[primeraFuente.formato],
      crossOrigin: "anonymous",
    });
  }

  const cargar = useCallback((...indices: number[]) => {
    setCargadas((antes) => {
      if (indices.every((i) => antes.has(i))) return antes;
      const nuevas = new Set(antes);
      for (const i of indices) nuevas.add(i);
      return nuevas;
    });
  }, []);

  /** Cambia ya, con la foto de destino cargada (o tras esperarla). */
  const cambiar = useCallback(
    (siguiente: number, porUsuario: boolean) => {
      if (pendiente.current) window.clearTimeout(pendiente.current.espera);
      pendiente.current = null;
      setSaliente(activo);
      setActivo(siguiente);
      setCambiado(true);
      if (porUsuario) {
        // Quien toca, toma el control: el pase se detiene (como Swiper en ux-9).
        pausar();
        setAnuncio(`Diapositiva ${siguiente + 1} de ${total}: ${diapositivas[siguiente]!.titulo}`);
      }
    },
    [activo, diapositivas, pausar, total],
  );

  const ir = useCallback(
    (destino: number, porUsuario: boolean) => {
      const siguiente = (destino + total) % total;
      if (siguiente === activo) return;
      if (listas.has(siguiente)) {
        cambiar(siguiente, porUsuario);
        return;
      }
      // Su foto aún no ha llegado: se pide y el cambio la espera (sin tarjeta en blanco),
      // como mucho `ESPERA_MAX_MS`.
      cargar(siguiente);
      if (pendiente.current) window.clearTimeout(pendiente.current.espera);
      pendiente.current = {
        destino: siguiente,
        porUsuario,
        espera: window.setTimeout(() => cambiar(siguiente, porUsuario), ESPERA_MAX_MS),
      };
    },
    [activo, cambiar, cargar, listas, total],
  );

  /** La foto de una diapositiva llegó: si un cambio la esperaba, se hace ya. */
  const alLlegar = (i: number) => {
    setListas((antes) => (antes.has(i) ? antes : new Set(antes).add(i)));
    if (pendiente.current?.destino === i) cambiar(i, pendiente.current.porUsuario);
  };

  /* Sin temporizadores colgando al desmontar. */
  useEffect(
    () => () => {
      if (pendiente.current) window.clearTimeout(pendiente.current.espera);
    },
    [],
  );

  /* La foto de la SIGUIENTE se pide `ANTICIPO_MS` antes de que le toque, con el pase en marcha. */
  useEffect(() => {
    if (!hayVarias || pausado || dentro) return;
    const t = window.setTimeout(
      () => cargar((activo + 1) % total),
      Math.max(PASE_MS - ANTICIPO_MS, 0),
    );
    return () => window.clearTimeout(t);
  }, [activo, cargar, dentro, hayVarias, pausado, total]);

  /** Al acercarse a una flecha o a un punto, se pide ya la foto de su destino. */
  const anticipar = (destino: number) => cargar((destino + total) % total);

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

  /* La fuente de cada diapositiva cargada (la activa y la siguiente), antes de que se vea. */
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    for (const i of cargadas) {
      const t = diapositivas[i]?.tipografia;
      if (!t?.fuente) continue;
      document.fonts.load(`${t.peso ?? 600} 1em "${t.fuente.familia}"`).catch(() => {});
    }
  }, [cargadas, diapositivas]);

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
  /*
   * TÍTULO: el lector oye `d.titulo` (una línea); lo pintado va oculto a él.
   * Las líneas del panel se pintan con su salto; con título partido, en
   * escritorio se pinta la parte de arriba aquí y la de abajo sobre la máquina.
   */
  const letras = Math.max(...d.tituloLineas.map((l) => l.length));
  const palabra = Math.max(...d.titulo.split(" ").map((p) => p.length));
  /*
   * TÍTULO OCULTO («Mostrar título» desmarcado, 2026-10-15): el `<h2>` se
   * queda, con su id (nombra la región) y el texto para lectores de pantalla.
   * Lo pintado SE RESERVA invisible (`data-oculto`: `visibility: hidden`, y ya
   * era `aria-hidden`): así la máquina queda donde estaría con título y el pase
   * no mueve su caja. Medido: con el título quitado del flujo, el pase a la
   * diapositiva siguiente desplazaba la caja de la máquina (CLS 0,069 a 390).
   */
  const medidas = {
    ["--hero-titulo-letras" as string]: String(letras),
    ["--hero-titulo-letras-escritorio" as string]: String(
      d.tituloPartido ? d.tituloPartido.arriba.length : letras,
    ),
    ["--hero-titulo-palabra" as string]: String(palabra),
    ["--hero-titulo-total" as string]: String(d.titulo.length),
  };
  /* Lo pintado del título: las líneas y, en escritorio, la parte de arriba del partido. */
  const lineas = (
    <>
      <span aria-hidden="true" className={estilos.tituloEntero}>
        {d.tituloLineas.map((l, i) => (
          <span key={i} className={estilos.tituloLinea}>
            {l}
          </span>
        ))}
      </span>
      {d.tituloPartido ? (
        <span aria-hidden="true" className={estilos.tituloArriba}>
          {d.tituloPartido.arriba}
        </span>
      ) : null}
    </>
  );
  /*
   * TIPOGRAFÍA DEL PANEL (2026-10-17): variables CSS en el título; vacías, el
   * estilo de siempre (`hero.module.css`). Tamaño por pantalla con su atributo.
   */
  const letra = variablesDeLetra(d.tipografia);
  const tamanos = tamanosDelTitulo(d.tipografia);
  const posicion = posicionDelTitulo(d.tipografia);
  const titulo = (
    <h2
      key={`titulo-${activo}`}
      id={idTitulo}
      className={`${estilos.titulo}${d.tituloVisible ? entra : ""}`}
      data-oculto={d.tituloVisible ? undefined : ""}
      data-partido={d.tituloPartido ? "" : undefined}
      {...tamanos.datos}
      style={{ ...medidas, ...letra, ...tamanos.estilo }}
    >
      <span className={estilos.soloLector}>{d.titulo}</span>
      {lineas}
    </h2>
  );

  const fontFace = reglasFontFace(fuentes);

  return (
    <section
      ref={raiz}
      className={estilos.hero}
      aria-roledescription={hayVarias ? "carrusel" : undefined}
      aria-labelledby={idTitulo}
      // Todo lo que se mueve solo se detiene aquí: línea, Ken Burns, pase y texto circular.
      data-pausado={pausado || dentro ? "" : undefined}
      // Un párrafo largo ensancha el vidrio en escritorio, como en el diseño (uno para todas).
      data-vidrio-largo={
        diapositivas.some((s) => (s.parrafo?.length ?? 0) > PARRAFO_LARGO) ? "" : undefined
      }
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
                <FondoHero diapositiva={s} primera={i === 0} alCargar={() => alLlegar(i)} />
              </div>
            ) : null,
          )}
        </div>

        {/*
         * TÍTULO EN <h2> (D1), ARRIBA Y SIEMPRE EN EL MISMO SITIO (D15), y la
         * MÁQUINA debajo, en el mismo flujo (hero de sliders de Andrés): ocupa lo
         * que queda hasta los controles, así se adapta a un título de varias
         * líneas. Con «sobre», en escritorio sube y cruza el título.
         *
         * UNA CAPA NUEVA POR DIAPOSITIVA (`key`): la caja de la máquina cambia
         * de sitio entre diapositivas (sobre/debajo, títulos de distinto alto) y,
         * con el pase automático, que no es una entrada del usuario, ese cambio
         * contaba como CLS (medido a 1010: 0,018 por pase). Un elemento nuevo no
         * cuenta como desplazamiento.
         */}
        <div
          key={`texto-${activo}`}
          className={estilos.capaTexto}
          data-maquina={d.posicionMaquina}
          data-partido={d.tituloPartido ? "" : undefined}
        >
          {/*
           * POSICIÓN DEL PANEL (2026-10-17): en las pantallas que la tienen, la
           * capa del título sale del flujo y va donde diga el panel, y en su
           * sitio queda una RESERVA invisible con el título del estilo de
           * siempre: la máquina se queda donde estaba.
           */}
          <div className={estilos.capaParallax} {...posicion.datos} style={posicion.estilo}>
            {titulo}
          </div>
          {Object.keys(posicion.datos).length > 0 ? (
            <div
              className={`${estilos.titulo} ${estilos.reserva}`}
              aria-hidden="true"
              data-partido={d.tituloPartido ? "" : undefined}
              {...posicion.datos}
              style={medidas}
            >
              {lineas}
            </div>
          ) : null}
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
                    sizes="(max-width: 767px) 100vw, (max-width: 1024px) 631px, 1000px"
                    className={estilos.frontal}
                  />
                </div>
              ) : null,
            )}
          </div>
        </div>

        {/* Escritorio, título partido: la parte de abajo, sobre la máquina. */}
        {d.tituloPartido ? (
          <p
            key={`abajo-${activo}`}
            aria-hidden="true"
            className={`${estilos.tituloAbajo}${entra}`}
            style={{
              ["--hero-titulo-letras" as string]: String(d.tituloPartido.abajo.length),
              ...letra,
            }}
          >
            {d.tituloPartido.abajo}
          </p>
        ) : null}

        {/* TEXTO CIRCULAR: decorativo; gira despacio y se para con la pausa. */}
        {d.textoCircular ? (
          <TextoCircular key={`circular-${activo}`} texto={d.textoCircular} />
        ) : null}

        {/* Con una diapositiva no hay controles; la fila conserva su alto. */}
        <div className={estilos.fila}>
          {hayVarias ? (
            // Los controles (en móvil, los puntos llegan a la derecha): el botón de WhatsApp los esquiva.
            <div className={estilos.flechas} data-evita-flotante="">
              <button
                type="button"
                className={estilos.flecha}
                onClick={() => mover(-1)}
                onPointerEnter={() => anticipar(activo - 1)}
                onFocus={() => anticipar(activo - 1)}
                aria-label="Diapositiva anterior"
                aria-controls={idTitulo}
              >
                <IconoFlecha hacia="anterior" />
              </button>
              <button
                type="button"
                className={estilos.flecha}
                onClick={() => mover(1)}
                onPointerEnter={() => anticipar(activo + 1)}
                onFocus={() => anticipar(activo + 1)}
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
                      onPointerEnter={() => anticipar(i)}
                      onFocus={() => anticipar(i)}
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

        {/* VIDRIO: también en móvil (diseño de sliders), encima de los controles. */}
        {d.parrafo || d.enlace ? (
          // El recuadro y el «+» van abajo a la derecha: el botón de WhatsApp los esquiva.
          <div className={`${estilos.vidrio} ${estilos.capaParallax}`} data-evita-flotante="">
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
                <IconoMas />
              </Link>
            ) : hayEnlaces ? (
              // Hueco del «+» si otra diapositiva lo tiene: el párrafo no cambia de ancho.
              <span className={`${estilos.mas} ${estilos.masVacio}`} aria-hidden="true">
                <IconoMas />
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Las fuentes propias del hero: declararlas no las descarga (ver arriba). */}
      {fontFace ? <style dangerouslySetInnerHTML={{ __html: fontFace }} /> : null}

      {hayVarias ? (
        <p className={estilos.soloLector} aria-live="polite" aria-atomic="true">
          {anuncio}
        </p>
      ) : null}
    </section>
  );
}
