import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import { Revelado } from "@/components/movimiento/Revelado";
import { ADELANTOS } from "@/components/movimiento/ritmos";

import estilos from "./marca.module.css";

/**
 * «CONTACTO PARTEQUIPOS» (ux-9): antetítulo, título revelado y el formulario.
 * El formulario es el nuestro (Zod en el servidor, Turnstile y aviso por
 * SMTP), con las dos preguntas opcionales de clasificación del diseño.
 *
 * El título del formulario es el del diseño, pero lo lleva `<h2>` aquí; el del
 * propio formulario queda solo para lectores de pantalla (`variante="plano"`).
 *
 * Lo que se aparta de ux-9: el campo «Empresa» no existe (en el diseño es una
 * opción de «Quién soy») y el formulario avisa de los errores campo a campo y
 * conserva lo escrito (accesibilidad y no perder un lead).
 */
export function ContactoMarca({
  titulo,
  subtitulo,
  boton,
  origen,
  siteKey,
  whatsapp,
  marca,
  id = "repuestos-marca-contacto",
  modelo,
  equipo,
  formulario,
}: {
  titulo: string;
  subtitulo: string;
  boton: string;
  origen: string;
  siteKey: string | null;
  whatsapp?: { href: string; etiqueta: string };
  marca: string;
  /** Id del título; la página de modelo lo usa de ancla («Solicitar repuestos» baja aquí). */
  id?: string;
  /**
   * Página de modelo: solicitud de repuesto con el modelo preseleccionado y los
   * campos de su formulario de WordPress (ciudad e interés), sin las preguntas
   * de clasificación.
   */
  modelo?: { id: number; nombre: string };
  /** Ficha de maquinaria nueva: cotización con el equipo como referencia. */
  equipo?: { id: number; nombre: string };
  /**
   * Otra página con el mismo bloque (servicio técnico, 2026-10-19): el título
   * del formulario para lectores y sus campos. Sin esto, el de repuestos.
   */
  formulario?: { titulo: string; conCiudad?: boolean; etiquetaMensaje?: string };
}) {
  if (!subtitulo) return null;
  return (
    <section className={estilos.contacto} aria-labelledby={id}>
      {titulo ? <p className={estilos.antetitulo}>{titulo}</p> : null}
      <Revelado
        adelanto={ADELANTOS.bajo}
        como="h2"
        id={id}
        texto={subtitulo}
        ritmo="titulo"
        className={estilos.tituloContacto}
      />
      <div className={estilos.formulario}>
        <FormularioSolicitud
          {...configContactoMarca({
            origen,
            siteKey,
            whatsapp,
            boton,
            marca,
            modelo,
            equipo,
            formulario,
          })}
          variante="plano"
        />
      </div>
    </section>
  );
}
