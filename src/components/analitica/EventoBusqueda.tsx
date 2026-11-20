"use client";

import { useEffect } from "react";

import { terminoSeguro } from "@/lib/analitica/eventos";
import { enviarEvento } from "@/lib/analitica/navegador";

/**
 * Evento `busqueda` de la página de resultados: una vez por término. No pinta nada. Un término
 * que parece un dato personal (correo, teléfono) no se envía.
 */
export function EventoBusqueda({ termino, resultados }: { termino: string; resultados: number }) {
  useEffect(() => {
    const seguro = terminoSeguro(termino);
    if (seguro) enviarEvento("busqueda", { termino: seguro, resultados, lugar: "pagina" });
  }, [termino, resultados]);
  return null;
}
