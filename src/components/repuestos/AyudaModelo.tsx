import { BotonFormulario } from "@/components/forms/BotonFormulario";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";

import mejoras from "./mejoras.module.css";

/**
 * R4 (dirección, 2026-10-21): «¿No encuentras tu modelo? Escríbenos con el número de serie», al
 * final de cada serie de la página de tipo y en el «sin resultados» del buscador (R1). Abre la
 * VENTANA EMERGENTE del formulario con la marca y el tipo ya escritos en «¿Qué necesitas?»;
 * sin JavaScript baja al formulario de la página.
 */
export function AyudaModelo({
  formulario,
  anclaContacto,
  className,
}: {
  formulario: ConfigFormulario;
  anclaContacto: string;
  className?: string;
}) {
  return (
    <p className={`${mejoras.ayuda} ${className ?? ""}`} data-mejora="R4">
      <span>¿No encuentras tu modelo?</span>{" "}
      <BotonFormulario
        href={`#${anclaContacto}`}
        formulario={formulario}
        className={mejoras.ayudaEnlace}
      >
        Escríbenos con el número de serie
      </BotonFormulario>
    </p>
  );
}
