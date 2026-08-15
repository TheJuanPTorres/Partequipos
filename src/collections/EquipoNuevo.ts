import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { revalidarEquipoNuevo, revalidarEquipoNuevoBorrado } from "./hooks/maquinariaHooks";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";

/**
 * Ficha de un equipo de la línea NUEVA. Es una página de **venta**, no una
 * página de catálogo de piezas: su trabajo es que alguien pida una cotización.
 *
 * De ahí los campos por encima de los de repuestos: galería, argumentos
 * destacados y ficha técnica.
 */
export const EquipoNuevo: CollectionConfig = {
  slug: "equipos-nuevos",
  labels: { singular: "Equipo nuevo", plural: "Equipos nuevos" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "marca", "tipo", "slug"],
    group: "Maquinaria",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: { afterChange: [revalidarEquipoNuevo], afterDelete: [revalidarEquipoNuevoBorrado] },
  // Unicidad por tipo; el tipo ya implica una marca. Igual que en repuestos.
  indexes: [{ fields: ["tipo", "slug"], unique: true }],
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    slugField(),
    {
      name: "marca",
      type: "relationship",
      relationTo: "marcas-maquinaria",
      required: true,
      label: "Marca",
      admin: {
        description:
          "Desnormalizada para consultas y migas. Debe coincidir con la marca del tipo elegido.",
      },
    },
    {
      name: "tipo",
      type: "relationship",
      relationTo: "tipos-maquinaria",
      required: true,
      label: "Tipo de equipo",
      admin: { description: "Se filtra por la marca seleccionada arriba." },
      filterOptions: ({ siblingData }) => {
        const marca = (siblingData as { marca?: number | string | null }).marca;
        return marca ? { marca: { equals: marca } } : true;
      },
    },
    {
      name: "codigo",
      type: "text",
      label: "Código / referencia",
      admin: { description: "Referencia del fabricante, ej. 1150M o ZX350LC-6." },
    },
    {
      name: "entradilla",
      type: "textarea",
      label: "Entradilla",
      admin: { description: "Resumen de una o dos líneas, bajo el título." },
    },
    {
      name: "descripcion",
      type: "richText",
      label: "Descripción comercial",
    },
    /*
     * Argumentos de venta en lista. Se modelan aparte de la descripción porque
     * la plantilla los presenta destacados y porque así el editor no depende de
     * acordarse de maquetarlos dentro del texto.
     */
    {
      name: "destacados",
      type: "array",
      label: "Puntos destacados",
      labels: { singular: "Punto", plural: "Puntos" },
      admin: { description: "Ventajas o argumentos de venta, uno por línea." },
      fields: [{ name: "texto", type: "text", required: true, label: "Texto" }],
    },
    {
      name: "imagenes",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      label: "Galería",
      admin: { description: "La primera imagen se usa como portada y como imagen social." },
    },
    /*
     * FICHA TÉCNICA como pares etiqueta/valor, NO como campos fijos.
     *
     * Las especificaciones relevantes cambian por completo según el equipo: una
     * excavadora se describe por peso operativo y alcance; una pavimentadora por
     * ancho de extendido; una regla vibratoria por longitud. Un esquema con
     * campos fijos dejaría la mitad vacíos en cada ficha y obligaría a migrar el
     * esquema cada vez que entre una familia nueva.
     *
     * Con pares, el editor copia exactamente lo que publica el fabricante. No se
     * inventa ninguna especificación concreta desde el código.
     */
    {
      name: "fichaTecnica",
      type: "array",
      label: "Ficha técnica",
      labels: { singular: "Especificación", plural: "Especificaciones" },
      admin: {
        description:
          "Pares etiqueta/valor tal como los publica el fabricante. No inventar datos: si no hay dato oficial, se deja fuera.",
      },
      fields: [
        {
          name: "etiqueta",
          type: "text",
          required: true,
          label: "Etiqueta",
          admin: { description: "Ej. «Peso operativo», «Potencia neta»." },
        },
        {
          name: "valor",
          type: "text",
          required: true,
          label: "Valor",
          admin: { description: "Incluir la unidad: «20.500 kg», «122 kW»." },
        },
      ],
    },
    /*
     * Documentación descargable (fichas del fabricante en PDF). Es material que
     * el comercial suele enviar y que aquí puede estar desde el primer clic.
     */
    {
      name: "documentos",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      label: "Documentos",
      admin: { description: "Fichas técnicas o folletos del fabricante en PDF." },
    },
    seoField(),
  ],
};
