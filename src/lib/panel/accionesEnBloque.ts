/**
 * CAMBIOS EN BLOQUE EN LAS LISTAS DEL PANEL (tanda 21, tarea 3, fase 2, punto 10; Juan Pablo).
 * Con varias fichas marcadas en la lista, un botón las muestra u oculta en la web a la vez y, en
 * las usadas, las marca vendidas o disponibles. Es UNA petición a la API de Payload con la misma
 * selección de la lista (también «todas las páginas»), con la sesión y el acceso del editor, y
 * cada ficha pasa por sus ganchos (revalidación incluida), como si se guardara una a una.
 *
 * «Publicar» y «Despublicar» varias a la vez ya los trae Payload en las colecciones con borradores
 * (artículos y páginas): no se repiten aquí.
 */

export type AccionEnBloque = {
  clave: string;
  /** El texto del botón. */
  texto: string;
  /** Lo que se guarda en cada ficha seleccionada. */
  datos: Record<string, unknown>;
  /** La pregunta antes de hacerlo, con el número de fichas. */
  pregunta: (n: number) => string;
  /** El aviso al terminar. */
  hecho: (n: number) => string;
};

const fichas = (n: number) => (n === 1 ? "1 ficha" : `${n} fichas`);

const MOSTRAR: AccionEnBloque = {
  clave: "mostrar",
  texto: "Mostrar en la web",
  datos: { mostrarEnWeb: true },
  pregunta: (n) => `¿Mostrar ${fichas(n)} en la web?`,
  hecho: (n) => `${fichas(n)} se muestran en la web.`,
};

const OCULTAR: AccionEnBloque = {
  clave: "ocultar",
  texto: "Ocultar de la web",
  datos: { mostrarEnWeb: false },
  pregunta: (n) => `¿Ocultar ${fichas(n)} de la web? Siguen en el panel.`,
  hecho: (n) => `${fichas(n)} ocultas: ya no salen en la web.`,
};

const VENDIDA: AccionEnBloque = {
  clave: "vendida",
  texto: "Marcar vendida",
  datos: { disponible: false },
  pregunta: (n) =>
    `¿Marcar ${n === 1 ? "1 unidad" : `${n} unidades`} como vendida${n === 1 ? "" : "s"}?`,
  hecho: (n) =>
    `${n === 1 ? "1 unidad marcada" : `${n} unidades marcadas`} como vendida${n === 1 ? "" : "s"}.`,
};

const DISPONIBLE: AccionEnBloque = {
  clave: "disponible",
  texto: "Marcar disponible",
  datos: { disponible: true },
  pregunta: (n) =>
    `¿Marcar ${n === 1 ? "1 unidad" : `${n} unidades`} como disponible${n === 1 ? "" : "s"}?`,
  hecho: (n) =>
    `${n === 1 ? "1 unidad marcada" : `${n} unidades marcadas`} como disponible${n === 1 ? "" : "s"}.`,
};

/** Qué botones lleva la lista de cada colección. */
export const ACCIONES_EN_BLOQUE: Record<string, AccionEnBloque[]> = {
  "equipos-nuevos": [MOSTRAR, OCULTAR],
  "modelos-repuesto": [MOSTRAR, OCULTAR],
  "equipos-usados": [MOSTRAR, OCULTAR, VENDIDA, DISPONIBLE],
};
