"use client";

import { IconArrowRight } from "@tabler/icons-react";

import { BotonFormulario } from "@/components/forms/BotonFormulario";
import { useDatosContacto } from "@/components/forms/ContextoContacto";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import { conMensaje } from "@/lib/whatsapp";

/**
 * «Cotizar» de la tarjeta de un modelo (2026-10-25): NUESTRA ventana de cotización
 * (`VentanaFormulario`, con el botón verde de WhatsApp) con el equipo como referencia, como la de
 * la ficha. El WhatsApp de la ventana lleva el modelo en el mensaje. Sin JavaScript, baja al
 * formulario de contacto de la página.
 */
export function BotonCotizarKit({
  equipo,
  marca,
  origen,
  anclaContacto,
  className,
}: {
  equipo: { id: number; nombre: string };
  marca: string;
  /** Ruta de la página de la marca: se guarda con la solicitud. */
  origen: string;
  anclaContacto: string;
  className?: string;
}) {
  const datos = useDatosContacto();
  const href = `#${anclaContacto}`;
  if (!datos) {
    return (
      <a href={href} className={className} aria-label={`Cotizar ${equipo.nombre}`}>
        Cotizar
        <IconArrowRight aria-hidden="true" size={18} stroke={2} />
      </a>
    );
  }
  return (
    <BotonFormulario
      href={href}
      className={className}
      ariaLabel={`Cotizar ${equipo.nombre}`}
      formulario={configContactoMarca({
        origen,
        siteKey: datos.siteKey,
        whatsapp: datos.whatsapp
          ? conMensaje(datos.whatsapp, `Hola, quiero cotizar el ${equipo.nombre}.`)
          : undefined,
        boton: "Enviar",
        marca,
        equipo,
        formulario: {
          titulo: `Cotización: ${equipo.nombre}`,
          conCiudad: true,
          etiquetaMensaje: "¿Qué necesitas?",
        },
      })}
    >
      Cotizar
      <IconArrowRight aria-hidden="true" size={18} stroke={2} />
    </BotonFormulario>
  );
}
