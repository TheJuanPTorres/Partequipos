/**
 * La DECISIÓN de si se puede vaciar `solicitudes` contra una base, separada del
 * script que borra (`npm run db:vaciar-solicitudes-preview`).
 *
 * POR QUÉ EXISTE. Tras cada refresco de la rama `preview` de Neon desde
 * `production` (CLAUDE.md §10.21) se vacía `solicitudes` en `preview`: es la
 * única colección con datos personales de terceros (nombre, correo y teléfono),
 * y clonarla a otro entorno es copiarlos sin necesidad (Ley 1581 de 2012).
 *
 * El modo de fallo que hay que hacer imposible es el contrario: **borrar los
 * leads de PRODUCCIÓN** por tener la variable apuntando a otra rama. Por eso es
 * una LISTA DE PERMITIDOS con un solo host —el del preview—, no una lista de
 * prohibidos: un host nuevo o desconocido también se rechaza.
 */

/** Endpoint de la rama `preview` de Neon (CLAUDE.md §10.21). No es secreto. */
export const HOST_PREVIEW = "ep-withered-cell-awv8x9ki-pooler.c-12.us-east-1.aws.neon.tech";

export type VeredictoVaciado = { permitido: true } | { permitido: false; motivo: string };

/** Host de una cadena de conexión de Postgres, sin credenciales. */
export function hostDeConexion(conexion: string): string | null {
  try {
    return new URL(conexion).hostname || null;
  } catch {
    return null;
  }
}

export function puedeVaciarSolicitudes(conexion: string | undefined): VeredictoVaciado {
  if (!conexion?.trim()) {
    return {
      permitido: false,
      motivo: "falta DATABASE_URI",
    };
  }
  const host = hostDeConexion(conexion.trim());
  if (!host) return { permitido: false, motivo: "DATABASE_URI no es una URL válida" };
  if (host !== HOST_PREVIEW) {
    return {
      permitido: false,
      motivo: `el host «${host}» no es el de la rama preview; solo se vacía ${HOST_PREVIEW}`,
    };
  }
  return { permitido: true };
}
