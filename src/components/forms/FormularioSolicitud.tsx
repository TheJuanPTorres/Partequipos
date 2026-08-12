"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import { Campo, claseControl } from "@/components/forms/Campo";
import { Turnstile } from "@/components/forms/Turnstile";
import { ESTADO_INICIAL } from "@/lib/actions/estadoFormulario";
import { enviarSolicitud } from "@/lib/actions/solicitudes";
import type { TipoSolicitud } from "@/lib/validation/solicitud";

/**
 * Formulario de solicitud. Sirve a los tres casos (contacto, cotización de
 * equipo y solicitud de repuesto) porque solo cambian el tipo, los textos y la
 * referencia preseleccionada; duplicar el marcado tres veces habría triplicado
 * también los fallos de accesibilidad.
 *
 * Es un Client Component —el único de esta tanda— porque necesita estado de
 * envío y gestión de foco. El resto de la página sigue siendo servidor.
 *
 * SIN PÁGINA DE GRACIAS: la confirmación sustituye al formulario en el sitio.
 * El sitio actual tiene 8 URLs de "gracias" huérfanas (grupo D del mapa de
 * redirects) que no aportan nada y ensucian el índice.
 */

type Referencia = {
  tipo: "equipos-nuevos" | "modelos-repuesto";
  id: number;
  /** Texto legible: "Excavadora Hitachi ZX350LC-5B". */
  texto: string;
};

type Props = {
  tipo: TipoSolicitud;
  /** Ruta desde la que se envía; se guarda con la solicitud. */
  origen: string;
  siteKey: string;
  /** Teléfono de contacto en formato E.164 para el enlace de WhatsApp. */
  whatsapp?: { href: string; etiqueta: string };
  referencia?: Referencia;
  titulo: string;
  descripcion?: string;
  /** Texto del botón. Cambia según el caso: "Enviar", "Pedir cotización"… */
  textoBoton: string;
};

