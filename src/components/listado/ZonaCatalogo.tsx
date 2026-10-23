"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from "react";

import {
  CURVA,
  DURACION_MS,
  PARAMETRO_ANIMACIONES,
  type Animacion,
} from "@/lib/listado/animaciones";
import { esEnvioDelCatalogo } from "@/lib/listado/envioCatalogo";

/** Los enlaces que solo cambian el catálogo van dentro de un elemento con este atributo. */
const ATRIBUTO_NAVEGACION = "data-catalogo-nav";

/**
 * A dónde va el foco al llegar el catálogo nuevo. Vive fuera del componente
 * porque al cambiar de categoría o de página Next monta la página de nuevo
 * (otro segmento), y una referencia del componente se perdería.
 */
let focoPendiente: { titulo: boolean; origen: Element | null } | null = null;

/**
 * La URL (ruta y consulta) del último catálogo pintado y las etiquetas de
 * filtro que tenía: así se sabe, también tras montar la página de nuevo, si
 * el catálogo acaba de cambiar sin recargar y qué etiquetas son nuevas.
 */
let ultimaClave: string | null = null;
let etiquetasAnteriores = new Set<string>();

/** Espacio que deja la cabecera fija al subir hasta el listado. */
const MARGEN_CABECERA = 110;

/** Cuántas tarjetas entran escalonadas (A1) y cuánto se espera entre una y otra. */
const TARJETAS_ESCALONADAS = 9;
const ESCALON_MS = 40;

/** Pasado este tiempo sin catálogo nuevo, se ven las tarjetas «esqueleto» (A2). */
const ESPERA_ESQUELETO_MS = 300;

const reducirMovimiento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Si el inicio del listado ha quedado por encima de la vista (al cambiar de
 * categoría desde abajo), la página sube hasta él; suave, salvo con
 * «reducir movimiento».
 */
function subirAlListado(zona: HTMLElement | null) {
  const listado = zona?.querySelector("[data-inicio-listado]") ?? zona;
  if (!listado) return;
  const arriba = listado.getBoundingClientRect().top;
  if (arriba >= MARGEN_CABECERA) return;
  scrollTo({
    top: scrollY + arriba - MARGEN_CABECERA,
    behavior: reducirMovimiento() ? "auto" : "smooth",
  });
}

/** Fundido y subida de ~10 px (A1 y las etiquetas de A7). */
function entrar(elemento: Element, retraso: number) {
  elemento.animate(
    [
      { opacity: 0, transform: "translateY(10px)" },
      { opacity: 1, transform: "none" },
    ],
    { duration: DURACION_MS, delay: retraso, easing: CURVA, fill: "backwards" },
  );
}

/**
 * La zona del catálogo de los listados de usados (cliente, 2026-10-21): al
 * cambiar de categoría, de filtro, de orden o de página solo se actualiza el
 * catálogo, sin recargar ni volver arriba, con un indicador mientras llega.
 *
 * No pinta nada propio: intercepta los clics de los enlaces marcados con
 * `data-catalogo-nav` y el envío del formulario de filtros, y navega con el
 * router (`scroll: false`) a la MISMA URL que daría la página sin JavaScript;
 * el servidor sigue pintando cada URL entera, así que el SEO no cambia. Lo que
 * envía el formulario ya está en la forma canónica (`PanelFiltrosListado`).
 * Sin JavaScript, enlaces y formulario funcionan como siempre.
 *
 * `clave` cambia con cada URL (ruta y consulta): al cambiar, los formularios
 * se reinician a lo que marca la URL (atrás y adelante) y el foco va a su sitio.
 *
 * Animaciones (`src/lib/listado/animaciones.ts`): `data-anim` dice cuáles se
 * pintan (el CSS de cada una cuelga de él); aquí corren las que necesitan
 * saber que el catálogo ha cambiado (A1 y las etiquetas de A7) y el
 * «esqueleto» de A2. En un preview, `?anim=` se conserva al navegar.
 */
