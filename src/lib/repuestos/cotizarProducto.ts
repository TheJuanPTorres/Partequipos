import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import { conMensaje } from "@/lib/whatsapp";

/**
 * Un PRODUCTO de una categoría técnica en el panel «Ver productos» (Juan Pablo, 2026-10-26): se
 * pulsa y abre la ventana de cotización con el producto ya indicado («Consulta sobre: {producto} ·
 * {categoría}») y en el mensaje de WhatsApp. Los productos no tienen página propia (en WordPress
 * tampoco), así que no se enlaza a nada. Nombres tal cual, como los pinta la página.
 */
export function cotizacionDeProducto(
  base: ConfigFormulario,
  producto: string,
  categoria: string,
): ConfigFormulario {
  const texto = `${producto.trim()} · ${categoria.trim()}`;
  return {
    ...base,
    tipo: "cotizacion",
    referencia: { texto },
    titulo: `Cotización: ${texto}`,
    clasificacion: false,
    conCiudad: true,
    etiquetaMensaje: "¿Qué necesitas?",
    mensajeInicial: undefined,
    whatsapp: base.whatsapp
      ? conMensaje(base.whatsapp, `Hola, quiero cotizar: ${texto}.`)
      : undefined,
  };
}
