import type { CollectionConfig } from "payload";

import { normalizarRuta } from "../lib/redirects/normalizar";
import { aplanarCadenas, marcarDestinoSinVerificar, validarRedirect } from "./hooks/redirectHooks";

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
    defaultColumns: ["desde", "hacia", "estadoDestino", "tipo", "origen"],
    description:
      "Redirecciones de URLs antiguas hacia las vigentes. Evita perder posicionamiento cuando una URL cambia.",
  },
  access: {
    // El proxy las consulta a través de una ruta interna; no se exponen a escritura pública.
    read: () => true,
  },
  hooks: {
    beforeValidate: [validarRedirect, marcarDestinoSinVerificar],
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
    /*
     * ESTADO DEL DESTINO — advertencia visible, nunca bloqueo.
     *
     * Un 301 hacia un 404 es PEOR que el 404 original: el rastreador gasta
     * presupuesto siguiéndolo y no se transfiere ninguna autoridad. Nada lo
     * comprobaba hasta ahora.
     *
     * No se valida al guardar, y es deliberado: durante la migración es
     * legítimo apuntar a contenido que todavía no se ha cargado. Bloquear ahí
     * impediría preparar los redirects por adelantado, que es justo lo que hay
     * que hacer. Lo verifica `npm run redirects:check` y este campo enseña el
     * veredicto en el listado del panel.
     *
     * Se pone en `sin-verificar` cada vez que cambia `hacia` (ver
     * `marcarDestinoSinVerificar`), para que un veredicto viejo no dé una
     * seguridad que ya no corresponde.
     */
    {
      name: "estadoDestino",
      type: "select",
      defaultValue: "sin-verificar",
      label: "Estado del destino",
      options: [
        { label: "Sin verificar", value: "sin-verificar" },
        { label: "✓ Resuelve", value: "resuelve" },
        { label: "⚠ Ruta correcta, sin contenido todavía", value: "sin-contenido" },
        { label: "✗ No corresponde a ninguna ruta", value: "sin-ruta" },
        { label: "Externa (no se comprueba)", value: "externa" },
      ],
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "Lo actualiza `npm run redirects:check`. «Sin contenido» es normal mientras se migra; " +
          "«No corresponde a ninguna ruta» hay que corregirlo antes de publicar.",
      },
    },
    {
      name: "destinoVerificadoEn",
      type: "date",
      label: "Destino verificado el",
      admin: { position: "sidebar", readOnly: true },
    },
  ],
};
