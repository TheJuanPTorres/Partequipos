"use client";

import { BotonPausa } from "@/components/movimiento/BotonPausa";
import { usePausa } from "@/components/movimiento/useMovimiento";

import estilos from "./demo.module.css";

/**
 * Una franja que se mueve sola, para ejercitar `usePausa` y `BotonPausa`
 * pintados. POR QUÉ ES DE CLIENTE (§3.1): lleva el estado de pausa.
 */
export function DemoPausa() {
  const { pausado, alternar } = usePausa();
  return (
    <div className="mt-4 flex items-center gap-4">
      <BotonPausa pausado={pausado} alPulsar={alternar} que="la franja" controla="demo-franja" />
      <div className="relative h-10 flex-1 overflow-hidden rounded bg-fondo-seccion">
        <div
          id="demo-franja"
          data-pausado={pausado}
          className={`absolute inset-y-2 left-0 w-16 rounded bg-marca ${estilos.franja}`}
        />
      </div>
    </div>
  );
}
