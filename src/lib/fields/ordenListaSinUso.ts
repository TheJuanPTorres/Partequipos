import type { Field } from "payload";

/**
 * EL ARRASTRE SIN EFECTO DE LA LISTA, OCULTO SIN MIGRACIÓN (tanda 21, 2026-11-23; Juan Pablo).
 *
 * El #534 hizo `orderable` las colecciones «Equipos nuevos» y «Tipos de maquinaria nueva», pero
 * desde el #326 la web no pinta ningún listado que use ese orden (lo que se ve sigue el arrastre de
 * la ficha de la marca y del tipo). Para que el cliente no arrastre en balde, se quita `orderable`
 * y se declara a mano el MISMO campo que añadía Payload 3.89 (`config/orderable/index.js`: texto,
 * con índice y oculto), así el esquema no cambia y no hace falta migración. La columna `_order` se
 * borra en la limpieza del PR 11, con su copia.
 */
export function ordenListaSinUso(): Field {
  return {
    name: "_order",
    type: "text",
    index: true,
    admin: {
      disableBulkEdit: true,
      disabled: true,
      disableGroupBy: true,
      disableListColumn: true,
      disableListFilter: true,
      hidden: true,
      readOnly: true,
    },
  };
}
