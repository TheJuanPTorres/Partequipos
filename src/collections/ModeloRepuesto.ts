import type { CollectionConfig } from "payload";
import { ocultoSinUso } from "../lib/fields/ocultoSinUso";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { marcaDelTipoCoincide } from "./hooks/marcaDelTipo";
import { revalidarModelo, revalidarModeloBorrado } from "./hooks/revalidateHooks";
import { mostrarEnWebField } from "../lib/fields/mostrarEnWeb";
import {
  borradoAdmin,
  escrituraContenido,
  lecturaContenido,
  soloPersonal,
} from "../lib/seguridad/acceso";
import { VERSIONES_SIN_BORRADORES, versionesRecientesPrimero } from "../lib/borradores";
import { VISTA_PREVIA_MODELO } from "../lib/vistaPrevia/enVivo";
import { avisoField } from "../lib/fields/avisoField";
import { validarSerieDelModelo } from "../lib/repuestos/series";
import { conPestanas } from "../lib/fields/pestanasFicha";
import { conCopia } from "../lib/fields/duplicar";
import {
  CELDA_NOMBRE_FICHA,
  camposResumenWeb,
  campoConSugerencias,
  conInterruptor,
} from "../lib/fields/fichaFacil";

/**
 * Modelo concreto dentro de un tipo de equipo (ej. "CAT 320D" en Excavadora).
 * Nivel más profundo de la jerarquía: Marca -> Tipo -> Modelo.
 */
