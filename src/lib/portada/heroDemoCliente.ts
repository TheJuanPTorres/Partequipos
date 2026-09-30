/**
 * DEMO DEL HERO CON LAS FOTOS DEL CLIENTE (2026-10-01), SOLO EN EL PREVIEW.
 *
 * Las fotos las envió el cliente, con derecho de uso confirmado (CLAUDE.md
 * §10.0.1), y siguen solo en el preview hasta que dirección las pase a
 * producción con un runbook. Se suben ya reducidas (JPG de 2560 px, calidad
 * 80, sin metadatos) desde fuera del repositorio, que es público.
 *
 * Títulos con el patrón de ux-9, «<primera palabra> <marca>», y como párrafo
 * las tres palabras del cliente (primera lista). Editables luego en el panel.
 * La segunda lista está en docs/diseno/decisiones-home-ux9.md §15.
 */

/** Marca del texto alternativo: así se reconocen las imágenes de la demo. */
export const MARCA_DEMO = "HERO CLIENTE —";

export type DiapositivaDemo = {
  fichero: string;
  alt: string;
  titulo: string;
  parrafo: string;
  /** Punto focal, en %: qué parte de la foto se conserva al recortar. */
  focalX: number;
  focalY: number;
};

/** Primera palabra de las tres, para el título. */
function titulo(palabras: string, marca: string): string {
  return `${palabras.split(".")[0]!.trim()} ${marca}`;
}

const d = (
  fichero: string,
  marca: string,
  descripcion: string,
  palabras: string,
  focalX: number,
  focalY: number,
): DiapositivaDemo => ({
  fichero,
  alt: `${MARCA_DEMO} ${descripcion}`,
  titulo: titulo(palabras, marca),
  parrafo: palabras,
  focalX,
  focalY,
});

/**
 * En este orden en el hero. CASE no tiene foto (no llegaron ni la 580SV ni la
 * SR240B), así que no tiene diapositiva.
 */
export const DIAPOSITIVAS_DEMO: DiapositivaDemo[] = [
  d(
    "hero-hitachi-zx245uslc-6.jpg",
    "Hitachi",
    "Excavadora Hitachi ZX245USLC-6 en obra",
    "Fuerza. Tradición. Respaldo.",
    48,
    45,
  ),
  d(
    "hero-liugong-856h.jpg",
    "LiuGong",
    "Cargador LiuGong 856H en una cantera",
    "Potencia. Productividad. Capacidad.",
    60,
    60,
  ),
  d(
    "hero-dynapac.jpg",
    "Dynapac",
    "Compactador Dynapac en una vía",
    "Precisión. Compactación. Desempeño.",
    62,
    55,
  ),
  d(
    "hero-yanmar.jpg",
    "Yanmar",
    "Excavadora Yanmar en movimiento de tierras",
    "Precisión. Tecnología. Confianza.",
    45,
    50,
  ),
];

export function esImagenDeDemo(alt: string | null | undefined): boolean {
  return typeof alt === "string" && alt.startsWith(MARCA_DEMO);
}

type IdRel = number | { id: number } | null | undefined;
const idDe = (r: IdRel) => (r && typeof r === "object" ? r.id : (r ?? null));

/** ¿Usa la diapositiva una imagen de la demo? */
export function esDiapositivaDeDemo(
  diapositiva: { imagenFondo?: IdRel },
  idsDemo: number[],
): boolean {
  const id = idDe(diapositiva.imagenFondo);
  return id !== null && idsDemo.includes(id);
}
