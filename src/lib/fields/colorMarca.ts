import type { Field } from "payload";

import { validarColor } from "./tipografiaTitulo";

/**
 * Campo «Color de la marca» (selector de color de `CampoColor`), común a las marcas de
 * repuestos y a las de maquinaria nueva. Vacío: la franja es amarilla como siempre.
 */
export const campoColorMarca: Field = {
  name: "colorMarca",
  type: "text",
  label: "Color de la marca",
  validate: validarColor,
  admin: {
    placeholder: "#FFCD00",
    components: { Field: "/components/admin/CampoColor" },
    description:
      "Color de la franja de las páginas de esta marca (y de sus tipos). Vacío: amarillo. El texto de la franja se pone solo en blanco o negro, el que mejor se lea.",
  },
};
