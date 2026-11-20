import type { GlobalConfig } from "payload";

import { soloAdmin } from "../lib/seguridad/acceso";

/**
 * APARIENCIA DEL PANEL (2026-11-19, organización del panel, plan §7.4): lo que se ve en el panel y
 * no en la web. Solo el Administrador lo ve y lo edita.
 *
 * - **Imagen de la pantalla de acceso** (`imagenAcceso`): antes estaba en el global `seo`
 *   («Imágenes»), que es de la web. La migración `…_apariencia_panel` COPIA la imagen elegida allí,
 *   así nadie la pierde. El campo viejo de `seo` queda oculto y sin uso hasta borrarlo con su
 *   migración.
 *
 * La pantalla de acceso lo lee con la API local en cada visita (`getImagenAcceso`), sin caché:
 * guardar aquí se ve en la siguiente carga, sin revalidar nada.
 */
export const AparienciaPanel: GlobalConfig = {
  slug: "apariencia-panel",
  label: "Apariencia del panel",
  admin: {
    group: "Configuración",
    description:
      "Lo que se ve en el panel, no en la web. Hoy, la imagen de la pantalla para entrar al panel.",
  },
  access: { read: soloAdmin, update: soloAdmin },
  fields: [
    {
      /*
       * Panel visual de la pantalla de acceso al panel (`/admin/login`, decisiones-panel.md §18).
       * Vacía, un degradado rojo hacia negro. Solo se ve en escritorio.
       */
      name: "imagenAcceso",
      type: "upload",
      relationTo: "media",
      label: "Imagen de la pantalla de acceso",
      admin: {
        description:
          "La que sale a la izquierda de la pantalla para entrar al panel, solo en computador. Mejor una imagen cuadrada o vertical y oscura, porque lleva texto blanco encima. Si la dejas vacía, sale un fondo rojo degradado.",
      },
    },
  ],
};
