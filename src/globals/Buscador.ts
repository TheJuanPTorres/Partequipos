import type { GlobalConfig } from "payload";

import { ETIQUETAS_DATOS, revalidarDatos } from "../lib/cacheDatos";
import { escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";

/**
 * BUSCADOR (2026-11-18): lo que el editor puede ajustar del buscador del sitio (la lupa de la
 * cabecera, el del pie y `/buscar/`).
 *
 * - **Sinónimos propios**: palabras que, para tus clientes, son lo mismo. Se suman a los que el
 *   buscador ya trae (retro, pala, aceite, rodaje, filtro…).
 * - **Guardar búsquedas sin resultado**: apagado, no se guarda ninguna.
 *
 * Al guardar, el buscador se actualiza en la siguiente búsqueda.
 */
export const Buscador: GlobalConfig = {
  slug: "buscador",
  label: "Buscador",
  admin: {
    group: "Configuración",
    description:
      "Ayuda al buscador del sitio a entender cómo hablan tus clientes. Las búsquedas que no encontraron nada están en «Búsquedas sin resultado».",
  },
  access: { read: lecturaContenido, update: escrituraContenido },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidarDatos(ETIQUETAS_DATOS.busqueda, "global buscador");
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "sinonimos",
      type: "textarea",
      label: "Sinónimos propios",
      admin: {
        rows: 8,
        description:
          "Una línea por grupo, con las palabras separadas por «=» o por comas. Por ejemplo: «dientes = gets = cuchillas». Quien escriba cualquiera de ellas encontrará también lo de las demás. Ya vienen incluidos los más comunes (retro, pala, aceite, rodaje, filtro…).",
      },
    },
    {
      name: "guardarSinResultado",
      type: "checkbox",
      label: "Guardar las búsquedas sin resultado",
      defaultValue: true,
      admin: {
        description:
          "Marcada, se guarda el texto de lo que nadie encontró y cuántas veces se repitió (nunca datos de quien busca). Desmarcada, no se guarda nada.",
      },
    },
  ],
};
