/**
 * Comprobación de las URLs del sitio actual contra el dominio nuevo, para el
 * día del lanzamiento (`docs/runbook-lanzamiento.md`, paso f).
 *
 * Aquí está la DECISIÓN —qué se espera de cada URL y qué veredicto merece la
 * cadena de respuestas—, separada de la red para poder probar que **falla
 * cuando debe**. La red vive en `scripts/lanzamiento/comprobar-urls.ts`.
 *
 * La fuente es `docs/url-map.csv` (648 URLs vivas del rastreo, §10.1, más 2
 * entradas del blog publicadas después) y la
 * clasificación, `docs/redirects-cobertura.md`:
 *
 *   conservada  la ruta es idéntica en el sitio nuevo   -> 200 sin saltos
 *   redirect    cargada en `Redirects`                  -> 301/308 hasta su destino, que da 200
 *
 * Los redirects esperados son los de `scripts/import/data/redirects.csv` MÁS
 * los que sirve el propio dominio en `/api/redirects-map/` (`unirRedirects`):
 * los importadores y el panel crean redirects que no están en el fichero (los
 * de repuestos, los de lubricantes de su migración, los de usados del panel).
 * Sin ellos, su 301 saldría como «redirect inesperado» y bloquearía. Los de la
 * base que no están en `url-map.csv` también se comprueban (`rutasAComprobar`).
 *   pendiente   decisión del cliente (§3 de cobertura)  -> se informa, no falla
 *   basura      no se migra (§4 de cobertura)           -> se informa, no falla
 */

export type Esperado =
  | { tipo: "conservada" }
  | { hacia: string; tipo: "redirect" }
  | { tipo: "pendiente" }
  | { tipo: "basura" };

/** Una respuesta de la cadena: el código y, si es 3xx, a dónde manda. */
export type Salto = { estado: number; location?: string };

export type Veredicto =
  | "ok"
  | "no-encontrada" // termina en 404/410
  | "error-servidor" // termina en 5xx
  | "redirect-temporal" // un 302/303/307 en la cadena: no transfiere autoridad
  | "destino-equivocado" // redirige, pero no adonde dice el mapa
  | "redirect-inesperado" // una conservada que redirige a otra ruta
  | "sin-redirect" // un redirect cargado que responde 200 sin saltar
  | "bucle"
  | "demasiados-saltos"
  | "error-red";

/** Pendientes de decisión del cliente (`redirects-cobertura.md` §3). */
export const PENDIENTES = [
  "/blog-partequipos/",
  "/lubricantes-eni/",
  "/pe-partsshop/",
  "/openhouse/",
  "/participa-openhouse/",
  "/premios-open-house/",
  "/referenciacion-openhouse-2025/",
  "/landing-dynapac/",
  "/congreso-de-alcaldes/",
  "/competencia_nacional_de_operadores/",
  "/lanzamiento_excavadoras/",
  "/excavadoras/",
  "/repuestos-para-maquinaria-pesada/",
  "/repuestos-para-maquinaria-pesada-2/",
];

/** Basura: no se migra ni se redirige (`redirects-cobertura.md` §4). */
export const BASURA = [
  "/maquinaria-pesada/test/",
  "/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras-propuesta2025/",
  "/maquinaria-pesada/maquinaria-pesada-usada/excavadoras4/",
  "/maquinaria-pesada/maquinaria-pesada-usada-otros/",
  "/elementor-48399/",
  "/inicio2025/",
];

export const MAX_SALTOS = 5;

/** Los hosts del sitio: una URL suya se compara solo por la ruta. */
const HOSTS_PROPIOS = new Set(["partequipos.com", "www.partequipos.com"]);

/**
 * Ruta con barra final, sin query ni `#ancla`: la forma de `trailingSlash:
 * true`. Sin host si es del sitio (relativa, `partequipos.com` o el dominio
 * que se comprueba, `origenPropio`); con su origen si es de otro sitio, para
 * que un redirect externo (el portal de empleo) no se confunda con una ruta
 * propia que se llame igual.
 */
export function normalizarRuta(url: string, origenPropio?: string): string {
  const u = new URL(url, "https://x.invalid");
  const ruta = u.pathname.endsWith("/") ? u.pathname : `${u.pathname}/`;
  const propio =
    u.host === "x.invalid" ||
    HOSTS_PROPIOS.has(u.host) ||
    (origenPropio !== undefined && u.host === new URL(origenPropio).host);
  return propio ? ruta : `${u.origin}${ruta}`;
}

/** CSV con comillas dobles (el formato de `url-map.csv` y `redirects.csv`). */
export function parsearCsv(texto: string): Record<string, string>[] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let entreComillas = false;

  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i += 1;
      } else if (c === '"') {
        entreComillas = false;
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === ",") {
      fila.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i += 1;
      fila.push(campo);
      if (fila.some((v) => v !== "")) filas.push(fila);
      fila = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  fila.push(campo);
  if (fila.some((v) => v !== "")) filas.push(fila);

  const [cabecera, ...resto] = filas;
  if (!cabecera) return [];
  return resto.map((valores) => Object.fromEntries(cabecera.map((k, j) => [k, valores[j] ?? ""])));
}

