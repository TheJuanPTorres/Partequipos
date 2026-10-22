"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition, type ReactNode } from "react";

/** Los enlaces que solo cambian el catálogo van dentro de un elemento con este atributo. */
const ATRIBUTO_NAVEGACION = "data-catalogo-nav";

/**
 * A dónde va el foco al llegar el catálogo nuevo. Vive fuera del componente
 * porque al cambiar de categoría o de página Next monta la página de nuevo
 * (otro segmento), y una referencia del componente se perdería.
 */
let focoPendiente: { titulo: boolean; origen: Element | null } | null = null;

/** Espacio que deja la cabecera fija al subir hasta el listado. */
const MARGEN_CABECERA = 110;

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
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  scrollTo({ top: scrollY + arriba - MARGEN_CABECERA, behavior: reducir ? "auto" : "smooth" });
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
 */
export function ZonaCatalogo({
  clave,
  className,
  lateral,
  children,
}: {
  clave: string;
  className?: string;
  lateral: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [cargando, iniciar] = useTransition();
  const zona = useRef<HTMLDivElement>(null);

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

  const navegar = (href: string, titulo: boolean, origen: Element | null) => {
    focoPendiente = { titulo, origen };
    iniciar(() => router.push(href, { scroll: false }));
  };

  return (
    <div
      ref={zona}
      className={className}
      data-lateral={lateral ? "" : undefined}
      data-cargando={cargando ? "" : undefined}
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
        navegar(url.pathname + url.search, titulo, desplegable?.querySelector("summary") ?? a);
      }}
      onSubmitCapture={(e) => {
        const form = e.target as HTMLFormElement;
        if (form.method.toLowerCase() !== "get") return;
        e.preventDefault();
        const datos = new URLSearchParams();
        new FormData(form).forEach((v, k) => {
          if (typeof v === "string") datos.append(k, v);
        });
        const consulta = datos.toString();
        const accion = new URL(form.action, location.href);
        const boton = (e.nativeEvent as SubmitEvent).submitter;
        navegar(accion.pathname + (consulta ? `?${consulta}` : ""), false, boton ?? form);
      }}
    >
      {children}
    </div>
  );
}