export const ModeloRepuesto: CollectionConfig = {
  slug: "modelos-repuesto",
  labels: {
    singular: "Modelo",
    plural: "Modelos",
  },
  admin: {
    useAsTitle: "nombre",
    group: "Repuestos",
    // El código («320D») es como busca un comercial; el nombre solo no basta.
    // Vista previa en vivo (tanda 21, tarea 3, fase 2, punto 5): la ficha se pinta mientras se escribe.
    livePreview: VISTA_PREVIA_MODELO,
  },
  access: {
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
    // El historial de versiones, solo con sesión del personal (tanda 21, tarea 3, fase 2, punto 4).
    readVersions: soloPersonal,
  },
  // Historial sin borradores: cada guardado, una versión que se compara y se restaura.
  versions: VERSIONES_SIN_BORRADORES,
  // Unicidad del slug POR TIPO (el tipo ya implica una marca). Ver reporte.
  indexes: [{ fields: ["tipo", "slug"], unique: true }],
  // ISR: revalida la ficha y la página del tipo donde el modelo se lista.
  hooks: {
    // La marca desnormalizada tiene que ser la del tipo (ver el hook).
    // La lista de versiones, la más reciente primero.
    beforeOperation: [versionesRecientesPrimero],
    beforeValidate: [marcaDelTipoCoincide("tipos-equipo")],
    afterChange: [revalidarModelo],
    afterDelete: [revalidarModeloBorrado],
  },
  fields: conPestanas(
    [
      // EDICIÓN FÁCIL (tanda 21, tarea 3, fase 2): «Así se ve hoy en la web» con la ficha completa,
      // y la columna «Estado» de la lista. Campos `ui`: no guardan nada.
      ...camposResumenWeb(),
      // Aviso en vivo si la galería está vacía (F4).
      avisoField("avisoSinFotos", "AvisoSinFotos"),
      // El nombre empieza por «test» o «prueba»: avisa, no bloquea (tanda 21, tarea 8).
      avisoField("avisoNombreDePrueba", "AvisoNombreDePrueba"),
      {
        name: "nombre",
        type: "text",
        required: true,
        label: "Nombre",
        // Al duplicar, «(copia)» (tanda 21, `duplicar.ts`).
        hooks: { beforeDuplicate: [conCopia] },
        admin: {
          description: "Como sale en la página del modelo. Ej. «Excavadora Caterpillar 320D».",
          // En la lista, con la miniatura, y los dos abren la ficha (punto 1).
          components: { Cell: CELDA_NOMBRE_FICHA },
        },
      },
      // En la lista, interruptor directo (punto 2).
      conInterruptor(
        mostrarEnWebField({
          descripcion:
            "Desmarcado, el modelo desaparece de toda la web (listados del tipo y de la marca, buscador y sitemap) sin borrarse del panel, y su página lleva a la de su tipo. Vuelve al marcarlo.",
        }),
      ),
      slugField(),
      // `marca` va antes que `tipo` para poder filtrar los tipos por la marca
      // elegida. Desnormalizada a propósito (consultas y breadcrumbs).
      {
        name: "marca",
        type: "relationship",
        relationTo: "marcas",
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
        relationTo: "tipos-equipo",
        required: true,
        label: "Tipo de equipo",
        admin: {
          description: "Solo aparecen los tipos de la marca elegida arriba.",
        },
        // Filtra el desplegable de tipos por la marca ya seleccionada.
        filterOptions: ({ siblingData }) => {
          const marca = (siblingData as { marca?: number | string | null }).marca;
          return marca ? { marca: { equals: marca } } : true;
        },
      },
      {
        name: "codigo",
        type: "text",
        label: "Código",
        admin: {
          description: "Código del modelo, ej. 320D.",
          placeholder: "Ej. 320D",
        },
      },
      {
        name: "serie",
        type: "text",
        label: "Serie",
        validate: validarSerieDelModelo,
        admin: {
          description:
            "Solo si su tipo de equipo tiene series: el nombre de una de ellas, ej. «EX» o «ZAXIS». Vacío: el modelo sale en «Otros modelos».",
          // Debajo, las series del tipo elegido, para pulsarlas (punto 7).
          components: {
            Field: campoConSugerencias("tipo", "Series de este tipo:", {
              coleccion: "tipos-equipo",
              lista: "series",
              subcampo: "nombre",
            }),
          },
        },
      },
      {
        name: "descripcion",
        type: "textarea",
        label: "Descripción",
        admin: {
          description:
            "El texto de presentación de la página del modelo, junto a su foto. Del WordPress, tal cual.",
        },
      },
      /*
       * El resto del contenido de la página de modelo de WordPress (decisión del
       * cliente, 2026-10-17: se migra todo tal cual, erratas incluidas). Un
       * `collapsible` no anida en la base: son columnas del modelo.
       */
      {
        type: "collapsible",
        label: "Textos de la página del modelo",
        admin: { initCollapsed: true },
        fields: [
          // Solo lo usaba el diseño propio, retirado el 2026-11-18 (limpieza, paso 1).
          ocultoSinUso({
            name: "antetitulo",
            type: "text",
            label: "Antetítulo",
            admin: { description: "Sobre el título, ej. «Repuestos para Maquinaria Pesada»." },
          }),
          // Solo lo usaba el diseño propio, retirado el 2026-11-18 (limpieza, paso 1).
          ocultoSinUso({
            name: "tituloPagina",
            type: "text",
            label: "Título de la página",
            admin: {
              description:
                "El título grande, ej. «HITACHI Excavadora ZX200». Vacío: «Repuestos» y el nombre del modelo.",
            },
          }),
          // Solo lo usaba el diseño propio, retirado el 2026-11-18 (limpieza, paso 1).
          ocultoSinUso({
            name: "tituloDisponibles",
            type: "text",
            label: "Título de las categorías",
            admin: {
              description:
                "Sobre las categorías, ej. «repuestos disponibles para excavadora Hitachi LANDCROS ZX200». Vacío: «Repuestos disponibles para» y el nombre.",
            },
          }),
          // Solo lo usaba el diseño propio, retirado el 2026-11-18 (limpieza, paso 1).
          ocultoSinUso({
            name: "piezas",
            type: "array",
            label: "Lista de piezas",
            labels: { singular: "Pieza", plural: "Piezas" },
            admin: {
              description:
                "La lista de WordPress («- Filtros para …»). Solo se ve si marcas la casilla de abajo.",
              initCollapsed: true,
            },
            fields: [{ name: "texto", type: "text", required: true, label: "Texto" }],
          }),
          // Solo lo usaba el diseño propio, retirado el 2026-11-18 (limpieza, paso 1).
          ocultoSinUso({
            name: "mostrarPiezas",
            type: "checkbox",
            label: "Mostrar la lista de piezas",
            defaultValue: false,
            admin: {
              description:
                "En WordPress la lista solo se ve en algunas páginas; en el resto está guardada pero oculta.",
            },
          }),
        ],
      },
      {
        name: "imagenes",
        type: "upload",
        relationTo: "media",
        hasMany: true,
        label: "Fotos",
        admin: {
          components: { Cell: "/components/admin/celdas/CeldaMiniatura" },
          // Punto 8: subir varias a la vez y ordenar por arrastre.
          description:
            "Puedes subir varias a la vez. Ordénalas arrastrando: la primera es la que sale en la página del modelo y al compartir.",
        },
      },
      seoField(),
    ],
    { fotos: { imagenes: "galeria" } },
  ),
};
