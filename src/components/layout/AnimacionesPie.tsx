"use client";

import { IconArrowUp } from "@tabler/icons-react";
import { useEffect, useSyncExternalStore, type MouseEvent } from "react";

import { ANIMACIONES_PIE, type AnimacionPie } from "@/lib/animacionesPie";
import { activasDe, PARAMETRO_ANIMACIONES } from "@/lib/listado/animaciones";

import estilos from "./pie.module.css";

const sinSuscripcion = () => () => {};
const parametroDeLaUrl = () => new URL(location.href).searchParams.get(PARAMETRO_ANIMACIONES);

const reducirMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * La parte de cliente de las animaciones del pie (`lib/animacionesPie.ts`). El
 * pie (Server Component) pinta `data-anim` con las encendidas en el código; esto:
 *
 * - en un preview, las recorta con `?anim=` (el pie va en el layout, que no
 *   recibe la query: se lee aquí);
 * - P3: la primera vez que el pie entra en pantalla, `data-p3` pasa de
 *   «pendiente» a «visto» y las columnas entran. Si ya se ve al cargar, o con
 *   «reducir movimiento», no se oculta nada;
 * - P4: el botón «Volver arriba» (sin JavaScript, el enlace a `#` sube igual).
 */
export function AnimacionesPie({ permitirUrl }: { permitirUrl: boolean }) {
  // En el servidor (y al hidratar), sin parámetro: las encendidas en el código.
  const parametro = useSyncExternalStore(sinSuscripcion, parametroDeLaUrl, () => null);
  const activas: AnimacionPie[] = activasDe(ANIMACIONES_PIE, parametro, permitirUrl);
  const clave = activas.join(" ");

  useEffect(() => {
    const pie = document.querySelector<HTMLElement>("footer[data-anim]");
    if (!pie) return;
    pie.dataset.anim = clave;

    if (
      !clave.split(" ").includes("P3") ||
      reducirMovimiento() ||
      !("IntersectionObserver" in window)
    )
      return;
    const ya = pie.getBoundingClientRect().top < window.innerHeight;
    if (ya) return;
    pie.dataset.p3 = "pendiente";
    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        pie.dataset.p3 = "visto";
        observador.disconnect();
      },
      { threshold: 0.1 },
    );
    observador.observe(pie);
    return () => {
      observador.disconnect();
      // Si P3 deja de estar activa antes de verse el pie (`?anim=`), nada queda a medias.
      if (pie.dataset.p3 === "pendiente") delete pie.dataset.p3;
    };
  }, [clave]);

  if (!activas.includes("P4")) return null;

  function subir(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reducirMovimiento() ? "auto" : "smooth" });
  }

  return (
    <a href="#" className={estilos.arriba} onClick={subir}>
      <IconArrowUp aria-hidden="true" focusable="false" stroke={2} />
      Volver arriba
    </a>
  );
}
