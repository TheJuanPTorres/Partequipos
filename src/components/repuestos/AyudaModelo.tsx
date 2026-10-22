import { IconMessageQuestion } from "@tabler/icons-react";

import { BotonFormulario } from "@/components/forms/BotonFormulario";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";

import mejoras from "./mejoras.module.css";

/**
 * R4 (dirección, 2026-10-21; más notorio el 2026-10-22): «¿No encuentras tu modelo?» como una
 * FRANJA PROPIA al final de los modelos de la página de tipo, una sola vez (no tras cada serie,
 * para no repetirse entre las tarjetas): fondo rojo muy suave, icono, título, una línea de texto
 * y el botón rojo del sitio. No compite con las tarjetas: sin foto, sin sombra y más baja.
 *
 * El botón abre la VENTANA EMERGENTE del formulario con la marca y el tipo ya escritos en
 * «¿Qué necesitas?»; sin JavaScript baja al formulario de la página.
 */
export function AyudaModelo({
  formulario,
  anclaContacto,
}: {
  formulario: ConfigFormulario;
  anclaContacto: string;
}) {
  return (
    <aside className={mejoras.ayuda} data-mejora="R4" aria-labelledby="ayuda-modelo-titulo">
      <span className={mejoras.ayudaIcono} aria-hidden="true">
        <IconMessageQuestion focusable="false" stroke={1.8} size={28} />
      </span>
      <div className={mejoras.ayudaTexto}>
        <h3 id="ayuda-modelo-titulo" className={mejoras.ayudaTitulo}>
          ¿No encuentras tu modelo?
        </h3>
        <p className={mejoras.ayudaFrase}>
          Escríbenos con el número de serie de tu máquina y te decimos qué repuestos le sirven.
        </p>
      </div>
      <BotonFormulario
        href={`#${anclaContacto}`}
        formulario={formulario}
        className={mejoras.ayudaBoton}
      >
        Escríbenos
      </BotonFormulario>
    </aside>
  );
}
