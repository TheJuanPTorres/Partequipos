/**
 * VÍDEOS DE YOUTUBE de la portada (fases F y H). Sin alias `@/`: lo importa
 * una colección, que se carga con la config.
 */

export type VideoYouTube = { id: string; inicio: number | null };

const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;

/** «1m30s», «90s» o «90» → segundos. */
function segundos(t: string | null): number | null {
  if (!t) return null;
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/.exec(t);
  if (!m || !m[0]) return null;
  const total = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
  return total > 0 ? total : null;
}

/**
 * Lee una URL de YouTube (`watch?v=`, `youtu.be/`, `embed/`, `shorts/`) con su
 * segundo de inicio (`t` o `start`). Cualquier otra cosa devuelve `null`: así
 * el panel no admite URLs ajenas ni se arma un iframe con lo que llegue.
 */
export function videoDeYouTube(url: string | null | undefined): VideoYouTube | null {
  if (!url?.trim()) return null;
  let u: URL;
  try {
    u = new URL(url.trim().replace(/&amp;/g, "&"));
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else id = /^\/(?:embed|shorts)\/([^/]+)$/.exec(u.pathname)?.[1] ?? null;
  } else if (host === "youtu.be") {
    id = u.pathname.slice(1);
  }
  if (!id || !ID_YOUTUBE.test(id)) return null;
  return { id, inicio: segundos(u.searchParams.get("t") ?? u.searchParams.get("start")) };
}

/** Validación del campo en el panel. */
export function validarYouTube(valor: unknown): true | string {
  if (valor === null || valor === undefined || valor === "") return true;
  return typeof valor === "string" && videoDeYouTube(valor)
    ? true
    : "Pega el enlace de YouTube del vídeo (p. ej. https://www.youtube.com/watch?v=…).";
}

/**
 * El iframe SIEMPRE desde el dominio sin cookies, y solo se crea al pulsar
 * (fase H, D20): hasta entonces no se carga nada de YouTube.
 */
export function urlInsercion(v: VideoYouTube): string {
  const q = new URLSearchParams({ autoplay: "1", rel: "0" });
  if (v.inicio) q.set("start", String(v.inicio));
  return `https://www.youtube-nocookie.com/embed/${v.id}?${q.toString()}`;
}
