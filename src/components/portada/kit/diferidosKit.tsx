"use client";

import dynamic from "next/dynamic";

/**
 * Las piezas de CLIENTE del kit de la portada (2026-10-26), fuera del chunk de la página, como
 * `../diferidos.tsx`: van bajo el hero y no compiten con su foto. SIN `ssr: false`: el HTML se
 * prerenderiza igual (buscadores, sin JavaScript y sin salto de layout).
 */
export const FiltroUsadosCliente = dynamic(() =>
  import("./FiltroUsados").then((m) => m.FiltroUsados),
);
export const SliderUsados = dynamic(() => import("./SliderUsados").then((m) => m.SliderUsados));
export const BandaLogos = dynamic(() => import("./BandaLogos").then((m) => m.BandaLogos));
