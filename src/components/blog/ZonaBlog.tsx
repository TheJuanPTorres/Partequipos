"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition, type ReactNode } from "react";

import { CURVA, DURACION_MS, PARAMETRO_ANIMACIONES } from "@/lib/listado/animaciones";

/** Pausa tras la última tecla antes de buscar. */
const PAUSA_MS = 350;
const ESCALON_MS = 70;

/** El campo de búsqueda recuperará el foco si la página se vuelve a montar al navegar. */
let enfocarBuscador = false;

/**
 * La zona del índice del blog (cliente, 2026-10-26): busca MIENTRAS SE ESCRIBE (con una pausa
 * corta) y al elegir una categoría, navegando con el router (`scroll: false`) a la MISMA URL que
 * daría la página sin JavaScript: no recarga ni sube, y el servidor pinta cada URL entera, así que
 * el SEO no cambia. Sin JavaScript, el formulario y los enlaces funcionan como siempre.
 *
 * - El formulario es el marcado con `data-blog-buscar`; los enlaces, los marcados con
 *   `data-blog-nav` (pastillas de categoría). La búsqueda siempre vuelve a la página 1.
 * - `data-anim` dice qué mejoras (N1–N4) se pintan; el CSS de cada una cuelga de él. En un
 *   preview, `?anim=` se conserva al navegar.
 * - N3: las tarjetas entran escalonadas (Web Animations, solo `opacity` y `transform`); las que
 *   ya se ven al cargar entran enseguida y las demás al llegar. Con «reducir movimiento», nada.
 * - `clave` cambia con cada URL: al cambiar, el resultado nuevo se anima de nuevo.
 */
export function ZonaBlog({
  clave,
  activas,
  children,
}: {
  clave: string;
  activas: string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [cargando, iniciar] = useTransition();
  const zona = useRef<HTMLDivElement>(null);
  const pausa = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conN3 = activas.includes("N3");

  const navegar = (destino: URL) => {
    // Para probar las mejoras en un preview: `?anim=` sigue al navegar.
    const anim = new URL(location.href).searchParams.get(PARAMETRO_ANIMACIONES);
    if (anim !== null) destino.searchParams.set(PARAMETRO_ANIMACIONES, anim);
    iniciar(() => router.push(destino.pathname + destino.search, { scroll: false }));
  };

  /** La URL que da el formulario (lo mismo que enviaría sin JavaScript). */
  const destinoDe = (form: HTMLFormElement) => {
    const datos = new URLSearchParams();
    new FormData(form).forEach((v, k) => {
      if (typeof v === "string" && v.trim() !== "") datos.append(k, v.trim());
    });
    const destino = new URL(form.action, location.href);
    destino.search = datos.toString();
    return destino;
  };

  // Si la página se vuelve a montar (de la 2 a la 1), el campo recupera el foco al final.
  useEffect(() => {
    if (!enfocarBuscador) return;
    enfocarBuscador = false;
    const campo = zona.current?.querySelector<HTMLInputElement>("input[data-blog-buscar-campo]");
    if (!campo) return;
    campo.focus({ preventScroll: true });
    campo.setSelectionRange(campo.value.length, campo.value.length);
  }, []);

  useEffect(() => () => void (pausa.current && clearTimeout(pausa.current)), []);

  // N3: entrada escalonada de las tarjetas.
  useEffect(() => {
    const raiz = zona.current;
    if (!conN3 || !raiz || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tarjetas = [...raiz.querySelectorAll<HTMLElement>("[data-blog-tarjetas] > li")];
    const hechas: Animation[] = [];
    const porLlegar = new Map<Element, Animation>();
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          observador.unobserve(e.target);
          porLlegar.get(e.target)?.play();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    tarjetas.forEach((li, i) => {
      const visible = li.getBoundingClientRect().top < innerHeight;
      const a = li.animate(
        [
          { opacity: 0, transform: "translateY(18px)" },
          { opacity: 1, transform: "none" },
        ],
        {
          duration: DURACION_MS * 1.6,
          easing: CURVA,
          delay: visible ? i * ESCALON_MS : (i % 3) * ESCALON_MS,
          fill: "backwards",
        },
      );
      hechas.push(a);
      if (!visible) {
        a.pause();
        porLlegar.set(li, a);
        observador.observe(li);
      }
    });
    return () => {
      observador.disconnect();
      // Si se desmonta o cambia antes de llegar, que nada se quede invisible.
      for (const a of hechas) a.finish();
    };
  }, [clave, conN3]);

  return (
    <div
      ref={zona}
      data-anim={activas.length ? activas.join(" ") : undefined}
      data-cargando={cargando ? "" : undefined}
      aria-busy={cargando || undefined}
      onInput={(e) => {
        const campo = e.target as HTMLInputElement;
        if (!campo.hasAttribute("data-blog-buscar-campo") || !campo.form) return;
        const form = campo.form;
        if (pausa.current) clearTimeout(pausa.current);
        pausa.current = setTimeout(() => {
          const destino = destinoDe(form);
          // Sin cambio respecto a la URL actual: nada que pedir.
          const actual = new URLSearchParams(location.search);
          actual.delete(PARAMETRO_ANIMACIONES);
          if (destino.searchParams.toString() === actual.toString()) return;
          enfocarBuscador = true;
          navegar(destino);
        }, PAUSA_MS);
      }}
      onSubmitCapture={(e) => {
        const form = e.target as HTMLFormElement;
        if (!form.hasAttribute("data-blog-buscar")) return;
        e.preventDefault();
        if (pausa.current) clearTimeout(pausa.current);
        enfocarBuscador = true;
        navegar(destinoDe(form));
      }}
      onClickCapture={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = (e.target as Element).closest("a[data-blog-nav]");
        if (!(a instanceof HTMLAnchorElement) || a.target) return;
        const url = new URL(a.href, location.href);
        if (url.origin !== location.origin) return;
        e.preventDefault();
        navegar(url);
      }}
    >
      {children}
    </div>
  );
}
