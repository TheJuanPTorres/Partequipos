import type { Field } from "payload";

const CELDA_FECHA = "/components/admin/celdas/CeldaFecha";

/*
 * Las fechas automáticas de Payload (`updatedAt`, `createdAt`), declaradas
 * IGUAL que las añade Payload 3.89 (`collections/config/sanitize.js`: `date`,
 * indexadas, ocultas en el formulario y sin edición en lote) y con una sola
 * diferencia: la celda de fecha relativa de la lista (F3, decisiones-panel.md
 * §24). Al estar declaradas, Payload no añade las suyas. Mismo esquema: lo
 * comprueba el guardarraíl de deriva.
 */
export const fechaActualizado: Field = {
  name: "updatedAt",
  type: "date",
  index: true,
  label: ({ t }) => t("general:updatedAt"),
  admin: { disableBulkEdit: true, hidden: true, components: { Cell: CELDA_FECHA } },
};

export const fechaCreado: Field = {
  name: "createdAt",
  type: "date",
  index: true,
  label: ({ t }) => t("general:createdAt"),
  admin: { disableBulkEdit: true, hidden: true, components: { Cell: CELDA_FECHA } },
};
