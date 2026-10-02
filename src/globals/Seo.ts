import type { GlobalConfig } from "payload";

import { DIAS, NOMBRE_DIA, validarHora } from "../lib/seo/horario";
import { revalidarTodoElSitio } from "../lib/revalidation";
import { escrituraContenido, publico } from "../lib/seguridad/acceso";

/**
 * SEO Y DATOS DE LA EMPRESA, editable (fase 6).
 *
 * Hoy solo lleva el HORARIO DE ATENCIÓN, que antes estaba escrito a mano en
 * `seoConfig` (texto libre) y solo lo pintaba el bloque de la home anterior a
 * ux-9. Va en el JSON-LD `Organization` (`contactPoint.hoursAvailable`, como
 * `OpeningHoursSpecification`) y en /contactanos/.
 *
 * El resto de los datos de la empresa (razón social, contacto, redes) sigue en
 * `src/lib/seo/config.ts` hasta que se decida moverlos aquí.
 *
 * Al guardar se revalida todo el sitio: el JSON-LD va en varias páginas.
 */
export const Seo: GlobalConfig = {
  slug: "seo",
  label: "SEO y datos de la empresa",
  admin: {
    group: "Configuración",
    description:
      "Datos de la empresa que usan los buscadores y el sitio. Hoy: el horario de atención.",
  },
  access: { read: publico, update: escrituraContenido },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidarTodoElSitio("seo");
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "horario",
      type: "array",
      label: "Horario de atención",
      labels: { singular: "Tramo", plural: "Tramos" },
      admin: {
        description:
          "Un tramo por grupo de días con el mismo horario. Ejemplo: lunes a viernes de 08:00 a 17:30.",
      },
      fields: [
        {
          name: "dias",
          type: "select",
          hasMany: true,
          required: true,
          label: "Días",
          options: DIAS.map((d) => ({
            label: NOMBRE_DIA[d].charAt(0).toUpperCase() + NOMBRE_DIA[d].slice(1),
            value: d,
          })),
        },
        {
          type: "row",
          fields: [
            {
              name: "abre",
              type: "text",
              required: true,
              label: "Abre",
              validate: validarHora,
              admin: { width: "50%", placeholder: "08:00" },
            },
            {
              name: "cierra",
              type: "text",
              required: true,
              label: "Cierra",
              validate: validarHora,
              admin: { width: "50%", placeholder: "17:30" },
            },
          ],
        },
      ],
    },
  ],
};
