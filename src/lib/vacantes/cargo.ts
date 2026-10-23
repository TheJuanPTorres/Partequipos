/**
 * El cargo de una vacante en escritura normal (Juan Pablo, 2026-10-23).
 *
 * En Buk los títulos van en MAYÚSCULAS y casi siempre con el lugar dentro, con
 * guion o sin él: «ANALISTA TIC - BOGOTÁ», «… MAQUINARIA AMARILLA- CÓRDOBA»,
 * «… MAQUINARIA NORTE DE SANTANDER». En la página va el cargo como frase, con
 * las siglas en mayúscula, y la ciudad aparte: «Analista TIC» y «Bogotá».
 *
 * Las erratas se quedan como vienen («COMERICAL»): el texto es del cliente.
 * Un título que ya viene con minúsculas se respeta (solo se le quita el lugar).
 */

/**
 * Siglas que se quedan en mayúscula. En un texto todo en mayúsculas no hay
 * forma de distinguir una sigla de una palabra, así que van en una lista; una
 * que falte sale en minúscula («Analista tic») y se añade aquí.
 */
const SIGLAS = new Set([
  "B2B",
  "BI",
  "CAD",
  "CCTV",
  "CNC",
  "CRM",
  "ERP",
  "GPS",
  "HSE",
  "HSEQ",
  "IT",
  "KAM",
  "PESV",
  "PLC",
  "QA",
  "QHSE",
  "RRHH",
  "SAP",
  "SG",
  "SIG",
  "SST",
  "TI",
  "TIC",
  "UI",
  "UX",
]);

/** Nombres propios que pueden salir en un cargo (marcas y la empresa). */
const NOMBRES = [
  "Partequipos",
  "Hitachi",
  "Case",
  "Yanmar",
  "Dynapac",
  "Liugong",
  "Caterpillar",
  "Komatsu",
  "Eni",
  "Ammann",
];

/**
 * Lugares de Colombia que pueden ir en un título aunque no sean la ubicación
 * de la vacante en Buk: los departamentos, las ciudades de las sedes y las
 * principales, y regiones. Al final del título se quitan; en medio, van con su
 * mayúscula.
 */
const LUGARES = [
  // Departamentos
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Valle",
  "Vaupés",
  "Vichada",
  // Ciudades
  "Bogotá",
  "Bogotá D.C.",
  "Medellín",
  "Envigado",
  "Itagüí",
  "Rionegro",
  "Guarne",
  "Caucasia",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Santa Marta",
  "Bucaramanga",
  "Cúcuta",
  "Montería",
  "Istmina",
  "Quibdó",
  "Ibagué",
  "Pereira",
  "Manizales",
  "Armenia",
  "Villavicencio",
  "Neiva",
  "Pasto",
  "Popayán",
  "Tunja",
  "Yopal",
  "Sincelejo",
  "Valledupar",
  "Riohacha",
  "Barrancabermeja",
  "Apartadó",
  // Regiones
  "Eje Cafetero",
  "Costa Atlántica",
  "Costa Caribe",
  "Llanos Orientales",
  "Magdalena Medio",
  "Urabá",
];

/** Palabras de unión que no van en mayúscula dentro de un nombre de lugar. */
const UNIONES = new Set(["de", "del", "la", "las", "los", "y", "en", "para"]);

/** Sin tildes, en minúscula y solo letras y números: para comparar. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const NOMBRES_NORMALIZADOS = new Map(NOMBRES.map((n) => [normalizar(n), n]));
const LUGARES_NORMALIZADOS = new Map(LUGARES.map((l) => [normalizar(l), l]));
/** El lugar más largo, en palabras: hasta dónde mirar hacia atrás. */
const MAX_PALABRAS_LUGAR = Math.max(...LUGARES.map((l) => l.split(" ").length));

/** «Bogotá, Bogotá, D.C.» → «Bogotá»: la ciudad, sin el departamento. */
export function ciudadDe(ubicacion: string): string {
  return ubicacion.split(",")[0]?.trim() ?? "";
}

