/**
 * DATOS DE PRUEBA DEL PROTOTIPO. No es contenido real y no sale de Payload.
 *
 * Están aquí, separados del componente, porque el día que esto se apruebe lo
 * único que cambia es de dónde vienen: el componente recibe `slides` por props
 * y no sabe si las pinta un array o una consulta. Ver la propuesta de modelo en
 * el informe de la tarea (campo de la portada frente a colección de slides).
 *
 * Las URL de imagen se pasan por props precisamente para no cablear el Blob:
 * en el preview son las de `Media`, y no hay ninguna URL en este fichero.
 */

export type SlideHero = {
  /** Texto en caso normal. Las mayúsculas las pone el CSS (§4 del encargo). */
  titulo: string;
  parrafo: string;
  /** Destino del icono «+». */
  enlace: { href: string; nombreAccesible: string };
};

export const SLIDES_PROTOTIPO: SlideHero[] = [
  {
    titulo: "Potencia Hitachi",
    parrafo:
      "En Partequipos encuentras maquinaria Hitachi, diseñada para ofrecer rendimiento, precisión y confiabilidad en cada operación.",
    enlace: {
      href: "/maquinaria-pesada/",
      nombreAccesible: "Ver maquinaria Hitachi",
    },
  },
  {
    titulo: "Potencia Caterpillar",
    parrafo:
      "Repuestos y equipos Caterpillar con respaldo técnico, disponibilidad de inventario y asesoría para cada frente de obra.",
    enlace: {
      href: "/repuestos-maquinaria-pesada-colombia/",
      nombreAccesible: "Ver repuestos Caterpillar",
    },
  },
  {
    titulo: "Potencia Komatsu",
    parrafo:
      "Tren de rodaje, motores y sistemas hidráulicos Komatsu, con mantenimiento preventivo y servicio en sitio.",
    enlace: {
      href: "/maquinaria-pesada/",
      nombreAccesible: "Ver maquinaria Komatsu",
    },
  },
];
