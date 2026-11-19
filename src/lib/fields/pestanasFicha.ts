import type { Field, Tab } from "payload";

import { ayudaDeFoto, type UsoDeFoto } from "../panel/fotoPequena";

/**
 * FICHAS CON PESTAÑAS (organización del panel, fase 2, 2026-11-18; ficha tipo aprobada por
 * dirección en el informe `2026-11-18-panel-organizacion-fase1.md` §4):
 *
 *   Contenido · Fotos · Buscadores y redes · Avanzado
 *
 * Reparte los campos de una colección SIN TOCAR EL ESQUEMA: las pestañas no tienen nombre, así que
 * Payload no anida sus datos (las columnas, las rutas de los campos y los ganchos son los mismos;
 * lo comprueba `db:deriva` en CI). Reglas, en este orden:
 *
 * - los avisos (`ui`) del principio se quedan ARRIBA, encima de las pestañas;
 * - lo de la barra lateral se queda en la BARRA LATERAL (Payload solo la pinta en el primer nivel),
 *   salvo lo que se pida para «Avanzado»;
 * - `seo` va a «Buscadores y redes»;
 * - los de `fotos` van a «Fotos», con el tamaño recomendado en su ayuda, y encima de todos un
 *   aviso en vivo si alguna foto elegida es pequeña (`AvisoFotoPequena`);
 * - los de `avanzado` y los OCULTOS van a «Avanzado», que solo ve un administrador;
 * - el resto, a «Contenido», en su orden.
 *
 * Una pestaña sin ningún campo visible no se pinta (sus campos ocultos siguen, en el primer nivel).
 */
export type PlanDePestanas = {
  /** Campos de foto y el uso que fija su tamaño recomendado. */
  fotos?: Record<string, UsoDeFoto>;
  /** Campos que solo toca un administrador (interruptores de diseño, campos técnicos). */
  avanzado?: string[];
};

const nombreDe = (c: Field): string | undefined => ("name" in c ? c.name : undefined);
const oculto = (c: Field) =>
  "admin" in c && (c.admin as { hidden?: unknown } | undefined)?.hidden === true;
const enBarraLateral = (c: Field) =>
  "admin" in c && (c.admin as { position?: unknown } | undefined)?.position === "sidebar";

/** ¿Lo ve alguien? Un contenedor sin nombre, solo si alguno de sus campos se ve. */
function visible(c: Field): boolean {
  if (oculto(c)) return false;
  if (!nombreDe(c) && "fields" in c && Array.isArray(c.fields)) return c.fields.some(visible);
  return true;
}

/** Quita `position: "sidebar"`: dentro de una pestaña no significa nada. */
function sinBarraLateral(c: Field): Field {
  if (!enBarraLateral(c)) return c;
  const { position: _quitada, ...admin } = (c as { admin: Record<string, unknown> }).admin;
  return { ...c, admin } as Field;
}

/** Añade a la ayuda de un campo de foto el tamaño recomendado. */
function conAyudaDeFoto(c: Field, uso: UsoDeFoto): Field {
  const admin = ("admin" in c && c.admin ? c.admin : {}) as { description?: unknown };
  const antes = typeof admin.description === "string" ? admin.description.trim() : "";
  const ayuda = ayudaDeFoto(uso);
  return {
    ...c,
    admin: { ...admin, description: antes ? `${antes} ${ayuda}` : ayuda },
  } as Field;
}

/** Solo un administrador ve la pestaña «Avanzado» (los datos se guardan igual: Payload solo se
 * salta la validación de lo que no pasa la condición, y lo sigue enviando al guardar). */
const soloAdministrador = (_data: unknown, _hermanos: unknown, ctx?: { user?: unknown }) =>
  (ctx?.user as { rol?: string } | null | undefined)?.rol === "administrador";

export function conPestanas(campos: Field[], plan: PlanDePestanas = {}): Field[] {
  const fotos = plan.fotos ?? {};
  const avanzado = new Set(plan.avanzado ?? []);
  const arriba: Field[] = [];
  const lateral: Field[] = [];
  const contenido: Field[] = [];
  const deFotos: Field[] = [];
  const buscadores: Field[] = [];
  const deAvanzado: Field[] = [];

  let alPrincipio = true;
  for (const c of campos) {
    const nombre = nombreDe(c);
    if (alPrincipio && c.type === "ui") {
      arriba.push(c);
      continue;
    }
    alPrincipio = false;
    if (nombre && avanzado.has(nombre)) deAvanzado.push(sinBarraLateral(c));
    else if (enBarraLateral(c)) lateral.push(c);
    else if (nombre === "seo") buscadores.push(c);
    else if (nombre && nombre in fotos) deFotos.push(conAyudaDeFoto(c, fotos[nombre]!));
    else if (oculto(c)) deAvanzado.push(c);
    else contenido.push(c);
  }

  const nombresDeFotos = deFotos.filter(visible).map((c) => nombreDe(c)!);
  if (nombresDeFotos.length > 0) {
    deFotos.unshift({
      name: "avisoFotoPequena",
      type: "ui",
      admin: {
        components: {
          Field: {
            path: "/components/admin/aviso/AvisoFotoPequena",
            clientProps: {
              campos: nombresDeFotos.filter((n) => fotos[n] !== "logo"),
            },
          },
        },
      },
    });
  }

  const todas: Tab[] = [
    { label: "Contenido", fields: contenido },
    { label: "Fotos", fields: deFotos },
    { label: "Buscadores y redes", fields: buscadores },
    { label: "Avanzado", fields: deAvanzado, admin: { condition: soloAdministrador } },
  ];
  // Una pestaña sin nada visible no se pinta, pero sus campos (ocultos) NO se pueden perder: se
  // quitarían del esquema. Van al primer nivel, donde siguen ocultos.
  const pestanas = todas.filter((p) => p.fields.some(visible));
  const sueltos = todas.filter((p) => !p.fields.some(visible)).flatMap((p) => p.fields);

  return [...arriba, { type: "tabs", tabs: pestanas }, ...lateral, ...sueltos];
}
