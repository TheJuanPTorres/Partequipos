import { crearMapaSinonimos, type MapaSinonimos } from "./sinonimos";
import { compacto, distancia, plegar, terminos, toleranciaDe } from "./texto";

/**
 * MOTOR DEL BUSCADOR (2026-11-18): un índice invertido en memoria, sin dependencias, que corre en el
 * servidor. Lo construye `indice.ts` desde el catálogo publicado y se reconstruye cuando algo cambia
 * en el panel. Aquí solo hay lógica pura (con pruebas en `motor.test.ts`).
 *
 * QUÉ ENTIENDE
 * - Mayúsculas, tildes y signos no cuentan; los modelos se parten entre letras y números
 *   («ZX200» = «zx 200» = «ZX-200»; «zx200lc» encuentra «ZX200»).
 * - Errores de escritura («exavadora», «donalson»), plurales y prefijos («excav»).
 * - Sinónimos del sector (base fija + los del panel).
 * - Búsquedas compuestas: «excavadora volvo usada» detecta el estado y la marca.
 *
 * CÓMO ORDENA: primero el modelo exacto, luego la relevancia por campo (título y código pesan más
 * que la descripción), y a igualdad, lo más específico (equipos y modelos antes que blog).
 */

export type Clase =
  | "marca"
  | "nueva"
  | "usada"
  | "modelo"
  | "repuestos"
  | "categoria"
  | "lubricante"
  | "blog"
  | "servicio"
  | "pagina"
  | "sede";

export type Campo = "titulo" | "codigo" | "marca" | "tipo" | "categoria" | "descripcion" | "specs";

export type DocBusqueda = {
  /** Único en todo el índice («nueva-12», «blog-3»). */
  id: string;
  clase: Clase;
  titulo: string;
  href: string;
  /** Línea bajo el título. */
  detalle?: string;
  /** Nombre de la marca y del tipo, para filtrar y mostrar. */
  marca?: string;
  tipo?: string;
  /** Foto o logo del resultado (dirección del fichero). */
  imagen?: { url: string; width: number; height: number } | null;
  campos: Partial<Record<Campo, string>>;
};

const PESO: Record<Campo, number> = {
  titulo: 6,
  codigo: 6,
  marca: 3,
  tipo: 3,
  categoria: 2.5,
  descripcion: 1,
  specs: 1,
};

/** A igualdad de relevancia, qué va antes. */
const PRIORIDAD: Record<Clase, number> = {
  marca: 0,
  modelo: 1,
  nueva: 1,
  usada: 1,
  repuestos: 2,
  categoria: 2,
  lubricante: 3,
  servicio: 4,
  pagina: 5,
  sede: 5,
  blog: 7,
};

export { ETIQUETA_CLASE } from "./etiquetas";

type Posting = { doc: number; campo: Campo };

export type Indice = {
  docs: DocBusqueda[];
  postings: Map<string, Posting[]>;
  vocabulario: string[];
  marcas: Set<string>;
  sinonimos: MapaSinonimos;
  /** Modelos y códigos sin separadores → documentos, para el «Ir a …» exacto. */
  exactos: Map<string, number[]>;
};

export function crearIndice(docs: DocBusqueda[], sinonimosExtra: string[][] = []): Indice {
  const postings = new Map<string, Posting[]>();
  const marcas = new Set<string>();
  const exactos = new Map<string, number[]>();
  docs.forEach((d, i) => {
    if (d.marca) for (const t of terminos(d.marca)) marcas.add(t);
    for (const clave of [d.titulo, d.campos.codigo]) {
      const c = clave ? compacto(clave) : "";
      if (c.length >= 3) exactos.set(c, [...(exactos.get(c) ?? []), i]);
    }
    for (const campo of Object.keys(d.campos) as Campo[]) {
      const texto = d.campos[campo];
      if (!texto) continue;
      for (const t of new Set(terminos(texto))) {
        const lista = postings.get(t) ?? [];
        lista.push({ doc: i, campo });
        postings.set(t, lista);
      }
    }
  });
  return {
    docs,
    postings,
    vocabulario: [...postings.keys()],
    marcas,
    sinonimos: crearMapaSinonimos(sinonimosExtra),
    exactos,
  };
}

