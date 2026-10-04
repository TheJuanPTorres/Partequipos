import { seoConfig } from "./config";

/**
 * Datos de contacto de la empresa, listos para el sitio.
 *
 * Salen del grupo «Contacto de la empresa» del global `seo` (editable en el
 * panel). Campo a campo, si está vacío se usa el valor de `seoConfig.contact`
 * y `seoConfig.sameAs` (`src/lib/seo/config.ts`), que se queda como RESPALDO:
 * así un global sin rellenar —o una base sin la migración— no deja el pie, la
 * cabecera ni el JSON-LD sin teléfono. La migración siembra en el global los
 * mismos valores que tiene hoy el respaldo, de modo que el sitio no cambia.
 *
 * Función pura: el acceso a la base está en `src/lib/queries/getSeo.ts`.
 */

export type Empresa = {
  /** Teléfono publicado, tal cual se escribe: «+57 317 670 7071». */
  telefono: string;
  /** Número de WhatsApp. Si se deja vacío, el teléfono. */
  whatsapp: string;
  correo: string;
  /** Calle y número. */
  direccion: string;
  /** Ciudad (o ciudad y departamento). */
  ciudad: string;
  /** Perfiles oficiales: alimentan el pie y `sameAs` del JSON-LD. */
  redes: string[];
};

/** Lo que llega del global: todo opcional y nullable, como lo da Payload. */
export type EmpresaGlobal =
  | {
      telefono?: string | null;
      whatsapp?: string | null;
      correo?: string | null;
      direccion?: string | null;
      ciudad?: string | null;
      redes?: { url?: string | null }[] | null;
    }
  | null
  | undefined;

const lleno = (valor: string | null | undefined): string | null => {
  const limpio = (valor ?? "").trim();
  return limpio ? limpio : null;
};

export function datosEmpresa(global: EmpresaGlobal): Empresa {
  const respaldo = seoConfig.contact;
  const telefono = lleno(global?.telefono) ?? respaldo.phone;
  const redes = (global?.redes ?? []).flatMap((r) => {
    const url = lleno(r.url);
    return url ? [url] : [];
  });
  return {
    telefono,
    whatsapp: lleno(global?.whatsapp) ?? telefono,
    correo: lleno(global?.correo) ?? respaldo.email,
    direccion: lleno(global?.direccion) ?? respaldo.streetAddress,
    ciudad: lleno(global?.ciudad) ?? respaldo.addressLocality,
    redes: redes.length > 0 ? redes : [...seoConfig.sameAs],
  };
}

/** Validación del panel: un número con al menos 10 cifras, o vacío. */
export function validarTelefono(valor: unknown): true | string {
  if (valor === null || valor === undefined || valor === "") return true;
  if (typeof valor !== "string") return "Tiene que ser texto.";
  return valor.replace(/\D/g, "").length >= 10
    ? true
    : "Escribe el número completo, con indicativo: p. ej. +57 317 670 7071.";
}

/** Validación del panel: una dirección https:// completa. */
export function validarUrlRed(valor: unknown): true | string {
  if (typeof valor !== "string" || !valor.trim()) return "Escribe la dirección del perfil.";
  try {
    const url = new URL(valor.trim());
    return url.protocol === "https:"
      ? true
      : "Tiene que empezar por https://, p. ej. https://www.instagram.com/partequipos_sas/.";
  } catch {
    return "No es una dirección válida. Cópiala entera desde el navegador, con https://.";
  }
}
