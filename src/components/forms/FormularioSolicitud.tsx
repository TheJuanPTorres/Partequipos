"use client";

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
   */
  variante?: "tarjeta" | "plano";
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
  clasificacion = false,
  variante = "tarjeta",
}: Props) {
  const [estado, accion, enviando] = useActionState(enviarSolicitud, ESTADO_INICIAL);

  const idBase = useId();
  const campo = (n: string) => `${idBase}-${n}`;

  const claseSeccion = variante === "plano" ? "" : "mt-10 rounded-lg border border-gray-200 p-6";
  const claseTitulo = variante === "plano" ? "sr-only" : "text-xl font-medium text-gray-900";

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
      <section aria-labelledby={idTitulo} className={claseSeccion}>
        <h2 id={idTitulo} className={claseTitulo}>
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
          placeholder={variante === "plano" ? "Nombre" : undefined}
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
          placeholder={variante === "plano" ? "Correo electrónico" : undefined}
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
      ayuda="Con indicativo si es fijo."
    >
      {(p) => (
        <input
          {...p}
          name="telefono"
          defaultValue={previo.telefono}
          type="tel"
          autoComplete="tel"
          placeholder={variante === "plano" ? "Teléfono" : undefined}
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
          className={claseControl}
        />
      )}
    </Campo>
  );

  return (
    <section aria-labelledby={idTitulo} className={claseSeccion}>
      <h2 id={idTitulo} className={claseTitulo}>
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

        {clasificacion ? (
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

        <Campo id={campo("mensaje")} etiqueta="Mensaje" obligatorio error={err.mensaje}>
          {(p) => (
            <textarea
              {...p}
              name="mensaje"
              rows={5}
              defaultValue={previo.mensaje}
              placeholder={variante === "plano" ? "Mensaje" : undefined}
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

        <p className="pt-2 text-xs text-gray-600">
          Los campos marcados con <span aria-hidden="true">*</span> son obligatorios. Usaremos tus
          datos únicamente para responder esta solicitud.
        </p>
      </form>
    </section>
  );
}
