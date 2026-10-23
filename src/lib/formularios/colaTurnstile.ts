/**
 * LOS WIDGETS DE TURNSTILE QUE ESPERAN AL SCRIPT (2026-10-23).
 *
 * El script de Cloudflare avisa al cargar llamando a UNA función global (`onload=alListoTurnstile`).
 * Antes cada widget escribía ahí su propio montaje, así que con dos formularios en la misma página
 * el último pisaba al primero y el otro se quedaba sin widget ni token: su envío se rechazaba
 * («No pudimos comprobar que eres una persona»). Pasaba en el estado vacío de usados, con el
 * formulario de la página y el de la ventana «Avísame cuando llegue una».
 *
 * Ahora cada widget se apunta a esta cola, y la función global los monta TODOS.
 */
const pendientes = new Set<() => void>();

/** Apunta un montaje para cuando cargue el script. Devuelve cómo borrarlo (al desmontar antes). */
export function alCargarTurnstile(montar: () => void): () => void {
  pendientes.add(montar);
  return () => {
    pendientes.delete(montar);
  };
}

/** La función global que llama el script al cargar: monta todos los pendientes. */
export function montarPendientes(): void {
  const ahora = [...pendientes];
  pendientes.clear();
  for (const montar of ahora) montar();
}
