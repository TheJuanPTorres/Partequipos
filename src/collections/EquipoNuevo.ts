import type { CollectionConfig } from "payload";

import { validarVista360 } from "../lib/maquinaria/fichaNueva";
import { ICONOS_FICHA, validarDestacarFila, type FilaFicha } from "../lib/maquinaria/fichaTecnica";
import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { mostrarEnWebField } from "../lib/fields/mostrarEnWeb";
import { marcaDelTipoCoincide } from "./hooks/marcaDelTipo";
import { revalidarEquipoNuevo, revalidarEquipoNuevoBorrado } from "./hooks/maquinariaHooks";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { avisoField } from "../lib/fields/avisoField";

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
    defaultColumns: ["nombre", "imagenes", "marca", "tipo", "slug", "mostrarEnWeb"],
    group: "Maquinaria",
    listSearchableFields: ["nombre", "codigo"],
  },
  access: {
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    // La marca desnormalizada tiene que ser la del tipo (ver el hook).
    beforeValidate: [marcaDelTipoCoincide("tipos-maquinaria")],
    afterChange: [revalidarEquipoNuevo],
    afterDelete: [revalidarEquipoNuevoBorrado],
  },
  // Unicidad por tipo; el tipo ya implica una marca. Igual que en repuestos.
  indexes: [{ fields: ["tipo", "slug"], unique: true }],
  fields: [
    // Aviso en vivo si la galería está vacía (F4).
    avisoField("avisoSinFotos", "AvisoSinFotos"),
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    mostrarEnWebField({
      descripcion:
        "Desmarcada, el equipo desaparece de toda la web (listados, «Otras referencias», menú, buscador, portada y sitemap) sin borrarse del panel, y su ficha lleva a la página de su tipo. Vuelve al marcarla.",
    }),
    slugField(),
    {
      name: "marca",
      type: "relationship",
      relationTo: "marcas-maquinaria",
      required: true,
      label: "Marca",
      admin: {
        description:
          "Tiene que ser la marca del tipo de equipo de abajo. Si la cambias, vuelve a elegir el tipo.",
      },
    },
    {
      name: "tipo",
      type: "relationship",
      relationTo: "tipos-maquinaria",
      required: true,
      label: "Tipo de equipo",
      admin: { description: "Solo aparecen los tipos de la marca elegida arriba." },
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
    /*
     * PESO OPERATIVO NUMÉRICO (2026-10-14, aprobado por dirección): para filtrar
     * y ordenar el listado por tramos de toneladas («Categoría secundaria» de
     * ux-9). En KILOGRAMOS y entero, porque así lo saca de la ficha técnica el
     * importador de WordPress (`pesoOperativoKg`, que rellena el primer campo
     * numérico cuyo nombre empieza por «peso»). El sitio lo pinta en toneladas.
     * La fila «Peso operativo» de la ficha técnica sigue siendo el texto visible.
     */
    {
      name: "pesoOperativoKg",
      type: "number",
      label: "Peso operativo (kg)",
      min: 0,
      admin: {
        step: 1,
        description:
          "En kilogramos, sin puntos: 8400 para 8,4 t. Sirve para filtrar y ordenar el listado; vacío, el equipo no sale en los filtros de peso.",
      },
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
      admin: {
        components: { Cell: "/components/admin/celdas/CeldaMiniatura" },
        description: "La primera imagen se usa como portada y como imagen social.",
      },
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
          "Pares etiqueta/valor tal como los publica el fabricante. No inventar datos: si no hay dato oficial, se deja fuera. En la ficha salen como mucho 5, junto al título: potencia neta, peso operativo, motor, fuerza de tracción máxima y ancho de la zapata (se reconocen por la etiqueta); si falta alguna, se completa con las siguientes filas, en el orden de aquí. «Destacar» elige los datos de la tarjeta del equipo en la página de su marca.",
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
        {
          type: "row",
          fields: [
            {
              name: "destacar",
              type: "checkbox",
              label: "Destacar",
              defaultValue: false,
              // Máximo 4 en toda la ficha (fichaTecnica.ts). En la casilla, y no en
              // el array, para que el editor vea el mensaje junto a lo que marcó.
              validate: validarDestacarFila,
              admin: {
                width: "30%",
                description: "Junto al título de la ficha, con icono. Máximo 4.",
              },
            },
            {
              name: "icono",
              type: "select",
              label: "Icono",
              options: ICONOS_FICHA.map((i) => ({ value: i.value, label: i.label })),
              admin: {
                width: "70%",
                condition: (_, fila) => Boolean((fila as FilaFicha | undefined)?.destacar),
                description: "Sin elegir, se usa «Otro dato».",
              },
            },
          ],
        },
      ],
    },
    // Contador en vivo de «Destacar» (campo `ui`, sin columna): avisa antes de
    // guardar si hay más de 4 (revisión en pantalla del 2026-10-06).
    {
      name: "contadorDestacadas",
      type: "ui",
      admin: { components: { Field: "/components/admin/ContadorDestacadas" } },
    },
    {
      name: "fichaTecnicaPdf",
      type: "upload",
      relationTo: "documentos",
      label: "Ficha técnica completa (PDF)",
      admin: {
        description:
          "Opcional. Sale como «Descargar ficha técnica completa». Sin documento, el botón no aparece. Súbelo aquí con «Crear» (PDF, máximo 30 MB) o elige uno ya subido en «Documentos».",
      },
    },
    /*
     * VISTA 360 (2026-10-21, ficha nueva de Andrés): un ENLACE, no un fichero.
     * La vista 360 la aloja su proveedor (Matterport, Kuula, un visor propio…) y
     * la ficha la abre en una ventana emergente; sin enlace, no hay botón.
     */
    {
      name: "vista360",
      type: "text",
      label: "Vista 360 (enlace)",
      validate: validarVista360,
      admin: {
        description:
          "Opcional. El enlace de la vista 360 del equipo (empieza por https://). Sale el botón «Ver en vista 360», que la abre en una ventana sobre la ficha. Vacío, no hay botón.",
      },
    },
    /*
     * Documentación descargable. `Media` solo admite JPEG, PNG y WebP
     * (CLAUDE.md §10.28), así que hoy aquí van IMÁGENES, no PDF, y el sitio no
     * las pinta. Decisión de dirección (fase 6): cuando las fichas se muestren,
     * colección aparte para documentos; los PDF no entran en `Media`.
     */
    {
      name: "documentos",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      label: "Imágenes de folletos",
      admin: {
        description:
          "Imágenes de fichas o folletos del fabricante (JPEG, PNG o WebP). No se muestran en el sitio. El PDF de la ficha técnica va en «Ficha técnica completa (PDF)».",
      },
    },
    seoField(),
  ],
};
