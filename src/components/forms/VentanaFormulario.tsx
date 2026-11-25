"use client";

import { IconX } from "@tabler/icons-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { useDatosContacto } from "@/components/forms/ContextoContacto";

import { ANIMACIONES_VENTANA } from "@/lib/formularios/animacionesVentana";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import { ventanaAbierta } from "@/lib/formularios/ventanaAbierta";
import { activasDe, PARAMETRO_ANIMACIONES } from "@/lib/listado/animaciones";

import piel from "./pielFormulario.module.css";
import estilos from "./ventanaFormulario.module.css";

const sinSuscripcion = () => () => {};

/** El formulario (campos, Turnstile, acción) no viaja hasta que la ventana se abre. */
const FormularioSolicitud = lazy(() =>
  import("@/components/forms/FormularioSolicitud").then((m) => ({
    default: m.FormularioSolicitud,
  })),
);

/** La hoja de vida («Enviar HV», 2026-10-23): su formulario tampoco viaja hasta abrir la ventana. */
const FormularioHojaDeVida = lazy(() =>
  import("@/components/forms/FormularioHojaDeVida").then((m) => ({
    default: m.FormularioHojaDeVida,
  })),
);

/** El formulario de la hoja de vida de una vacante, en lugar del de solicitud. */
export type ConfigHojaDeVida = { vacante: string; origen: string };

/**
 * LA VENTANA: un `<dialog>` nativo abierto con `showModal()`, que ya da el foco
 * atrapado (el resto de la página queda inerte), el cierre con Esc y el
 * anuncio del título (`aria-labelledby`). Se añade el cierre con la X y al
 * tocar fuera. El formulario solo existe mientras la ventana está abierta, así
 * que cada apertura empieza limpia.
 *
 * VA EN UN PORTAL, FUERA DE LA PÁGINA (t8, 2026-11-25): el catálogo de los listados está dentro de un
 * `<ViewTransition>` de React (`TransicionCatalogo`). Al volver la respuesta del envío, la
 * transición que lo contiene animaba el «cambio» del catálogo —el diálogo era su descendiente— y
 * el navegador pintaba la página sin el fondo oscuro ni la capa superior durante ~280 ms: la
 * ventana parecía desaparecer y volver de golpe (medido en el preview: fotogramas con la página de
 * detrás sin oscurecer). Colgada de `body`, ningún cambio del formulario toca esa transición.
 */
export function VentanaFormulario({
  abierta,
  titulo,
  nombreAccesible,
  formulario,
  hojaDeVida,
  alCerrar,
}: {
  abierta: boolean;
  titulo: string;
  /** Para lectores de pantalla; por defecto, el título visible. */
  nombreAccesible?: string;
  /** El formulario de solicitud; si se da `hojaDeVida`, no se usa. */
  formulario?: ConfigFormulario;
  hojaDeVida?: ConfigHojaDeVida;
  alCerrar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const empezoFuera = useRef(false);

  // Las mejoras F1–F4 (`animacionesVentana.ts`): las encendidas en el código y, solo fuera del sitio
  // publicado, recortadas por `?anim=`. En el servidor y al hidratar, todas las encendidas.
  const contacto = useDatosContacto();
  const permitirUrl = contacto?.permitirUrl ?? false;
  const parametro = useSyncExternalStore(
    sinSuscripcion,
    () => (permitirUrl ? new URL(location.href).searchParams.get(PARAMETRO_ANIMACIONES) : null),
    () => null,
  );
  const activas = useMemo(
    () => activasDe(ANIMACIONES_VENTANA, parametro, permitirUrl),
    [parametro, permitirUrl],
  );

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    else if (!abierta && d.open) d.close();
  }, [abierta]);

  // Mientras está abierta, el catálogo de detrás no anima su cambio (`ventanaAbierta.ts`).
  useEffect(() => (abierta ? ventanaAbierta() : undefined), [abierta]);

  const ventana = (
    <dialog
      ref={dialogo}
      className={estilos.ventana}
      aria-label={nombreAccesible ?? titulo}
      data-ventana-contacto=""
      data-anim={activas.join(" ")}
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
          <h2 className={estilos.titulo}>{titulo}</h2>
          <button type="button" className={estilos.cerrar} onClick={alCerrar}>
            <IconX aria-hidden="true" focusable="false" stroke={1.9} size={22} />
            <span className="sr-only">Cerrar la ventana</span>
          </button>
        </div>
        {abierta ? (
          <Suspense fallback={<p className={estilos.cargando}>Cargando el formulario…</p>}>
            <div className={piel.formulario}>
              {hojaDeVida ? (
                <FormularioHojaDeVida
                  vacante={hojaDeVida.vacante}
                  origen={hojaDeVida.origen}
                  siteKey={contacto?.siteKey ?? null}
                  animar={activas}
                  alCerrar={alCerrar}
                />
              ) : formulario ? (
                <FormularioSolicitud
                  {...formulario}
                  variante="emergente"
                  animar={activas}
                  alCerrar={alCerrar}
                />
              ) : null}
            </div>
          </Suspense>
        ) : null}
      </div>
    </dialog>
  );
  // Solo existe tras el primer clic (`BotonFormulario` la monta entonces): `document` ya está.
  return typeof document === "undefined" ? null : createPortal(ventana, document.body);
}
