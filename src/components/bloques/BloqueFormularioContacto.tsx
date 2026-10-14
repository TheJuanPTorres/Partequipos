import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import type { VistaFormularioContacto as Datos } from "@/lib/bloques/vista";

import estilos from "./formularioContacto.module.css";

/** Lo que el bloque necesita de la página y no está en el bloque. */
export type ContextoFormulario = {
  /** Ruta de la página: se guarda con la solicitud. */
  origen: string;
  siteKey: string | null;
  whatsapp?: { href: string; etiqueta: string };
};

/**
 * BLOQUE «FORMULARIO DE CONTACTO» — título, texto y el formulario de siempre
 * (Zod en el servidor, Turnstile y aviso por SMTP), de tipo «contacto» y con
 * la ruta de la página como origen. El título visible es el del bloque; el del
 * formulario queda para lectores de pantalla (`variante="plano"`).
 */
export function BloqueFormularioContacto({
  antetitulo,
  titulo,
  texto,
  botonTexto,
  contexto,
}: Datos & { contexto: ContextoFormulario }) {
  return (
    <section className={estilos.seccion}>
      <div className={estilos.tarjeta}>
        {antetitulo ? (
          <p className={`${estilos.antetitulo} texto-destacado-negrita`}>{antetitulo}</p>
        ) : null}
        <h2 className={`${estilos.titulo} texto-titulo-seccion`}>{titulo}</h2>
        {texto ? <p className={`${estilos.texto} texto-cuerpo`}>{texto}</p> : null}
        <FormularioSolicitud
          tipo="contacto"
          origen={contexto.origen}
          siteKey={contexto.siteKey}
          whatsapp={contexto.whatsapp}
          titulo={titulo}
          textoBoton={botonTexto || "Enviar solicitud"}
          variante="plano"
        />
      </div>
    </section>
  );
}
