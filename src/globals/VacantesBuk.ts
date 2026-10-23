import type { GlobalConfig } from "payload";

import { ETIQUETAS_DATOS, revalidarDatos } from "../lib/cacheDatos";
import { revalidarRutas } from "../lib/revalidation";
import { escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { CONTEXTO_ESCRITURA_VACANTES, SLUG_VACANTES_BUK } from "../lib/vacantes/constantes";

/**
 * VACANTES DE BUK (2026-10-23, Juan Pablo): el interruptor de la lectura del
 * portal de Buk para «Trabaja con nosotros» y la ÚLTIMA COPIA BUENA de esa
 * lectura (`src/lib/vacantes/fuente.ts`).
 *
 * El editor solo toca el interruptor. Lo demás lo escribe el servidor al leer
 * Buk (con `overrideAccess` y el contexto `CONTEXTO_ESCRITURA_VACANTES`, que
 * no revalida nada): el panel lo enseña de solo lectura, y nadie puede
 * cambiarlo por la API (acceso de campo).
 *
 * Al guardar el interruptor se invalida la caché de las vacantes: el cambio
 * llega a la página en la siguiente visita.
 */
const soloServidor = { update: () => false, create: () => false };

export const VacantesBuk: GlobalConfig = {
  slug: SLUG_VACANTES_BUK,
  label: "Vacantes de Buk",
  admin: {
    group: "Partes del sitio",
    description:
      "Las vacantes de la página «Trabaja con nosotros» se leen del portal de empleo de Buk, como mucho cada 6 horas. Aquí se puede cortar esa lectura y ver cómo fue la última.",
  },
  access: { read: lecturaContenido, update: escrituraContenido },
  hooks: {
    afterChange: [
      ({ doc, req }) => {
        if (req.context?.[CONTEXTO_ESCRITURA_VACANTES]) return doc;
        revalidarDatos(ETIQUETAS_DATOS.vacantes, "global vacantes-buk");
        revalidarRutas(["/nosotros/trabaja-con-nosotros"], "global vacantes-buk");
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "leer",
      type: "checkbox",
      label: "Leer vacantes de Buk",
      defaultValue: true,
      admin: {
        description:
          "Desmarcada, la página no lee Buk y muestra solo el aviso de que no hay vacantes con el enlace al portal de empleo de Buk. El cambio se ve en la siguiente visita.",
      },
    },
    {
      type: "collapsible",
      label: "Última lectura (solo lectura)",
      admin: { initCollapsed: false },
      fields: [
        {
          name: "copiaEl",
          type: "date",
          label: "Última lectura correcta",
          access: soloServidor,
          admin: {
            readOnly: true,
            date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" },
            description: "Las vacantes que se ven en la página son las de esta lectura.",
          },
        },
        {
          name: "numeroVacantes",
          type: "number",
          label: "Vacantes en esa lectura",
          access: soloServidor,
          admin: { readOnly: true },
        },
        {
          name: "ultimoIntento",
          type: "date",
          label: "Último intento",
          access: soloServidor,
          admin: {
            readOnly: true,
            date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" },
          },
        },
        {
          name: "ultimoError",
          type: "text",
          label: "Error del último intento",
          access: soloServidor,
          admin: {
            readOnly: true,
            description:
              "Vacío: salió bien. Con texto: la lectura falló y la página sigue con la última lectura correcta.",
          },
        },
        {
          name: "vacantes",
          type: "json",
          label: "Copia de las vacantes",
          access: soloServidor,
          admin: { hidden: true },
        },
      ],
    },
  ],
};
