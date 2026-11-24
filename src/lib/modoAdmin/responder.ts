import { esPersonal } from "@/lib/seguridad/acceso";

import {
  MAPA_VACIO,
  mapaDePortada,
  mapaDeUsada,
  respuestaDelMapa,
  type Permisos,
  type RespuestaMapa,
} from "./mapa";
import { clasificarRuta, rutaValida } from "./ruta";

/**
 * MODO ADMINISTRACIÓN: la DECISIÓN de `GET /api/modo-admin/mapa/`, sin Payload ni Next, para
 * poder probarla. La ruta le pasa la sesión ya resuelta y dos búsquedas que consultan la base CON
 * EL ACCESO DE ESE USUARIO (`overrideAccess: false`): si no puede leer el documento, no hay id.
 *
 * Condiciones de dirección (2026-11-24), cada una con su prueba:
 * 1. Sin sesión de personal (`esPersonal`), 401, antes de mirar la ruta.
 * 2. La `ruta` se valida y se clasifica (`ruta.ts`); una inválida, 400; una que no se conoce,
 *    mapa vacío SIN consultar la base.
 * 3. Solo bloques de lo que ese usuario puede leer (las búsquedas) y editar (`respuestaDelMapa`).
 * 4. Solo lectura: aquí no hay nada que escriba.
 */
export type Busquedas = {
  /** El id de la página «inicio», o `null` si ese usuario no puede leerla. */
  idDePortada: () => Promise<number | string | null>;
  /** El id de la unidad usada con esa dirección, o `null`. */
  idDeUsada: (slug: string) => Promise<number | string | null>;
  /** La ruta de la vista previa de una unidad usada, o `null`. */
  borradorDeUsada: (id: number | string) => string | null;
};

export type Resultado =
  | { status: 401 | 400; cuerpo: { error: string } }
  | { status: 200; cuerpo: RespuestaMapa & { usuario: string } };

export async function responderMapa(entrada: {
  usuario: unknown;
  permisos: Permisos | null | undefined;
  ruta: unknown;
  busquedas: Busquedas;
}): Promise<Resultado> {
  if (!esPersonal(entrada.usuario)) {
    return { status: 401, cuerpo: { error: "Inicia sesión en el panel." } };
  }
  const ruta = rutaValida(entrada.ruta);
  if (!ruta) return { status: 400, cuerpo: { error: "Ruta no válida." } };

  const conocida = clasificarRuta(ruta);
  let mapa = MAPA_VACIO;
  if (conocida.tipo === "portada") {
    const id = await entrada.busquedas.idDePortada();
    if (id !== null) mapa = mapaDePortada(id);
  } else if (conocida.tipo === "usada") {
    const id = await entrada.busquedas.idDeUsada(conocida.slug);
    if (id !== null) mapa = mapaDeUsada(id, entrada.busquedas.borradorDeUsada(id));
  }

  const correo = (entrada.usuario as { email?: unknown }).email;
  return {
    status: 200,
    cuerpo: {
      ...respuestaDelMapa(mapa, entrada.permisos),
      // Su propio correo, para la franja («…como administrador: tú»). No sale de su navegador.
      usuario: typeof correo === "string" ? correo : "",
    },
  };
}
