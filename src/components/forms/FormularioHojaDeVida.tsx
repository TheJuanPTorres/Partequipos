"use client";

import { IconPaperclip } from "@tabler/icons-react";
import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { Campo, claseControl } from "@/components/forms/Campo";
import { Turnstile } from "@/components/forms/Turnstile";
import {
  MAX_PDF_BYTES,
  MAX_PDF_MB,
  RUTA_API_HV,
  RUTA_POLITICA_DATOS,
  type ErroresHv,
  type RespuestaHv,
} from "@/lib/hojaDeVida/constantes";

/**
 * «ENVIAR HV» (`/nosotros/trabaja-con-nosotros/`, 2026-10-23): el formulario de la hoja de vida,
 * dentro de la ventana emergente (`VentanaFormulario`, con la piel de Contáctanos). Nombre, correo,
 * teléfono, la vacante ya rellenada (no se edita), un mensaje opcional, el PDF y la casilla de
 * autorización del tratamiento de datos (Ley 1581 de 2012, con el enlace a la política).
 *
 * Va a una ruta (`/api/hoja-de-vida/`) y no a una Server Action: el PDF pasa del tope de 1 MB de
 * las acciones. El PDF NO se guarda en el sitio: llega de adjunto en un correo. Aquí solo se avisa
 * de lo evidente (tipo y tamaño) antes de enviar; el servidor comprueba el CONTENIDO.
 */
