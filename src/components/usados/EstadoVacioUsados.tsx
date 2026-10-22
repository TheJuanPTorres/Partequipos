import { IconBell, IconBrandWhatsapp } from "@tabler/icons-react";

import { BotonFormulario } from "@/components/forms/BotonFormulario";
import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { TarjetasMarca } from "@/components/repuestos/TarjetasMarca";
import type { ConfigFormulario } from "@/lib/formularios/configFormulario";
import { turnstileSiteKey } from "@/lib/turnstile";
import type { DatosVacio } from "@/lib/usados/listado";

import estilos from "./vacio.module.css";

const ANCLA_AVISO = "avisame";

/**
 * ESTADO VACÍO de un listado de usados sin unidades (petición del cliente,
 * 2026-10-18; en WordPress salía «No hay maquinaria disponible en el momento»
 * y un formulario). Diseñado con el lenguaje del sitio para que se siga
 * mirando: un titular claro, alternativas REALES como tarjetas (la misma
 * categoría en maquinaria nueva, si existe, y otras categorías de usados con
 * unidades) y «Avísame cuando llegue una»: el formulario de solicitud con la
 * categoría ya puesta, más WhatsApp con el mensaje escrito.
 *
 * La página sigue sin indexarse ni salir en el sitemap mientras esté vacía
 * (D4); vuelve sola con la primera unidad.
 */
export function EstadoVacioUsados({ datos, origen }: { datos: DatosVacio; origen: string }) {
  // El mismo formulario en la página y en la ventana de «Avísame cuando llegue una».
  const formulario: ConfigFormulario = {
    tipo: "cotizacion",
    origen,
    siteKey: turnstileSiteKey(),
    whatsapp: datos.whatsapp,
    referencia: { texto: `${datos.referencia} (avísame cuando llegue una)` },
    titulo: "Avísame cuando llegue una",
    descripcion:
      "Déjanos tus datos y te escribimos en cuanto entre una unidad. Si buscas un modelo, un año o unas horas concretas, cuéntanoslo en el mensaje.",
    textoBoton: "Avísame",
  };
  return (
    <div className={estilos.vacio}>
      <section className={estilos.cabecera} aria-labelledby="vacio-titulo">
        <h2 id="vacio-titulo" className={estilos.titulo}>
          {datos.mensaje}
        </h2>
        <p className={estilos.texto}>
          El inventario de usados cambia con frecuencia. Mientras tanto, mira estas opciones o
          déjanos tus datos y te avisamos en cuanto llegue una.
        </p>
        <div className={estilos.acciones}>
          <BotonFormulario
            href={`#${ANCLA_AVISO}`}
            className={`${estilos.boton} ${estilos.botonRojo}`}
            formulario={formulario}
          >
            <IconBell size={18} stroke={1.8} aria-hidden="true" />
            Avísame cuando llegue una
          </BotonFormulario>
          {datos.whatsapp ? (
            <a
              href={datos.whatsapp.href}
              className={`${estilos.boton} ${estilos.botonNegro}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandWhatsapp size={18} stroke={1.8} aria-hidden="true" />
              Escríbenos por WhatsApp
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          ) : null}
        </div>
      </section>

      {datos.nueva.length ? (
        <div className={estilos.alternativas}>
          <TarjetasMarca
            id="vacio-nueva"
            titulo={datos.tituloNueva}
            indice
            verTodo="Ver equipos"
            tarjetas={datos.nueva}
          />
        </div>
      ) : null}

      <div id={ANCLA_AVISO} className={estilos.formulario}>
        <FormularioSolicitud {...formulario} />
      </div>
    </div>
  );
}
