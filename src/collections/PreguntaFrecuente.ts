import type { CollectionConfig } from "payload";

import { borradoAdmin, escrituraContenido, lecturaFiltrada } from "../lib/seguridad/acceso";
import { validarRespuestaFaq } from "../lib/portada/respuestaFaq";
import { revalidarPortada } from "./hooks/portadaHooks";

const portada = revalidarPortada("preguntas-frecuentes");

/** Por la API, el personal lee todas; con el token de lectura, solo las publicadas. */
const leerPreguntas = lecturaFiltrada({ publicada: { equals: true } });

/**
 * Preguntas frecuentes: la sección 11 de la home de ux-9.
 *
 * La respuesta es TEXTO PLANO a propósito, no texto enriquecido: alimenta el
 * JSON-LD `FAQPage`, que pide texto. Admite enlaces con `[texto](/ruta/)`
 * (`respuestaFaq.ts`).
 */
export const PreguntaFrecuente: CollectionConfig = {
  slug: "preguntas-frecuentes",
  labels: { singular: "Pregunta frecuente", plural: "Preguntas frecuentes" },
  admin: {
    useAsTitle: "pregunta",
    defaultColumns: ["pregunta", "orden", "publicada"],
    group: "Páginas y blog",
  },
  access: {
    read: leerPreguntas,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: { afterChange: [portada.afterChange], afterDelete: [portada.afterDelete] },
  defaultSort: "orden",
  fields: [
    { name: "pregunta", type: "text", required: true, label: "Pregunta" },
    {
      name: "respuesta",
      type: "textarea",
      required: true,
      label: "Respuesta",
      validate: validarRespuestaFaq,
      admin: {
        description:
          "Texto sin formato. Para enlazar a otra página escribe [texto del enlace](/ruta/) o [texto](https://…).",
      },
    },
    { name: "orden", type: "number", label: "Orden", admin: { position: "sidebar" } },
    {
      name: "publicada",
      type: "checkbox",
      label: "Publicada",
      defaultValue: true,
      admin: {
        components: { Cell: "/components/admin/celdas/CeldaPublicado" },
        position: "sidebar",
      },
    },
  ],
};
