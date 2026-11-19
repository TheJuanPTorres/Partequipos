import {
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconBrandX,
  IconMail,
} from "@tabler/icons-react";

import { enlacesCompartir } from "@/lib/blog/articulo";

import estilos from "./articuloPropio.module.css";

const ICONOS = {
  facebook: IconBrandFacebook,
  x: IconBrandX,
  linkedin: IconBrandLinkedin,
  correo: IconMail,
  whatsapp: IconBrandWhatsapp,
} as const;

/**
 * «Comparte esta nota de interés» (como el artículo de WordPress): Facebook, X,
 * LinkedIn, correo y WhatsApp con sus enlaces de compartir, sin scripts ni
 * píxeles de terceros. Enlaces normales en otra pestaña (el correo abre el
 * programa de correo). Sin JavaScript: Server Component.
 */
export function BarraCompartir({ url, titulo }: { url: string; titulo: string }) {
  return (
    <div className={estilos.compartir}>
      <p className={estilos.tituloCompartir} id="compartir-titulo">
        Comparte esta nota de interés
      </p>
      <ul aria-labelledby="compartir-titulo">
        {enlacesCompartir(url, titulo).map(({ red, nombre, href }) => {
          const Icono = ICONOS[red];
          const correo = red === "correo";
          return (
            <li key={red}>
              <a
                href={href}
                data-red={red}
                {...(correo ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                aria-label={
                  correo
                    ? "Compartir por correo"
                    : `Compartir en ${nombre} (se abre en otra pestaña)`
                }
              >
                <Icono aria-hidden="true" size={20} stroke={1.8} />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
