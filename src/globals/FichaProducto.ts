import type { GlobalConfig } from "payload";

import { escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { revalidarFichasDeProducto } from "../lib/revalidation";

/**
 * Lo COMÚN a todas las fichas de equipo nuevo (ficha de producto V2 de ux-9,
 * docs/diseno/decisiones-ficha.md): hoy, la imagen de la llamada a contactar
 * («Contáctanos para recibir asesoría»), que es la misma en cada ficha.
 *
 * Al guardar se revalidan las fichas de equipo nuevo y las páginas de las
 * unidades usadas, que pintan la misma ficha.
 */
export const FichaProducto: GlobalConfig = {
  slug: "ficha-producto",
  label: "Ficha de producto",
  admin: {
    group: "Partes del sitio",
    description: "Lo que comparten todas las fichas de maquinaria nueva.",
  },
  access: { read: lecturaContenido, update: escrituraContenido },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidarFichasDeProducto("global ficha-producto");
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "imagenContacto",
      type: "upload",
      relationTo: "media",
      label: "Imagen de «Contáctanos para recibir asesoría»",
      admin: {
        description:
          "Opcional. A la derecha del recuadro de contacto, al final de cada ficha. Una persona o máquina recortada (PNG transparente) sobresale por arriba; una foto (JPG o WebP) llena esa mitad del recuadro. Vacío: el recuadro sin imagen.",
      },
    },
  ],
};
