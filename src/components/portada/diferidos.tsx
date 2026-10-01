"use client";

import dynamic from "next/dynamic";

/**
 * COMPONENTES DE CLIENTE DE LA PORTADA QUE NO HACEN FALTA ANTES DEL LCP
 * (fase 5, paso 2a; docs/diseno/decisiones-home-ux9.md §21).
 *
 * Todo lo que va bajo el hero: su JS sale del chunk de la página y se pide al
 * hidratar, así no compite por la red con la foto del hero. SIN `ssr: false`:
 * el HTML se prerenderiza igual (buscadores, sin JS y sin salto de layout) y
 * React lo hidrata cuando llega su chunk.
 *
 * Tiene que ser un fichero de CLIENTE: desde un componente de servidor,
 * `next/dynamic` no parte el JS (lo dice la guía de lazy loading de Next 16).
 */
export const CarruselMarcas = dynamic(() =>
  import("./CarruselMarcas").then((m) => m.CarruselMarcas),
);
export const PestanasUsada = dynamic(() => import("./PestanasUsada").then((m) => m.PestanasUsada));
export const CarruselLogos = dynamic(() => import("./CarruselLogos").then((m) => m.CarruselLogos));
export const TarjetasApiladas = dynamic(() =>
  import("./TarjetasApiladas").then((m) => m.TarjetasApiladas),
);
export const SeccionCompania = dynamic(() =>
  import("./SeccionCompania").then((m) => m.SeccionCompania),
);
export const SeccionTestimonios = dynamic(() =>
  import("./SeccionTestimonios").then((m) => m.SeccionTestimonios),
);
