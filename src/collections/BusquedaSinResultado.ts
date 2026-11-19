import type { CollectionConfig } from "payload";

import { ETIQUETAS_DATOS, revalidarDatos } from "../lib/cacheDatos";
import { escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";

/**
 * BÚSQUEDAS SIN RESULTADO (2026-11-18): lo que los visitantes buscaron en el sitio y no encontraron,
 * con las veces que se repitió. Sirve para saber qué falta (un sinónimo, una página, un producto).
 *
 * LO QUE GUARDA, Y LO QUE NO: solo el TEXTO buscado (en minúsculas, sin tildes) y un contador. Nunca
 * la IP, ni cookies, ni nada de quien busca. Se descartan los textos que parezcan un teléfono, un
 * correo, un documento o una dirección web (`src/lib/buscador/registro.ts`), y hay límite de
 * frecuencia. Solo lo escribe el servidor (con `overrideAccess`): por la API nadie crea ni edita
 * filas; el editor puede borrarlas una vez atendidas.
 */
const soloServidor = { update: () => false, create: () => false };

export const BusquedaSinResultado: CollectionConfig = {
  slug: "busquedas-sin-resultado",
  labels: { singular: "Búsqueda sin resultado", plural: "Búsquedas sin resultado" },
  admin: {
    useAsTitle: "texto",
    defaultColumns: ["texto", "veces", "ultimaVez"],
    group: "Configuración",
    description:
      "Lo que los visitantes buscaron y no encontraron, de la más repetida a la menos. Solo se guarda el texto y cuántas veces se repitió: nada de quien buscó. Si una se repite, añade un sinónimo en «Buscador» o crea la página que falta. Bórrala cuando la hayas atendido.",
    listSearchableFields: ["texto"],
  },
  defaultSort: "-veces",
  access: {
    read: lecturaContenido,
    create: () => false,
    update: () => false,
    delete: escrituraContenido,
  },
  hooks: {
    afterDelete: [
      ({ doc }) => {
        revalidarDatos(ETIQUETAS_DATOS.busqueda, "búsqueda sin resultado borrada");
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "texto",
      type: "text",
      label: "Lo que buscaron",
      required: true,
      unique: true,
      maxLength: 80,
      access: soloServidor,
      admin: { readOnly: true },
    },
    {
      name: "veces",
      type: "number",
      label: "Veces",
      defaultValue: 1,
      access: soloServidor,
      admin: { readOnly: true, description: "Cuántas veces se buscó sin encontrar nada." },
    },
    {
      name: "ultimaVez",
      type: "date",
      label: "Última vez",
      access: soloServidor,
      admin: {
        readOnly: true,
        date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" },
      },
    },
  ],
};
