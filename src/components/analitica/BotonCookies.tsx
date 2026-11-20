"use client";

import { EVENTO_ABRIR_COOKIES } from "@/lib/analitica/config";

/** «Configurar cookies» del pie: reabre el aviso para cambiar la decisión. */
export function BotonCookies({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_COOKIES))}
    >
      Configurar cookies
    </button>
  );
}
