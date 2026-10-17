import type { Field } from "payload";

import { avisoField } from "./avisoField";

/**
 * «TIPOGRAFÍA DEL TÍTULO» DE UNA DIAPOSITIVA DEL HERO (2026-10-17, pedido del
 * cliente: control total del título desde el panel). TODO OPCIONAL: un campo
 * vacío deja el estilo de siempre (Inter seminegrita, mayúsculas, centrado,
 * blanco, tamaño del diseño y título arriba). Lo traduce a CSS
 * `src/lib/portada/tipografia.ts`.
 */

/** `#RRGGBB` (o `#RGB`), lo único que admite el color. */
export const RE_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function validarColor(valor: unknown): true | string {
  if (valor === null || valor === undefined || valor === "") return true;
  return typeof valor === "string" && RE_COLOR.test(valor.trim())
    ? true
    : "Escribe el color en hexadecimal, con almohadilla: p. ej. #FFFFFF (blanco) o #D92035 (rojo).";
}

const PANTALLAS = [
  { sufijo: "Escritorio", nombre: "escritorio", ancho: "1025 px o más" },
  { sufijo: "Tablet", nombre: "tablet", ancho: "768 a 1024 px" },
  { sufijo: "Movil", nombre: "móvil", ancho: "menos de 768 px" },
] as const;

const PESOS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
const NOMBRE_PESO: Record<number, string> = {
  100: "Fina",
  200: "Extrafina ligera",
  300: "Ligera",
  400: "Normal",
  500: "Media",
  600: "Seminegrita",
  700: "Negrita",
  800: "Extranegrita",
  900: "Black",
};

export const tipografiaTituloField: Field = {
  name: "tipografia",
  type: "group",
  label: "Tipografía del título",
  admin: {
    condition: (_: unknown, hermanos: { mostrarTitulo?: boolean }) =>
      hermanos?.mostrarTitulo !== false,
    description:
      "Todo opcional: lo que dejes vacío conserva el estilo de siempre (Inter, seminegrita, mayúsculas, centrado y blanco, arriba).",
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "fuente",
          type: "relationship",
          relationTo: "fuentes",
          label: "Fuente",
          admin: {
            width: "50%",
            placeholder: "Inter (la del sitio)",
            description:
              "Vacía: Inter, la del sitio. Las demás son las que se suben en «Archivos › Fuentes». Solo se descarga si la diapositiva se ve.",
          },
        },
        {
          name: "peso",
          type: "select",
          label: "Grosor",
          options: PESOS.map((p) => ({ label: `${p} · ${NOMBRE_PESO[p]}`, value: String(p) })),
          admin: {
            width: "50%",
            description:
              "Vacío: 600. Con una fuente subida, solo cambia si la fuente es variable o es de ese grosor.",
          },
        },
      ],
    },
    {
      type: "row",
      fields: PANTALLAS.map(({ sufijo, nombre, ancho }) => ({
        name: `tamano${sufijo}`,
        type: "number" as const,
        label: `Tamaño en ${nombre} (px)`,
        min: 12,
        max: 300,
        admin: {
          width: "33%",
          description: `Pantallas de ${ancho}. Si el título no cabe a lo ancho, se reduce solo.`,
        },
      })),
    },
    {
      type: "row",
      fields: [
        {
          name: "interlineado",
          type: "number",
          label: "Interlineado",
          min: 0.6,
          max: 3,
          admin: {
            width: "33%",
            step: 0.05,
            description: "Alto de cada línea, en veces el tamaño de la letra. Vacío: 1,4.",
          },
        },
        {
          name: "interletrado",
          type: "number",
          label: "Interletrado (%)",
          min: -20,
          max: 100,
          admin: {
            width: "33%",
            step: 1,
            description: "Espacio entre letras, en % del tamaño. Vacío: 0. Negativo las junta.",
          },
        },
        {
          name: "color",
          type: "text",
          label: "Color",
          validate: validarColor,
          admin: {
            width: "33%",
            placeholder: "#FFFFFF",
            components: { Field: "/components/admin/CampoColor" },
            description: "Vacío: blanco.",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "mayusculas",
          type: "select",
          label: "Mayúsculas y minúsculas",
          options: [
            { label: "TODO EN MAYÚSCULAS", value: "mayusculas" },
            { label: "Como está escrito", value: "normal" },
            { label: "todo en minúsculas", value: "minusculas" },
            { label: "Cada Palabra Con Mayúscula", value: "palabras" },
          ],
          admin: { width: "50%", description: "Vacío: todo en mayúsculas." },
        },
        {
          name: "alineacion",
          type: "select",
          label: "Alineación",
          options: [
            { label: "Izquierda", value: "izquierda" },
            { label: "Centro", value: "centro" },
            { label: "Derecha", value: "derecha" },
          ],
          admin: { width: "50%", description: "Vacío: centrado." },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Posición del título",
      admin: {
        initCollapsed: true,
        description:
          "En % de la tarjeta, por tamaño de pantalla: horizontal 0 = izquierda, 100 = derecha; vertical 0 = arriba, 100 = abajo. Vacío: arriba y centrado, como siempre. Si solo pones uno, el otro queda como siempre. La máquina no se mueve.",
      },
      fields: PANTALLAS.map(({ sufijo, nombre }) => ({
        type: "row" as const,
        fields: (["X", "Y"] as const).map((eje) => ({
          name: `posicion${eje}${sufijo}`,
          type: "number" as const,
          label: `${eje === "X" ? "Horizontal" : "Vertical"} en ${nombre} (%)`,
          min: 0,
          max: 100,
          admin: { width: "50%" },
        })),
      })),
    },
    // Aviso en vivo si el color puede leerse mal sobre la foto (no bloquea).
    avisoField("avisoContraste", "AvisoContrasteTitulo"),
  ],
};