export function ZonaCatalogo({
  clave,
  className,
  lateral,
  animaciones = [],
  children,
}: {
  clave: string;
  className?: string;
  lateral: boolean;
  animaciones?: Animacion[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [cargando, iniciar] = useTransition();
  const zona = useRef<HTMLDivElement>(null);
  const [esperaLarga, setEsperaLarga] = useState(false);
  const conA1 = animaciones.includes("A1");
  const conA2 = animaciones.includes("A2");
  const conA7 = animaciones.includes("A7");

  useEffect(() => {
    // Las casillas pueden haberse tocado: vuelven a lo que dice la URL (sus
    // `defaultChecked` ya son los de la URL nueva).
    zona.current?.querySelectorAll<HTMLFormElement>("form[method=get]").forEach((f) => f.reset());
    const pendiente = focoPendiente;
    focoPendiente = null;
    if (!pendiente) return;
    const origen = pendiente.origen;
    if (pendiente.titulo) subirAlListado(zona.current);
    if (pendiente.titulo || !origen?.isConnected) {
      document.getElementById("listado-titulo")?.focus({ preventScroll: true });
    } else if (origen instanceof HTMLElement && document.activeElement !== origen) {
      origen.focus({ preventScroll: true });
    }
  }, [clave]);

  // Antes de pintar el catálogo nuevo: entrada de tarjetas (A1) y de etiquetas nuevas (A7).
  useLayoutEffect(() => {
    const raiz = zona.current;
    const anterior = ultimaClave;
    ultimaClave = clave;
    const etiquetas = [...(raiz?.querySelectorAll<HTMLElement>("[data-etiqueta-filtro]") ?? [])];
    const antes = etiquetasAnteriores;
    etiquetasAnteriores = new Set(etiquetas.map((e) => e.dataset.etiquetaFiltro ?? ""));
    if (!raiz || anterior === null || anterior === clave) return;
    // La primera carga anima por CSS (A1, `data-primera-carga`); en cuanto el
    // catálogo cambia, por código. Se quita en el DOM, antes de pintar: React
    // no lo vuelve a poner porque su valor no cambia.
    raiz.removeAttribute("data-primera-carga");
    if (reducirMovimiento()) return;
    if (conA1) {
      const tarjetas = [...raiz.querySelectorAll("ul[data-vista] > li")]
        .slice(0, TARJETAS_ESCALONADAS)
        .filter((t) => t.getBoundingClientRect().top < innerHeight);
      tarjetas.forEach((t, i) => entrar(t, i * ESCALON_MS));
    }
    if (conA7) {
      etiquetas
        .filter((e) => !antes.has(e.dataset.etiquetaFiltro ?? ""))
        .forEach((e, i) => entrar(e, i * ESCALON_MS));
    }
  }, [clave, conA1, conA7]);

  // A2: si el catálogo nuevo tarda, tarjetas «esqueleto» encima del viejo.
  useEffect(() => {
    if (!conA2 || !cargando) return;
    const espera = setTimeout(() => setEsperaLarga(true), ESPERA_ESQUELETO_MS);
    return () => {
      clearTimeout(espera);
      setEsperaLarga(false);
    };
  }, [conA2, cargando]);

  const navegar = (destino: URL, titulo: boolean, origen: Element | null) => {
    // Para probar las animaciones en un preview: `?anim=` sigue al navegar
    // (en el sitio publicado no tiene efecto).
    const anim = new URL(location.href).searchParams.get(PARAMETRO_ANIMACIONES);
    if (anim !== null) destino.searchParams.set(PARAMETRO_ANIMACIONES, anim);
    focoPendiente = { titulo, origen };
    iniciar(() => router.push(destino.pathname + destino.search, { scroll: false }));
  };

  return (
    <div
      ref={zona}
      className={className}
      data-lateral={lateral ? "" : undefined}
      data-cargando={cargando ? "" : undefined}
      data-anim={animaciones.length ? animaciones.join(" ") : undefined}
      data-primera-carga=""
      data-esqueleto={conA2 && cargando && esperaLarga ? "" : undefined}
      aria-busy={cargando || undefined}
      onClickCapture={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = (e.target as Element).closest("a");
        if (!a || !a.closest(`[${ATRIBUTO_NAVEGACION}]`) || a.target || a.hasAttribute("download"))
          return;
        const url = new URL(a.href, location.href);
        if (url.origin !== location.origin) return;
        e.preventDefault();
        // Un desplegable («Ordenar») se cierra al elegir; el foco vuelve a su botón.
        const desplegable = a.closest("details");
        desplegable?.removeAttribute("open");
        // Otra categoría u otra página: el foco, al título del listado.
        const titulo = url.pathname !== location.pathname;
        navegar(url, titulo, desplegable?.querySelector("summary") ?? a);
      }}
      onSubmitCapture={(e) => {
        const form = e.target as HTMLFormElement;
        // Solo el de filtros: un formulario de solicitud (acción de servidor) sigue su camino.
        if (!esEnvioDelCatalogo(form)) return;
        e.preventDefault();
        const datos = new URLSearchParams();
        new FormData(form).forEach((v, k) => {
          if (typeof v === "string") datos.append(k, v);
        });
        const destino = new URL(form.action, location.href);
        destino.search = datos.toString();
        const boton = (e.nativeEvent as SubmitEvent).submitter;
        navegar(destino, false, boton ?? form);
      }}
    >
      {children}
    </div>
  );
}
