"use client";

import { IconCheck, IconChevronRight, IconMinus, IconPlus } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  forwardRef,
  memo,
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
import { geometriaMarco, PIEZAS_MARCO, type PiezaMarco } from "@/lib/cabecera/marco";
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
      {tarjetas.map((t) => (
        <li key={t.href} className={estilos.tarjetaCaja}>
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
        </li>
      ))}
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

/** Cómo está cada panel dentro del marco. */
export type EstadoPanel = "activo" | "saliendo" | "oculto";

/**
 * EL MARCO del megamenú (2026-10-25): UNA caja con el contorno para todos los
 * paneles, que van dentro: nunca hay dos a la vez.
 *
 * EL CONTORNO son piezas (`lib/cabecera/marco.ts`) que solo se mueven y se
 * estiran con `transform`, solapadas 1 px entre ellas. Antes era una MÁSCARA de 6
 * piezas de degradado que solo se tocaban: con un escalado de pantalla no entero
 * (125 %) la unión caía en medio píxel y se veía una línea fina.
 *
 * EL CONTORNO SIGUE SIEMPRE AL PANEL (2026-10-26, fallo visto por Juan Pablo: en
 * «Repuestos» el fondo se quedaba con el tamaño de otro menú). Cada cambio de
 * tamaño o de posición del panel lo repinta en el mismo fotograma, con la caja
 * MEDIDA del panel en pantalla, también a mitad de un cambio de panel. Antes,
 * durante el cambio, dejaba de seguirlo hasta que la animación avisaba de que
 * había terminado; si el aviso no llegaba, el contorno se quedaba corto.
 *
 * M3: al cambiar de panel con el marco abierto, no se cierra y reabre: durante
 * `DURACION_MARCO_MS` el marco lleva `data-cambiando` y las piezas y el recorte
 * del contenido pasan del tamaño de antes al nuevo con una TRANSICIÓN CSS (se
 * reencamina sola si algo cambia a medias); el saliente se funde mientras entra el
 * nuevo. Nada cambia de sitio en la maqueta: CLS 0. Sin M3, el cambio vuelve a
 * hacer la entrada de siempre (bajada y fundido). Con «reducir movimiento», al
 * instante.
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
  const piezas = useRef<Partial<Record<PiezaMarco, HTMLSpanElement | null>>>({});
  const previo = useRef<{ activo: string | null; abierto: boolean }>({ activo, abierto });
  const ultimoAlto = useRef<number | null>(null);
  const finCambio = useRef<number | undefined>(undefined);
  const [saliente, setSaliente] = useState<string | null>(null);

  /** Pinta el contorno y el recorte sobre el panel que se ve, con su caja MEDIDA en pantalla. */
  const pintar = () => {
    const m = marco.current;
    const l = lienzo.current;
    const c = contenido.current;
    const v = c?.querySelector<HTMLElement>("nav[data-estado='activo']");
    if (!m || !l || !c || !v) return;
    const css = getComputedStyle(m);
    const radio = parseFloat(css.getPropertyValue("--mega-radio")) || 30;
    const curva = parseFloat(css.getPropertyValue("--mega-curva")) || 20;
    const rl = l.getBoundingClientRect();
    const rv = v.getBoundingClientRect();
    const g = geometriaMarco(
      l.clientWidth,
      c.offsetHeight,
      rv.width,
      rv.height,
      radio,
      curva,
      rv.left - rl.left,
    );
    for (const p of PIEZAS_MARCO) {
      const el = piezas.current[p];
      if (el && el.style.transform !== g.piezas[p]) el.style.transform = g.piezas[p];
    }
    if (c.style.clipPath !== g.recorte) c.style.clipPath = g.recorte;
    ultimoAlto.current = rv.height;
  };

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
  }, []);

  useEffect(() => () => window.clearTimeout(finCambio.current), []);

  useLayoutEffect(() => {
    const antes = previo.current;
    previo.current = { activo, abierto };
    const m = marco.current;
    const c = contenido.current;
    if (!m || !c) return;
    const cambio = abierto && antes.abierto && antes.activo !== null && antes.activo !== activo;
    const animar = cambio && !reducirMovimiento();
    if (animar && mejoras.has("M3")) {
      // Mientras dura el cambio, el contenido mide lo del más alto de los dos paneles: el
      // recorte puede ir del tamaño de antes al nuevo sin que nada se salga.
      const nuevo = c.querySelector<HTMLElement>("nav[data-estado='activo']")?.offsetHeight ?? 0;
      c.style.minHeight = `${Math.max(ultimoAlto.current ?? 0, nuevo)}px`;
      m.dataset.cambiando = "si";
      pintar();
      window.clearTimeout(finCambio.current);
      finCambio.current = window.setTimeout(() => {
        delete m.dataset.cambiando;
        c.style.minHeight = "";
        pintar();
      }, DURACION_MARCO_MS);
      setSaliente(antes.activo);
      return;
    }
    // Sin cambio animado: al instante.
    window.clearTimeout(finCambio.current);
    delete m.dataset.cambiando;
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
  }, [activo, abierto, mejoras]);

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
          {PIEZAS_MARCO.map((p) => (
            <span
              key={p}
              ref={(el) => {
                piezas.current[p] = el;
              }}
              className={estilos.pieza}
              data-pieza={p}
            />
          ))}
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
