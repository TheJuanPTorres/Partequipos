import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * CIFRADO DE LA CONTRASEÑA DEL SMTP DEL PANEL (2026-10-27, Juan Pablo: que la cliente ponga sus
 * datos sin pasárselos a nadie). AES-256-GCM: cifra y autentica, así que una contraseña alterada
 * o cifrada con otra clave no se descifra (falla, no da basura).
 *
 * La CLAVE vive solo en una variable de entorno, `SMTP_CLAVE_CIFRADO`: 32 bytes en base64
 * (`openssl rand -base64 32`). En el sitio publicado es OBLIGATORIA. Fuera de él (previews y
 * local), si falta, se deriva de `PAYLOAD_SECRET`, que cada entorno tiene propio: así se puede
 * probar sin otra variable, y una base del preview clonada de la publicada no descifra la
 * contraseña de producción (otra clave), sino que vuelve a las variables de Vercel.
 *
 * Formato guardado: `v1:<iv>:<etiqueta>:<cifrado>`, cada parte en base64.
 */

type Entorno = Record<string, string | undefined>;

export const VARIABLE_CLAVE = "SMTP_CLAVE_CIFRADO";

export type Clave = { clave: Buffer } | { clave: null; motivo: string };

/** La clave en vigor, o por qué no hay ninguna (solo NOMBRES de variables, nunca valores). */
export function claveDeCifrado(env: Entorno = process.env): Clave {
  const propia = env[VARIABLE_CLAVE]?.trim() ?? "";
  if (propia) {
    const clave = Buffer.from(propia, "base64");
    if (clave.length !== 32) {
      return { clave: null, motivo: `${VARIABLE_CLAVE} no son 32 bytes en base64` };
    }
    return { clave };
  }
  if (env.VERCEL_ENV === "production") {
    return { clave: null, motivo: `falta ${VARIABLE_CLAVE}` };
  }
  const secreto = env.PAYLOAD_SECRET?.trim() ?? "";
  if (!secreto) return { clave: null, motivo: `faltan ${VARIABLE_CLAVE} y PAYLOAD_SECRET` };
  return {
    clave: Buffer.from(hkdfSync("sha256", secreto, "partequipos", "smtp-panel-v1", 32)),
  };
}

/** Cifra un texto con la clave (un IV nuevo cada vez: el mismo texto da otro resultado). */
export function cifrar(texto: string, clave: Buffer): string {
  const iv = randomBytes(12);
  const cifrador = createCipheriv("aes-256-gcm", clave, iv);
  const cifrado = Buffer.concat([cifrador.update(texto, "utf8"), cifrador.final()]);
  const etiqueta = cifrador.getAuthTag();
  return ["v1", iv, etiqueta, cifrado]
    .map((p) => (typeof p === "string" ? p : p.toString("base64")))
    .join(":");
}

/** Descifra lo que dio `cifrar`. `null` si el formato no es el suyo, la clave no es o está alterado. */
export function descifrar(guardado: string, clave: Buffer): string | null {
  const [version, iv, etiqueta, cifrado] = guardado.split(":");
  if (version !== "v1" || !iv || !etiqueta || cifrado === undefined) return null;
  try {
    const descifrador = createDecipheriv("aes-256-gcm", clave, Buffer.from(iv, "base64"));
    descifrador.setAuthTag(Buffer.from(etiqueta, "base64"));
    return Buffer.concat([
      descifrador.update(Buffer.from(cifrado, "base64")),
      descifrador.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
