import type { CollectionConfig } from "payload";
import { validarAlt } from "../lib/media/altFlojo";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";
import { formatoDeImagenPermitido } from "./hooks/formatoDeImagenPermitido";
import { almacenEsperado } from "./hooks/almacenEsperado";
import { sinDescargaRemota } from "./hooks/sinDescargaRemota";
import { sinRecorte } from "./hooks/sinRecorte";
import { fechaActualizado } from "../lib/fields/fechasDeLista";
import { urlMiniatura } from "../lib/panel/miniatura";

/**
 * Archivos subidos (imágenes, logos, etc.).
 * El almacenamiento NO es en disco local: lo gestiona el plugin de Vercel Blob
 * configurado en payload.config.ts (Vercel tiene FS de solo lectura en producción).
 */
export const Media: CollectionConfig = {
  slug: "media",
  // Solo admite imágenes (ver `mimeTypes`): «Media» a secas no le dice nada al editor.
  labels: { singular: "Imagen", plural: "Imágenes" },
  admin: {
    group: "Archivos",
    description:
      "Fotos y logos del sitio, en JPEG, PNG o WebP, de hasta 15 MB (suben directo al almacén). El texto alternativo describe la imagen a quien no la ve.",
    // El texto alternativo en la lista, para ver de un vistazo cuáles están flojos.
    defaultColumns: ["filename", "alt", "updatedAt"],
    listSearchableFields: ["filename", "alt"],
    // Aviso con las imágenes de texto alternativo flojo (`src/lib/media/altFlojo.ts`).
    // Entre el buscador y la tabla: `beforeList` lo pintaba fuera del margen.
    components: { beforeListTable: ["/components/admin/AltFlojos"] },
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  /*
   * FORMATOS PERMITIDOS — mitigación del CVE GHSA-2xp9-vwfh-vxw4 (CLAUDE.md
   * §10.28). El fallo está en `libheif`, dentro de `sharp`, al DECODIFICAR
   * ficheros AVIF, y `payload.config.ts` pasa `sharp` a `buildConfig`: sin esta
   * lista, un editor autenticado podía subir un `.avif` manipulado y nuestro
   * propio lambda lo decodificaba.
   *
   * La lista es también la de formatos que el sitio sirve de verdad. Payload la
   * usa en las dos direcciones: filtra el selector de ficheros del panel y
   * valida en el servidor, así que no depende del navegador.
   *
   * SVG queda fuera a propósito: es ejecutable (puede llevar script) y
   * `next.config.ts` no lo permite en el optimizador (`dangerouslyAllowSVG`
   * sigue en false).
   */
  upload: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    /*
     * «Pegar URL» CERRADO A PROPÓSITO (CLAUDE.md §10.32). Con el valor por
     * defecto el panel descarga la url desde el navegador y el endpoint del
     * servidor ya estaba desactivado; `false` quita además el botón. Nadie lo
     * usa: se sube desde el equipo.
     */
    pasteURL: false,
    /*
     * MINIATURA PEQUEÑA EN EL PANEL (F3, decisiones-panel.md §24): la lista y
     * los campos de imagen usaban el ORIGINAL (hasta 15 MB) como miniatura. Pasa
     * por el optimizador de Next a 128 px. No toca el esquema: `thumbnailURL`
     * se calcula al leer.
     */
    adminThumbnail: ({ doc }) => urlMiniatura(typeof doc.url === "string" ? doc.url : null),
    /*
     * RECORTE DESACTIVADO (CLAUDE.md §10.32): sobrescribía el fichero con el
     * mismo nombre y la caché de un año seguía sirviendo el original con las
     * medidas del recorte. `crop: false` quita el botón; el gancho `sinRecorte`
     * lo cierra en el servidor, que no mira esta opción.
     */
    crop: false,
    /*
     * PUNTO FOCAL ACTIVADO EXPLÍCITAMENTE (fase C). Sin `true` el panel no
     * muestra el selector, porque `Media` no tiene tamaños derivados. Se aplica
     * como `object-position` en las imágenes con `object-cover` (hero, blog):
     * decide qué parte de la foto se ve cuando la caja la recorta.
     */
    focalPoint: true,
  },
  /*
   * El mensaje de rechazo de Payload está cableado en inglés; este hook se
   * adelanta para decirlo en español. Ver el fichero del hook.
   */
  hooks: {
    // Primero el cierre de la descarga remota: esa vía no trae `req.file`, así
    // que el gancho de formato no la vería (§10.32).
    beforeOperation: [almacenEsperado, sinDescargaRemota, sinRecorte, formatoDeImagenPermitido],
  },
  fields: [
    // «Última modificación» como fecha relativa en la lista (F3).
    fechaActualizado,
    {
      name: "alt",
      type: "text",
      required: true,
      label: "Texto alternativo",
      // Rechaza los flojos («foto1», el nombre del fichero, menos de 5 letras).
      // Solo al guardar: las imágenes que ya lo tienen flojo salen en el aviso
      // de la lista y se arreglan al abrirlas.
      validate: validarAlt,
      admin: {
        description:
          "Describe lo que se ve, como se lo contarías a alguien por teléfono: «Excavadora Hitachi ZX200 trabajando en una obra». Ni «foto1», ni «imagen», ni el nombre del fichero.",
      },
    },
  ],
};
