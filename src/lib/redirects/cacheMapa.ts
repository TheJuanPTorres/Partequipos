/**
 * Caché en memoria del mapa de redirects del proxy (ADR 0005), separada de la
 * red para poder probarla.
 *
 * LO QUE NO SE GUARDA NUNCA ES UN FALLO (2026-10-17). Antes, si la base fallaba
 * al arrancar, la ruta del mapa respondía 200 con un mapa vacío, el proxy lo
 * guardaba 60 s y durante ese minuto no se aplicaba ningún 301 (la prueba de
 * humo de `main` vio `/gracias/` en 404 tras un despliegue). Ahora:
 *
 *  - una carga buena se guarda `ttlMs`;
 *  - una carga fallida NO se guarda: la siguiente petición vuelve a intentarlo;
 *  - si falla y hay un mapa bueno anterior en memoria (aunque haya vencido), se
 *    sigue usando ese, y se reintenta en la petición siguiente;
 *  - sin mapa anterior, el fallo sube y el proxy deja pasar la petición.
 *
 * Varias peticiones con la caché vencida comparten UNA carga (sin estampida).
 */
export function crearCacheMapa<M>(opciones: {
  ahora?: () => number;
  avisar?: (mensaje: string, error: unknown) => void;
  ttlMs: number;
}) {
  const ahora = opciones.ahora ?? Date.now;
  const avisar = opciones.avisar ?? ((m, e) => console.error(m, e));
  let bueno: { expiraEn: number; mapa: M } | null = null;
  let cargaEnCurso: Promise<M> | null = null;

  return {
    obtener(cargar: () => Promise<M>): Promise<M> {
      if (bueno && bueno.expiraEn > ahora()) return Promise.resolve(bueno.mapa);
      cargaEnCurso ??= cargar()
        .then((mapa) => {
          bueno = { expiraEn: ahora() + opciones.ttlMs, mapa };
          return mapa;
        })
        .catch((error: unknown) => {
          if (!bueno) throw error;
          avisar("[proxy] mapa de redirects no disponible; se sigue con el anterior:", error);
          return bueno.mapa;
        })
        .finally(() => {
          cargaEnCurso = null;
        });
      return cargaEnCurso;
    },
  };
}
