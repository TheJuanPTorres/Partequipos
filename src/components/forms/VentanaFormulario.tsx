"use client";

import { IconX } from "@tabler/icons-react";
import { lazy, Suspense, useEffect, useId, useRef } from "react";

import type { ConfigFormulario } from "@/lib/formularios/configFormulario";

import estilos from "./ventanaFormulario.module.css";

/** El formulario (campos, Turnstile, acción) no viaja hasta que la ventana se abre. */
const FormularioSolicitud = lazy(() =>
  import("@/components/forms/FormularioSolicitud").then((m) => ({
    default: m.FormularioSolicitud,
  })),
);

/**
 * LA VENTANA: un `<dialog>` nativo abierto con `showModal()`, que ya da el foco
 * atrapado (el resto de la página queda inerte), el cierre con Esc y el
 * anuncio del título (`aria-labelledby`). Se añade el cierre con la X y al
 * tocar fuera. El formulario solo existe mientras la ventana está abierta, así
 * que cada apertura empieza limpia.
 */
export function VentanaFormulario({
  abierta,
  titulo,
  formulario,
  alCerrar,
}: {
  abierta: boolean;
  titulo: string;
  formulario: ConfigFormulario;
  alCerrar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const empezoFuera = useRef(false);
  const idTitulo = useId();

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    else if (!abierta && d.open) d.close();
  }, [abierta]);

  return (
    <dialog
      ref={dialogo}
      className={estilos.ventana}
      aria-labelledby={idTitulo}
      data-ventana-contacto=""
      // Esc o `close()`: el estado se entera y el foco vuelve al botón.
      onClose={alCerrar}
      // Cierra al tocar el fondo, pero no si la pulsación empezó dentro (arrastrar texto).
      onPointerDown={(e) => {
        empezoFuera.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && empezoFuera.current) alCerrar();
      }}
    >
      <div className={estilos.contenido}>
        <div className={estilos.cabecera}>
          <h2 id={idTitulo} className={estilos.titulo}>
            {titulo}
          </h2>
          <button type="button" className={estilos.cerrar} onClick={alCerrar}>
            <IconX aria-hidden="true" focusable="false" stroke={1.9} size={22} />
            <span className="sr-only">Cerrar la ventana</span>
          </button>
        </div>
        {abierta ? (
          <Suspense fallback={<p className={estilos.cargando}>Cargando el formulario…</p>}>
            <FormularioSolicitud {...formulario} variante="emergente" />
          </Suspense>
        ) : null}
      </div>
    </dialog>
  );
}
