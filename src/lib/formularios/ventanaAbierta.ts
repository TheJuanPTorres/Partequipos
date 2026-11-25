/**
 * ¿HAY UNA VENTANA DE FORMULARIO ABIERTA? (t8, 2026-11-25). Una cuenta de ventanas abiertas fuera
 * de React, para que otras partes de la página puedan leerla con `useSyncExternalStore`.
 *
 * Para qué: el catálogo de los listados va en un `<ViewTransition>` (`TransicionCatalogo`). Cuando
 * vuelve la respuesta de un envío, React lo anima como un «cambio» y el navegador sustituye la
 * página por una foto fija durante ~280 ms: la capa superior (el fondo oscuro de la ventana) no
 * sale en esa foto, así que la ventana parecía desaparecer y volver de golpe. Con una ventana
 * abierta, el catálogo no anima su cambio.
 */
let abiertas = 0;
const oyentes = new Set<() => void>();

function avisar() {
  for (const o of oyentes) o();
}

/** Suma una ventana abierta; devuelve la función que la quita. */
export function ventanaAbierta(): () => void {
  abiertas += 1;
  avisar();
  let quitada = false;
  return () => {
    if (quitada) return;
    quitada = true;
    abiertas -= 1;
    avisar();
  };
}

export function suscribirVentanas(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

export const hayVentanaAbierta = () => abiertas > 0;