export function FormularioHojaDeVida({
  vacante,
  origen,
  siteKey,
  animar = [],
  alCerrar,
}: {
  /** El cargo (y la ciudad) de la tarjeta: viaja ya rellenado y no se edita. */
  vacante: string;
  origen: string;
  siteKey: string | null;
  /** Las mejoras de la ventana que están encendidas (`F3`, `F4`). */
  animar?: readonly string[];
  alCerrar?: () => void;
}) {
  const f3 = animar.includes("F3");
  const f4 = animar.includes("F4");
  const idBase = useId();
  const campo = (n: string) => `${idBase}-${n}`;
  const formulario = useRef<HTMLFormElement>(null);
  const resumen = useRef<HTMLDivElement>(null);
  const confirmacion = useRef<HTMLDivElement>(null);
  const vuelta = useRef(0);

  const [archivo, setArchivo] = useState<File | null>(null);
  const entradaArchivo = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<ErroresHv>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);
  // Cada respuesta reinicia el reto de Turnstile (el token es de un solo uso).
  const [reinicio, setReinicio] = useState(0);

  useEffect(() => {
    if (hecho) confirmacion.current?.focus();
    else if (mensaje) resumen.current?.focus();
  }, [hecho, mensaje]);

  useEffect(() => {
    if (!f4 || !mensaje || !formulario.current) return;
    vuelta.current += 1;
    formulario.current.dataset.vuelta = String(vuelta.current % 2);
  }, [mensaje, errores, f4]);

  /** Aviso inmediato de lo evidente: no es seguridad, es cortesía (el servidor lo vuelve a mirar). */
  function avisoDelArchivo(archivo: File | undefined): string | undefined {
    if (!archivo) return undefined;
    if (!/\.pdf$/i.test(archivo.name) || (archivo.type && archivo.type !== "application/pdf")) {
      return "La hoja de vida tiene que ser un archivo PDF.";
    }
    if (archivo.size > MAX_PDF_BYTES) {
      return `El PDF pesa demasiado: el máximo es ${MAX_PDF_MB} MB.`;
    }
    return undefined;
  }

  function alElegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    const elegido = e.currentTarget.files?.[0] ?? null;
    const aviso = avisoDelArchivo(elegido ?? undefined);
    if (aviso) {
      // No se queda un archivo que no vale: se avisa y se vacía la elección.
      e.currentTarget.value = "";
      setArchivo(null);
      setErrores((previos) => ({ ...previos, hojaDeVida: aviso }));
      return;
    }
    setArchivo(elegido);
    setErrores((previos) => ({ ...previos, hojaDeVida: undefined }));
  }

  function quitarArchivo() {
    if (entradaArchivo.current) entradaArchivo.current.value = "";
    setArchivo(null);
    entradaArchivo.current?.focus();
  }

  async function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    const datos = new FormData(e.currentTarget);
    const archivo = datos.get("hojaDeVida");
    const aviso = avisoDelArchivo(
      archivo instanceof File && archivo.size > 0 ? archivo : undefined,
    );
    if (aviso) {
      setErrores({ hojaDeVida: aviso });
      setMensaje("Revisa los campos marcados.");
      return;
    }
    setEnviando(true);
    setErrores({});
    setMensaje(null);
    try {
      const r = await fetch(RUTA_API_HV, { method: "POST", body: datos });
      const cuerpo = (await r.json().catch(() => null)) as RespuestaHv | null;
      if (cuerpo?.ok) {
        setHecho(cuerpo.mensaje);
      } else if (cuerpo) {
        setErrores(cuerpo.errores ?? {});
        setMensaje(cuerpo.mensaje);
      } else {
        // 413 de Vercel u otra respuesta que no es nuestra.
        setMensaje(
          r.status === 413
            ? `El PDF pesa demasiado: el máximo es ${MAX_PDF_MB} MB.`
            : "No pudimos enviar tu hoja de vida. Vuelve a intentarlo en un momento.",
        );
      }
    } catch {
      setMensaje("No hay conexión. Revisa tu internet y vuelve a intentarlo.");
    } finally {
      setEnviando(false);
      setReinicio((n) => n + 1);
    }
  }

  if (hecho) {
    return (
      <section>
        <div
          ref={confirmacion}
          tabIndex={-1}
          role="status"
          data-confirmacion={f3 ? "animada" : undefined}
          className={
            f3
              ? "mt-4 focus:outline-none"
              : "mt-4 rounded border border-green-700 bg-green-50 p-4 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-700"
          }
        >
          {f3 ? (
            <svg
              viewBox="0 0 52 52"
              aria-hidden="true"
              focusable="false"
              data-check=""
              className="mx-auto mb-3 h-16 w-16"
            >
              <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="3" />
              <path
                d="M15 27l8 8 15-17"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
          <p className="font-medium">Hoja de vida enviada</p>
          <p className="mt-1 text-sm">{hecho}</p>
          {f3 && alCerrar ? (
            <button type="button" onClick={alCerrar} data-cerrar="">
              Cerrar
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section>
      {mensaje ? (
        <div
          ref={resumen}
          tabIndex={-1}
          role="alert"
          className="mt-4 rounded border border-red-700 bg-red-50 p-4 text-sm text-red-900 focus:outline-none focus:ring-2 focus:ring-red-700"
        >
          {mensaje}
        </div>
      ) : null}

      <form ref={formulario} onSubmit={alEnviar} className="mt-6 space-y-4" noValidate>
        <input type="hidden" name="origen" value={origen} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id={campo("nombre")} etiqueta="Nombre" obligatorio error={errores.nombre}>
            {(p) => (
              <input
                {...p}
                name="nombre"
                type="text"
                autoComplete="name"
                placeholder="Nombre"
                className={claseControl}
              />
            )}
          </Campo>
          <Campo id={campo("telefono")} etiqueta="Teléfono" obligatorio error={errores.telefono}>
            {(p) => (
              <input
                {...p}
                name="telefono"
                type="tel"
                autoComplete="tel"
                placeholder="Teléfono"
                className={claseControl}
              />
            )}
          </Campo>
          <Campo id={campo("correo")} etiqueta="Correo" obligatorio error={errores.correo}>
            {(p) => (
              <input
                {...p}
                name="correo"
                type="email"
                autoComplete="email"
                placeholder="Correo electrónico"
                className={claseControl}
              />
            )}
          </Campo>
          <Campo id={campo("vacante")} etiqueta="Vacante" obligatorio error={errores.vacante}>
            {(p) => (
              <input
                {...p}
                name="vacante"
                type="text"
                value={vacante}
                readOnly
                placeholder="Vacante"
                className={claseControl}
              />
            )}
          </Campo>
        </div>

        <Campo id={campo("mensaje")} etiqueta="Mensaje" error={errores.mensaje}>
          {(p) => (
            <textarea
              {...p}
              name="mensaje"
              rows={4}
              placeholder="Mensaje (opcional)"
              className={claseControl}
            />
          )}
        </Campo>

        {/*
         * El PDF: botón propio «Adjuntar PDF». El `<input type="file">` nativo queda oculto pero
         * accesible (sigue en el orden de tabulación y anuncia su nombre; su foco se pinta en el
         * botón). Al elegir, se ve el nombre del archivo, con «Quitar».
         */}
        <section data-campo="" data-archivo="">
          <p id={campo("hojaDeVida-titulo")} data-titulo-archivo="">
            Hoja de vida (PDF, máximo {MAX_PDF_MB} MB)
            <span className="text-red-700">
              {" *"}
              <span className="sr-only">(obligatorio)</span>
            </span>
          </p>
          <div data-adjuntar-fila="">
            <input
              ref={entradaArchivo}
              id={campo("hojaDeVida")}
              name="hojaDeVida"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              aria-labelledby={campo("hojaDeVida-titulo")}
              aria-invalid={errores.hojaDeVida ? true : undefined}
              aria-describedby={errores.hojaDeVida ? campo("hojaDeVida-error") : undefined}
              onChange={alElegirArchivo}
            />
            <label htmlFor={campo("hojaDeVida")} data-adjuntar="">
              <IconPaperclip aria-hidden="true" size={18} stroke={2} />
              {archivo ? "Cambiar PDF" : "Adjuntar PDF"}
            </label>
            {archivo ? (
              <span data-archivo-elegido="">
                <span data-nombre-archivo="">{archivo.name}</span>
                <button type="button" data-quitar="" onClick={quitarArchivo}>
                  Quitar<span className="sr-only"> el archivo {archivo.name}</span>
                </button>
              </span>
            ) : (
              <span data-sin-archivo="">Ningún archivo seleccionado</span>
            )}
          </div>
          <span aria-live="polite" className="sr-only">
            {archivo ? `Archivo elegido: ${archivo.name}` : ""}
          </span>
          {errores.hojaDeVida ? (
            <p id={campo("hojaDeVida-error")} role="alert" data-error="">
              {errores.hojaDeVida}
            </p>
          ) : null}
        </section>

        <section data-campo="" data-autorizacion="">
          <label htmlFor={campo("autorizacion")}>
            <input
              id={campo("autorizacion")}
              name="autorizacion"
              type="checkbox"
              required
              aria-invalid={errores.autorizacion ? true : undefined}
              aria-describedby={errores.autorizacion ? campo("autorizacion-error") : undefined}
            />
            <span>
              Autorizo el tratamiento de mis datos personales según la{" "}
              <a href={RUTA_POLITICA_DATOS} target="_blank" rel="noopener">
                política de tratamiento de datos
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
              . <span className="text-red-700">*</span>
              <span className="sr-only">(obligatorio)</span>
            </span>
          </label>
          {errores.autorizacion ? (
            <p id={campo("autorizacion-error")} role="alert" data-error="">
              {errores.autorizacion}
            </p>
          ) : null}
        </section>

        {siteKey ? <Turnstile siteKey={siteKey} reinicio={reinicio} /> : null}

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={enviando}
            data-enviando={f3 && enviando ? "" : undefined}
            className="rounded bg-gray-900 px-5 py-2.5 font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {enviando ? "Enviando…" : "Enviar hoja de vida"}
          </button>
          <span aria-live="polite" className="sr-only">
            {enviando ? "Enviando la hoja de vida" : ""}
          </span>
        </div>

        <p className="pt-2 text-xs text-gray-600">
          Los campos marcados con <span aria-hidden="true">*</span> son obligatorios. Tu hoja de
          vida llega por correo a Partequipos; no se publica ni se guarda en este sitio.
        </p>
      </form>
    </section>
  );
}
