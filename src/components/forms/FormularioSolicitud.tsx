"use client";

import { IconBrandWhatsapp } from "@tabler/icons-react";
import { useActionState, useEffect, useId, useRef } from "react";

import { Campo, claseControl } from "@/components/forms/Campo";
import { Turnstile } from "@/components/forms/Turnstile";
import { ESTADO_INICIAL } from "@/lib/actions/estadoFormulario";
import { enviarSolicitud } from "@/lib/actions/solicitudes";
import { INTERESES, PERFILES, type TipoSolicitud } from "@/lib/validation/opcionesSolicitud";

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
  /** Sin `tipo` ni `id` (una unidad usada), la solicitud guarda solo el texto de la referencia. */
  tipo?: "equipos-nuevos" | "modelos-repuesto";
  id?: number;
  /** Texto legible: "Excavadora Hitachi ZX350LC-5B". */
  texto: string;
};

type Props = {
  tipo: TipoSolicitud;
  /** Ruta desde la que se envía; se guarda con la solicitud. */
  origen: string;
  /** Clave del widget de Turnstile; `null` en producción sin claves reales: sin widget. */
  siteKey: string | null;
  /** Teléfono de contacto en formato E.164 para el enlace de WhatsApp. */
  whatsapp?: { href: string; etiqueta: string };
  referencia?: Referencia;
  titulo: string;
  descripcion?: string;
  /** Texto del botón. Cambia según el caso: "Enviar", "Pedir cotización"… */
  textoBoton: string;
  /**
   * Añade las dos preguntas de clasificación opcionales («Estoy interesado
   * en», «Quién soy»). Solo la página de marca de repuestos las usa.
   */
  clasificacion?: boolean;
  /**
   * `plano`: sin tarjeta ni margen propios y con el título solo para lectores
   * de pantalla; la página que lo aloja pone el título visible y el marco.
   * `emergente`: dentro de la ventana de contacto, que pone el título y el marco;
   * el formulario no pinta ningún título.
   */
  variante?: "tarjeta" | "plano" | "emergente";
  /** Etiqueta del campo de mensaje: «Mensaje» por defecto; lubricantes: «¿Qué necesitas?». */
  etiquetaMensaje?: string;
  /**
   * Añade el campo «Ciudad» (opcional; se guarda en la solicitud). Lo usan la
   * página de modelo de repuestos y Lubricantes ENI.
   */
  conCiudad?: boolean;
  /**
   * Texto con el que empieza el mensaje (editable): «¿No encuentras tu modelo?» de las páginas
   * de tipo de repuestos lo abre con la marca y el tipo ya escritos (R4, 2026-10-21).
   */
  mensajeInicial?: string;
  /**
   * Las mejoras de la ventana emergente que están encendidas (`F3`, `F4`; `animacionesVentana.ts`).
   * Solo las lee la variante `emergente`.
   */
  animar?: readonly string[];
  /** Cierra la ventana: lo usa el botón de la confirmación animada (F3). */
  alCerrar?: () => void;
};

const OPCIONES = {
  interes: { pregunta: "Estoy interesado en:", opciones: INTERESES },
  perfil: { pregunta: "Quién soy", opciones: PERFILES },
} as const;

