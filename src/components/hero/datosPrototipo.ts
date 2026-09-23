import { IMAGENES_HERO_PROTOTIPO, type ImagenHero } from "./imagenesPrototipo";

/**
 * DATOS DE PRUEBA DEL PROTOTIPO. No es contenido real y no sale de Payload.
 *
 * Están aquí, separados del componente, porque el día que esto se apruebe lo
 * único que cambia es de dónde vienen: el componente recibe `slides` por props
 * y no sabe si las pinta un array o una consulta (ADR 0009).
 *
 * CADA TÍTULO VA CON SU MÁQUINA. La primera versión repetía la excavadora
 * Hitachi en las tres diapositivas —«POTENCIA KOMATSU» sobre una Hitachi—; eso
 * no se puede enseñar a nadie.
 */

export type SlideHero = {
  /** Texto en caso normal. Las mayúsculas las pone el CSS. */
  titulo: string;
  parrafo: string;
  /** Destino del icono «+». */
  enlace: { href: string; nombreAccesible: string };
  fondo: ImagenHero;
  /**
   * Máquina recortada en PNG transparente, la que pasa por delante del título.
   * OPCIONAL: sin ella la diapositiva se pinta solo con el fondo y el hueco
   * conserva su tamaño, así que el título y las flechas no saltan al cambiar.
   */
  frontal?: ImagenHero;
};

const { caterpillar, hitachi, komatsu } = IMAGENES_HERO_PROTOTIPO;

export const SLIDES_PROTOTIPO: SlideHero[] = [
  {
    titulo: "Potencia Hitachi",
    parrafo:
      "En Partequipos encuentras maquinaria Hitachi, diseñada para ofrecer rendimiento, precisión y confiabilidad en cada operación.",
    enlace: { href: "/maquinaria-pesada/", nombreAccesible: "Ver maquinaria Hitachi" },
    fondo: hitachi.fondo,
    frontal: hitachi.frontal,
  },
  {
    titulo: "Potencia Caterpillar",
    parrafo:
      "Excavadoras Caterpillar y sus repuestos, con respaldo técnico y disponibilidad de inventario para cada frente de obra.",
    enlace: {
      href: "/repuestos-maquinaria-pesada-colombia/",
      nombreAccesible: "Ver repuestos Caterpillar",
    },
    fondo: caterpillar.fondo,
  },
  {
    titulo: "Potencia Komatsu",
    parrafo:
      "Excavadoras Komatsu con tren de rodaje, motor y sistema hidráulico respaldados por mantenimiento preventivo.",
    enlace: { href: "/maquinaria-pesada/", nombreAccesible: "Ver maquinaria Komatsu" },
    fondo: komatsu.fondo,
  },
];
