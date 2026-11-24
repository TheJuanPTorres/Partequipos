/**
 * Los nombres de los dos campos ocultos contra el spam (`antiSpam.ts`), en un módulo SIN imports
 * de Node. El formulario es un componente de cliente: si tomara estas constantes de `antiSpam.ts`,
 * que importa `node:crypto` para el límite por IP, el empaquetador metería en el navegador el
 * sustituto de `crypto` (unos 424 kB de JavaScript en cada página con formulario, medido en el
 * sitio publicado el 2026-11-23), que además dispara un aviso de `eval` en la CSP. Lo vigila
 * `clienteSinZod.test.ts`.
 */

/** Campo trampa: una persona no lo ve y un robot lo rellena. */
export const CAMPO_TRAMPA = "sitio_web";
/** La hora a la que se mostró el formulario. */
export const CAMPO_TIEMPO = "tiempo_inicio";
