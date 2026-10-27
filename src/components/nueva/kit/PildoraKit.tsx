"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { LogoMarca } from "@/components/marca/LogoMarca";
import { CURVA_FRENADA, DURACION_DESLIZAR_MS } from "@/lib/listado/animaciones";
import type { ImagenLista } from "@/lib/utils/relations";

import { BotonTiposKit, type TipoPildora } from "./BotonTiposKit";
import estilos from "./kit.module.css";

/** Lo que se necesita de una imagen para pintarla (el logo no lleva punto focal). */
type Imagen = Pick<ImagenLista, "url" | "alt" | "width" | "height"> & { oscuro?: boolean };

/**
 * PÍLDORA DE NAVEGACIÓN del «Kit de marca» (2026-10-25), al estilo de la isla de Apple: aparece
 * ABAJO al centro, flotando, cuando la cabecera sale de la pantalla (y se aparta al llegar al pie), primero como la píldora del logo y
 * enseguida se extiende con los tipos de la marca. El tipo que está a media pantalla se marca con
 * el color de la marca, y ese resaltado se DESLIZA de uno a otro (`::before` animado con
 * `transform`, como la barra de series, sin librerías). Es un atajo: las secciones siguen ahí
 * aunque no aparezca. Con «reducir movimiento», aparece y cambia sin viajar.
 *
 * En MÓVIL Y TABLET (≤ 1024 px; 2026-10-27, dirección) la barra no se pinta: en su lugar va
 * `BotonTiposKit`, un botón compacto que abre el panel inferior con los tipos. Ese botón además
 * SE ESCONDE AL BAJAR y vuelve al subir; la barra de escritorio, como siempre.
 */
export function PildoraKit({
  nombre,
  logo,
  tipos,
  idCabecera,
}: {
  nombre: string;
  logo: Imagen | null;
  tipos: TipoPildora[];
  /** `id` del `<h1>` de la cabecera. */
  idCabecera: string;
}) {
  const [fueraDeCabecera, setFueraDeCabecera] = useState(false);
  const [sobrePie, setSobrePie] = useState(false);
  const visible = fueraDeCabecera && !sobrePie;
  const [bajando, setBajando] = useState(false);
  const [activa, setActiva] = useState<string | null>(tipos[0]?.clave ?? null);
  const lista = useRef<HTMLUListElement>(null);
  const anterior = useRef<{ izquierda: number; ancho: number } | null>(null);
  const reducido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Cambia el tipo activo guardando antes dónde estaba el resaltado (para deslizarlo). */
  function cambiar(clave: string) {
    setActiva((previa) => {
      if (previa === clave) return previa;
      const a = previa ? lista.current?.querySelector<HTMLElement>(`a[href="#${previa}"]`) : null;
      anterior.current = a ? { izquierda: a.offsetLeft, ancho: a.offsetWidth } : null;
      return clave;
    });
  }

  // Visible desde que la cabecera deja de verse.
  useEffect(() => {
    const cabecera = document.getElementById(idCabecera)?.closest("section");
    if (!cabecera) return;
    const io = new IntersectionObserver(
      (entradas) => {
        const e = entradas[0];
        if (e) setFueraDeCabecera(!e.isIntersecting);
      },
      { threshold: 0 },
    );
    io.observe(cabecera);
    return () => io.disconnect();
  }, [idCabecera]);

  // Móvil: el botón se esconde al bajar y vuelve al subir (con un margen, para no parpadear).
  useEffect(() => {
    let ultima = scrollY;
    let frame = 0;
    const medir = () => {
      frame = 0;
      const y = scrollY;
      if (Math.abs(y - ultima) < 8) return;
      setBajando(y > ultima);
      ultima = y;
    };
    const pedir = () => {
      if (!frame) frame = requestAnimationFrame(medir);
    };
    addEventListener("scroll", pedir, { passive: true });
    return () => {
      removeEventListener("scroll", pedir);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Al llegar al pie se aparta: no tapa el final del contenido.
  useEffect(() => {
    const pie = document.querySelector("footer");
    if (!pie) return;
    const io = new IntersectionObserver(
      (entradas) => {
        const e = entradas[0];
        if (e) setSobrePie(e.isIntersecting);
      },
      { threshold: 0 },
    );
    io.observe(pie);
    return () => io.disconnect();
  }, []);

  // El tipo activo es el que cruza la mitad de la pantalla.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) cambiar(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const t of tipos) {
      const el = document.getElementById(t.clave);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [tipos]);

  useLayoutEffect(() => {
    const antes = anterior.current;
    anterior.current = null;
    const a = activa ? lista.current?.querySelector<HTMLElement>(`a[href="#${activa}"]`) : null;
    if (!antes || !a || reducido() || !a.offsetWidth) return;
    const dx = antes.izquierda - a.offsetLeft;
    if (Math.abs(dx) < 1) return;
    a.animate(
      [
        { transform: `translateX(${dx}px) scaleX(${antes.ancho / a.offsetWidth})` },
        { transform: "none" },
      ],
      { duration: DURACION_DESLIZAR_MS, easing: CURVA_FRENADA, pseudoElement: "::before" },
    );
  }, [activa]);

  // En teléfono la lista se desliza: mantiene a la vista el tipo activo.
  useEffect(() => {
    const ul = lista.current;
    const a = activa ? ul?.querySelector<HTMLElement>(`a[href="#${activa}"]`) : null;
    if (!ul || !a || ul.scrollWidth <= ul.clientWidth) return;
    ul.scrollTo({
      left: a.offsetLeft - (ul.clientWidth - a.offsetWidth) / 2,
      behavior: reducido() ? "auto" : "smooth",
    });
  }, [activa, visible]);

  return (
    <>
      <BotonTiposKit
        nombre={nombre}
        logo={logo}
        tipos={tipos}
        activa={activa}
        visible={visible && !bajando}
      />
      <nav
        aria-label={`Tipos de máquina ${nombre}`}
        className={estilos.pildora}
        data-visible={visible ? "" : undefined}
        // Escondida, no se lee ni se enfoca.
        inert={!visible}
      >
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            scrollTo({ top: 0, behavior: reducido() ? "auto" : "smooth" });
          }}
          aria-label={`${nombre}: volver arriba`}
          className={estilos.pildoraLogo}
        >
          {logo ? (
            // Sobre la cápsula clara: el logo con su regla común (en tinta oscura si es blanco).
            <LogoMarca logo={{ ...logo, oscuro: logo.oscuro ?? false }} alt="" sizes="96px" />
          ) : (
            <span>{nombre}</span>
          )}
        </a>

        <ul ref={lista} className={estilos.pildoraLista}>
          {tipos.map((t) => (
            <li key={t.clave}>
              <a
                href={`#${t.clave}`}
                className={estilos.pildoraEnlace}
                aria-current={t.clave === activa ? "location" : undefined}
                onClick={(e) => {
                  const destino = document.getElementById(t.clave);
                  if (!destino) return;
                  e.preventDefault();
                  destino.scrollIntoView({
                    behavior: reducido() ? "auto" : "smooth",
                    block: "start",
                  });
                  history.replaceState(null, "", `#${t.clave}`);
                }}
              >
                {t.nombre}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
