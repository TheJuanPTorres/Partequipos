import type { CollectionConfig } from "payload";

import { notificarSolicitud } from "./hooks/notificarSolicitud";
import { escrituraContenido, soloAdmin, soloPersonal } from "../lib/seguridad/acceso";

/**
 * Solicitudes enviadas desde los formularios públicos: el lead comercial, que es
 * el objetivo del proyecto.
 *
 * ES EL ÚNICO PUNTO DEL PROYECTO CON DATOS PERSONALES. Ver el bloque de
 * `access`, que es lo primero que hay que revisar al tocar esta colección.
 */
export const Solicitud: CollectionConfig = {
  slug: "solicitudes",
  labels: { singular: "Solicitud", plural: "Solicitudes" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "tipo", "estado", "correo", "telefono", "createdAt"],
    group: "Comercial",
    description:
      "Formularios enviados desde el sitio. Contienen datos personales: no se publican y solo son visibles aquí.",
    listSearchableFields: ["nombre", "correo", "empresa", "mensaje"],
  },

  // Lo más nuevo primero: esto es una bandeja de entrada, no un catálogo.
  defaultSort: "-createdAt",

  /*
   * CONTROL DE ACCESO — el punto delicado de esta colección.
   *
   * `read: soloPersonal` cierra la API REST y GraphQL a cualquiera que no esté
   * autenticado. Sin esto, `GET /api/solicitudes` devolvería el listado de leads
   * con nombres, correos y teléfonos a quien lo pidiera: el resto de colecciones
   * son de lectura pública precisamente porque son catálogo, y copiar ese patrón
   * aquí sería una fuga de datos personales.
   *
   * `create: false` cierra la creación por API pública. Los formularios NO pasan
   * por ahí: usan la API local de Payload desde una Server Action, y la API
   * local ignora el control de acceso por defecto (`overrideAccess: true`). Es
   * decir, el formulario funciona y el endpoint público no.
   *
   * `update` y `delete` quedan restringidos a usuarios autenticados: el cliente
   * marca una solicitud como atendida desde /admin.
   */
  access: {
    read: soloPersonal,
    create: () => false,
    update: escrituraContenido,
    // Borrar un lead es irreversible: solo administrador. Para el trabajo
    // diario basta con marcarlo "atendida".
    delete: soloAdmin,
  },

  fields: [
    {
      name: "tipo",
      type: "select",
      required: true,
      label: "Tipo",
      defaultValue: "contacto",
      options: [
        { label: "Contacto general", value: "contacto" },
        { label: "Cotización de equipo", value: "cotizacion" },
        { label: "Solicitud de repuesto", value: "repuesto" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "estado",
      type: "select",
      required: true,
      label: "Estado",
      defaultValue: "nueva",
      options: [
        { label: "Nueva", value: "nueva" },
        { label: "Atendida", value: "atendida" },
      ],
      admin: {
        position: "sidebar",
        description: "Marcar como atendida en vez de borrar: conserva el historial.",
      },
    },

    { name: "nombre", type: "text", required: true, label: "Nombre" },
    { name: "correo", type: "email", required: true, label: "Correo" },
    { name: "telefono", type: "text", label: "Teléfono" },
    { name: "empresa", type: "text", label: "Empresa" },
    { name: "mensaje", type: "textarea", required: true, label: "Mensaje" },

    /*
     * Referencia a lo que se consultaba. Se guarda por RELACIÓN, no como texto:
     * así el comercial abre la ficha desde la solicitud. `hasMany: false` con dos
     * colecciones posibles porque una solicitud es de un equipo O de un modelo,
     * nunca de ambos.
     */
    {
      name: "referencia",
      type: "relationship",
      relationTo: ["equipos-nuevos", "modelos-repuesto"],
      label: "Equipo o modelo consultado",
      admin: {
        description: "Se rellena solo cuando la solicitud sale de una ficha.",
        readOnly: true,
      },
    },
    /*
     * Copia en TEXTO de lo consultado. Es redundante con `referencia` a
     * propósito: si algún día se borra o se renombra la ficha, la solicitud
     * sigue diciendo por qué producto preguntaron. Un lead no debe degradarse
     * porque el catálogo cambie.
     */
    {
      name: "referenciaTexto",
      type: "text",
      label: "Producto consultado (texto)",
      admin: { readOnly: true },
    },
    {
      name: "origen",
      type: "text",
      label: "URL de origen",
      admin: {
        description: "Página desde la que se envió el formulario.",
        readOnly: true,
      },
    },
  ],

  /*
   * Aviso por correo al recibir el lead. Nunca puede tumbar el envío: si el
   * correo falla, la solicitud ya está guardada y eso es lo que importa.
   */
  hooks: { afterChange: [notificarSolicitud] },

  timestamps: true,
};
