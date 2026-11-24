import type { Field } from "payload";

/**
 * Piezas comunes de la EDICIÓN FÁCIL de las fichas de producto (tanda 21, tarea 3, fase 2): las de
 * usadas (#533) llevadas a nuevas, aditamentos y modelos de repuestos. Ninguna guarda nada: son
 * campos `ui` o componentes de lista y de formulario (sin esquema).
 */

/** Una casilla con interruptor directo en la lista (punto 2). */
export const conInterruptor = <T extends { admin?: Record<string, unknown> }>(c: T): T => ({
  ...c,
  admin: {
    ...c.admin,
    components: {
      ...((c.admin?.components as Record<string, unknown> | undefined) ?? {}),
      Cell: "/components/admin/celdas/CeldaInterruptor",
    },
  },
});

/**
 * Arriba de la ficha, «Así se ve hoy en la web» con la ficha completa (puntos 3 y 9), y en la lista,
 * la columna «Estado» (punto 2). Lo que cuenta en cada colección, en `src/lib/panel/fichaProducto.ts`.
 */
export const camposResumenWeb = (): Field[] => [
  {
    name: "resumenWeb",
    type: "ui",
    admin: {
      components: { Field: "/components/admin/ResumenWeb" },
      disableListColumn: true,
    },
  },
  {
    name: "estadoWeb",
    type: "ui",
    label: "Estado",
    admin: {
      components: {
        Field: "/components/admin/Nada",
        Cell: "/components/admin/celdas/CeldaEstadoFicha",
      },
    },
  },
];

/** Celda de lista con la miniatura y el nombre juntos, que abren la ficha (punto 1). */
export const CELDA_NOMBRE_FICHA = "/components/admin/celdas/CeldaNombreFicha";

/** Campo de texto con sugerencias de otras fichas con el mismo `filtro` (punto 7). */
export const campoConSugerencias = (filtro: string, titulo: string) => ({
  path: "/components/admin/CampoConSugerencias",
  clientProps: { filtro, titulo },
});
