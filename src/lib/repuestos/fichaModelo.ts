import { normalizarBusqueda } from "./buscarModelo";
import type { ModeloEnlace } from "./tipo";

/**
 * Lógica pura de la FICHA DE MODELO sin fotos y de la lista de modelos en texto (Ronda 12,
 * 2026-11-08): el cliente vende repuestos, no máquinas.
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";

/** El texto por el que se busca una tarjeta de modelo: su nombre, su código y su serie, normalizados. */
export function textoDeBusqueda(m: {
  nombre: string;
  corto?: string | null;
  codigo?: string | null;
  serie?: string | null;
}): string {
  return normalizarBusqueda([m.nombre, m.corto, m.codigo, m.serie].filter(Boolean).join(" "));
}

/**
 * UNA LÍNEA de texto del modelo: la primera frase de la descripción de WordPress, cortada en
 * una palabra si pasa de `max` caracteres. Sin descripción, vacío (la línea no se pinta).
 */
export function lineaDeTexto(descripcion: string | null | undefined, max = 160): string {
  // Un guion de lista («- Filtros para …») no se pinta (Juan Pablo, #458).
  const limpio = texto(descripcion).replace(/\s+/g, " ").replace(/^-\s+/, "");
  if (!limpio) return "";
  const frase = limpio.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? limpio;
  if (frase.length <= max) return frase;
  const corte = frase.slice(0, max);
  const espacio = corte.lastIndexOf(" ");
  return `${(espacio > max * 0.6 ? corte.slice(0, espacio) : corte).replace(/[\s,;:.]+$/, "")}…`;
}

/**
 * El `<h1>` de la ficha (Juan Pablo, #433): solo tipo y modelo corto, «Bulldozer 1150M». La marca ya
 * va en el logo, en las migas y en el `<title>`.
 */
export function tituloFichaModelo(d: {
  tipo: { nombre: string };
  modelo: { nombre: string; codigo?: string | null };
}): string {
  return [texto(d.tipo.nombre), texto(d.modelo.codigo) || texto(d.modelo.nombre)]
    .filter(Boolean)
    .join(" ");
}

export type DatoClave = { etiqueta: string; valor: string };

/** Los datos clave de la ficha: tipo, serie (si la hay) y modelo (la marca ya va en el logo). */
export function datosClaveModelo(d: {
  tipo: string;
  serie?: string | null;
  modelo: string;
}): DatoClave[] {
  return [
    { etiqueta: "Tipo", valor: texto(d.tipo) },
    { etiqueta: "Serie", valor: texto(d.serie) },
    { etiqueta: "Modelo", valor: texto(d.modelo) },
  ].filter((x) => x.valor);
}

/**
 * «Otros modelos de {tipo} {marca}»: los de la lista del tipo menos el de la página, en el orden
 * de la lista. Una entrada sin página (`href` nulo) no es un destino: no sale.
 */
export function otrosModelosDelTipo(lista: ModeloEnlace[], actual: { id: number }): ModeloEnlace[] {
  return lista.filter((m) => m.href && m.id !== actual.id);
}
