"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { BotonFormulario } from "@/components/forms/BotonFormulario";
import { useDatosContacto } from "@/components/forms/ContextoContacto";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import { llevaAlFormulario } from "@/lib/formularios/enlaceContacto";

/**
 * Enlace de un bloque o banner editable en el panel (`botonEnlace`): si apunta
 * al formulario de contacto abre la ventana emergente; si no, es un `Link`
 * normal. Sin JavaScript, el enlace de siempre.
 */
export function EnlaceContacto({
  href,
  className,
  style,
  children,
  ariaLabel,
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const datos = useDatosContacto();
  if (!datos || !llevaAlFormulario(href)) {
    return (
      <Link href={href} className={className} style={style} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <BotonFormulario
      href={href}
      className={className}
      style={style}
      ariaLabel={ariaLabel}
      origenDePagina
      titulo="Contáctanos"
      formulario={configContactoMarca({
        origen: "/contactanos/",
        siteKey: datos.siteKey,
        whatsapp: datos.whatsapp,
        boton: "Enviar",
        marca: "",
        formulario: { titulo: "Contáctanos", conCiudad: true, etiquetaMensaje: "¿Qué necesitas?" },
      })}
    >
      {children}
    </BotonFormulario>
  );
}
