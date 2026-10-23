"use client";

import { IconFileUpload } from "@tabler/icons-react";
import { useRef, useState, type MouseEvent } from "react";

import { VentanaFormulario } from "@/components/forms/VentanaFormulario";

/**
 * «ENVIAR HV» de cada tarjeta de vacante (2026-10-23): abre la ventana emergente (el diseño del
 * #340) con el formulario de la hoja de vida y la vacante ya rellenada.
 *
 * MEJORA PROGRESIVA, como `BotonFormulario`: es un enlace al portal de empleo de Buk (otra
 * pestaña), así que sin JavaScript —o con Ctrl, ⌘, Mayús o botón central— se comporta como
 * «Ver oferta». La ventana se monta en el primer clic y el formulario llega en un trozo aparte.
 */
export function BotonHojaDeVida({
  vacante,
  ciudad,
  hrefSinJs,
  className,
}: {
  vacante: string;
  ciudad: string;
  /** Sin JavaScript: la oferta en Buk, donde también se puede enviar la hoja de vida. */
  hrefSinJs: string;
  className?: string;
}) {
  const [montada, setMontada] = useState(false);
  const [abierta, setAbierta] = useState(false);
  const [origen, setOrigen] = useState("");
  const enlace = useRef<HTMLAnchorElement>(null);

  function alPulsar(e: MouseEvent<HTMLAnchorElement>) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    setOrigen(window.location.pathname);
    setMontada(true);
    setAbierta(true);
  }

  return (
    <>
      <a
        ref={enlace}
        href={hrefSinJs}
        className={className}
        onClick={alPulsar}
        aria-haspopup="dialog"
        aria-label={`Enviar hoja de vida: ${vacante}, ${ciudad}`}
      >
        <IconFileUpload aria-hidden="true" size={16} stroke={2} />
        Enviar HV
      </a>
      {montada ? (
        <VentanaFormulario
          abierta={abierta}
          titulo="Envía tu hoja de vida"
          nombreAccesible={`Envía tu hoja de vida: ${vacante}, ${ciudad}`}
          hojaDeVida={{ vacante: `${vacante} (${ciudad})`, origen }}
          alCerrar={() => {
            setAbierta(false);
            enlace.current?.focus();
          }}
        />
      ) : null}
    </>
  );
}