export type Redirect = { desde: string; hacia: string };

/** Un mismo origen con destinos distintos en el fichero y en la base. */
export type Conflicto = { desde: string; enBase: string; enFichero: string };

/**
 * Une los redirects del fichero con los que sirve la base. Si los dos tienen
 * el mismo origen con distinto destino es un CONFLICTO: el sitio hará lo de la
 * base, pero el repositorio dice otra cosa, y alguien tiene que decidir. Se
 * compara con rutas normalizadas (barra final, sin `#ancla`).
 */
export function unirRedirects(
  fichero: Redirect[],
  base: Redirect[],
): { conflictos: Conflicto[]; redirects: Redirect[] } {
  const porDesde = new Map<string, Redirect>();
  for (const r of base) porDesde.set(normalizarRuta(r.desde), r);
  const conflictos: Conflicto[] = [];
  for (const r of fichero) {
    const desde = normalizarRuta(r.desde);
    const enBase = porDesde.get(desde);
    if (!enBase) porDesde.set(desde, r);
    else if (normalizarRuta(enBase.hacia) !== normalizarRuta(r.hacia)) {
      conflictos.push({ desde, enBase: enBase.hacia, enFichero: r.hacia });
    }
  }
  return { conflictos, redirects: [...porDesde.values()] };
}

/**
 * Las rutas a recorrer: las de `url-map.csv` y, además, el origen de cada
 * redirect que no esté en él (un 301 creado en el panel también tiene que
 * llegar a un 200).
 */
export function rutasAComprobar(urls: string[], redirects: Redirect[]): string[] {
  const vistas = new Set(urls.map((u) => normalizarRuta(u)));
  const extra = redirects.map((r) => normalizarRuta(r.desde)).filter((r) => !vistas.has(r));
  return [...urls, ...new Set(extra)];
}

/**
 * Qué se espera de cada ruta del mapa. `redirects` son los de `unirRedirects`
 * (o, en las pruebas, las filas de `scripts/import/data/redirects.csv`).
 */
export function clasificar(rutas: string[], redirects: Redirect[]): Map<string, Esperado> {
  const mapa = new Map<string, Esperado>();
  const porDesde = new Map(
    redirects.map((r) => [normalizarRuta(r.desde), normalizarRuta(r.hacia)]),
  );
  const pendientes = new Set(PENDIENTES);
  const basura = new Set(BASURA);

  for (const bruta of rutas) {
    const ruta = normalizarRuta(bruta);
    const hacia = porDesde.get(ruta);
    if (hacia) mapa.set(ruta, { hacia, tipo: "redirect" });
    else if (pendientes.has(ruta)) mapa.set(ruta, { tipo: "pendiente" });
    else if (basura.has(ruta)) mapa.set(ruta, { tipo: "basura" });
    else mapa.set(ruta, { tipo: "conservada" });
  }
  return mapa;
}

const PERMANENTE = new Set([301, 308]);
const TEMPORAL = new Set([302, 303, 307]);

/**
 * Veredicto de una cadena ya recorrida. `saltos` es la secuencia de
 * respuestas, la primera la de `ruta`; `error` si la red falló a mitad.
 */
export function veredicto(
  ruta: string,
  esperado: Esperado,
  saltos: Salto[],
  error?: string,
  origenPropio?: string,
): Veredicto {
  if (error) return "error-red";
  const ultimo = saltos.at(-1);
  if (!ultimo) return "error-red";

  const visitadas = [ruta];
  for (const salto of saltos.slice(0, -1)) {
    if (TEMPORAL.has(salto.estado)) return "redirect-temporal";
    const siguiente = salto.location ? normalizarRuta(salto.location, origenPropio) : "";
    if (visitadas.includes(siguiente)) return "bucle";
    visitadas.push(siguiente);
  }
  if (TEMPORAL.has(ultimo.estado)) return "redirect-temporal";
  if (PERMANENTE.has(ultimo.estado)) {
    const siguiente = ultimo.location ? normalizarRuta(ultimo.location, origenPropio) : "";
    return visitadas.includes(siguiente) ? "bucle" : "demasiados-saltos";
  }
  if (ultimo.estado >= 500) return "error-servidor";
  if (ultimo.estado === 404 || ultimo.estado === 410) return "no-encontrada";
  if (ultimo.estado !== 200) return "error-servidor";

  const destino = visitadas.at(-1);
  // Un 308 que solo añade la barra final no cuenta como cambio de ruta.
  const cambioDeRuta = destino !== normalizarRuta(ruta);

  if (esperado.tipo === "redirect") {
    if (!cambioDeRuta) return "sin-redirect";
    return destino === esperado.hacia ? "ok" : "destino-equivocado";
  }
  if (cambioDeRuta) return "redirect-inesperado";
  return "ok";
}

/**
 * ¿Bloquea el lanzamiento? Solo lo que debía funcionar: conservadas y
 * redirects. Pendientes y basura se informan aparte (son decisiones abiertas,
 * y un 404 ahí es el estado conocido, no un fallo).
 */
export function bloquea(esperado: Esperado, v: Veredicto): boolean {
  if (esperado.tipo === "pendiente" || esperado.tipo === "basura") return false;
  return v !== "ok";
}
