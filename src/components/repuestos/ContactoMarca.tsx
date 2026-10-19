import { FormularioSolicitud } from "@/components/forms/FormularioSolicitud";
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
  id,
}: {
  titulo: string;
  subtitulo: string;
  boton: string;
  origen: string;
  siteKey: string | null;
  whatsapp?: { href: string; etiqueta: string };
  marca: string;
  /** Ancla de la sección (a ella baja «Solicita asesoría»). */
  id?: string;
}) {
  if (!subtitulo) return null;
  return (
    <section id={id} className={estilos.contacto} aria-labelledby="repuestos-marca-contacto">
      {titulo ? <p className={estilos.antetitulo}>{titulo}</p> : null}
      <Revelado
        adelanto={ADELANTOS.bajo}
        como="h2"
        id="repuestos-marca-contacto"
        texto={subtitulo}
        ritmo="titulo"
        className={estilos.tituloContacto}
      />
      <div className={estilos.formulario}>
        <FormularioSolicitud
          tipo="contacto"
          origen={origen}
          siteKey={siteKey}
          whatsapp={whatsapp}
          titulo={`Contacto sobre repuestos ${marca}`}
          textoBoton={boton || "Enviar"}
          clasificacion
          variante="plano"
        />
      </div>
    </section>
  );
}
