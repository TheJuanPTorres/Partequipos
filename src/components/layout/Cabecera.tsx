"use client";

import {
  IconChevronDown,
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
  Fragment,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { inicioDelPanel, modoCabecera } from "@/lib/cabecera/modo";
import { claveDeEnlace, type PanelMenu } from "@/lib/megamenu";
import type { ImagenLogo } from "@/lib/seo/logo";

import estilos from "./cabecera.module.css";
import { Megamenu } from "./Megamenu";

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
  enlaces: readonly Enlace[];
  /** Botón de la cabecera (global `cabecera`). Sin él, no se pinta. */
  contacto: Enlace | null;
  whatsapp: string;
  /** Logo del panel o el de siempre (`getLogo().sitio`). */
  logo: ImagenLogo;
  nombreSitio: string;
  /** Paneles del megamenú por clave de enlace (`getMegamenu`). */
  paneles: Readonly<Record<string, PanelMenu>>;
};

/** Margen para cruzar del botón al panel con el ratón sin que se cierre. */
const RETARDO_CIERRE = 200;

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

export function Cabecera({ enlaces, contacto, whatsapp, logo, nombreSitio, paneles }: Props) {
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

  // Al abrir el buscador el foco pasa al campo.
  useEffect(() => {
    if (buscando) campo.current?.focus();
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
    setBuscandoEn(null);
    setAltoFila(null);
    abridor.current?.focus();
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

  const abrirMega = (clave: string) => {
    window.clearTimeout(temporizador.current);
    setMega({ clave, ruta });
  };

  const cerrarMegaLuego = () => {
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setMega(null), RETARDO_CIERRE);
  };

  const cerrarMega = (foco: "boton" | "siguiente" | null) => {
    const clave = megaAbierto;
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
  };

  const alPulsarDisparador = (clave: string) => (e: MouseEvent<HTMLButtonElement>) => {
    // Con el teclado (Intro o Espacio) el clic llega con `detail` 0.
    const conTeclado = e.detail === 0;
    if (megaAbierto === clave && conTeclado) {
      setMega(null);
      return;
    }
    abrirMega(clave);
    if (conTeclado) {
      window.setTimeout(() => paneMega.current[clave]?.querySelector<HTMLElement>("a")?.focus(), 0);
    }
  };

  const alTeclado = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Escape") return;
    if (buscando) {
      e.preventDefault();
      cerrarBusqueda();
    } else if (megaAbierto) {
      e.preventDefault();
      cerrarMega("boton");
    } else if (abierto) {
      e.preventDefault();
      cerrar();
    }
  };

  const actual = (href: string) => (ruta === href || ruta.startsWith(href) ? "page" : undefined);

  const listaEnlaces = (
    <ul className={estilos.lista}>
      {enlaces.map((e) => (
        <li key={e.href}>
          <Link href={e.href} className={estilos.enlace} aria-current={actual(e.href)}>
            {e.etiqueta}
          </Link>
        </li>
      ))}
    </ul>
  );

  // Escritorio: las entradas con panel son botones; el resto, enlaces.
  const listaEscritorio = (
    <ul className={estilos.lista}>
      {enlaces.map((e) => {
        const clave = claveDeEnlace(e.href);
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
          <li key={e.href} onMouseEnter={() => abrirMega(clave)} onMouseLeave={cerrarMegaLuego}>
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

  return (
    <Fragment>
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
          <nav aria-label="Menú">{listaEnlaces}</nav>
          {botonContacto}
        </div>
      </header>

      {/* Fuera de la cabecera: su `clip-path` recortaría el panel (§26). */}
      {enlaces.flatMap((e) => {
        const clave = claveDeEnlace(e.href);
        const datos = paneles[clave];
        if (!datos) return [];
        return [
          <Megamenu
            key={clave}
            ref={(el) => {
              paneMega.current[clave] = el;
            }}
            id={idPanel(clave)}
            etiqueta={e.etiqueta}
            panel={datos}
            abierto={megaAbierto === clave}
            arriba={inicioDelPanel(alto, !arriba)}
            alCerrar={cerrarMega}
            alEntrar={() => abrirMega(clave)}
            alSalir={cerrarMegaLuego}
          />,
        ];
      })}
    </Fragment>
  );
}
