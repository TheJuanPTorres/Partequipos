import { lineasDeTexto, type AlineacionTexto } from "@/lib/fields/alineacionTexto";

import estilos from "./textoEditable.module.css";

/**
 * UN TEXTO ESCRITO EN EL PANEL (2026-10-27): cada línea del cuadro de texto es un párrafo separado
 * y la alineación la elige el editor (izquierda por defecto). La tipografía y el ancho los pone la
 * clase de la sección. Sin texto, no se pinta.
 */
export function TextoEditable({
  texto,
  alineacion,
  className,
}: {
  texto: string;
  alineacion: AlineacionTexto;
  className?: string;
}) {
  const lineas = lineasDeTexto(texto);
  if (lineas.length === 0) return null;
  return (
    <div className={`${estilos.texto} ${className ?? ""}`} data-alineacion={alineacion}>
      {lineas.map((l, i) => (
        <p key={i}>{l}</p>
      ))}
    </div>
  );
}
