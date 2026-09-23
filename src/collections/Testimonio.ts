import {
  ValidationError,
  type Access,
  type CollectionBeforeChangeHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
} from "payload";

import {
  TESTIMONIOS_PUBLICOS,
  publicadoEfectivo,
  validarPublicacionTestimonio,
} from "../lib/fields/reglasPortada";
import { borradoAdmin, esPersonal, escrituraContenido } from "../lib/seguridad/acceso";
import { revalidarPortada } from "./hooks/portadaHooks";

const portada = revalidarPortada("testimonios");

/**
 * El personal del panel lee todo; el público, SOLO lo publicado y autorizado.
 * Se devuelve una CONSULTA, no `false`: la respuesta sale en 200 con menos
 * filas, así que esto se verifica por el efecto, no por el código (§10.15).
 */
const leerTestimonios: Access = ({ req }) =>
  esPersonal(req.user) ? true : (TESTIMONIOS_PUBLICOS as unknown as ReturnType<Access>);

/**
 * RECHAZA, con error visible, la petición que pide publicar sin autorización.
 *
 * Tiene que ser `beforeValidate` y no `beforeChange`: en Payload 3 los ganchos
 * `beforeChange` de colección corren ANTES de validar los campos, así que un
 * `beforeChange` que corrige el dato deja a la validación sin nada que
 * rechazar. Medido: el editor «publicaba», no veía error, y el testimonio
 * quedaba sin publicar sin que lo supiera.
 *
 * Solo en el PASO a publicado (no lo estaba y ahora sí). En una actualización
 * Payload entrega `data` ya mezclado con lo guardado, así que retirar la
 * autorización de uno publicado llega con `publicado: true`: eso NO da error,
 * lo despublica el gancho de abajo, que es lo que se quiere (quitarlo de la web
 * cuanto antes). Medido: la primera versión lo rechazaba.
 */
const noPublicarSinAutorizacion: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (data?.publicado !== true || originalDoc?.publicado === true) return data;
  const autorizado = data.autorizacionUso ?? originalDoc?.autorizacionUso;
  const veredicto = validarPublicacionTestimonio(true, autorizado);
  if (veredicto === true) return data;
  throw new ValidationError({
    collection: "testimonios",
    errors: [{ path: "publicado", message: veredicto }],
    req,
  });
};

/**
 * RED DETRÁS: el servidor nunca guarda «publicado» sin autorización.
 * En una actualización PARCIAL un campo puede no venir en la petición: se toma
 * el valor ya guardado, para no despublicar por omisión uno autorizado.
 */
const sinAutorizacionNoSePublica: CollectionBeforeChangeHook = ({ data, originalDoc }) => ({
  ...data,
  publicado: publicadoEfectivo(
    data.publicado ?? originalDoc?.publicado,
    data.autorizacionUso ?? originalDoc?.autorizacionUso,
  ),
});

/**
 * Testimonios de clientes: la sección 10 de la home de ux-9.
 *
 * SON PERSONAS REALES. Publicar su nombre, foto y cita con fines comerciales
 * exige su autorización (Ley 1581 de 2012; licencia L4 de
 * docs/diseno/decisiones-home-ux9.md). La protección práctica es doble:
 *
 * 1. **No se puede publicar sin la autorización marcada**: el campo `publicado`
 *    lo valida, y un gancho lo fuerza a `false` en el servidor si falta —
 *    también al RETIRAR la autorización de uno ya publicado.
 * 2. **El público no lee lo no publicado**: el acceso de lectura filtra.
 *
 * Un testimonio nuevo nace SIN publicar.
 */
export const Testimonio: CollectionConfig = {
  slug: "testimonios",
  labels: { singular: "Testimonio", plural: "Testimonios" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "empresa", "autorizacionUso", "publicado"],
    group: "Contenido",
    description:
      "Testimonios de la portada. Un testimonio no se publica sin la autorización de uso de la persona.",
  },
  access: {
    read: leerTestimonios,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    beforeValidate: [noPublicarSinAutorizacion],
    beforeChange: [sinAutorizacionNoSePublica],
    afterChange: [portada.afterChange],
    afterDelete: [portada.afterDelete],
  },
  defaultSort: "orden",
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre de la persona" },
    { name: "empresa", type: "text", label: "Empresa" },
    { name: "ciudad", type: "text", label: "Ciudad o departamento" },
    { name: "cita", type: "textarea", required: true, label: "Testimonio" },
    { name: "foto", type: "upload", relationTo: "media", label: "Foto" },
    {
      name: "video",
      type: "relationship",
      relationTo: "videos",
      label: "Vídeo del testimonio",
      admin: {
        description: "Opcional. En ux-9 ninguno lo tiene, aunque el botón dice «Ver Video».",
      },
    },
    {
      type: "collapsible",
      label: "Autorización de uso",
      admin: { initCollapsed: false },
      fields: [
        {
          name: "autorizacionUso",
          type: "checkbox",
          label:
            "Tengo la autorización firmada de esta persona para publicar su nombre, foto y testimonio",
          defaultValue: false,
        },
        {
          name: "fechaAutorizacion",
          type: "date",
          label: "Fecha de la autorización",
          admin: { condition: (_, s) => s?.autorizacionUso === true },
          validate: (
            valor: unknown,
            { siblingData }: { siblingData: { autorizacionUso?: boolean } },
          ) =>
            siblingData?.autorizacionUso === true && !valor
              ? "Indica la fecha de la autorización."
              : true,
        },
        {
          name: "referenciaAutorizacion",
          type: "text",
          label: "Dónde está el documento",
          admin: {
            condition: (_, s) => s?.autorizacionUso === true,
            description: "Para poder encontrarlo si la persona pide retirar su testimonio.",
          },
        },
      ],
    },
    {
      name: "publicado",
      type: "checkbox",
      label: "Publicado",
      defaultValue: false,
      validate: (valor: unknown, { siblingData }: { siblingData: { autorizacionUso?: boolean } }) =>
        validarPublicacionTestimonio(valor, siblingData?.autorizacionUso),
      admin: {
        position: "sidebar",
        description: "Solo se puede marcar con la autorización de uso marcada.",
      },
    },
    { name: "orden", type: "number", label: "Orden", admin: { position: "sidebar" } },
  ],
};
