"use client";

import { IconCheck, IconChevronRight, IconMinus, IconPlus } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { LogoMarca } from "@/components/marca/LogoMarca";
import {
  CURVA_MENU,
  DURACION_ACORDEON_MS,
  DURACION_MARCO_MS,
  type MejoraMegamenu,
} from "@/lib/cabecera/fluidez";
import {
  cajaMarco,
  type CajaMarco,
  interpolarCaja,
  recorteMarco,
  suavizadoMarco,
} from "@/lib/cabecera/marco";
import {
  panelConTarjetas,
  type EnlaceMenu,
  type GrupoMenu,
  type PanelMenu,
  type TarjetaMenu,
} from "@/lib/megamenu";

import estilos from "./megamenu.module.css";

/**
 * PANEL DEL MEGAMENÚ (ux-9, export 2162 del 2026-10-05; decisiones-home-ux9.md
 * §26). Lo abre `Cabecera`; aquí solo se pinta y se recorre.
 *
 * Acordeones como DIVULGACIÓN, no como `role="menu"`: un botón con
 * `aria-expanded` y `aria-controls` que muestra u oculta su región. Los
 * enlaces están siempre en el HTML del servidor (SEO, CLAUDE.md §3.1).
 *
 * FLUIDEZ (2026-10-25, `lib/cabecera/fluidez.ts`): las mejoras encendidas llegan
 * por `MejorasMenu`. M3 es el marco único (`MarcoMegamenu`); M4, los acordeones
 * que se pliegan con su altura (`usePlegable`) y se cierran entre hermanos.
 */

/** Las mejoras de fluidez encendidas (`?anim=` en un preview). Sin proveedor, ninguna. */
export const MejorasMenu = createContext<ReadonlySet<MejoraMegamenu>>(new Set());

const reducirMovimiento = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * M4. Hermanos: los acordeones de un mismo nivel comparten cuál está abierto, así
 * abrir uno cierra el que estaba abierto a su lado. Sin M4, cada uno va por libre.
 */
type Hermanos = { abierto: string | null; abrir: (clave: string | null) => void };
const HermanosCtx = createContext<Hermanos | null>(null);

export function GrupoHermanos({ children }: { children: ReactNode }) {
  const [abierto, abrir] = useState<string | null>(null);
  const valor = useMemo(() => ({ abierto, abrir }), [abierto]);
  return <HermanosCtx.Provider value={valor}>{children}</HermanosCtx.Provider>;
}

/** Abierto o cerrado: compartido con los hermanos con M4; propio sin él. */
function useAbierto(clave: string): [boolean, () => void] {
  const mejoras = useContext(MejorasMenu);
  const hermanos = useContext(HermanosCtx);
  const [propio, setPropio] = useState(false);
  if (mejoras.has("M4") && hermanos) {
    const abierto = hermanos.abierto === clave;
    return [abierto, () => hermanos.abrir(abierto ? null : clave)];
  }
  return [propio, () => setPropio(!propio)];
}

/**
 * M4. Una región que se pliega: con la mejora, la altura pasa de 0 a la del
 * contenido (y al revés) en `DURACION_ACORDEON_MS`; cerrada, `hidden` como
 * siempre (fuera del orden del tabulador y de los lectores). Si se invierte a
 * medias, sigue desde la altura en la que estaba: sin saltos. Sin la mejora o con
 * «reducir movimiento», cambia al instante.
 */
function usePlegable(ref: RefObject<HTMLDivElement | null>, abierto: boolean) {
  const animar = useContext(MejorasMenu).has("M4");
  // Cerrándose con la animación: aún se ve (sin `hidden`) hasta que llega a 0.
  const [cerrando, setCerrando] = useState(false);
  const [antes, setAntes] = useState(abierto);
  if (antes !== abierto) {
    setAntes(abierto);
    setCerrando(!abierto && animar && !reducirMovimiento());
  }
  const previo = useRef(abierto);
  const animacion = useRef<Animation | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const eraAbierto = previo.current;
    previo.current = abierto;
    if (!el || eraAbierto === abierto) return;
    // A medias de otra animación, se sigue desde la altura que tenía en pantalla.
    const amedias = animacion.current !== null;
    const desde = el.getBoundingClientRect().height;
    animacion.current?.cancel();
    animacion.current = null;
    if (!animar || reducirMovimiento() || typeof el.animate !== "function") return;
    const hasta = abierto ? el.scrollHeight : 0;
    const a = el.animate(
      [
        { height: `${abierto && !amedias ? 0 : desde}px`, overflow: "hidden" },
        { height: `${hasta}px`, overflow: "hidden" },
      ],
      { duration: DURACION_ACORDEON_MS, easing: CURVA_MENU },
    );
    animacion.current = a;
    a.onfinish = () => {
      animacion.current = null;
      if (!abierto) setCerrando(false);
    };
  }, [ref, abierto, animar]);

  return { oculto: !abierto && !cerrando, inerte: !abierto };
}

