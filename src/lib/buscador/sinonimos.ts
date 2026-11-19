import { terminos } from "./texto";

/**
 * SINÓNIMOS DEL SECTOR (2026-11-18). Cada grupo son palabras que, para quien busca, son lo mismo:
 * escribir una de ellas encuentra también las otras. Base fija (aquí) + los del panel («Sinónimos del
 * buscador», que llegan como líneas «retro = retroexcavadora, retrocargadora»).
 *
 * Una entrada puede ser una FRASE («tren de rodaje»): para casar, el resultado tiene que tener todas
 * sus palabras. La relación es de ida y vuelta dentro del grupo, salvo en `UNA_VIA`: «pala» lleva a
 * «cargador», pero «cargador» no tiene por qué llevar a «pala».
 */
export const GRUPOS_BASE: string[][] = [
  ["retro", "retroexcavadora", "retrocargadora", "backhoe"],
  ["excavadora", "excavator", "excavadora hidraulica"],
  ["miniexcavadora", "mini excavadora", "minicargador excavador"],
  ["cargador", "cargadora", "pala", "pala cargadora", "loader", "payloader"],
  ["minicargador", "mini cargador", "skid steer", "bobcat"],
  ["bulldozer", "buldozer", "tractor de orugas", "dozer", "topadora"],
  ["motoniveladora", "moto niveladora", "niveladora", "grader"],
  ["compactador", "vibrocompactador", "rodillo", "apisonadora"],
  ["aceite", "lubricante", "lubricantes", "grasa"],
  ["filtro", "filtracion", "donaldson"],
  ["rodaje", "tren de rodaje", "cadena", "zapata", "rodillo inferior"],
  ["llanta", "neumatico", "rin", "llantas y rines"],
  ["motor", "motor diesel", "repuestos motor diesel"],
  ["hidraulico", "componentes hidraulicos", "bomba hidraulica", "cilindro"],
  ["balde", "cucharon", "bucket", "herramienta de corte"],
  ["diente", "herramienta de corte", "gets", "cuchilla"],
  ["transmision", "caja", "diferencial", "mando final"],
  ["repuesto", "repuestos", "parte", "pieza", "refaccion"],
  ["servicio tecnico", "taller", "mantenimiento", "reparacion"],
  ["sede", "sucursal", "oficina", "direccion", "ubicacion"],
  ["noticia", "blog", "articulo"],
];

/** Solo de ida: lo que se escribe a la izquierda también busca lo de la derecha. */
export const UNA_VIA: Record<string, string[]> = {
  pala: ["cargador", "cargadora"],
  rodaje: ["tren de rodaje"],
  cadena: ["tren de rodaje"],
  filtro: ["filtracion", "donaldson"],
};

/** término (ya en singular y plegado) → expansiones alternativas, cada una como lista de palabras. */
export type MapaSinonimos = Map<string, string[][]>;

function agregar(mapa: MapaSinonimos, clave: string, expansion: string[]) {
  const lista = mapa.get(clave) ?? [];
  const firma = expansion.join(" ");
  if (!lista.some((e) => e.join(" ") === firma)) lista.push(expansion);
  mapa.set(clave, lista);
}

/** Las líneas del panel: «retro = retroexcavadora, retrocargadora» (una sola vía no; todas se cruzan). */
export function gruposDelPanel(texto: string | null | undefined): string[][] {
  if (!texto) return [];
  return texto
    .split(/\r?\n/)
    .map((linea) =>
      linea
        .split(/[=,;]/)
        .map((p) => p.trim())
        .filter(Boolean),
    )
    .filter((g) => g.length >= 2)
    .slice(0, 500);
}

export function crearMapaSinonimos(extra: string[][] = []): MapaSinonimos {
  const mapa: MapaSinonimos = new Map();
  for (const grupo of [...GRUPOS_BASE, ...extra]) {
    const formas = grupo.map((g) => terminos(g)).filter((f) => f.length > 0);
    for (const f of formas) {
      // Solo se indexa por la palabra suelta o por la frase entera (la primera palabra no basta).
      const clave = f.join(" ");
      for (const otra of formas) {
        if (otra.join(" ") !== clave) agregar(mapa, clave, otra);
      }
    }
  }
  for (const [clave, destinos] of Object.entries(UNA_VIA)) {
    for (const d of destinos) agregar(mapa, terminos(clave).join(" "), terminos(d));
  }
  return mapa;
}