export function FormularioSolicitud({
  tipo,
  origen,
  siteKey,
  whatsapp,
  referencia,
  titulo,
  descripcion,
  textoBoton,
}: Props) {
  const [estado, accion, enviando] = useActionState(enviarSolicitud, ESTADO_INICIAL);

  const idBase = useId();
  const campo = (n: string) => `${idBase}-${n}`;

  const resumenRef = useRef<HTMLDivElement>(null);
  const confirmacionRef = useRef<HTMLDivElement>(null);
  const idTitulo = `${idBase}-titulo`;

  /*
   * FOCO AL TERMINAR. Sin esto, quien navega con teclado o lector de pantalla se
   * queda en el botón y no se entera de si el envío salió bien: el cambio ocurre
   * en otra parte de la página.
   */
  useEffect(() => {
    if (estado.estado === "ok") confirmacionRef.current?.focus();
    else if (estado.estado === "error") resumenRef.current?.focus();
  }, [estado]);

  if (estado.estado === "ok") {
    return (
      <section aria-labelledby={idTitulo} className="mt-10 rounded-lg border border-gray-200 p-6">
        <h2 id={idTitulo} className="text-xl font-medium text-gray-900">
          {titulo}
        </h2>
        <div
          ref={confirmacionRef}
          tabIndex={-1}
          role="status"
          className="mt-4 rounded border border-green-700 bg-green-50 p-4 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-700"
        >
          <p className="font-medium">Solicitud enviada</p>
          <p className="mt-1 text-sm">{estado.mensaje}</p>
          {whatsapp ? (
            <p className="mt-3 text-sm">
              ¿Es urgente?{" "}
              <a
                href={whatsapp.href}
                className="underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                Escríbenos por WhatsApp al {whatsapp.etiqueta}
              </a>
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  const err = estado.errores ?? {};

  return (
    <section aria-labelledby={idTitulo} className="mt-10 rounded-lg border border-gray-200 p-6">
      <h2 id={idTitulo} className="text-xl font-medium text-gray-900">
        {titulo}
      </h2>
      {descripcion ? <p className="mt-2 text-sm text-gray-600">{descripcion}</p> : null}

      {referencia ? (
        <p className="mt-3 rounded bg-gray-50 px-3 py-2 text-sm text-gray-700">
          Consulta sobre: <strong className="font-medium">{referencia.texto}</strong>
        </p>
      ) : null}

      {/*
       * Resumen de error, enfocable. Es lo primero que oye un lector de pantalla
       * tras un envío fallido; los errores de cada campo van además junto a él.
       */}
      {estado.estado === "error" ? (
        <div
          ref={resumenRef}
          tabIndex={-1}
          role="alert"
          className="mt-4 rounded border border-red-700 bg-red-50 p-4 text-sm text-red-900 focus:outline-none focus:ring-2 focus:ring-red-700"
        >
          {estado.mensaje}
        </div>
      ) : null}

      <form action={accion} className="mt-6 space-y-4" noValidate>
        {/* Campos que no toca el usuario. El servidor los valida igual. */}
        <input type="hidden" name="tipo" value={tipo} />
        <input type="hidden" name="origen" value={origen} />
        {referencia ? (
          <>
            <input type="hidden" name="referenciaTipo" value={referencia.tipo} />
            <input type="hidden" name="referenciaId" value={referencia.id} />
            <input type="hidden" name="referenciaTexto" value={referencia.texto} />
          </>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id={campo("nombre")} etiqueta="Nombre" obligatorio error={err.nombre}>
            {(p) => (
              <input
                {...p}
                name="nombre"
                type="text"
                autoComplete="name"
                className={claseControl}
              />
            )}
          </Campo>

          <Campo id={campo("correo")} etiqueta="Correo" obligatorio error={err.correo}>
            {(p) => (
              <input
                {...p}
                name="correo"
                type="email"
                autoComplete="email"
                className={claseControl}
              />
            )}
          </Campo>

          <Campo
            id={campo("telefono")}
            etiqueta="Teléfono"
            error={err.telefono}
            ayuda="Con indicativo si es fijo."
          >
            {(p) => (
              <input
                {...p}
                name="telefono"
                type="tel"
                autoComplete="tel"
                className={claseControl}
              />
            )}
          </Campo>

          <Campo id={campo("empresa")} etiqueta="Empresa" error={err.empresa}>
            {(p) => (
              <input
                {...p}
                name="empresa"
                type="text"
                autoComplete="organization"
                className={claseControl}
              />
            )}
          </Campo>
        </div>

        <Campo id={campo("mensaje")} etiqueta="Mensaje" obligatorio error={err.mensaje}>
          {(p) => <textarea {...p} name="mensaje" rows={5} className={claseControl} />}
        </Campo>

        <Turnstile siteKey={siteKey} />

        <div className="flex flex-wrap items-center gap-4 pt-2">
          {/*
           * DOBLE ENVÍO: el botón se deshabilita mientras la acción está en
           * vuelo. `useActionState` además encola las llamadas, así que un
           * segundo clic no dispara una segunda escritura.
           */}
          <button
            type="submit"
            disabled={enviando}
            className="rounded bg-gray-900 px-5 py-2.5 font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {enviando ? "Enviando…" : textoBoton}
          </button>

          {/* Se anuncia el envío en curso a quien no ve el botón cambiar. */}
          <span aria-live="polite" className="sr-only">
            {enviando ? "Enviando la solicitud" : ""}
          </span>

          {whatsapp ? (
            <a
              href={whatsapp.href}
              className="text-sm text-gray-700 underline hover:text-gray-900"
              rel="noopener noreferrer"
              target="_blank"
            >
              O escríbenos por WhatsApp
            </a>
          ) : null}
        </div>

        <p className="pt-2 text-xs text-gray-500">
          Los campos marcados con <span aria-hidden="true">*</span> son obligatorios. Usaremos tus
          datos únicamente para responder esta solicitud.
        </p>
      </form>
    </section>
  );
}
