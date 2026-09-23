import type { Access, CollectionConfig } from "payload";

import { borradoAdmin, esPersonal, escrituraContenido } from "../lib/seguridad/acceso";
import { revalidarPortada } from "./hooks/portadaHooks";

const portada = revalidarPortada("preguntas-frecuentes");

/** El público solo lee las publicadas; el personal, todas. */
const leerPreguntas: Access = ({ req }) =>
  esPersonal(req.user) ? true : { publicada: { equals: true } };

/**
 * Preguntas frecuentes: la sección 11 de la home de ux-9.
 *
 * La respuesta es TEXTO PLANO a propósito, no texto enriquecido: alimenta el
 * JSON-LD `FAQPage`, que pide texto, y en ux-9 las respuestas son párrafos sin
 * enlaces ni formato.
 */
export const PreguntaFrecuente: CollectionConfig = {
  slug: "preguntas-frecuentes",
  labels: { singular: "Pregunta frecuente", plural: "Preguntas frecuentes" },
  admin: {
    useAsTitle: "pregunta",
    defaultColumns: ["pregunta", "orden", "publicada"],
    group: "Contenido",
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
    { name: "respuesta", type: "textarea", required: true, label: "Respuesta" },
    { name: "orden", type: "number", label: "Orden", admin: { position: "sidebar" } },
    {
      name: "publicada",
      type: "checkbox",
      label: "Publicada",
      defaultValue: true,
      admin: { position: "sidebar" },
    },
  ],
};