const esGuion = (t: string) => /^[-–—]$/.test(t);

/** ¿Estas palabras son un lugar? La ubicación de la vacante (ciudad o departamento) o uno de `LUGARES`. */
function esLugar(palabras: string[], ubicacion: Set<string>): boolean {
  const clave = normalizar(palabras.join(" "));
  return !!clave && (ubicacion.has(clave) || LUGARES_NORMALIZADOS.has(clave));
}

/**
 * Quita del final el lugar (con su guion, y una «de» o «en» que quede colgando).
 * Dos pasadas, para «… - MEDELLÍN, ANTIOQUIA» o «… CÚCUTA - NORTE DE SANTANDER».
 */
function sinLugarFinal(tokens: string[], ubicacion: Set<string>): string[] {
  let resto = [...tokens];
  for (let pasada = 0; pasada < 2; pasada++) {
    let quitado = false;
    for (let n = Math.min(MAX_PALABRAS_LUGAR, resto.length - 1); n >= 1; n--) {
      const cola = resto.slice(-n);
      if (cola.some(esGuion)) continue;
      if (esLugar(cola, ubicacion)) {
        resto = resto.slice(0, -n);
        quitado = true;
        break;
      }
    }
    if (!quitado) break;
    while (resto.length > 1) {
      const ultimo = resto[resto.length - 1] ?? "";
      if (esGuion(ultimo) || UNIONES.has(normalizar(ultimo))) resto = resto.slice(0, -1);
      else break;
    }
  }
  return resto;
}

/** «norte de santander» → «Norte de Santander». */
function conMayusculas(palabras: string[]): string[] {
  return palabras.map((p, i) => {
    const min = p.toLocaleLowerCase("es");
    return i > 0 && UNIONES.has(normalizar(p))
      ? min
      : min.charAt(0).toLocaleUpperCase("es") + min.slice(1);
  });
}

/** Una palabra de un título en mayúsculas, como iría en una frase. */
function palabra(original: string): string {
  if (esGuion(original)) return original;
  if (SIGLAS.has(original.replace(/\./g, "").toUpperCase())) return original.toUpperCase();
  return NOMBRES_NORMALIZADOS.get(normalizar(original)) ?? original.toLocaleLowerCase("es");
}

/**
 * «ANALISTA TIC - BOGOTÁ» con ubicación «Bogotá, Bogotá, D.C.» → «Analista TIC».
 * «ASESOR COMERCIAL DE MAQUINARIA NORTE DE SANTANDER» con «Cúcuta, Norte de
 * Santander» → «Asesor comercial de maquinaria».
 */
export function cargoLegible(titulo: string, ubicacion: string): string {
  const ubic = new Set(ubicacion.split(",").map(normalizar).filter(Boolean));
  const tokens = titulo
    .replace(/\s*([-–—])\s*/g, " $1 ")
    .replace(/[.,;:\s]+$/, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const limpios = sinLugarFinal(tokens, ubic);
  // Sin nada antes del lugar (un título que solo es un lugar), se deja tal cual.
  const base = limpios.length > 0 ? limpios : tokens;

  if (/\p{Ll}/u.test(base.join(" "))) return base.join(" ").replace(/ ([-–—]) /g, " $1 ");

  // En frase; los lugares que queden en medio, con su mayúscula.
  const salida: string[] = [];
  for (let i = 0; i < base.length;) {
    let encontrado = 0;
    for (let n = Math.min(MAX_PALABRAS_LUGAR, base.length - i); n >= 1; n--) {
      const trozo = base.slice(i, i + n);
      if (!trozo.some(esGuion) && esLugar(trozo, ubic)) {
        encontrado = n;
        break;
      }
    }
    if (encontrado > 0) {
      salida.push(...conMayusculas(base.slice(i, i + encontrado)));
      i += encontrado;
    } else {
      salida.push(palabra(base[i] ?? ""));
      i += 1;
    }
  }
  const frase = salida.join(" ");
  return frase.charAt(0).toLocaleUpperCase("es") + frase.slice(1);
}