// --- La consulta -----------------------------------------------------------------------------

export type Estado = "nueva" | "usada";

export type Filtros = {
  marca?: string;
  tipo?: string;
  estado?: Estado;
  clase?: Clase;
};

export type Detectado = { estado?: Estado; marca?: string };

const ESTADO_USADA = new Set(["usado", "usada", "usado", "segunda", "seminuevo", "seminueva"]);
const ESTADO_NUEVA = new Set(["nuevo", "nueva", "0km"]);

/** Palabras sueltas que no aportan a la búsqueda. */
const VACIAS = new Set([
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "para",
  "en",
  "y",
  "con",
  "un",
  "una",
]);

type Pareja = { doc: number; puntos: number };

/** Puntos de una palabra de la consulta sobre cada documento (el mejor campo y la mejor forma). */
function puntuarPalabra(indice: Indice, palabra: string, soloExacta = false): Map<number, number> {
  const mejor = new Map<number, number>();
  const sumar = (doc: number, puntos: number) => {
    if (puntos > (mejor.get(doc) ?? 0)) mejor.set(doc, puntos);
  };
  const tol = soloExacta ? 0 : toleranciaDe(palabra);
  const exacta = indice.postings.get(palabra);
  if (exacta) for (const p of exacta) sumar(p.doc, PESO[p.campo]);
  if (soloExacta) return mejor;
  for (const token of indice.vocabulario) {
    if (token === palabra) continue;
    let calidad = 0;
    if (palabra.length >= 2 && token.startsWith(palabra)) {
      // Un prefijo vale menos cuanto más corto es lo escrito frente al token.
      calidad = 0.55 + 0.35 * (palabra.length / token.length);
    } else if (tol > 0 && distancia(palabra, token, tol) <= tol) {
      calidad = 0.5;
    } else if (
      tol > 0 &&
      token.length > palabra.length &&
      distancia(palabra, token.slice(0, palabra.length), tol) <= tol
    ) {
      // Prefijo con una errata («exavad» → «excavadora»).
      calidad = 0.4;
    }
    if (!calidad) continue;
    for (const p of indice.postings.get(token) ?? []) sumar(p.doc, PESO[p.campo] * calidad);
  }
  return mejor;
}

/** Una «forma» de entender una palabra: ella misma o un sinónimo (que puede ser una frase). */
function puntuarForma(
  indice: Indice,
  forma: string[],
  desdeSinonimo: boolean,
): Map<number, number> {
  let acumulado: Map<number, number> | null = null;
  for (const palabra of forma) {
    const de = puntuarPalabra(indice, palabra, desdeSinonimo);
    if (!acumulado) {
      acumulado = new Map(de);
      continue;
    }
    const siguiente = new Map<number, number>();
    for (const [doc, puntos] of acumulado) {
      const otro = de.get(doc);
      if (otro !== undefined) siguiente.set(doc, puntos + otro);
    }
    acumulado = siguiente;
  }
  return acumulado ?? new Map();
}

function puntuarTermino(indice: Indice, termino: string): Map<number, number> {
  const resultado = puntuarForma(indice, [termino], false);
  const alternativas = indice.sinonimos.get(termino) ?? [];
  for (const forma of alternativas) {
    // Un sinónimo vale bastante menos que lo escrito tal cual: «rodaje» pone «Tren de rodaje» antes que
    // unas cadenas que solo coinciden por el sinónimo «cadena».
    for (const [doc, puntos] of puntuarForma(indice, forma, true)) {
      const valor = (puntos / forma.length) * 0.6;
      if (valor > (resultado.get(doc) ?? 0)) resultado.set(doc, valor);
    }
  }
  return resultado;
}

export type Faceta = { valor: string; total: number };

export type Resultado = {
  doc: DocBusqueda;
  puntos: number;
  /** Es el modelo o código que se escribió, tal cual. */
  exacto: boolean;
};

