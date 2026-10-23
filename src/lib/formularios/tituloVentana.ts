import type { ConfigFormulario } from "@/lib/formularios/configFormulario";

/**
 * TÍTULO DE LA VENTANA EMERGENTE (dirección, 2026-10-23). El producto o el equipo
 * NO va en el título visible —sale en la franja «Consulta sobre: …» de debajo—:
 * «Cotización», «Contáctanos», «Avísame cuando llegue una». El nombre accesible del
 * diálogo sí puede llevarlo, para los lectores de pantalla. El formulario del final
 * de la página conserva su título de siempre.
 */
export function tituloDeVentana(
  formulario: ConfigFormulario,
  titulo?: string,
): { visible: string; accesible: string } {
  const original = titulo ?? formulario.titulo;
  const referencia = formulario.referencia?.texto;
  let visible = original;
  if (formulario.tipo === "cotizacion") visible = "Cotización";
  else if (/^(Contacto|Formulario de contacto|Solicitud de información) sobre /.test(original)) {
    visible = "Contáctanos";
  } else if (titulo !== undefined && titulo !== formulario.titulo && referencia === undefined) {
    // Título explícito de quien abre la ventana: se respeta tal cual.
    visible = titulo;
  }
  const accesible =
    referencia && !original.includes(referencia) ? `${visible}: ${referencia}` : original;
  return { visible, accesible };
}
