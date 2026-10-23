"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";

import { activasDe, CURVA, DURACION_MS, PARAMETRO_ANIMACIONES } from "@/lib/listado/animaciones";

/**
 * La zona de una página con animaciones elegibles (`data-anim`, como la del listado de usados,
 * #320): el CSS de cada una cuelga de `[data-anim~="C2"]`… El servidor pinta las encendidas en el
 * código; en un preview (`permitirUrl`), `?anim=` las recorta al cargar. Es de cliente porque la
 * página es estática: leer la query en el servidor la volvería dinámica.
 *
 * `entrada` (C1 del índice de categorías): las baldosas (`[data-entrada] > li`) entran
 * escalonadas al llegar a la sección (IntersectionObserver; 50 ms entre una y otra; si ya se
 * ven al cargar, no se tocan), con la
 * curva y la duración del listado. Se preparan en el cliente y solo si hay movimiento: sin
 * JavaScript, o con «reducir movimiento», se ven quietas desde el principio. Solo `opacity` y
 * `transform`: sin CLS.
 */
export function ZonaAnimada({
  interruptores,
  permitirUrl,
  entrada,
  children,
}: {
  interruptores: Record<string, boolean>;
  permitirUrl: boolean;
  /** La animación que hace entrar las baldosas (p. ej. `"C1"`). */
  entrada?: string;
  children: ReactNode;
}) {
  // `?anim=` en el cliente (en el servidor, y en la hidratación, `null`: todas las encendidas).
  const parametro = useSyncExternalStore(
    sinSuscripcion,
    () => (permitirUrl ? new URL(location.href).searchParams.get(PARAMETRO_ANIMACIONES) : null),
    () => null,
  );
  const activas = useMemo(
    () => activasDe(interruptores, parametro, permitirUrl),
    [interruptores, parametro, permitirUrl],
  );
  const zona = useRef<HTMLDivElement>(null);

  const conEntrada = entrada !== undefined && activas.includes(entrada);
  useEffect(() => {
    const raiz = zona.current;
    if (!conEntrada || !raiz || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const listas = [...raiz.querySelectorAll<HTMLElement>("[data-entrada]")];
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          observador.unobserve(e.target);
          for (const a of animaciones.get(e.target) ?? []) a.play();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    const animaciones = new Map<Element, Animation[]>();
    for (const lista of listas) {
      // Ya a la vista al cargar: se queda como está (ocultarla ahora sería un parpadeo).
      if (lista.getBoundingClientRect().top < innerHeight) continue;
      const elementos = [...lista.children].filter(
        (li): li is HTMLElement => li instanceof HTMLElement,
      );
      const preparadas = elementos.map((li, i) => {
        const a = li.animate(
          [
            { opacity: 0, transform: "translateY(16px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: DURACION_MS * 1.5, easing: CURVA, delay: i * 50, fill: "backwards" },
        );
        a.pause();
        return a;
      });
      animaciones.set(lista, preparadas);
      observador.observe(lista);
    }
    return () => {
      observador.disconnect();
      // Si se desmonta o se apaga antes de llegar, que nada se quede invisible.
      for (const lista of animaciones.values()) for (const a of lista) a.finish();
    };
  }, [conEntrada]);

  return (
    <div ref={zona} data-anim={activas.join(" ")}>
      {children}
    </div>
  );
}

/** La query no cambia sin navegar (y navegar vuelve a montar la página): nada que escuchar. */
function sinSuscripcion() {
  return () => {};
}
