import config from "@payload-config";
import { getPayload } from "payload";

import { plegar } from "./texto";

/**
 * REGISTRO DE BÚSQUEDAS SIN RESULTADO (2026-11-18). Solo el texto buscado y un contador: nada de
 * quien busca (ni IP, ni cookies, ni cabeceras). Ver `BusquedaSinResultado.ts`.
 *
 * Lo que NO se guarda: lo que parezca un dato personal (teléfono, correo, documento, dirección web)
 * o no sea una búsqueda (muy corto, muy largo, solo números). Y hay límite de frecuencia: el mismo
 * texto no se cuenta más de una vez por minuto y por instancia, y no se escriben más de
 * `MAXIMO_POR_MINUTO` filas en un minuto, para que nadie llene la base con una ráfaga.
 */

const MAXIMO_POR_MINUTO = 20;
const ESPERA_MISMO_TEXTO_MS = 60_000;

/** El texto tal como se guardaría, o `null` si no debe guardarse. */
export function textoRegistrable(crudo: string): string | null {
  const original = crudo.trim();
  if (original.length < 3 || original.length > 60) return null;
  // Correo o dirección web.
  if (/@|https?:|www\.|\.(com|co|net|org)\b/i.test(original)) return null;
  // Teléfono o documento: siete o más dígitos, aunque vayan separados por espacios o guiones.
  const digitos = original.replace(/[^0-9]/g, "");
  if (digitos.length >= 7) return null;
  const plano = plegar(original);
  if (plano.length < 3 || /^[0-9 ]+$/.test(plano)) return null;
  // Una cadena larga de letras y números pegados (un serial o un código de cliente).
  if (/\b(?=[a-z]*[0-9])(?=[0-9]*[a-z])[a-z0-9]{12,}\b/.test(plano)) return null;
  return plano.slice(0, 80);
}

const vistos = new Map<string, number>();
let ventana = { inicio: 0, cuenta: 0 };

/** ¿Se puede escribir ahora? Aplica los dos límites y lo anota. */
export function permitirAhora(texto: string, ahora = Date.now()): boolean {
  const ultimo = vistos.get(texto);
  if (ultimo !== undefined && ahora - ultimo < ESPERA_MISMO_TEXTO_MS) return false;
  if (ahora - ventana.inicio > 60_000) ventana = { inicio: ahora, cuenta: 0 };
  if (ventana.cuenta >= MAXIMO_POR_MINUTO) return false;
  ventana.cuenta += 1;
  vistos.set(texto, ahora);
  if (vistos.size > 500) {
    for (const [k, t] of vistos) if (ahora - t > ESPERA_MISMO_TEXTO_MS) vistos.delete(k);
  }
  return true;
}

/** Cuenta una búsqueda sin resultado. Nunca lanza: un fallo aquí no puede romper una búsqueda. */
export async function registrarSinResultado(crudo: string): Promise<void> {
  try {
    const texto = textoRegistrable(crudo);
    if (!texto || !permitirAhora(texto)) return;
    const payload = await getPayload({ config });
    const ajustes = await payload.findGlobal({ slug: "buscador", depth: 0 });
    if (ajustes.guardarSinResultado === false) return;
    const existente = await payload.find({
      collection: "busquedas-sin-resultado",
      where: { texto: { equals: texto } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const ahora = new Date().toISOString();
    const fila = existente.docs[0];
    if (fila) {
      await payload.update({
        collection: "busquedas-sin-resultado",
        id: fila.id,
        data: { veces: (fila.veces ?? 1) + 1, ultimaVez: ahora },
        overrideAccess: true,
      });
    } else {
      await payload.create({
        collection: "busquedas-sin-resultado",
        data: { texto, veces: 1, ultimaVez: ahora },
        overrideAccess: true,
      });
    }
  } catch (error) {
    console.error("[buscador] no se pudo anotar una búsqueda sin resultado:", String(error));
  }
}
