"use client";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";

/**
 * Widget de Cloudflare Turnstile.
 *
 * Se renderiza explícitamente (`render: "explicit"`) en vez de dejar que el
 * script busque `.cf-turnstile` por su cuenta: así el widget se monta y se
 * limpia con el ciclo de vida de React y no se duplica al navegar entre páginas
 * con el enrutador del cliente.
 *
 * El token viaja al servidor en el campo `cf-turnstile-response` que el propio
 * widget inyecta dentro del formulario.
 */

type TurnstileAPI = {
  render: (el: HTMLElement, opciones: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileAPI;
    /** Callback global que dispara el script al cargarse. */
    alListoTurnstile?: () => void;
  }
}

export function Turnstile({ siteKey }: { siteKey: string }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const idEtiqueta = useId();

  useEffect(() => {
    const montar = () => {
      if (!contenedor.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(contenedor.current, {
        sitekey: siteKey,
        language: "es",
        // Deja de ocupar sitio cuando no hace falta interacción.
        appearance: "interaction-only",
      });
    };

    // El script puede haber cargado antes de que monte este componente.
    if (window.turnstile) montar();
    else window.alListoTurnstile = montar;

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=alListoTurnstile"
        strategy="lazyOnload"
      />
      <div ref={contenedor} id={idEtiqueta} className="mt-4" />
    </>
  );
}
