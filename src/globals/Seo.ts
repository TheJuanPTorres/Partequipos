import type { GlobalConfig } from "payload";

import { validarTelefono, validarUrlRed } from "../lib/seo/empresa";
import { DIAS, NOMBRE_DIA, validarHora } from "../lib/seo/horario";
import { revalidarTodoElSitio } from "../lib/revalidation";
import { escrituraContenido, publico } from "../lib/seguridad/acceso";
import { avisoField } from "../lib/fields/avisoField";

/**
 * SEO Y DATOS DE LA EMPRESA, editable (fase 6).
 *
 * Hoy solo lleva el HORARIO DE ATENCIÓN, que antes estaba escrito a mano en
 * `seoConfig` (texto libre) y solo lo pintaba el bloque de la home anterior a
 * ux-9. Va en el JSON-LD `Organization` (`contactPoint.hoursAvailable`, como
 * `OpeningHoursSpecification`) y en /contactanos/.
 *
 * CONTACTO DE LA EMPRESA (2026-10-04): teléfono, WhatsApp, correo, dirección y
 * redes, que antes solo estaban en `src/lib/seo/config.ts`. Ese fichero queda
 * como RESPALDO campo a campo (`src/lib/seo/empresa.ts`); la migración siembra
 * aquí sus mismos valores. La razón social y el NIT siguen en `config.ts`,
 * pendientes del cliente (CLAUDE.md §10.3).
 *
 * IMAGEN AL COMPARTIR POR DEFECTO (2026-10-04): opaca, 1200 × 630, en
 * «Imágenes». Vacía, la imagen social es el logo; y si este también está
 * vacío, la de `config.ts`. El JSON-LD sigue con el logo.
 *
 * LOGO (2026-10-04, §10.8): campo «Logo» en «Imágenes». Vacío, cada sitio usa
 * el de siempre (`src/lib/seo/logo.ts`); la migración solo crea la columna.
 *
 * IMAGEN DE LA PANTALLA DE ACCESO (2026-10-05): panel visual de `/admin/login`
 * (`getImagenAcceso`). Vacía, un degradado. Sustituye a la búsqueda por el
 * nombre de fichero del PR #89; la migración solo crea la columna.
 *
 * Al guardar se revalida todo el sitio: el JSON-LD va en varias páginas.
 */
export const Seo: GlobalConfig = {
  slug: "seo",
  label: "SEO y datos de la empresa",
  admin: {
    group: "Configuración",
    description:
      "Datos de la empresa que usan los buscadores y el sitio: el horario de atención, el logo y el contacto.",
  },
  access: { read: publico, update: escrituraContenido },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidarTodoElSitio("seo");
        return doc;
      },
    ],
  },
  fields: [
    // «El sitio está cerrado a buscadores» mientras dure §10.6 (F4).
    avisoField("avisoBuscadores", "AvisoBuscadores"),
    {
      name: "horario",
      type: "array",
      label: "Horario de atención",
      labels: { singular: "Tramo", plural: "Tramos" },
      admin: {
        description:
          "Un tramo por grupo de días con el mismo horario. Ejemplo: lunes a viernes de 08:00 a 17:30.",
      },
      fields: [
        {
          name: "dias",
          type: "select",
          hasMany: true,
          required: true,
          label: "Días",
          options: DIAS.map((d) => ({
            label: NOMBRE_DIA[d].charAt(0).toUpperCase() + NOMBRE_DIA[d].slice(1),
            value: d,
          })),
        },
        {
          type: "row",
          fields: [
            {
              name: "abre",
              type: "text",
              required: true,
              label: "Abre",
              validate: validarHora,
              admin: { width: "50%", placeholder: "08:00" },
            },
            {
              name: "cierra",
              type: "text",
              required: true,
              label: "Cierra",
              validate: validarHora,
              admin: { width: "50%", placeholder: "17:30" },
            },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Imágenes",
      admin: { initCollapsed: false },
      fields: [
        {
          name: "logo",
          type: "upload",
          relationTo: "media",
          label: "Logo",
          admin: {
            description:
              "Sale en la cabecera, el pie y la información que leen los buscadores (y al compartir en redes, si no hay imagen al compartir por defecto). Usa un PNG con fondo transparente y letras oscuras, de al menos 520 px de ancho. Si lo dejas vacío, se usa el logo de siempre.",
          },
        },
        {
          name: "imagenSocial",
          type: "upload",
          relationTo: "media",
          label: "Imagen al compartir por defecto",
          admin: {
            description:
              "La que sale al compartir en redes (WhatsApp, Facebook, LinkedIn…) las páginas que no tienen imagen propia. Usa una imagen opaca, sin transparencia, de 1200 × 630 px. Si la dejas vacía, se usa el logo.",
          },
        },
        {
          /*
           * Panel visual de la pantalla de acceso al panel (`/admin/login`,
           * decisiones-panel.md §18). Vacía, un degradado rojo hacia negro.
           * Solo se ve en escritorio.
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
    },
    {
      name: "empresa",
      type: "group",
      label: "Contacto de la empresa",
      admin: {
        description:
          "Sale en el pie, la cabecera, el botón de WhatsApp y la información que leen los buscadores. Si dejas un campo vacío, se usa el dato de siempre.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "telefono",
              type: "text",
              label: "Teléfono",
              validate: validarTelefono,
              admin: { width: "50%", placeholder: "+57 317 670 7071" },
            },
            {
              name: "whatsapp",
              type: "text",
              label: "WhatsApp",
              validate: validarTelefono,
              admin: {
                width: "50%",
                placeholder: "+57 317 670 7071",
                description: "Si lo dejas vacío, se usa el teléfono.",
              },
            },
          ],
        },
        { name: "correo", type: "email", label: "Correo de contacto" },
        {
          type: "row",
          fields: [
            {
              name: "direccion",
              type: "text",
              label: "Dirección",
              admin: { width: "60%", placeholder: "Carrera 68D # 17A-84" },
            },
            {
              name: "ciudad",
              type: "text",
              label: "Ciudad",
              admin: { width: "40%", placeholder: "Bogotá D.C." },
            },
          ],
        },
        {
          name: "redes",
          type: "array",
          label: "Redes sociales",
          labels: { singular: "Red", plural: "Redes" },
          admin: {
            description:
              "La dirección completa de cada perfil oficial. En el pie salen LinkedIn, X, Facebook, Instagram, TikTok y YouTube, en el orden en que estén aquí; las demás solo las leen los buscadores.",
          },
          fields: [
            {
              name: "url",
              type: "text",
              required: true,
              label: "Dirección",
              validate: validarUrlRed,
            },
          ],
        },
      ],
    },
  ],
};