export type RespuestaBusqueda = {
  consulta: string;
  detectado: Detectado;
  resultados: Resultado[];
  total: number;
  porClase: Partial<Record<Clase, number>>;
  marcas: Faceta[];
  tipos: Faceta[];
  estados: Faceta[];
  /** Todas las palabras casaron (false: se relajó alguna, p. ej. el sufijo de un modelo). */
  completa: boolean;
  /** El modelo exacto, para el botón «Ir a …». */
  exacto: DocBusqueda | null;
  /** Con cero resultados: la consulta corregida, si con ella sí hay. */
  sugerencia: string | null;
};

const VACIA = (consulta: string): RespuestaBusqueda => ({
  consulta,
  detectado: {},
  resultados: [],
  total: 0,
  porClase: {},
  marcas: [],
  tipos: [],
  estados: [],
  completa: true,
  exacto: null,
  sugerencia: null,
});

function contar(valores: (string | undefined)[]): Faceta[] {
  const m = new Map<string, number>();
  for (const v of valores) if (v) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()]
    .map(([valor, total]) => ({ valor, total }))
    .sort((a, b) => b.total - a.total || a.valor.localeCompare(b.valor, "es"));
}

const estadoDe = (d: DocBusqueda): Estado | undefined =>
  d.clase === "usada" ? "usada" : d.clase === "nueva" ? "nueva" : undefined;

/** Busca. `limite` recorta la lista devuelta, no los totales. */
export function buscarEnIndice(
  indice: Indice,
  crudo: string,
  filtros: Filtros = {},
  limite = 200,
): RespuestaBusqueda {
  const consulta = crudo.trim().slice(0, 80);
  let palabrasConsulta = terminos(consulta);
  if (palabrasConsulta.length === 0) return VACIA(consulta);

  // Estado y marca escritos dentro de la consulta («excavadora volvo usada»).
  const detectado: Detectado = {};
  const resto: string[] = [];
  for (const p of palabrasConsulta) {
    if (VACIAS.has(p)) continue;
    if (ESTADO_USADA.has(singularEstado(p))) detectado.estado = "usada";
    else if (ESTADO_NUEVA.has(singularEstado(p))) detectado.estado = "nueva";
    else resto.push(p);
  }
  // Una consulta que es solo «usada» no puede quedarse sin palabras: se busca tal cual.
  palabrasConsulta = resto.length > 0 ? resto : palabrasConsulta.filter((p) => !VACIAS.has(p));
  if (resto.length === 0) delete detectado.estado;
  for (const p of palabrasConsulta) {
    if (indice.marcas.has(p) && !detectado.marca) detectado.marca = p;
  }
  if (palabrasConsulta.length === 0) return VACIA(consulta);

  const porTermino = palabrasConsulta.map((p) => puntuarTermino(indice, p));

  // AND estricto; si no hay nada, se va soltando la palabra más corta (un sufijo de modelo, «lc»…).
  const orden = palabrasConsulta
    .map((p, i) => ({ i, largo: p.length }))
    .sort((a, b) => a.largo - b.largo);
  let activos = porTermino.map((_, i) => i);
  let casados = unir(porTermino, activos);
  let completa = true;
  while (casados.length === 0 && activos.length > 1) {
    const soltar = orden.find((o) => activos.includes(o.i))!.i;
    activos = activos.filter((i) => i !== soltar);
    casados = unir(porTermino, activos);
    completa = false;
  }

  const estadoPedido = filtros.estado ?? detectado.estado;
  const consultaCompacta = compacto(consulta);
  let lista: Resultado[] = casados.flatMap((c) => {
    const doc = indice.docs[c.doc];
    if (!doc) return [];
    const exacto = (indice.exactos.get(consultaCompacta) ?? []).includes(c.doc);
    const aTitulo = compacto(doc.titulo).startsWith(consultaCompacta) ? 4 : 0;
    return [
      {
        doc,
        puntos:
          c.puntos +
          aTitulo +
          // Lo que es del estado pedido («usada») va antes que lo que no tiene estado.
          (estadoPedido && estadoDe(doc) === estadoPedido ? 6 : 0) +
          (exacto ? 1000 : 0) -
          PRIORIDAD[doc.clase] * 1.5,
        exacto,
      },
    ];
  });

  // Facetas y recuentos sobre lo que casa, antes de aplicar los filtros del visitante.
  const base = lista;
  const aplicar = (r: Resultado, f: Filtros & { soloEstado?: boolean }) =>
    (!f.marca || plegar(r.doc.marca ?? "") === plegar(f.marca)) &&
    (!f.tipo || plegar(r.doc.tipo ?? "") === plegar(f.tipo)) &&
    (!f.clase || r.doc.clase === f.clase) &&
    (!f.estado || estadoDe(r.doc) === f.estado);

  // El estado escrito en la consulta filtra solo lo que tiene estado (equipos); un modelo de
  // repuestos o un artículo no lo pierde por «usada».
  lista = lista.filter(
    (r) =>
      aplicar(r, { marca: filtros.marca, tipo: filtros.tipo, clase: filtros.clase }) &&
      (!estadoPedido || !estadoDe(r.doc) || estadoDe(r.doc) === estadoPedido) &&
      (!filtros.estado || estadoDe(r.doc) === filtros.estado),
  );
  lista.sort(
    (a, b) =>
      b.puntos - a.puntos ||
      PRIORIDAD[a.doc.clase] - PRIORIDAD[b.doc.clase] ||
      a.doc.titulo.localeCompare(b.doc.titulo, "es"),
  );

  const porClase: Partial<Record<Clase, number>> = {};
  for (const r of lista) porClase[r.doc.clase] = (porClase[r.doc.clase] ?? 0) + 1;
  const exacto = lista.find((r) => r.exacto)?.doc ?? null;

  const sugerencia = lista.length === 0 ? sugerir(indice, palabrasConsulta, filtros) : null;
  return {
    consulta,
    detectado,
    resultados: lista.slice(0, limite),
    total: lista.length,
    porClase,
    marcas: contar(base.map((r) => r.doc.marca)),
    tipos: contar(base.map((r) => r.doc.tipo)),
    estados: contar(base.map((r) => estadoDe(r.doc))),
    completa,
    exacto,
    sugerencia,
  };
}

