/**
 * MODO ADMINISTRACIÓN SOBRE LA WEB (tanda 23, la barra «Editar» de A en el sitio): el formato del
 * enlace que abre una ficha del panel en la pestaña y el campo exactos, y su lectura en el panel
 * (`IrAlCampo`). Función pura, con pruebas; la usan la web (A) y el panel (C).
 *
 *   /admin/collections/<colección>/<id>?pestana=<pestaña>&campo=<ruta del campo>
 *   /admin/globals/<global>?pestana=<pestaña>&campo=<ruta del campo>
 *
 * SEGURIDAD (dirección, 2026-11-24): `pestana` y `campo` llegan por la URL. Solo se aceptan:
 * - `pestana`: una de las claves de `PESTANAS` (lista cerrada);
 * - `campo`: letras, números, puntos y guiones, hasta 80 caracteres (`imagenes.0.alt`).
 * Cualquier otra cosa se ignora, y el panel no hace nada con ella: nunca va a `innerHTML` ni a un
 * selector sin escapar.
 */

/** Las pestañas de las fichas (`conPestanas`): la clave de la URL y la etiqueta que pinta Payload. */
export const PESTANAS = {
  contenido: "Contenido",
  fotos: "Fotos",
  buscadores: "Buscadores y redes",
  avanzado: "Avanzado",
} as const;

export type ClavePestana = keyof typeof PESTANAS;

const PATRON_CAMPO = /^[A-Za-z0-9.-]{1,80}$/;
const PATRON_SLUG = /^[a-z0-9-]{1,60}$/;

export function esPestanaValida(v: unknown): v is ClavePestana {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(PESTANAS, v);
}

/** Una ruta de campo segura: sin espacios, comillas, `<`, `#`, `/` ni nada que no sea letra, número, punto o guion. */
export function esCampoValido(v: unknown): v is string {
  return (
    typeof v === "string" &&
    PATRON_CAMPO.test(v) &&
    !v.startsWith(".") &&
    !v.endsWith(".") &&
    !v.includes("..")
  );
}

export type DestinoEditar =
  | { coleccion: string; id: number | string; pestana?: ClavePestana; campo?: string }
  | { global: string; pestana?: ClavePestana; campo?: string };

/**
 * El enlace «Editar» al panel, o `null` si algún dato no es válido (mejor sin enlace que uno roto
 * o peligroso). `pestana` y `campo` que no casan se omiten.
 */
export function enlaceEditar(destino: DestinoEditar, admin = "/admin"): string | null {
  let ruta: string;
  if ("global" in destino) {
    if (!PATRON_SLUG.test(destino.global)) return null;
    ruta = `${admin}/globals/${destino.global}`;
  } else {
    if (!PATRON_SLUG.test(destino.coleccion)) return null;
    const id = String(destino.id);
    if (!/^[1-9][0-9]{0,15}$/.test(id)) return null;
    ruta = `${admin}/collections/${destino.coleccion}/${id}`;
  }
  const p = new URLSearchParams();
  if (esPestanaValida(destino.pestana)) p.set("pestana", destino.pestana);
  if (esCampoValido(destino.campo)) p.set("campo", destino.campo);
  const q = p.toString();
  return q ? `${ruta}?${q}` : ruta;
}

/**
 * Lo que pide la URL del panel (`location.search`): la etiqueta de la pestaña y la ruta del campo,
 * solo si son válidas; lo demás, `null`.
 */
export function destinoDeUrl(search: string): { pestana: string | null; campo: string | null } {
  const p = new URLSearchParams(search);
  const pestana = p.get("pestana");
  const campo = p.get("campo");
  return {
    pestana: esPestanaValida(pestana) ? PESTANAS[pestana] : null,
    campo: esCampoValido(campo) ? campo : null,
  };
}

/** El id que Payload da al campo en el formulario: `field-` y la ruta con `__` en vez de puntos. */
export function idDeCampo(campo: string): string {
  return `field-${campo.replace(/\./g, "__")}`;
}
