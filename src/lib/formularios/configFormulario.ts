import type { ComponentProps } from "react";

import type { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";

/**
 * Lo que necesita la VENTANA EMERGENTE para pintar el formulario de una página:
 * las mismas propiedades del formulario del final de la página (todas
 * serializables, porque cruzan de servidor a cliente), sin la variante, que la
 * decide la ventana. Cada página las construye con el mismo código que usa para
 * su formulario, así que la ventana y la página nunca discrepan.
 */
export type ConfigFormulario = Omit<ComponentProps<typeof FormularioSolicitud>, "variante">;

type Entrada = {
  origen: string;
  siteKey: string | null;
  whatsapp?: { href: string; etiqueta: string };
  boton: string;
  marca: string;
  /** Página de modelo: solicitud de repuesto con el modelo preseleccionado. */
  modelo?: { id: number; nombre: string };
  /** Otra página con el bloque de contacto (servicio técnico, lubricantes…). */
  formulario?: { titulo: string; conCiudad?: boolean; etiquetaMensaje?: string };
  /**
   * Ficha de maquinaria nueva (2026-10-21): cotización con el equipo como
   * referencia, como el formulario de la ficha V2. Va con `formulario`.
   */
  equipo?: { id: number; nombre: string };
};

/** Las propiedades del formulario de `ContactoMarca`, compartidas con su ventana emergente. */
export function configContactoMarca(e: Entrada): ConfigFormulario {
  const { modelo, formulario, equipo } = e;
  if (equipo) {
    return {
      tipo: "cotizacion",
      origen: e.origen,
      siteKey: e.siteKey,
      whatsapp: e.whatsapp,
      referencia: { tipo: "equipos-nuevos", id: equipo.id, texto: equipo.nombre },
      titulo: formulario?.titulo ?? `Cotización: ${equipo.nombre}`,
      textoBoton: e.boton || "Enviar",
      clasificacion: false,
      conCiudad: formulario?.conCiudad ?? true,
      etiquetaMensaje: formulario?.etiquetaMensaje ?? "¿Qué necesitas?",
    };
  }
  return {
    tipo: modelo ? "repuesto" : "contacto",
    origen: e.origen,
    siteKey: e.siteKey,
    whatsapp: e.whatsapp,
    referencia: modelo
      ? { tipo: "modelos-repuesto", id: modelo.id, texto: modelo.nombre }
      : undefined,
    titulo: formulario?.titulo ?? `Contacto sobre repuestos ${e.marca}`,
    textoBoton: e.boton || "Enviar",
    clasificacion: !modelo && !formulario,
    conCiudad: formulario ? Boolean(formulario.conCiudad) : Boolean(modelo),
    etiquetaMensaje: formulario
      ? formulario.etiquetaMensaje
      : modelo
        ? "¿En qué estás interesado?"
        : undefined,
  };
}