function Lista({ enlaces, alElegir }: { enlaces: EnlaceMenu[]; alElegir: () => void }) {
  if (enlaces.length === 0) return null;
  return (
    <ul className={estilos.lista}>
      {enlaces.map((e) => (
        <li key={e.href}>
          <Link href={e.href} className={estilos.hoja} onClick={alElegir}>
            <IconCheck aria-hidden="true" focusable="false" stroke={2.5} />
            {e.etiqueta}
            {e.nota ? <span className={estilos.nota}> · {e.nota}</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * TARJETAS CON FOTO (las categorías técnicas de Repuestos, 2026-10-20): foto y
 * nombre, como las tarjetas de categorías del sitio, en versión compacta; 5 por
 * fila en escritorio y tablet y 2 en el teléfono, con la última fila centrada (regla
 * del #281). La foto es DECORATIVA (el nombre ya nombra la tarjeta), diferida y
 * pedida a su tamaño: va dentro de un acordeón cerrado (`hidden`), así que no se
 * descarga hasta que se abre. La caja tiene proporción fija: sin CLS.
 */
function Tarjetas({ tarjetas, alElegir }: { tarjetas: TarjetaMenu[]; alElegir: () => void }) {
  if (tarjetas.length === 0) return null;
  return (
    <ul className={estilos.tarjetas}>
      {tarjetas.map((t) => {
        const accesos = t.accesos ?? [];
        const baldosa = (
          <Link href={t.href} className={estilos.tarjeta} onClick={alElegir}>
            <span className={estilos.tarjetaFoto}>
              {t.imagen ? (
                <Image
                  src={t.imagen.url}
                  width={t.imagen.width}
                  height={t.imagen.height}
                  alt=""
                  sizes="(max-width: 767px) 45vw, (max-width: 1024px) 19vw, 130px"
                  loading="lazy"
                />
              ) : null}
            </span>
            <span className={estilos.tarjetaNombre}>{t.etiqueta}</span>
          </Link>
        );
        return (
          <li key={t.href} className={estilos.tarjetaCaja}>
            {accesos.length === 0 ? (
              baldosa
            ) : (
              /*
               * Las páginas que cuelgan de esta categoría (Filtros Donaldson bajo Filtración,
               * 2026-10-26): un botón DENTRO de la baldosa, bajo su nombre, con el icono y el
               * nombre de la marca. La foto cede su alto, así la baldosa mide lo mismo que las
               * demás. Dos enlaces hermanos (no uno dentro de otro): teclado y lectores, como el
               * resto del menú.
               */
              <div className={estilos.tarjetaMarco}>
                {baldosa}
                {accesos.map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className={estilos.acceso}
                    style={{ "--acceso-color": a.color } as CSSProperties}
                    onClick={alElegir}
                  >
                    {a.icono ? (
                      <Image
                        src={a.icono.url}
                        width={a.icono.width}
                        height={a.icono.height}
                        alt=""
                        sizes="24px"
                        loading="lazy"
                        className={estilos.accesoIcono}
                      />
                    ) : null}
                    <span className={estilos.accesoNombre}>{a.etiqueta}</span>
                  </Link>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Acordeon({
  grupo,
  nivel,
  alElegir,
}: {
  grupo: GrupoMenu;
  nivel: number;
  alElegir: () => void;
}) {
  const [abierto, alternar] = useAbierto(grupo.titulo);
  const region = useRef<HTMLDivElement>(null);
  const plegable = usePlegable(region, abierto);
  const id = useId();
  return (
    <div className={estilos.acordeon} data-nivel={nivel} data-abierto={abierto ? "si" : "no"}>
      <button
        type="button"
        className={estilos.titulo}
        aria-expanded={abierto}
        aria-controls={id}
        onClick={alternar}
      >
        {abierto ? (
          <IconMinus aria-hidden="true" focusable="false" stroke={2.5} />
        ) : (
          <IconPlus aria-hidden="true" focusable="false" stroke={2.5} />
        )}
        {/*
         * Logo de la marca (petición del cliente, §26): DECORATIVO, el nombre
         * ya dice la marca. Va dentro de un acordeón cerrado (`hidden`), así
         * que la carga diferida no lo descarga hasta que se abre. Medidas
         * explícitas: sin CLS.
         */}
        {grupo.logo ? (
          <LogoMarca
            logo={{ ...grupo.logo, oscuro: grupo.logo.oscuro === true }}
            alt=""
            sizes="96px"
            loading="lazy"
            className={estilos.logo}
          />
        ) : null}
        {grupo.titulo}
      </button>
      <div
        ref={region}
        id={id}
        className={estilos.plegable}
        hidden={plegable.oculto}
        inert={plegable.inerte}
      >
        <div className={estilos.contenido}>
          <Lista enlaces={grupo.enlaces} alElegir={alElegir} />
          {grupo.tarjetas ? <Tarjetas tarjetas={grupo.tarjetas} alElegir={alElegir} /> : null}
          <GrupoHermanos>
            {grupo.grupos.map((g) => (
              <Acordeon key={g.titulo} grupo={g} nivel={nivel + 1} alElegir={alElegir} />
            ))}
          </GrupoHermanos>
        </div>
      </div>
    </div>
  );
}

/**
 * El CONTENIDO de un panel —«Ver todo», los acordeones y los enlaces finales
 * (la política de garantías y Aditamentos)—, común al megamenú de escritorio y al menú móvil
 * (2026-10-20): los dos pintan lo mismo.
 */
export function ContenidoMenu({ panel, alElegir }: { panel: PanelMenu; alElegir: () => void }) {
  return (
    <>
      <Link href={panel.verTodo.href} className={estilos.verTodo} onClick={alElegir}>
        {panel.verTodo.etiqueta}
        <IconChevronRight aria-hidden="true" focusable="false" stroke={2} />
      </Link>
      <GrupoHermanos>
        {panel.grupos.map((g) => (
          <Acordeon key={g.titulo} grupo={g} nivel={1} alElegir={alElegir} />
        ))}
      </GrupoHermanos>
      {(panel.finales ?? []).map((e) => (
        // Un enlace suelto con el recuadro de los acordeones de nivel 1.
        <div key={e.href} className={estilos.acordeon} data-nivel={1}>
          <Link
            href={e.href}
            className={`${estilos.titulo} ${estilos.tituloEnlace}`}
            onClick={alElegir}
          >
            <IconChevronRight aria-hidden="true" focusable="false" stroke={2.5} />
            {e.etiqueta}
          </Link>
        </div>
      ))}
    </>
  );
}

/**
 * MENÚ MÓVIL (2026-10-20): una entrada con panel es su enlace y, al lado, un
 * botón que despliega el MISMO contenido que el megamenú de escritorio
 * (`ContenidoMenu`). Divulgación con `aria-expanded`; los enlaces están en el
 * HTML del servidor aunque estén plegados. Con M4, se pliega con su altura y
 * abrir una entrada cierra la otra (las entradas van en un `GrupoHermanos`).
 */
export function SubmenuMovil({
  etiqueta,
  href,
  actual,
  panel,
  claseEnlace,
  alElegir,
}: {
  etiqueta: string;
  href: string;
  actual: "page" | undefined;
  panel: PanelMenu;
  claseEnlace?: string;
  alElegir: () => void;
}) {
  const [abierto, alternar] = useAbierto(href);
  const region = useRef<HTMLDivElement>(null);
  const plegable = usePlegable(region, abierto);
  const id = useId();
  return (
    <>
      <div className={estilos.filaMovil}>
        <Link href={href} className={claseEnlace} aria-current={actual}>
          {etiqueta}
        </Link>
        <button
          type="button"
          className={estilos.abrirMovil}
          aria-expanded={abierto}
          aria-controls={id}
          aria-label={`${abierto ? "Cerrar" : "Abrir"} el menú de ${etiqueta}`}
          onClick={alternar}
        >
          {abierto ? (
            <IconMinus aria-hidden="true" focusable="false" stroke={2.5} />
          ) : (
            <IconPlus aria-hidden="true" focusable="false" stroke={2.5} />
          )}
        </button>
      </div>
      <div
        ref={region}
        id={id}
        className={estilos.plegable}
        hidden={plegable.oculto}
        inert={plegable.inerte}
      >
        <div className={estilos.movil}>
          <ContenidoMenu panel={panel} alElegir={alElegir} />
        </div>
      </div>
    </>
  );
}

/** El radio de las esquinas de abajo del marco (`--mega-radio`). */
const radioDe = (m: HTMLElement) =>
  parseFloat(getComputedStyle(m).getPropertyValue("--mega-radio")) || 30;

/** Cómo está cada panel dentro del marco. */
export type EstadoPanel = "activo" | "saliendo" | "oculto";

/**
 * EL MARCO del megamenú (2026-10-25): UNA caja con el contorno para todos los
 * paneles, que van dentro: nunca hay dos a la vez.
 *
 * EL CONTORNO es UN SOLO elemento real (`.forma`, `lib/cabecera/marco.ts`):
 * fondo, filete y esquinas con `border` y `border-radius` nativos, que cambia de
 * `width` y `height` de verdad. Antes (#357) eran piezas de 1 × 1 px estiradas con
 * `scale()` y con transición CSS: con GPU, tras cambiar de menú, el fondo se
 * quedaba en pantalla con el tamaño de otro panel (en «Repuestos», sin cubrirlo).
 *
 * EL CONTORNO SIGUE SIEMPRE AL PANEL: cada cambio de tamaño o de posición del
 * panel lo repinta, con la caja MEDIDA del panel en pantalla, también a mitad de
 * un cambio de panel.
 *
 * M3: al cambiar de panel con el marco abierto, no se cierra y reabre: durante
 * `DURACION_MARCO_MS` el contorno y el recorte del contenido pasan del tamaño de
 * antes al nuevo, INTERPOLADOS AQUÍ fotograma a fotograma (sin transiciones CSS,
 * que con GPU podían quedarse a medias; si el panel cambia a mitad, va hacia la
 * medida nueva); el saliente se funde mientras entra el nuevo. Nada cambia de
 * sitio en la maqueta: CLS 0. Sin M3, el cambio vuelve a hacer la entrada de
 * siempre (bajada y fundido). Con «reducir movimiento», al instante.
 */
export function MarcoMegamenu({
  activo,
  abierto,
  arriba,
  children,
}: {
  /** El panel que se ve: el abierto o, mientras se cierra, el último. */
  activo: string | null;
  abierto: boolean;
  /** Dónde acaba la cabecera (px): el marco empieza ahí. `null`: el valor de reserva del CSS. */
  arriba: number | null;
  children: (estado: (clave: string) => EstadoPanel) => ReactNode;
}) {
  const mejoras = useContext(MejorasMenu);
  const marco = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const contenido = useRef<HTMLDivElement>(null);
  const forma = useRef<HTMLSpanElement>(null);
  const previo = useRef<{ activo: string | null; abierto: boolean }>({ activo, abierto });
  const ultimoAlto = useRef<number | null>(null);
  const finCambio = useRef<number | undefined>(undefined);
  /** La caja que se ve ahora y, durante un cambio (M3), de dónde viene, adónde va y desde cuándo. */
  const pintada = useRef<CajaMarco | null>(null);
  const cambio = useRef<{
    desde: CajaMarco;
    hacia: CajaMarco;
    inicio: number;
    fotograma: number;
  } | null>(null);
  const [saliente, setSaliente] = useState<string | null>(null);

  /** Pone la caja en el contorno y en el recorte del contenido: valores fijos, sin transiciones. */
  const aplicar = useCallback((caja: CajaMarco) => {
    const m = marco.current;
    const l = lienzo.current;
    const c = contenido.current;
    const f = forma.current;
    if (!m || !l || !c || !f) return;
    const traslado = `${caja.x}px 0px`;
    if (f.style.translate !== traslado) f.style.translate = traslado;
    if (f.style.width !== `${caja.ancho}px`) f.style.width = `${caja.ancho}px`;
    if (f.style.height !== `${caja.alto}px`) f.style.height = `${caja.alto}px`;
    f.dataset.medida = "si";
    const recorte = recorteMarco(caja, l.clientWidth, c.offsetHeight, radioDe(m));
    if (c.style.clipPath !== recorte) c.style.clipPath = recorte;
    pintada.current = caja;
  }, []);

  /** La caja del panel que se ve, MEDIDA en pantalla. */
  const medir = useCallback((): CajaMarco | null => {
    const m = marco.current;
    const l = lienzo.current;
    const v = contenido.current?.querySelector<HTMLElement>("nav[data-estado='activo']");
    if (!m || !l || !v) return null;
    const rl = l.getBoundingClientRect();
    const rv = v.getBoundingClientRect();
    ultimoAlto.current = rv.height;
    return cajaMarco(l.clientWidth, rv.width, rv.height, radioDe(m), rv.left - rl.left);
  }, []);

  /** Pinta el contorno sobre el panel que se ve; durante un cambio, solo le da el destino nuevo. */
  const pintar = useCallback(() => {
    const caja = medir();
    if (!caja) return;
    if (cambio.current) cambio.current.hacia = caja;
    else aplicar(caja);
  }, [aplicar, medir]);

  const pararCambio = useCallback(() => {
    if (cambio.current) window.cancelAnimationFrame(cambio.current.fotograma);
    cambio.current = null;
  }, []);

  /** M3: del tamaño que se ve al del panel nuevo, un fotograma tras otro. */
  const empezarCambio = useCallback(() => {
    const hacia = medir();
    if (!hacia) return;
    const desde = pintada.current ?? hacia;
    pararCambio();
    const paso = (ahora: number) => {
      const actual = cambio.current;
      if (!actual) return;
      const t = Math.min(1, (ahora - actual.inicio) / DURACION_MARCO_MS);
      aplicar(interpolarCaja(actual.desde, actual.hacia, suavizadoMarco(t)));
      if (t < 1) actual.fotograma = window.requestAnimationFrame(paso);
      else cambio.current = null;
    };
    cambio.current = { desde, hacia, inicio: performance.now(), fotograma: 0 };
    cambio.current.fotograma = window.requestAnimationFrame(paso);
  }, [aplicar, medir, pararCambio]);

  // Cualquier cambio de tamaño (un acordeón, una foto que llega, otro ancho de ventana): se repinta.
  useEffect(() => {
    const c = contenido.current;
    const l = lienzo.current;
    if (!c || !l) return;
    const observador = new ResizeObserver(() => pintar());
    observador.observe(c);
    observador.observe(l);
    for (const v of c.querySelectorAll("nav")) observador.observe(v);
    return () => observador.disconnect();
  }, [pintar]);

  useEffect(
    () => () => {
      window.clearTimeout(finCambio.current);
      pararCambio();
    },
    [pararCambio],
  );

  useLayoutEffect(() => {
    const antes = previo.current;
    previo.current = { activo, abierto };
    const m = marco.current;
    const c = contenido.current;
    if (!m || !c) return;
    const otroPanel = abierto && antes.abierto && antes.activo !== null && antes.activo !== activo;
    const animar = otroPanel && !reducirMovimiento();
    if (animar && mejoras.has("M3")) {
      // Mientras dura el cambio, el contenido mide lo del más alto de los dos paneles: el
      // recorte puede ir del tamaño de antes al nuevo sin que nada se salga.
      const nuevo = c.querySelector<HTMLElement>("nav[data-estado='activo']")?.offsetHeight ?? 0;
      c.style.minHeight = `${Math.max(ultimoAlto.current ?? 0, nuevo)}px`;
      empezarCambio();
      window.clearTimeout(finCambio.current);
      finCambio.current = window.setTimeout(() => {
        pararCambio();
        c.style.minHeight = "";
        pintar();
      }, DURACION_MARCO_MS + 20);
      setSaliente(antes.activo);
      return;
    }
    // Sin cambio animado: al instante.
    window.clearTimeout(finCambio.current);
    pararCambio();
    c.style.minHeight = "";
    pintar();
    if (animar && typeof m.animate === "function") {
      // Sin M3: la entrada de siempre, otra vez, con el panel nuevo.
      m.animate([{ transform: "translate(-50%, -12px)" }, { transform: "translate(-50%, 0)" }], {
        duration: 550,
        easing: "ease",
      });
      c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 550, easing: "ease" });
    }
  }, [activo, abierto, mejoras, empezarCambio, pararCambio, pintar]);

  // El saliente se funde durante el cambio de tamaño y después desaparece.
  useEffect(() => {
    if (!saliente) return;
    const t = window.setTimeout(() => setSaliente(null), DURACION_MARCO_MS);
    return () => window.clearTimeout(t);
  }, [saliente]);

  const estado = (clave: string): EstadoPanel =>
    clave === activo ? "activo" : saliente === clave && clave !== activo ? "saliendo" : "oculto";

  return (
    <div
      ref={marco}
      className={estilos.marco}
      data-abierto={abierto ? "si" : "no"}
      data-m3={mejoras.has("M3") ? "si" : undefined}
      style={arriba === null ? undefined : ({ "--mega-arriba": `${arriba}px` } as CSSProperties)}
    >
      <div ref={lienzo} className={estilos.lienzo}>
        <div className={estilos.contorno} aria-hidden="true">
          <span ref={forma} className={estilos.forma} />
        </div>
        {/*
         * Cerrado (también durante el fundido de salida), el contenido no se puede
         * enfocar: antes el Tab entraba en el panel que se estaba cerrando.
         */}
        <div ref={contenido} className={estilos.contenidoMarco} inert={!abierto}>
          {children(estado)}
        </div>
      </div>
    </div>
  );
}

type Props = {
  id: string;
  etiqueta: string;
  panel: PanelMenu;
  /** Dentro del marco: el que se ve, el que se funde al cambiar (M3) o ninguno. */
  estado: EstadoPanel;
  /**
   * Cerrar: al elegir un enlace (`null`), con Escape o Mayús+Tab desde el
   * primero (`"boton"`), o con Tab desde el último (`"siguiente"`).
   */
  alCerrar: (clave: string, foco: "boton" | "siguiente" | null) => void;
  alEntrar: (clave: string) => void;
  alSalir: () => void;
  /** Clave del panel: las funciones de arriba son comunes y estables, así que el panel no se vuelve a pintar con cada cambio de la cabecera. */
  clave: string;
};

export const Megamenu = memo(
  forwardRef<HTMLElement, Props>(function Megamenu(
    { id, etiqueta, panel, estado, alCerrar, alEntrar, alSalir, clave },
    ref,
  ) {
    /*
     * El panel va DESPUÉS de la cabecera en el DOM (el `clip-path` del encogido
     * lo recortaría dentro). Para que el orden del tabulador siga siendo el de
     * la cabecera: al salir con Tab por el final, se cierra y el foco pasa al
     * enlace que sigue al botón; con Mayús+Tab desde el primero, vuelve al botón.
     */
    const alTeclado = (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        alCerrar(clave, "boton");
        return;
      }
      if (e.key !== "Tab") return;
      const enfocables = [
        ...e.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ].filter((el) => el.offsetParent !== null);
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        alCerrar(clave, "boton");
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        alCerrar(clave, "siguiente");
      }
    };

    return (
      <nav
        ref={ref}
        id={id}
        aria-label={etiqueta}
        className={estilos.vista}
        data-estado={estado}
        data-ancho={panelConTarjetas(panel) ? "amplio" : undefined}
        hidden={estado === "oculto"}
        inert={estado === "saliendo"}
        onKeyDown={alTeclado}
        onMouseEnter={() => alEntrar(clave)}
        onMouseLeave={alSalir}
      >
        <div className={estilos.caja}>
          <ContenidoMenu panel={panel} alElegir={() => alCerrar(clave, null)} />
        </div>
      </nav>
    );
  }),
);
