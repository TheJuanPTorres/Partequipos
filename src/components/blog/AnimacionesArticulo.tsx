"use client";

import { useEffect, useSyncExternalStore } from "react";

import { ANIMACIONES_ARTICULO } from "@/lib/blog/animacionesArticulo";
import { activasDe, PARAMETRO_ANIMACIONES } from "@/lib/listado/animaciones";

const sinSuscripcion = () => () => {};
const parametroDeLaUrl = () => new URL(location.href).searchParams.get(PARAMETRO_ANIMACIONES);

/**
 * En un preview, recorta las mejoras A1–A3 con `?anim=` (`lib/blog/animacionesArticulo.ts`).
 * El artículo es estático y no recibe la query: el servidor pinta `data-anim` con las
 * encendidas en el código y esto la corrige en el navegador. En el sitio publicado no hace nada.
 */
export function AnimacionesArticulo({
  permitirUrl,
  idRaiz,
}: {
  permitirUrl: boolean;
  idRaiz: string;
}) {
  const parametro = useSyncExternalStore(sinSuscripcion, parametroDeLaUrl, () => null);
  const clave = activasDe(ANIMACIONES_ARTICULO, parametro, permitirUrl).join(" ");

  useEffect(() => {
    if (!permitirUrl) return;
    const raiz = document.getElementById(idRaiz);
    if (raiz) raiz.dataset.anim = clave;
  }, [clave, idRaiz, permitirUrl]);

  return null;
}
