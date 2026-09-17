import {
  IconArticle,
  IconBulldozer,
  IconDroplet,
  IconInbox,
  IconSettings,
  IconTool,
  type Icon,
} from "@tabler/icons-react";

/**
 * Iconos de los grupos del menú, del sistema de diseño del cliente
 * (`@tabler/icons-react`, ver docs/design-tokens.md). La regla del sistema es
 * **no mezclar familias**, así que el chevron de los grupos y el botón de salir
 * también son de Tabler, no los de Payload.
 *
 * Los iconos van SOLO en los grupos (primer nivel). Las entradas no llevan: son
 * 19 y un icono por cada una obligaría a inventar metáforas para «Categorías de
 * usada» frente a «Categorías de maquinaria nueva», que es ruido, no ayuda.
 *
 * La clave es el NOMBRE del grupo, que es el `admin.group` de las colecciones.
 * `src/collections/grupos.test.ts` comprueba que todo grupo aprobado tiene su
 * icono aquí: si alguien renombra un grupo, CI lo para en vez de dejar una
 * entrada sin icono.
 */
export const ICONOS_DE_GRUPO: Record<string, Icon> = {
  Comercial: IconInbox,
  Repuestos: IconTool,
  Maquinaria: IconBulldozer,
  Lubricantes: IconDroplet,
  Contenido: IconArticle,
  Configuración: IconSettings,
};

/** Tamaño del icono: `size-4` del sistema, en px porque la raíz del panel mide 13. */
export const TAMANO_ICONO = 16;