const singularEstado = (p: string) => (p.endsWith("s") ? p.slice(0, -1) : p);

function unir(porTermino: Map<number, number>[], activos: number[]): Pareja[] {
  if (activos.length === 0) return [];
  const [primero, ...otros] = activos;
  const salida: Pareja[] = [];
  for (const [doc, puntos] of primero === undefined ? [] : (porTermino[primero] ?? [])) {
    let total = puntos;
    let todos = true;
    for (const o of otros) {
      const p = porTermino[o]?.get(doc);
      if (p === undefined) {
        todos = false;
        break;
      }
      total += p;
    }
    if (todos) salida.push({ doc, puntos: total });
  }
  return salida;
}

/** «¿Quisiste decir…?»: cada palabra sin casar se sustituye por la más cercana del vocabulario. */
function sugerir(indice: Indice, palabrasConsulta: string[], filtros: Filtros): string | null {
  const nuevas = palabrasConsulta.map((p) => {
    if (indice.postings.has(p) || /[0-9]/.test(p) || p.length < 4) return p;
    let mejor = p;
    let d = 3;
    for (const token of indice.vocabulario) {
      if (Math.abs(token.length - p.length) > 3) continue;
      const dd = distancia(p, token, 3);
      if (dd < d || (dd === d && token.length > mejor.length && dd < 3)) {
        d = dd;
        mejor = token;
      }
    }
    return mejor;
  });
  const texto = nuevas.join(" ");
  if (texto === palabrasConsulta.join(" ")) return null;
  const prueba = buscarEnIndice(indice, texto, filtros, 1);
  return prueba.total > 0 ? texto : null;
}

export { resaltar } from "./resaltar";
