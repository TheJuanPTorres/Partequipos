"use client";

import { useEffect, useRef } from "react";

import { terminoSeguro } from "@/lib/analitica/eventos";
import { enviarEvento } from "@/lib/analitica/navegador";

/**
 * Evento `busqueda` de la página de resultados: una vez por término. No pinta nada. Un término
 * que parece un dato personal (correo, teléfono) no se envía.
 */
export function EventoBusqueda({ termino, resultados }: { termino: string; resultados: number }) {
  // Una vez por término, aunque el efecto se repita (en desarrollo React lo ejecuta dos veces).
  const enviado = useRef<string | null>(null);
  useEffect(() => {
    if (enviado.current === termino) return;
    enviado.current = termino;
    const seguro = terminoSeguro(termino);
    if (seguro) enviarEvento("busqueda", { termino: seguro, resultados, lugar: "pagina" });
  }, [termino, resultados]);
  return null;
}
