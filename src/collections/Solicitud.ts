import type { CollectionConfig } from "payload";

import { notificarSolicitud } from "./hooks/notificarSolicitud";
import { escrituraContenido, soloAdmin, soloPersonal } from "../lib/seguridad/acceso";
import { fechaCreado } from "../lib/fields/fechasDeLista";
import {
  ESTADOS_SOLICITUD,
  ESTADO_PENDIENTE,
  fechaDeContacto,
  solicitudesACsv,
  type FilaSolicitud,
} from "../lib/solicitudes/seguimiento";

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
    // «Autorizó» (2026-11-27): quién autorizó el tratamiento de datos, a la vista en la bandeja.
    defaultColumns: ["nombre", "tipo", "estado", "autorizacionDatos", "createdAt"],
    group: "Mensajes recibidos",
    description:
      "Formularios enviados desde el sitio. Contienen datos personales: no se publican y solo son visibles aquí.",
    // Ayuda arriba de la lista (F4). Solo texto: no lee filas ni cambia el acceso.
    components: { beforeList: ["/components/admin/aviso/AvisoSolicitudes"] },
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
    // «Creado» como fecha relativa en la lista (F3). Solo la celda: ni datos ni acceso.
    fechaCreado,
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
      defaultValue: ESTADO_PENDIENTE,
      options: [...ESTADOS_SOLICITUD],
      admin: {
        components: { Cell: "/components/admin/celdas/CeldaSolicitud" },
        position: "sidebar",
        description:
          "Nueva → Contactada (ya hablaste con la persona) → Cerrada. No la borres: conserva el historial. Solo las «Nuevas» cuentan como pendientes.",
      },
    },
    // Seguimiento (2026-11-20): quién la lleva, cuándo se contactó y notas del equipo.
    {
      name: "responsable",
      type: "relationship",
      relationTo: "users",
      label: "Responsable",
      admin: { position: "sidebar", description: "Quién se encarga de esta solicitud." },
    },
    {
      name: "fechaContacto",
      type: "date",
      label: "Fecha de contacto",
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayAndTime" },
        description: "Se apunta sola al pasar de «Nueva»; puedes corregirla.",
      },
    },
    {
      name: "notasInternas",
      type: "textarea",
      label: "Notas internas",
      admin: {
        position: "sidebar",
        description: "Solo las ve el equipo en el panel; nunca salen al visitante.",
      },
    },

    { name: "nombre", type: "text", required: true, label: "Nombre" },
    { name: "correo", type: "email", required: true, label: "Correo" },
    { name: "telefono", type: "text", label: "Teléfono" },
    { name: "empresa", type: "text", label: "Empresa" },
    // Opcional. La piden los formularios que la muestran (página de modelo de repuestos, Lubricantes ENI).
    { name: "ciudad", type: "text", label: "Ciudad" },
    /*
     * Clasificación opcional del formulario de la página de marca de repuestos
     * (ux-9). Solo estos dos campos y solo de elección cerrada: ningún dato
     * personal nuevo. Los demás formularios no los envían.
     */
    {
      name: "interes",
      type: "select",
      label: "Interesado en",
      options: [
        { label: "Cotizar productos", value: "cotizar" },
        { label: "Muestras / prototipos", value: "muestras" },
        { label: "Asesoría general", value: "asesoria" },
        { label: "Otro", value: "otro" },
      ],
    },
    {
      name: "perfil",
      type: "select",
      label: "Perfil",
      options: [
        { label: "Empresa", value: "empresa" },
        { label: "Comprador", value: "comprador" },
        { label: "Emprendedor", value: "emprendedor" },
        { label: "Proveedor", value: "proveedor" },
        { label: "Empleado", value: "empleado" },
        { label: "Otro", value: "otro" },
      ],
    },
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
    /*
     * PRUEBA DE LA AUTORIZACIÓN DEL TRATAMIENTO DE DATOS (Ley 1581 de 2012, 2026-11-27): la casilla
     * es obligatoria en todos los formularios, así que una solicitud nueva siempre la lleva en
     * «Sí». Las anteriores (sin el campo) se ven con «—». La fecha de la autorización es la de
     * la solicitud (`createdAt`). Solo las escribe el servidor al crear: nadie las cambia después.
     */
    {
      name: "autorizacionDatos",
      type: "checkbox",
      label: "Autorizó el tratamiento de datos",
      access: { update: () => false },
      admin: {
        readOnly: true,
        position: "sidebar",
        components: { Cell: "/components/admin/celdas/CeldaAutorizo" },
        description:
          "Si la persona marcó la casilla de autorización (Ley 1581 de 2012) al enviar el formulario. Las solicitudes anteriores al 27 de noviembre de 2026 no lo registran.",
      },
    },
    {
      name: "autorizacionTexto",
      type: "text",
      label: "Texto que aceptó",
      access: { update: () => false },
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "El texto de la casilla que aceptó. La fecha es la de la solicitud.",
      },
    },
  ],

  /*
   * Aviso por correo al recibir el lead. Nunca puede tumbar el envío: si el
   * correo falla, la solicitud ya está guardada y eso es lo que importa.
   */
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const fecha = fechaDeContacto(
          originalDoc?.estado,
          data?.estado ?? originalDoc?.estado,
          data?.fechaContacto ?? originalDoc?.fechaContacto,
          new Date(),
        );
        if (fecha && data) data.fechaContacto = fecha;
        return data;
      },
    ],
    afterChange: [notificarSolicitud],
  },

  // Exportar a Excel (CSV): respeta el filtro de la lista (`?where[…]`) y el acceso del usuario.
  endpoints: [
    {
      path: "/exportar",
      method: "get",
      handler: async (req) => {
        if (!req.user) return Response.json({ mensaje: "Sin sesión." }, { status: 401 });
        const { docs } = await req.payload.find({
          collection: "solicitudes",
          where: (req.query?.where as never) ?? undefined,
          sort: "-createdAt",
          limit: 5000,
          depth: 1,
          pagination: false,
          user: req.user,
          overrideAccess: false,
        });
        const dia = new Date().toISOString().slice(0, 10);
        return new Response(solicitudesACsv(docs as unknown as FilaSolicitud[]), {
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "content-disposition": `attachment; filename="solicitudes-${dia}.csv"`,
            "cache-control": "no-store",
          },
        });
      },
    },
  ],

  timestamps: true,
};