export function FormularioSolicitud({
  tipo,
  origen,
  siteKey,
  whatsapp,
  referencia,
  titulo,
  descripcion,
  textoBoton,
  clasificacion: clasificacionPagina = false,
  variante = "tarjeta",
  etiquetaMensaje: etiquetaPagina = "Mensaje",
  conCiudad: conCiudadPagina = false,
  mensajeInicial,
  animar = [],
  alCerrar,
}: Props) {
  /*
   * La VENTANA EMERGENTE lleva siempre «Ciudad» y «¿Qué necesitas?» (dirección,
   * 2026-10-19) y no las preguntas de clasificación del diseño de repuestos:
   * es el mismo formulario corto en cualquier página que la abra.
   */
  const emergente = variante === "emergente";
  const f3 = emergente && animar.includes("F3");
  const f4 = emergente && animar.includes("F4");
  // La piel de Contáctanos (campos en píldora) pinta las etiquetas solo para lectores: lo visible
  // es el placeholder, y la ventana la lleva también.
  const conMarcador = variante === "plano" || emergente;
  const clasificacion = emergente ? false : clasificacionPagina;
  const conCiudad = emergente || conCiudadPagina;
  const etiquetaMensaje =
    emergente && etiquetaPagina === "Mensaje" ? "¿Qué necesitas?" : etiquetaPagina;
  const [estado, accion, enviando] = useActionState(enviarSolicitud, ESTADO_INICIAL);

  const idBase = useId();
  const campo = (n: string) => `${idBase}-${n}`;

  const claseSeccion = variante !== "tarjeta" ? "" : "mt-10 rounded-lg border border-gray-200 p-6";
  const claseTitulo = variante === "plano" ? "sr-only" : "text-xl font-medium text-gray-900";

  const conTitulo = variante !== "emergente";
  const resumenRef = useRef<HTMLDivElement>(null);
  const confirmacionRef = useRef<HTMLDivElement>(null);
  const idTitulo = `${idBase}-titulo`;

  /*
   * FOCO AL TERMINAR. Sin esto, quien navega con teclado o lector de pantalla se
   * queda en el botón y no se entera de si el envío salió bien: el cambio ocurre
   * en otra parte de la página.
   */
  // F4: cada error nuevo reinicia el movimiento de los campos señalados (par/impar: al cambiar el
  // nombre de la animación vuelve a empezar aunque el campo siga marcado).
  const formulario = useRef<HTMLFormElement>(null);
  const vuelta = useRef(0);
  useEffect(() => {
    if (!f4 || estado.estado !== "error" || !formulario.current) return;
    vuelta.current += 1;
    formulario.current.dataset.vuelta = String(vuelta.current % 2);
  }, [estado, f4]);

  useEffect(() => {
    if (estado.estado === "ok") confirmacionRef.current?.focus();
    else if (estado.estado === "error") resumenRef.current?.focus();
  }, [estado]);

  if (estado.estado === "ok") {
    return (
      <section aria-labelledby={conTitulo ? idTitulo : undefined} className={claseSeccion}>
        {conTitulo ? (
          <h2 id={idTitulo} className={claseTitulo}>
            {titulo}
          </h2>
        ) : null}
        <div
          ref={confirmacionRef}
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
          {f3 && alCerrar ? (
            <button type="button" onClick={alCerrar} data-cerrar="">
              Cerrar
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  const err = estado.errores ?? {};
  // Tras un error, lo que escribió el usuario vuelve como valor por defecto:
  // React restablece el formulario al terminar la acción y, sin esto, lo vaciaría.
  const previo = estado.estado === "error" ? (estado.valores ?? {}) : {};

  const campoNombre = (
    <Campo id={campo("nombre")} etiqueta="Nombre" obligatorio error={err.nombre}>
      {(p) => (
        <input
          {...p}
          name="nombre"
          defaultValue={previo.nombre}
          type="text"
          autoComplete="name"
          placeholder={conMarcador ? "Nombre" : undefined}
          className={claseControl}
        />
      )}
    </Campo>
  );
  const campoCorreo = (
    <Campo id={campo("correo")} etiqueta="Correo" obligatorio error={err.correo}>
      {(p) => (
        <input
          {...p}
          name="correo"
          defaultValue={previo.correo}
          type="email"
          autoComplete="email"
          placeholder={conMarcador ? "Correo electrónico" : undefined}
          className={claseControl}
        />
      )}
    </Campo>
  );
  const campoTelefono = (
    <Campo
      id={campo("telefono")}
      etiqueta="Teléfono"
      error={err.telefono}
      // En la ventana emergente, sin ayuda (dirección, 2026-10-19); en las páginas, se queda.
      ayuda={variante === "emergente" ? undefined : "Con indicativo si es fijo."}
    >
      {(p) => (
        <input
          {...p}
          name="telefono"
          defaultValue={previo.telefono}
          type="tel"
          autoComplete="tel"
          placeholder={conMarcador ? "Teléfono" : undefined}
          className={claseControl}
        />
      )}
    </Campo>
  );
  const campoEmpresa = (
    <Campo id={campo("empresa")} etiqueta="Empresa" error={err.empresa}>
      {(p) => (
        <input
          {...p}
          name="empresa"
          defaultValue={previo.empresa}
          type="text"
          autoComplete="organization"
          placeholder={conMarcador ? "Empresa" : undefined}
          className={claseControl}
        />
      )}
    </Campo>
  );

  const campoCiudad = (
    <Campo id={campo("ciudad")} etiqueta="Ciudad" error={err.ciudad}>
      {(p) => (
        <input
          {...p}
          name="ciudad"
          defaultValue={previo.ciudad}
          type="text"
          autoComplete="address-level2"
          placeholder={conMarcador ? "Ciudad" : undefined}
          className={claseControl}
        />
      )}
    </Campo>
  );

  return (
    <section aria-labelledby={conTitulo ? idTitulo : undefined} className={claseSeccion}>
      {conTitulo ? (
        <h2 id={idTitulo} className={claseTitulo}>
          {titulo}
        </h2>
      ) : null}
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
          // F4: con errores en los campos, el resumen solo se anuncia (cada mensaje ya está bajo su
          // campo); si fue otro fallo (reto, servidor), se ve como siempre.
          className={
            f4 && Object.keys(err).length > 0
              ? "sr-only"
              : "mt-4 rounded border border-red-700 bg-red-50 p-4 text-sm text-red-900 focus:outline-none focus:ring-2 focus:ring-red-700"
          }
        >
          {estado.mensaje}
        </div>
      ) : null}

      <form ref={formulario} action={accion} className="mt-6 space-y-4" noValidate>
        {/* Campos que no toca el usuario. El servidor los valida igual. */}
        <input type="hidden" name="tipo" value={tipo} />
        <input type="hidden" name="origen" value={origen} />
        {referencia ? (
          <>
            {referencia.tipo && referencia.id !== undefined ? (
              <>
                <input type="hidden" name="referenciaTipo" value={referencia.tipo} />
                <input type="hidden" name="referenciaId" value={referencia.id} />
              </>
            ) : null}
            <input type="hidden" name="referenciaTexto" value={referencia.texto} />
          </>
        ) : null}

        {clasificacion
          ? (["interes", "perfil"] as const).map((nombre) => (
              <fieldset key={nombre}>
                <legend className="block text-sm font-medium text-gray-900">
                  {OPCIONES[nombre].pregunta}
                  <span className="ml-1 font-normal text-gray-500">(opcional)</span>
                </legend>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                  {OPCIONES[nombre].opciones.map((o) => (
                    <label key={o.valor} className="flex items-center gap-2 text-sm text-gray-800">
                      <input
                        type="radio"
                        name={nombre}
                        value={o.valor}
                        defaultChecked={previo[nombre] === o.valor}
                      />
                      {o.etiqueta}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))
          : null}

        {conCiudad && !clasificacion ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {campoNombre}
            {campoTelefono}
            {campoCorreo}
            {campoCiudad}
          </div>
        ) : clasificacion ? (
          // Orden del diseño de ux-9: nombre y teléfono en una fila, el correo debajo.
          // Sin «Empresa»: ahí es una opción de «Quién soy».
          <div className="grid gap-4 sm:grid-cols-2">
            {campoNombre}
            {campoTelefono}
            <div className="sm:col-span-2">{campoCorreo}</div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {campoNombre}
            {campoCorreo}
            {campoTelefono}
            {campoEmpresa}
          </div>
        )}

        <Campo id={campo("mensaje")} etiqueta={etiquetaMensaje} obligatorio error={err.mensaje}>
          {(p) => (
            <textarea
              {...p}
              name="mensaje"
              rows={5}
              defaultValue={previo.mensaje ?? mensajeInicial}
              placeholder={conMarcador ? etiquetaMensaje : undefined}
              className={claseControl}
            />
          )}
        </Campo>

        {/*
         * Cada respuesta del servidor reinicia el reto: el token es de un solo
         * uso. Sin clave (producción sin claves reales) no se pinta: un widget
         * con la clave de prueba sería una protección falsa (§10.11).
         */}
        {siteKey ? <Turnstile siteKey={siteKey} reinicio={estado} /> : null}

        <div className="flex flex-wrap items-center gap-4 pt-2">
          {/*
           * DOBLE ENVÍO: el botón se deshabilita mientras la acción está en
           * vuelo. `useActionState` además encola las llamadas, así que un
           * segundo clic no dispara una segunda escritura.
           */}
          <button
            type="submit"
            disabled={enviando}
            data-enviando={f3 && enviando ? "" : undefined}
            className="rounded bg-gray-900 px-5 py-2.5 font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {enviando ? "Enviando…" : textoBoton}
          </button>

          {/* Se anuncia el envío en curso a quien no ve el botón cambiar. */}
          <span aria-live="polite" className="sr-only">
            {enviando ? "Enviando la solicitud" : ""}
          </span>

          {whatsapp && emergente ? (
            // La VENTANA lleva un botón verde con el icono (2026-10-25); el enlace de texto de las
            // páginas no cambia. Mismo destino y mensaje, en pestaña nueva.
            <a
              href={whatsapp.href}
              data-whatsapp-boton=""
              rel="noopener noreferrer"
              target="_blank"
            >
              <IconBrandWhatsapp aria-hidden="true" focusable="false" stroke={2} size={20} />
              Escríbenos por WhatsApp
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          ) : whatsapp ? (
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

        <p className="pt-2 text-xs text-gray-600">
          Los campos marcados con <span aria-hidden="true">*</span> son obligatorios. Usaremos tus
          datos únicamente para responder esta solicitud.
        </p>
      </form>
    </section>
  );
}
