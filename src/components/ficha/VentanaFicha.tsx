"use client";

import { IconX } from "@tabler/icons-react";
import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";

import estilos from "./ventanaFicha.module.css";

/**
 * VENTANA EMERGENTE de la ficha de maquinaria nueva (2026-10-21): la del PDF
 * en el visor y la de la vista 360. El mismo patrón que la del formulario
 * (`VentanaFormulario`): un `<dialog>` nativo con `showModal()`, que atrapa el
 * foco, cierra con Esc y anuncia su título; se añade el cierre con la X y al
 * tocar fuera. El contenido solo existe mientras está abierta. Cerrada no pinta
 * nada: sin CLS.
 */
export function VentanaFicha({
  abierta,
  titulo,
  alCerrar,
  style,
  variante = "documento",
  children,
}: {
  abierta: boolean;
  titulo: string;
  alCerrar: () => void;
  /** Variables de tamaño del contenido (p. ej. la proporción del documento). */
  style?: CSSProperties;
  /** «documento»: el ancho se ajusta al alto de la pantalla; «360»: todo el ancho. */
  variante?: "documento" | "360";
  children: ReactNode;
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
      className={variante === "360" ? `${estilos.ventana} ${estilos.ventana360}` : estilos.ventana}
      aria-labelledby={idTitulo}
      data-ventana-ficha=""
      style={style}
      onClose={alCerrar}
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
        {abierta ? children : null}
      </div>
    </dialog>
  );
}
