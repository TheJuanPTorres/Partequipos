"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { CURVA_FRENADA, DURACION_DESLIZAR_MS } from "@/lib/listado/animaciones";
import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./kit.module.css";

/** Lo que se necesita de una imagen para pintarla (el logo no lleva punto focal). */
type Imagen = Pick<ImagenLista, "url" | "alt" | "width" | "height">;

/**
 * PÍLDORA DE NAVEGACIÓN del «Kit de marca» (2026-10-25), al estilo de la isla de Apple: aparece
 * arriba al centro cuando la cabecera sale de la pantalla, primero como la píldora del logo y
 * enseguida se extiende con los tipos de la marca. El tipo que está a media pantalla se marca con
 * el color de la marca, y ese resaltado se DESLIZA de uno a otro (`::before` animado con
 * `transform`, como la barra de series, sin librerías). Es un atajo: las secciones siguen ahí
 * aunque no aparezca. Con «reducir movimiento», aparece y cambia sin viajar.
 */
export function PildoraKit({
  nombre,
  logo,
  tipos,
  idCabecera,
}: {
  nombre: string;
  logo: Imagen | null;
  tipos: { clave: string; nombre: string }[];
  /** `id` del `<h1>` de la cabecera. */
  idCabecera: string;
}) {
  const [visible, setVisible] = useState(false);
  const [activa, setActiva] = useState<string | null>(tipos[0]?.clave ?? null);
  const lista = useRef<HTMLUListElement>(null);
  const barra = useRef<HTMLElement>(null);
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

  // Va SIEMPRE justo debajo de la cabecera del sitio, que es fija y cambia de alto al bajar (se
  // encoge): se sigue su borde inferior real, y el CSS suaviza el cambio con una transición.
  useEffect(() => {
    const sitio = document.querySelector("header");
    const el = barra.current;
    if (!sitio || !el) return;
    const colocar = () =>
      el.style.setProperty(
        "--pildora-arriba",
        `${Math.max(0, Math.round(sitio.getBoundingClientRect().bottom))}px`,
      );
    colocar();
    const ro = new ResizeObserver(colocar);
    ro.observe(sitio);
    addEventListener("scroll", colocar, { passive: true });
    addEventListener("resize", colocar);
    return () => {
      ro.disconnect();
      removeEventListener("scroll", colocar);
      removeEventListener("resize", colocar);
    };
  }, []);

  // Visible desde que la cabecera deja de verse.
  useEffect(() => {
    const cabecera = document.getElementById(idCabecera)?.closest("section");
    if (!cabecera) return;
    const io = new IntersectionObserver(
      (entradas) => {
        const e = entradas[0];
        if (e) setVisible(!e.isIntersecting);
      },
      { threshold: 0 },
    );
    io.observe(cabecera);
    return () => io.disconnect();
  }, [idCabecera]);

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
    <nav
      ref={barra}
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
          <Image src={logo.url} alt="" width={logo.width} height={logo.height} sizes="96px" />
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
  );
}
