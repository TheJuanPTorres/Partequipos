import type { CollectionConfig } from "payload";

import { validarLatitud, validarLongitud } from "../lib/fields/reglasPortada";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";
import { revalidarPortada } from "./hooks/portadaHooks";

const portada = revalidarPortada("sedes");

/**
 * Sedes de Partequipos: el globo de la sección 9 de la home de ux-9.
 *
 * **No tienen URL propia**, como los equipos usados: el sitio actual no tiene
 * una página por sede, así que no se inventan URLs. Por eso no llevan slug.
 *
 * Una sede tiene VARIAS líneas de negocio, cada una con su dirección: en Bogotá
 * maquinaria, repuestos y almacén están en sitios distintos, y en Antioquia en
 * dos municipios (Guarne y Medellín). De ahí el array de líneas.
 *
 * Coordenadas en dos números y no en un campo `point`: en Postgres, `point`
 * exige la extensión PostGIS, que no está activada y es una dependencia de
 * infraestructura más para la base del cliente (§10.7).
 *
 * Los datos de ux-9 son de una maqueta: las direcciones y teléfonos se
 * confirman con el cliente antes de publicarse o de ir al JSON-LD
 * (docs/diseno/analisis-home-ux9.md §1).
 *
 * Fase G (2026-10-02): como en ux-9, la ficha lleva la etiqueta «Ciudad,
 * Departamento» (`ciudad` y `departamento`) y el teléfono va POR LÍNEA, no por
 * sede: en Antioquia cada línea tiene el suyo. El array `telefonos` de la sede
 * se quitó (estaba vacío en todas las bases).
 */
export const Sede: CollectionConfig = {
  slug: "sedes",
  labels: { singular: "Sede", plural: "Sedes" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "orden"],
    group: "Páginas y blog",
    description: "Sedes del mapa de la portada. No generan URLs propias.",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: { afterChange: [portada.afterChange], afterDelete: [portada.afterDelete] },
  defaultSort: "orden",
  fields: [
    {
      name: "nombre",
      type: "text",
      required: true,
      label: "Nombre",
      admin: {
        description: "Nombre de la sede. La ficha dice «Sede <nombre>». Ej. «Bogotá», «Antioquia».",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "ciudad",
          type: "text",
          required: true,
          label: "Ciudad",
          admin: { width: "50%", description: "Ej. «Medellín» en la sede Antioquia." },
        },
        {
          name: "departamento",
          type: "text",
          required: true,
          label: "Departamento",
          admin: {
            width: "50%",
            description: "Ej. «Antioquia». Etiqueta: «Ciudad, Departamento».",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "latitud",
          type: "number",
          required: true,
          label: "Latitud",
          validate: validarLatitud,
          admin: { step: 0.000001, width: "50%" },
        },
        {
          name: "longitud",
          type: "number",
          required: true,
          label: "Longitud",
          validate: validarLongitud,
          admin: { step: 0.000001, width: "50%" },
        },
      ],
    },
    {
      name: "lineas",
      type: "array",
      label: "Líneas de negocio",
      labels: { singular: "Línea", plural: "Líneas" },
      minRows: 1,
      admin: {
        description: "Cada línea con su dirección. Ej. Maquinaria · Diagonal 16 # 96 G – 85.",
      },
      fields: [
        { name: "linea", type: "text", required: true, label: "Línea" },
        {
          name: "localidad",
          type: "text",
          label: "Municipio",
          admin: { description: "Solo si no es el de la sede. Ej. «Guarne» en Antioquia." },
        },
        { name: "direccion", type: "text", required: true, label: "Dirección" },
        {
          name: "telefono",
          type: "text",
          label: "Teléfono",
          admin: {
            description:
              "Opcional: en ux-9, tres sedes no tienen teléfono. Con indicativo. Ej. (601) 492 62 60.",
          },
        },
      ],
    },
    { name: "foto", type: "upload", relationTo: "media", label: "Foto" },
    {
      name: "orden",
      type: "number",
      label: "Orden",
      admin: { position: "sidebar", description: "Menor primero." },
    },
  ],
};
