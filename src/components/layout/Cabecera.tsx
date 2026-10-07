"use client";

import { IconChevronDown, IconHeadset, IconMail, IconMenu2, IconX } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";

import { useMovimientoReducido } from "@/components/movimiento/useMovimiento";
import { claveDeEnlace, type PanelMenu } from "@/lib/megamenu";
import type { ImagenLogo } from "@/lib/seo/logo";

import estilos from "./cabecera.module.css";
import { Megamenu } from "./Megamenu";

/**
 * CABECERA DEL SITIO (ux-9, export 2629 = plantilla 2162). Valores en `cabecera.module.css`.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): se esconde con el scroll,
 * cambia de modo al salir del hero y abre el menú móvil. Los enlaces están en
 * el HTML prerenderizado.
 *
 * - El logo NO es el `<h1>` (auditoría de C, I1, 2026-10-06): en la portada,
 *   el `<h1>` es el título descriptivo de la página, oculto a la vista, en
 *   `page.tsx`. Aquí solo se marca `aria-current` en la portada, con el
 *   criterio de `useSelectedLayoutSegment` (no `usePathname`, que al
 *   regenerarse la portada devuelve `/index`).
 * - En el flujo (`sticky`), encima del hero, como en ux-9. Portada: sin fondo
 *   arriba; al bajar, el velo de Andrés. Resto de páginas: fondo blanco.
 * - Se esconde al bajar y reaparece al subir o al recibir el foco; con
 *   movimiento reducido no se esconde.
 * - Menú móvil: Escape lo cierra y devuelve el foco al botón; al abrir, el foco
 *   va al primer enlace.
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
 * Umbrales de ux-9, MEDIDOS en su plugin («Sticky Header Effects» 2.2.3): el
 * velo y el encogido entran con el scroll ≥ 60 px, y se esconde al bajar
 * cuando la posición anterior pasa de 500 px (y reaparece al subir).
 */
const UMBRAL_VELO = 60;
const UMBRAL_ESCONDER = 500;

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
  const reducido = useMovimientoReducido();
  const [arriba, setArriba] = useState(true);
  const [oculta, setOculta] = useState(false);
  // El menú guarda la ruta en la que se abrió: al cambiar de página deja de
  // contar como abierto, sin un efecto que lo cierre.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const abierto = abiertoEn === ruta;
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const cabecera = useRef<HTMLElement>(null);
  // Megamenú: qué panel está abierto y en qué ruta (como el menú móvil).
  const [mega, setMega] = useState<{ clave: string; ruta: string } | null>(null);
  const megaAbierto = mega?.ruta === ruta ? mega.clave : null;
  const disparadores = useRef<Record<string, HTMLButtonElement | null>>({});
  const paneMega = useRef<Record<string, HTMLElement | null>>({});
  const temporizador = useRef<number | undefined>(undefined);

  useEffect(() => {
    let ultimo = window.scrollY;
    const alDesplazar = () => {
      const y = window.scrollY;
      setArriba(y < UMBRAL_VELO);
      if (ultimo > UMBRAL_ESCONDER) {
        if (y > ultimo) setOculta(true);
        else if (y < ultimo) setOculta(false);
      } else if (y < ultimo) setOculta(false);
      ultimo = y;
    };
    alDesplazar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);

  useEffect(() => {
    if (abierto) panel.current?.querySelector<HTMLElement>("a")?.focus();
  }, [abierto]);

  const cerrar = () => {
    setAbiertoEn(null);
    boton.current?.focus();
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
    if (megaAbierto) {
      e.preventDefault();
      cerrarMega("boton");
    } else if (abierto) {
      e.preventDefault();
      cerrar();
    }
  };

  const esconder = oculta && !abierto && !megaAbierto && !reducido;
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

  return (
    <Fragment>
      <header
        ref={cabecera}
        className={estilos.cabecera}
        data-portada={esPortada ? "si" : "no"}
        data-modo={!esPortada || abierto ? "solido" : arriba ? "transparente" : "velo"}
        data-encogida={arriba ? "no" : "si"}
        data-oculta={esconder ? "si" : "no"}
        // El foco de teclado la hace reaparecer (decisión 5).
        onFocusCapture={() => setOculta(false)}
        onKeyDown={alTeclado}
      >
        {/* UNA fila y UN logo. */}
        <div className={estilos.fila}>
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
          <div className={estilos.accionCol}>{botonContacto}</div>
          <button
            ref={boton}
            type="button"
            className={`${estilos.hamburguesa} ${estilos.soloMovil}`}
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
            encogida={!arriba}
            alCerrar={cerrarMega}
            alEntrar={() => abrirMega(clave)}
            alSalir={cerrarMegaLuego}
          />,
        ];
      })}
    </Fragment>
  );
}
