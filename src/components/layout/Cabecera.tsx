"use client";

import {
  IconChevronDown,
  IconExternalLink,
  IconHeadset,
  IconMail,
  IconMenu2,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import {
  dentroDelPasillo,
  ESPERA_PASILLO_MS,
  FLUIDEZ_MEGAMENU,
  RETRASO_ABRIR_MS,
  RETRASO_CERRAR_MS,
  RETRASO_CERRAR_SIN_M1_MS,
  type Punto,
} from "@/lib/cabecera/fluidez";
import { inicioDelPanel, modoCabecera } from "@/lib/cabecera/modo";
import { activasDe, PARAMETRO_ANIMACIONES } from "@/lib/listado/animaciones";
import { claveDeEnlace, type PanelMenu } from "@/lib/megamenu";
import type { ImagenLogo } from "@/lib/seo/logo";

import estilos from "./cabecera.module.css";
import { GrupoHermanos, MarcoMegamenu, Megamenu, MejorasMenu, SubmenuMovil } from "./Megamenu";

/**
 * CABECERA DEL SITIO (ux-9, export 2629 = plantilla 2162). Valores en `cabecera.module.css`.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): cambia de modo al salir
 * del hero, mide su alto para el megamenú y abre los menús. Los enlaces están en
 * el HTML prerenderizado.
 *
 * - El logo NO es el `<h1>` (auditoría de C, I1, 2026-10-06): en la portada,
 *   el `<h1>` es el título descriptivo de la página, oculto a la vista, en
 *   `page.tsx`. Aquí solo se marca `aria-current` en la portada, con el
 *   criterio de `useSelectedLayoutSegment` (no `usePathname`, que al
 *   regenerarse la portada devuelve `/index`).
 * - En el flujo (`sticky`), encima del hero, como en ux-9. Portada: sin fondo
 *   arriba; al bajar, el velo de Andrés. Resto de páginas: fondo blanco.
 * - SIEMPRE visible y fija arriba, en todos los anchos: NO se esconde al bajar
 *   (petición de Andrés, 2026-10-14, docs/diseno/decisiones-cabecera.md).
 * - Menú móvil: Escape lo cierra y devuelve el foco al botón; al abrir, el foco
 *   va al primer enlace.
 * - BUSCADOR (petición del cliente, diseño de Andrés, 2026-10-14): una lupa a la
 *   izquierda de «Contáctanos» (en móvil, junto al menú) que transforma la barra
 *   en un formulario de búsqueda: logo, campo, «Buscar» y una X. Es un
 *   formulario GET a `/buscar/` que funciona sin JavaScript (la lupa también es
 *   un formulario: sin JS lleva a la página de resultados). Con JS, el foco pasa
 *   al campo; Escape y la X cierran y devuelven el foco a la lupa. La fila
 *   conserva su alto (`min-height` fijado al abrir): sin CLS.
 * - MEGAMENÚ de escritorio (§26): los enlaces del global cuya ruta tiene panel
 *   (maquinaria y repuestos) son BOTONES que lo abren —con el ratón al pasar,
 *   con clic o con Intro/Espacio—; Escape lo cierra y devuelve el foco. El
 *   menú móvil no cambia: ahí siguen siendo enlaces.
 */

type Enlace = { etiqueta: string; href: string };

type Props = {
  /** `externo`: otro sitio (la tienda), en pestaña nueva con su icono (`enlacesDeCabecera`). */
  enlaces: readonly (Enlace & { externo?: boolean })[];
  /** Botón de la cabecera (global `cabecera`). Sin él, no se pinta. */
  contacto: Enlace | null;
  whatsapp: string;
  /** Logo del panel o el de siempre (`getLogo().sitio`). */
  logo: ImagenLogo;
  nombreSitio: string;
  /** Paneles del megamenú por clave de enlace (`getMegamenu`). */
  paneles: Readonly<Record<string, PanelMenu>>;
  /** En un preview, las mejoras de fluidez (M1–M4) se recortan con `?anim=`; en el sitio publicado, no. */
  permitirUrl: boolean;
};

/**
 * Enlace de la barra a otro sitio (la tienda del cliente, 2026-10-27): pestaña
 * nueva, `noopener`, icono de enlace externo y el aviso en el nombre accesible.
 * Mismo estilo que el resto de enlaces, en escritorio y en móvil.
 */
function EnlaceExterno({ enlace }: { enlace: Enlace }) {
  return (
    <a
      href={enlace.href}
      className={`${estilos.enlace} ${estilos.externo}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${enlace.etiqueta} (se abre en otra pestaña)`}
    >
      {enlace.etiqueta}
      <IconExternalLink aria-hidden="true" focusable="false" stroke={1.75} />
    </a>
  );
}

const sinSuscripcion = () => () => {};
const parametroDeLaUrl = () => new URL(location.href).searchParams.get(PARAMETRO_ANIMACIONES);

/** Id del panel de una clave de enlace: `/maquinaria-pesada/` → `mega-maquinariapesada`. */
const idPanel = (clave: string) => `mega-${clave.replace(/[^a-z0-9]+/gi, "")}`;

/*
 * Umbral de ux-9, MEDIDO en su plugin («Sticky Header Effects» 2.2.3): el velo y
 * el encogido entran con el scroll ≥ 60 px. (Se escondía al bajar pasados 500 px;
 * quitado el 2026-10-14.)
 */
const UMBRAL_VELO = 60;

function Logo({
  logo,
  esPortada,
  nombreSitio,
}: {
  logo: ImagenLogo;
  esPortada: boolean;
  nombreSitio: string;
}) {
  return (
    <Link
      href="/"
      aria-label={`${nombreSitio} — Inicio`}
      aria-current={esPortada ? "page" : undefined}
    >
      <Image
        src={logo.src}
        alt={nombreSitio}
        width={logo.width}
        height={logo.height}
        className={estilos.logo}
        preload
      />
    </Link>
  );
}

export function Cabecera({
  enlaces,
  contacto,
  whatsapp,
  logo,
  nombreSitio,
  paneles,
  permitirUrl,
}: Props) {
  const esPortada = useSelectedLayoutSegment() === null;
  const ruta = usePathname();
  const [arriba, setArriba] = useState(true);
  // Alto de la barra, medido: el panel del megamenú empieza justo donde acaba.
  const [alto, setAlto] = useState<number | null>(null);
  // El menú guarda la ruta en la que se abrió: al cambiar de página deja de
  // contar como abierto, sin un efecto que lo cierre.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const abierto = abiertoEn === ruta;
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const cabecera = useRef<HTMLElement>(null);
  // Buscador: la ruta en la que se abrió (cambiar de página lo cierra), el alto de
  // la fila al abrir (para que la barra no cambie de alto) y quién lo abrió.
  const [buscandoEn, setBuscandoEn] = useState<string | null>(null);
  const buscando = buscandoEn === ruta;
  const [altoFila, setAltoFila] = useState<number | null>(null);
  const fila = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const abridor = useRef<HTMLButtonElement | null>(null);
  // Megamenú: qué panel está abierto y en qué ruta (como el menú móvil).
  const [mega, setMega] = useState<{ clave: string; ruta: string } | null>(null);
  const megaAbierto = mega?.ruta === ruta ? mega.clave : null;
  const disparadores = useRef<Record<string, HTMLButtonElement | null>>({});
  const paneMega = useRef<Record<string, HTMLElement | null>>({});
  const temporizador = useRef<number | undefined>(undefined);
  // El último panel abierto: se sigue viendo mientras el marco se cierra.
  const [ultimo, setUltimo] = useState<string | null>(null);
  // Fluidez (`lib/cabecera/fluidez.ts`): las mejoras encendidas, recortadas con `?anim=` en un preview.
  const parametro = useSyncExternalStore(sinSuscripcion, parametroDeLaUrl, () => null);
  const claveMejoras = activasDe(FLUIDEZ_MEGAMENU, parametro, permitirUrl).join(" ");
  const mejoras = useMemo(
    () =>
      new Set(claveMejoras.split(" ").filter(Boolean)) as ReadonlySet<
        keyof typeof FLUIDEZ_MEGAMENU
      >,
    [claveMejoras],
  );
  const mejorasRef = useRef(mejoras);
  useEffect(() => {
    mejorasRef.current = mejoras;
  }, [mejoras]);
  // M2: el botón bajo el puntero, las últimas posiciones del puntero y el marco (su caja).
  const encima = useRef<string | null>(null);
  const rastro = useRef<Punto[]>([]);
  const marcoRef = useRef<HTMLDivElement | null>(null);
  const abiertaRef = useRef<string | null>(null);
  // El panel abierto con el teclado: su primer enlace recibe el foco en cuanto se ve.
  const enfocarAlAbrir = useRef<string | null>(null);

  useEffect(() => {
    const alDesplazar = () => setArriba(window.scrollY < UMBRAL_VELO);
    alDesplazar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);

  // El alto cambia con el ancho (el logo encoge entre 1025 y ~1335 px): se vuelve a medir.
  useEffect(() => {
    const el = cabecera.current;
    if (!el) return;
    const medir = () => setAlto(el.offsetHeight);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    if (abierto) panel.current?.querySelector<HTMLElement>("a")?.focus();
  }, [abierto]);

  const cerrar = () => {
    setAbiertoEn(null);
    boton.current?.focus();
  };

  // Al abrir el buscador el foco pasa al campo; al cerrarlo, vuelve a la lupa. La
  // lupa está oculta (`display: none`) mientras la barra está abierta, así que el
  // foco se devuelve DESPUÉS de renderizar el cierre, no al pulsar.
  const devolverFoco = useRef(false);
  useEffect(() => {
    if (buscando) {
      campo.current?.focus();
    } else if (devolverFoco.current) {
      devolverFoco.current = false;
      abridor.current?.focus();
    }
  }, [buscando]);

  const abrirBusqueda = (e: FormEvent<HTMLFormElement>) => {
    // Con JavaScript la lupa abre la barra; sin él, el formulario lleva a `/buscar/`.
    e.preventDefault();
    abridor.current = e.currentTarget.querySelector("button");
    setAltoFila(fila.current?.offsetHeight ?? null);
    setMega(null);
    setAbiertoEn(null);
    setBuscandoEn(ruta);
  };

  const cerrarBusqueda = () => {
    devolverFoco.current = true;
    setBuscandoEn(null);
    setAltoFila(null);
  };

  // Clic fuera de la cabecera y del panel: se cierra el megamenú.
  useEffect(() => {
    if (!megaAbierto) return;
    const fuera = (e: PointerEvent) => {
      const t = e.target as Node;
      if (cabecera.current?.contains(t) || paneMega.current[megaAbierto]?.contains(t)) return;
      setMega(null);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [megaAbierto]);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  useEffect(() => {
    abiertaRef.current = megaAbierto;
  }, [megaAbierto]);

  /** Abre un panel y lo recuerda: se sigue viendo mientras el marco se cierra. */
  const mostrarMega = useCallback(
    (clave: string) => {
      setMega({ clave, ruta });
      setUltimo(clave);
    },
    [ruta],
  );

  // M2: el rastro del puntero mientras hay un panel abierto (las 4 últimas posiciones).
  useEffect(() => {
    if (!megaAbierto || !mejoras.has("M2")) return;
    const mover = (e: PointerEvent) => {
      rastro.current = [...rastro.current.slice(-3), { x: e.clientX, y: e.clientY }];
    };
    document.addEventListener("pointermove", mover, { passive: true });
    return () => {
      document.removeEventListener("pointermove", mover);
      rastro.current = [];
    };
  }, [megaAbierto, mejoras]);

  /** M2: ¿el puntero va hacia el panel abierto? */
  const vaAlPanel = () => {
    const caja = marcoRef.current
      ?.querySelector("nav[data-estado='activo']")
      ?.getBoundingClientRect();
    const puntos = rastro.current;
    if (!caja || puntos.length < 2) return false;
    return dentroDelPasillo(puntos[0] as Punto, puntos[puntos.length - 1] as Punto, caja);
  };

  // Estables (no cambian al abrir el buscador ni al hacer scroll): así los paneles del
  // megamenú, que son memoizados, no se vuelven a pintar con cada cambio de la cabecera.
  const abrirMega = useCallback(
    (clave: string) => {
      window.clearTimeout(temporizador.current);
      const m = mejorasRef.current;
      const abierta = abiertaRef.current;
      // El que ya está abierto (el puntero vuelve a su botón o entra en el panel): se queda.
      if (abierta === clave) return;
      const abrir = () => mostrarMega(clave);
      // M2: hay otro abierto y el puntero baja hacia él: se espera; si sigue en este botón, cambia.
      if (abierta && m.has("M2") && vaAlPanel()) {
        temporizador.current = window.setTimeout(() => {
          if (encima.current === clave) abrir();
        }, ESPERA_PASILLO_MS);
        return;
      }
      // M1: se espera un poco, por si solo pasaba por encima.
      if (m.has("M1")) {
        temporizador.current = window.setTimeout(abrir, RETRASO_ABRIR_MS);
        return;
      }
      abrir();
    },
    [mostrarMega],
  );

  const cerrarMegaLuego = useCallback(() => {
    window.clearTimeout(temporizador.current);
    // Sin panel abierto no hay nada que cerrar (y el que iba a abrirse por M1 ya no se abre).
    if (!abiertaRef.current) return;
    const espera = mejorasRef.current.has("M1") ? RETRASO_CERRAR_MS : RETRASO_CERRAR_SIN_M1_MS;
    temporizador.current = window.setTimeout(() => setMega(null), espera);
  }, []);

  const cerrarMega = useCallback((clave: string | null, foco: "boton" | "siguiente" | null) => {
    window.clearTimeout(temporizador.current);
    setMega(null);
    if (!clave || !foco) return;
    const disparador = disparadores.current[clave];
    if (foco === "boton" || !disparador) {
      disparador?.focus();
      return;
    }
    // Lo enfocable que sigue al botón dentro de la cabecera.
    const enfocables = [
      ...(cabecera.current?.querySelectorAll<HTMLElement>("a[href], button") ?? []),
    ].filter((el) => el.offsetParent !== null);
    enfocables[enfocables.indexOf(disparador) + 1]?.focus();
  }, []);

  // Una función por panel, siempre la misma (un `ref` nuevo en cada pintado lo haría cambiar).
  const refsPanel = useRef<Record<string, (el: HTMLElement | null) => void>>({});
  const refDelPanel = (clave: string) =>
    (refsPanel.current[clave] ??= (el) => {
      paneMega.current[clave] = el;
    });

  const alPulsarDisparador = (clave: string) => (e: MouseEvent<HTMLButtonElement>) => {
    // Con el teclado (Intro o Espacio) el clic llega con `detail` 0.
    const conTeclado = e.detail === 0;
    if (megaAbierto === clave && conTeclado) {
      setMega(null);
      return;
    }
    // Un clic o una tecla abren AL INSTANTE: los retrasos (M1, M2) son solo para el ratón que pasa.
    window.clearTimeout(temporizador.current);
    mostrarMega(clave);
    // Con el teclado, el foco entra en el panel cuando ya se ve (efecto de abajo).
    if (conTeclado) enfocarAlAbrir.current = clave;
  };

  /*
   * El foco entra en el panel abierto con el teclado EN CUANTO SE VE. Antes, con un
   * `setTimeout(0)`, el panel aún estaba oculto y el foco se quedaba en el botón
   * (medido con «reducir movimiento», 2026-10-26; ya pasaba en el sitio publicado):
   * con esa preferencia, una regla global da a todo una transición de 0,01 ms y los
   * hijos del marco heredan `visibility: hidden` un fotograma más. Se reintenta en
   * cada fotograma, como mucho 10, hasta que el enlace acepta el foco.
   */
  useEffect(() => {
    if (!megaAbierto || enfocarAlAbrir.current !== megaAbierto) return;
    enfocarAlAbrir.current = null;
    let intentos = 0;
    let id = 0;
    const intentar = () => {
      const enlace = paneMega.current[megaAbierto]?.querySelector<HTMLElement>("a");
      if (!enlace) return;
      enlace.focus();
      if (document.activeElement !== enlace && intentos++ < 10)
        id = requestAnimationFrame(intentar);
    };
    id = requestAnimationFrame(intentar);
    return () => cancelAnimationFrame(id);
  }, [megaAbierto]);

  const alTeclado = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Escape") return;
    if (buscando) {
      e.preventDefault();
      cerrarBusqueda();
    } else if (megaAbierto) {
      e.preventDefault();
      cerrarMega(megaAbierto, "boton");
    } else if (abierto) {
      e.preventDefault();
      cerrar();
    }
  };

  const actual = (href: string) => (ruta === href || ruta.startsWith(href) ? "page" : undefined);

  // Móvil: las entradas con panel despliegan su contenido (el mismo del megamenú, 2026-10-20).
  const listaEnlaces = (
    <ul className={estilos.lista}>
      {enlaces.map((e) => {
        const datos = paneles[claveDeEnlace(e.href)];
        return (
          <li key={e.href}>
            {e.externo ? (
              <EnlaceExterno enlace={e} />
            ) : datos ? (
              <SubmenuMovil
                etiqueta={e.etiqueta}
                href={e.href}
                actual={actual(e.href)}
                panel={datos}
                claseEnlace={estilos.enlace}
                alElegir={() => setAbiertoEn(null)}
              />
            ) : (
              <Link href={e.href} className={estilos.enlace} aria-current={actual(e.href)}>
                {e.etiqueta}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );

  // Escritorio: las entradas con panel son botones; el resto, enlaces.
  const listaEscritorio = (
    <ul className={estilos.lista}>
      {enlaces.map((e) => {
        const clave = claveDeEnlace(e.href);
        if (e.externo) {
          return (
            <li key={e.href}>
              <EnlaceExterno enlace={e} />
            </li>
          );
        }
        if (!paneles[clave]) {
          return (
            <li key={e.href}>
              <Link href={e.href} className={estilos.enlace} aria-current={actual(e.href)}>
                {e.etiqueta}
              </Link>
            </li>
          );
        }
        return (
          <li
            key={e.href}
            onMouseEnter={() => {
              encima.current = clave;
              abrirMega(clave);
            }}
            onMouseLeave={() => {
              if (encima.current === clave) encima.current = null;
              cerrarMegaLuego();
            }}
          >
            <button
              ref={(el) => {
                disparadores.current[clave] = el;
              }}
              type="button"
              className={`${estilos.enlace} ${estilos.disparador}`}
              aria-expanded={megaAbierto === clave}
              aria-controls={idPanel(clave)}
              data-actual={actual(e.href) ? "si" : undefined}
              onClick={alPulsarDisparador(clave)}
            >
              {e.etiqueta}
              <IconChevronDown aria-hidden="true" focusable="false" stroke={2} />
            </button>
          </li>
        );
      })}
    </ul>
  );

  const botonContacto = contacto ? (
    <Link href={contacto.href} className={`${estilos.boton} texto-etiqueta`}>
      <IconMail aria-hidden="true" focusable="false" stroke={1.75} />
      {contacto.etiqueta}
    </Link>
  ) : null;

  const lupa = (
    <form action="/buscar/" method="get" className={estilos.lupaForm} onSubmit={abrirBusqueda}>
      <button
        type="submit"
        className={estilos.lupa}
        aria-label="Buscar"
        aria-expanded={buscando}
        aria-controls="cab-busqueda"
      >
        <IconSearch aria-hidden="true" focusable="false" stroke={1.75} />
      </button>
    </form>
  );

  const conPanel = enlaces.filter((e) => paneles[claveDeEnlace(e.href)]);
  const visible = megaAbierto ?? ultimo;

  return (
    <MejorasMenu.Provider value={mejoras}>
      <header
        ref={cabecera}
        className={estilos.cabecera}
        data-portada={esPortada ? "si" : "no"}
        data-modo={modoCabecera({
          esPortada,
          arriba,
          menuMovilAbierto: abierto,
          megaAbierto: megaAbierto !== null,
        })}
        data-encogida={arriba ? "no" : "si"}
        data-mega={megaAbierto ? "si" : "no"}
        data-buscando={buscando ? "si" : "no"}
        onKeyDown={alTeclado}
      >
        {/* UNA fila y UN logo. */}
        <div
          ref={fila}
          className={estilos.fila}
          style={altoFila ? { minHeight: altoFila } : undefined}
        >
          <a
            href={whatsapp}
            className={`${estilos.icono} ${estilos.soloMovil}`}
            aria-label="Atención al cliente por WhatsApp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconHeadset aria-hidden="true" focusable="false" stroke={1.5} />
          </a>
          <div className={estilos.logoCol}>
            <Logo logo={logo} esPortada={esPortada} nombreSitio={nombreSitio} />
          </div>
          <nav className={estilos.nav} aria-label="Navegación principal">
            {listaEscritorio}
          </nav>
          <div className={estilos.accionCol}>
            <div className={estilos.acciones}>
              {lupa}
              {botonContacto}
            </div>
          </div>
          <form
            id="cab-busqueda"
            role="search"
            aria-label="Buscar en el sitio"
            action="/buscar/"
            method="get"
            className={estilos.busqueda}
            hidden={!buscando}
          >
            <label htmlFor="cab-buscar" className="sr-only">
              Buscar en el sitio
            </label>
            <input
              ref={campo}
              id="cab-buscar"
              name="q"
              type="search"
              className={estilos.busquedaCampo}
              placeholder="Escribe los términos de búsqueda…"
              autoComplete="off"
              maxLength={80}
            />
            <button type="submit" className={`${estilos.busquedaBoton} texto-etiqueta`}>
              <IconSearch aria-hidden="true" focusable="false" stroke={1.75} />
              Buscar
            </button>
            <button
              type="button"
              className={estilos.busquedaCerrar}
              aria-label="Cerrar búsqueda"
              onClick={cerrarBusqueda}
            >
              <IconX aria-hidden="true" focusable="false" stroke={1.75} />
            </button>
          </form>
          <div className={estilos.derechaMovil}>
            {lupa}
            <button
              ref={boton}
              type="button"
              className={estilos.hamburguesa}
              aria-expanded={abierto}
              aria-controls="menu-movil"
              aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setAbiertoEn(abierto ? null : ruta)}
            >
              {abierto ? (
                <IconX aria-hidden="true" focusable="false" stroke={1.5} />
              ) : (
                <IconMenu2 aria-hidden="true" focusable="false" stroke={1.5} />
              )}
            </button>
          </div>
        </div>

        <div ref={panel} id="menu-movil" className={estilos.panel} hidden={!abierto}>
          <nav aria-label="Menú">
            <GrupoHermanos>{listaEnlaces}</GrupoHermanos>
          </nav>
          {botonContacto}
        </div>
      </header>

      {/*
       * Fuera de la cabecera: su `clip-path` recortaría el panel (§26). UN marco para
       * todos los paneles (2026-10-25): nunca hay dos a la vez.
       */}
      {conPanel.length > 0 ? (
        <div ref={marcoRef}>
          <MarcoMegamenu
            activo={visible}
            abierto={megaAbierto !== null}
            arriba={inicioDelPanel(alto, !arriba)}
          >
            {(estado) =>
              conPanel.map((e) => {
                const clave = claveDeEnlace(e.href);
                return (
                  <Megamenu
                    key={clave}
                    ref={refDelPanel(clave)}
                    clave={clave}
                    id={idPanel(clave)}
                    etiqueta={e.etiqueta}
                    panel={paneles[clave] as PanelMenu}
                    estado={estado(clave)}
                    alCerrar={cerrarMega}
                    alEntrar={abrirMega}
                    alSalir={cerrarMegaLuego}
                  />
                );
              })
            }
          </MarcoMegamenu>
        </div>
      ) : null}
    </MejorasMenu.Provider>
  );
}
