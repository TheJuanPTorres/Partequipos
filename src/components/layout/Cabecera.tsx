"use client";

import { IconHeadset, IconMail, IconMenu2, IconX } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { useMovimientoReducido } from "@/components/movimiento/useMovimiento";

import estilos from "./cabecera.module.css";

/**
 * CABECERA DEL SITIO (ux-9, export 2629 = plantilla 2162). Valores en `cabecera.module.css`.
 *
 * POR QUÉ ES COMPONENTE DE CLIENTE (CLAUDE.md §3.1): se esconde con el scroll,
 * cambia de modo al salir del hero y abre el menú móvil. Los enlaces están en
 * el HTML prerenderizado.
 *
 * - El logo es el `<h1>` SOLO en la portada (D1), con el criterio que tenía
 *   `LogoCabecera`: `useSelectedLayoutSegment`, no `usePathname`, porque al
 *   regenerarse la portada `usePathname` devuelve `/index`.
 * - En el flujo (`sticky`), encima del hero, como en ux-9. Portada: sin fondo
 *   arriba; al bajar, el velo de Andrés. Resto de páginas: fondo blanco.
 * - Se esconde al bajar y reaparece al subir o al recibir el foco; con
 *   movimiento reducido no se esconde.
 * - Menú móvil: Escape lo cierra y devuelve el foco al botón; al abrir, el foco
 *   va al primer enlace.
 */

type Enlace = { etiqueta: string; href: string };

type Props = {
  enlaces: readonly Enlace[];
  contacto: Enlace;
  whatsapp: string;
  nombreSitio: string;
  tituloPortada: string;
};

const UMBRAL_ESCONDER = 120;

function Logo({
  esPortada,
  nombreSitio,
  tituloPortada,
}: {
  esPortada: boolean;
  nombreSitio: string;
  tituloPortada: string;
}) {
  const imagen = (
    <Image
      src="/logo-partequipos.png"
      alt={esPortada ? tituloPortada : nombreSitio}
      width={187}
      height={51}
      className={estilos.logo}
      preload
    />
  );
  if (esPortada) {
    return (
      <h1 className="m-0">
        <Link href="/" aria-current="page">
          {imagen}
        </Link>
      </h1>
    );
  }
  return (
    <Link href="/" aria-label={`${nombreSitio} — Inicio`}>
      {imagen}
    </Link>
  );
}

export function Cabecera({ enlaces, contacto, whatsapp, nombreSitio, tituloPortada }: Props) {
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

  useEffect(() => {
    let ultimo = window.scrollY;
    const alDesplazar = () => {
      const y = window.scrollY;
      setArriba(y < 10);
      if (y > ultimo && y > UMBRAL_ESCONDER) setOculta(true);
      else if (y < ultimo) setOculta(false);
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

  const alTeclado = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape" && abierto) {
      e.preventDefault();
      cerrar();
    }
  };

  const esconder = oculta && !abierto && !reducido;
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

  const botonContacto = (
    <Link href={contacto.href} className={`${estilos.boton} texto-etiqueta`}>
      <IconMail aria-hidden="true" focusable="false" stroke={1.75} />
      {contacto.etiqueta}
    </Link>
  );

  return (
    <header
      className={estilos.cabecera}
      data-portada={esPortada ? "si" : "no"}
      data-modo={!esPortada || abierto ? "solido" : arriba ? "transparente" : "velo"}
      data-encogida={arriba ? "no" : "si"}
      data-oculta={esconder ? "si" : "no"}
      // El foco de teclado la hace reaparecer (decisión 5).
      onFocusCapture={() => setOculta(false)}
      onKeyDown={alTeclado}
    >
      {/* UNA fila y UN logo: el `<h1>` de la portada no puede quedar oculto en ningún ancho. */}
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
          <Logo esPortada={esPortada} nombreSitio={nombreSitio} tituloPortada={tituloPortada} />
        </div>
        <nav className={estilos.nav} aria-label="Navegación principal">
          {listaEnlaces}
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
  );
}
