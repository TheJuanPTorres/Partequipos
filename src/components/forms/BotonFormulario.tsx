"use client";

import { useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";

import { VentanaFormulario } from "@/components/forms/VentanaFormulario";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";

/**
 * BOTÓN QUE ABRE EL FORMULARIO DE CONTACTO EN UNA VENTANA EMERGENTE
 * (dirección, 2026-10-19).
 *
 * MEJORA PROGRESIVA: es un enlace `<a href>` al formulario del final de la
 * página (o a /contactanos/), así que sin JavaScript —o con un clic con
 * Ctrl, ⌘, Mayús o botón central— se comporta como siempre. Con JavaScript, el
 * clic normal abre la ventana.
 *
 * NO CARGA NADA PESADO HASTA ABRIRSE: la ventana se monta en el primer clic, y
 * el formulario (campos, Turnstile, acción de servidor) llega en un trozo
 * aparte, también en ese momento. Cerrada, la ventana es un `<dialog>` oculto
 * que no ocupa sitio: sin CLS.
 */
export function BotonFormulario({
  href,
  className,
  style,
  formulario,
  titulo,
  ariaLabel,
  origenDePagina = false,
  children,
}: {
  /** Destino sin JavaScript: el formulario de la página. */
  href: string;
  className?: string;
  style?: CSSProperties;
  formulario: ConfigFormulario;
  /** Título de la ventana; por defecto, el del formulario. */
  titulo?: string;
  ariaLabel?: string;
  /** El `origen` de la solicitud es la página donde se pulsa (botones editables del panel). */
  origenDePagina?: boolean;
  children: ReactNode;
}) {
  const [abierta, setAbierta] = useState(false);
  const [montada, setMontada] = useState(false);
  const [origen, setOrigen] = useState<string | null>(null);
  const enlace = useRef<HTMLAnchorElement>(null);

  function alPulsar(e: MouseEvent<HTMLAnchorElement>) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    if (origenDePagina) setOrigen(window.location.pathname);
    setMontada(true);
    setAbierta(true);
  }

  return (
    <>
      <a
        ref={enlace}
        href={href}
        className={className}
        style={style}
        onClick={alPulsar}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
      >
        {children}
      </a>
      {montada ? (
        <VentanaFormulario
          abierta={abierta}
          titulo={titulo ?? formulario.titulo}
          formulario={origen ? { ...formulario, origen } : formulario}
          alCerrar={() => {
            setAbierta(false);
            // Foco de vuelta al botón que la abrió.
            enlace.current?.focus();
          }}
        />
      ) : null}
    </>
  );
}
