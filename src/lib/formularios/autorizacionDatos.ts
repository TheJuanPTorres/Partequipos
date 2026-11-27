/**
 * AUTORIZACIÓN DEL TRATAMIENTO DE DATOS (Ley 1581 de 2012; 2026-11-27, Juan Pablo): la casilla
 * obligatoria, SIN marcar de entrada, de TODOS los formularios que piden datos personales
 * (solicitudes de contacto, cotización, repuestos, lubricantes, «Avísame» y las hojas de vida).
 * SIN Zod ni Node: la importan los componentes de cliente (`clienteSinZod.test.ts`) y el servidor.
 */

/** La política con la que se autoriza el tratamiento de los datos. Se abre en otra pestaña. */
export const RUTA_POLITICA_DATOS = "/tratamiento-de-datos/";

/** El nombre del campo de la casilla en el formulario (`on` cuando está marcada). */
export const CAMPO_AUTORIZACION = "autorizacion";

/** El texto que acepta la persona (lo que se guarda con la solicitud como prueba). */
export const TEXTO_AUTORIZACION =
  "Autorizo el tratamiento de mis datos personales según la política de tratamiento de datos.";

/** Los fragmentos del texto visible, con el enlace a la política en medio. */
export const PARTES_AUTORIZACION = {
  antes: "Autorizo el tratamiento de mis datos personales según la ",
  enlace: "política de tratamiento de datos",
  despues: ".",
} as const;

/** Lo que se dice si se intenta enviar el formulario de una solicitud sin autorizar. */
export const MENSAJE_AUTORIZACION =
  "Para enviar tu solicitud tienes que autorizar el tratamiento de tus datos personales.";
