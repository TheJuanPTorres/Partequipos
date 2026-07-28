import type { CollectionConfig } from "payload";

import { normalizarRuta } from "../lib/redirects/normalizar";
import { aplanarCadenas, validarRedirect } from "./hooks/redirectHooks";

/**
 * Redirecciones 301/302 (ADR 0005).
 *
 * Cubre dos necesidades con un mismo mecanismo:
 *  - cambios de slug en el catálogo (`origen: "cambio-de-slug"`, automático);
 *  - el mapa de 301 de la migración de las 648 URLs del sitio actual
 *    (`origen: "migracion"`, carga masiva pendiente de los datos reales).
 */
export const Redirects: CollectionConfig = {
  slug: "redirects",
  labels: {
    singular: "Redirección",
    plural: "Redirecciones",
  },
  admin: {
    useAsTitle: "desde",
    defaultColumns: ["desde", "hacia", "tipo", "origen"],
    description:
      "Redirecciones de URLs antiguas hacia las vigentes. Evita perder posicionamiento cuando una URL cambia.",
  },
  access: {
    // El proxy las consulta a través de una ruta interna; no se exponen a escritura pública.
    read: () => true,
  },
  hooks: {
    beforeValidate: [validarRedirect],
    afterChange: [aplanarCadenas],
  },
  fields: [
    {
      name: "desde",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: "Desde (ruta origen)",
      admin: {
        description: "Ruta antigua, empezando por «/». Ej: /repuestos-viejo/modelo-x",
      },
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === "string" ? normalizarRuta(value) : value),
        ],
      },
    },
    {
      name: "hacia",
      type: "text",
      required: true,
      label: "Hacia (ruta destino)",
      admin: {
        description: "Ruta vigente o URL absoluta a la que se redirige.",
      },
      hooks: {
        beforeValidate: [
          ({ value }) =>
            typeof value === "string" && !/^https?:\/\//i.test(value.trim())
              ? normalizarRuta(value)
              : value,
        ],
      },
    },
    {
      name: "tipo",
      type: "select",
      required: true,
      defaultValue: "301",
      label: "Tipo",
      options: [
        { label: "301 — Permanente (transfiere posicionamiento)", value: "301" },
        { label: "302 — Temporal", value: "302" },
      ],
      admin: {
        description: "301 salvo que la redirección sea realmente temporal.",
      },
    },
    {
      name: "origen",
      type: "select",
      required: true,
      defaultValue: "manual",
      label: "Origen",
      options: [
        { label: "Manual", value: "manual" },
        { label: "Cambio de slug", value: "cambio-de-slug" },
        { label: "Migración", value: "migracion" },
      ],
      admin: {
        description:
          "Cómo se creó esta redirección. Las automáticas no deben editarse a la ligera.",
      },
    },
    {
      name: "notas",
      type: "textarea",
      label: "Notas",
    },
  ],
};
