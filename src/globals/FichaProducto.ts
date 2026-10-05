import type { GlobalConfig } from "payload";

import { escrituraContenido, publico } from "../lib/seguridad/acceso";
import { revalidarFichasNuevas } from "../lib/revalidation";

/**
 * Lo COMÚN a todas las fichas de equipo nuevo (ficha de producto V2 de ux-9,
 * docs/diseno/decisiones-ficha.md): hoy, la imagen de la llamada a contactar
 * («Contáctanos para recibir asesoría»), que es la misma en cada ficha.
 *
 * Al guardar se revalidan las fichas de equipo nuevo.
 */
export const FichaProducto: GlobalConfig = {
  slug: "ficha-producto",
  label: "Ficha de producto",
  admin: {
    group: "Contenido",
    description: "Lo que comparten todas las fichas de maquinaria nueva.",
  },
  access: { read: publico, update: escrituraContenido },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidarFichasNuevas("global ficha-producto");
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
          "Opcional. Persona o máquina recortada (PNG transparente) a la derecha del recuadro de contacto, al final de cada ficha. Vacío: el recuadro sin imagen.",
      },
    },
  ],
};
