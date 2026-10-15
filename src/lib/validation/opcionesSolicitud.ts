/**
 * Opciones y límites de los formularios públicos, SIN Zod.
 *
 * Viven aparte del esquema (`solicitud.ts`) porque los usa el formulario, que
 * es componente de cliente: importarlos desde el esquema metía Zod entero en
 * el navegador (98 KiB comprimidos, 406 KB de JavaScript), porque el esquema se
 * construye con `z.object` al cargar el módulo y el empaquetador no puede
 * quitarlo. Medido en el sitio publicado el 2026-10-14
 * (`clienteSinZod.test.ts` lo vigila).
 */

/** Tipos de solicitud; deben coincidir con el `select` de la colección. */
export const TIPOS_SOLICITUD = ["contacto", "cotizacion", "repuesto"] as const;
export type TipoSolicitud = (typeof TIPOS_SOLICITUD)[number];

/**
 * Clasificación opcional del formulario de la página de marca de repuestos.
 * Valores y etiquetas, en el orden del diseño; deben coincidir con los
 * `select` `interes` y `perfil` de la colección `solicitudes`.
 */
export const INTERESES = [
  { valor: "cotizar", etiqueta: "Cotizar productos" },
  { valor: "muestras", etiqueta: "Muestras/prototipos" },
  { valor: "asesoria", etiqueta: "Asesoría general" },
  { valor: "otro", etiqueta: "Otro" },
] as const;
export const PERFILES = [
  { valor: "empresa", etiqueta: "Empresa" },
  { valor: "comprador", etiqueta: "Comprador" },
  { valor: "emprendedor", etiqueta: "Emprendedor" },
  { valor: "proveedor", etiqueta: "Proveedor" },
  { valor: "empleado", etiqueta: "Empleado" },
  { valor: "otro", etiqueta: "Otro" },
] as const;

/** Longitudes máximas. Cortan el abuso antes de llegar a la base. */
export const MAX = { nombre: 120, correo: 200, telefono: 40, empresa: 160, mensaje: 4000 } as const;

/** Errores por campo, en la forma que consume el formulario. */
export type ErroresCampo = Partial<Record<string, string>>;
