/**
 * Prueba de humo contra la aplicación DESPLEGADA (CLAUDE.md §10.20).
 *
 * Aquí está la DECISIÓN —qué rutas se piden, cuándo se reintenta y cuándo se
 * aborta—, separada de la red, para poder comprobar que **falla cuando debe**
 * sin necesidad de un despliegue roto a mano. Es el mismo criterio que se aplicó
 * al guardián de migraciones (§10.25).
 *
 * POR QUÉ EXISTE. El despliegue del incidente §10.18 pasó typecheck, lint,
 * formato, 198 pruebas y un `next build` completo, y dejó `/admin`, la API, el
 * sitemap y el mapa de redirects en 500. Ninguna de nuestras puertas mira el
 * lambda ya desplegado: esta sí.
 */

export type Entorno = "preview" | "production";

export type Ruta = {
  /** Cabeceras propias de la ruta, aparte del token de derivación. */
  cabeceras?: Record<string, string>;
  /** Por qué está en la lista. Se imprime al fallar. */
  motivo: string;
  ruta: string;
  /** Entornos donde se comprueba. */
  soloEn?: Entorno;
};

/**
 * LISTA FIJA, ESCRITA A MANO. **No se lee del sitemap**, y eso es deliberado:
 * `NEXT_PUBLIC_SERVER_URL` es la misma en Production y Preview, así que el
 * sitemap de un preview lista URLs de PRODUCCIÓN (§10.21). Una prueba que lo
 * leyera daría verde midiendo otro sitio.
 */
export const RUTAS: Ruta[] = [
  { motivo: "carga la config de Payload; es lo que cayó en §10.18", ruta: "/admin/" },
  { motivo: "API REST contra la base", ruta: "/api/marcas/" },
  { motivo: "ruta dinámica con consulta", ruta: "/sitemap.xml" },
  { motivo: "control: si esto cae, es otra cosa", ruta: "/" },
  {
    cabeceras: { "x-proxy-internal": "1" },
    /*
     * SOLO EN PRODUCCIÓN, y no por comodidad: en un preview el token de
     * derivación **falsea el resultado**. El proxy real pide este mapa sin
     * token y la protección de despliegue le responde 302, así que la ruta
     * daría 200 midiendo un camino privilegiado que el llamante real no tiene
     * (§10.22). Medirla en preview sería repetir el error de §10.15 dentro de
     * la propia herramienta de verificación.
     */
    motivo: "sostiene los redirects; en preview el token falsearía el resultado (§10.22)",
    ruta: "/api/redirects-map/",
    soloEn: "production",
  },
];

export function rutasPara(entorno: Entorno): Ruta[] {
  return RUTAS.filter((r) => !r.soloEn || r.soloEn === entorno);
}

export type Resultado = {
  /** Mensaje de red, si la petición no llegó a responder. */
  error?: string;
  estado?: number;
  intentos: number;
  ruta: string;
};

/** Límite duro de intentos: un bucle infinito no puede ser la forma de fallar. */
export const INTENTOS_MAXIMOS = 4;

/**
 * Espera antes del siguiente intento, en milisegundos. Crece, pero está acotada:
 * 1 s, 2 s, 4 s → 7 s por ruta como máximo. Existe por el arranque en frío
 * (§10.4 midió 2,89 s en frío), no para tapar un fallo real.
 */
export function esperaMs(intento: number): number {
  return 1000 * 2 ** (intento - 1);
}

/**
 * ¿Se reintenta? Solo con fallo de red o 5xx, y mientras queden intentos.
 *
 * Un 4xx NO se reintenta: es una respuesta del servidor, no un arranque en
 * frío, y reintentarla solo retrasa el fallo. El 403 del mapa de redirects sin
 * su cabecera es justo ese caso.
 */
export function debeReintentar(resultado: Resultado): boolean {
  if (resultado.intentos >= INTENTOS_MAXIMOS) {
    return false;
  }
  if (resultado.error !== undefined) {
    return true;
  }
  return resultado.estado !== undefined && resultado.estado >= 500;
}

export type Veredicto = {
  codigo: 0 | 1;
  fallos: Resultado[];
  /** Línea por línea, lista para imprimir. */
  lineas: string[];
  total: number;
};

/**
 * Exige **200** en todas las rutas. Cualquier otra cosa es fallo, incluidos los
 * 3xx: un redirect en `/admin/` significaría que la protección no se derivó, y
 * dar eso por bueno es cómo una prueba de humo se vuelve decorativa.
 */
export function veredicto(resultados: Resultado[]): Veredicto {
  const fallos = resultados.filter((r) => r.estado !== 200);
  const lineas = resultados.map((r) => {
    const marca = r.estado === 200 ? "✓" : "✗";
    const detalle = r.error !== undefined ? `error de red: ${r.error}` : `HTTP ${r.estado}`;
    const reintentos = r.intentos > 1 ? ` (${r.intentos} intentos)` : "";
    return `${marca} ${r.ruta} — ${detalle}${reintentos}`;
  });

  return {
    codigo: fallos.length > 0 ? 1 : 0,
    fallos,
    lineas,
    total: resultados.length,
  };
}
