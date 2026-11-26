import type { TextField } from "payload";

import { AYUDA_ENLACE_TIENDA, validarEnlaceTienda } from "./enlaceTienda";

/** El campo «Enlace en la tienda» de un elemento de repuestos (2026-11-26). */
export function campoEnlaceTienda(que: string): TextField {
  return {
    name: "enlaceTienda",
    type: "text",
    label: "Enlace en la tienda",
    validate: validarEnlaceTienda,
    admin: {
      placeholder: "https://… página de este producto en la tienda",
      description: AYUDA_ENLACE_TIENDA(que),
    },
  };
}
