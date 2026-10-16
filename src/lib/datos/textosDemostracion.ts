/**
 * TEXTOS DE DEMOSTRACIÓN QUE SIGUEN A LA VISTA EN EL SITIO PUBLICADO.
 *
 * La siembra de demostración (`npm run import`, 2026-08-09, §10.6) dejó en
 * varias descripciones la frase «Contenido de demostracion.» y, en el tipo
 * SV208, una nota interna de desarrollo («Anomalia del sitio actual… (ADR
 * 0007)»). Salen en la página y en la meta description. La comprobación del
 * sitio publicado del 2026-10-14 las encontró; decisión de dirección del mismo
 * día: se sustituyen por el texto real de WordPress si existe y, si no, se
 * vacían (la página usa entonces su descripción por defecto).
 *
 * `demo` es EXACTAMENTE el texto sembrado (`scripts/import/data/*.csv`; la
 * prueba lo comprueba): la migración solo cambia el campo si sigue siendo ese,
 * así no pisa nada que un editor haya escrito.
 *
 * El texto real sale de la página de WordPress (exportación XML del
 * 2026-10-07, el texto visible de la introducción):
 * - Las categorías de usada y de nueva no tienen introducción, solo el listado
 *   de unidades, así que se vacían. (Excavadoras nueva tiene al pie una lista
 *   de palabras clave, que no es una descripción.)
 * - Aditamentos: su encabezado. SV208: su párrafo, con la tilde de
 *   «Encuéntrala» corregida. Dynapac: el mismo texto que le pone el importador
 *   de contenido real (`scripts/contenido-real`, el primer párrafo de su página
 *   que nombra la marca), para que el runbook de contenido real no lo cambie.
 *   Desde el 2026-10-16 el importador le pone el texto de la Home V2
 *   (`DESCRIPCIONES_V2` de `extraer-xml.py`); esta migración ya está aplicada
 *   y no se toca.
 *
 * ESTA LISTA ES LA FUENTE DE LA MIGRACIÓN `…_huerfanas_y_textos_demo`, que
 * lleva una copia literal (CLAUDE.md §3.5); `textosDemostracion.test.ts` exige
 * que coincidan.
 */
export type TablaConDescripcion =
  "categorias_usada" | "categorias_maquinaria" | "marcas_maquinaria" | "tipos_maquinaria";

export type TextoDemostracion = {
  tabla: TablaConDescripcion;
  slug: string;
  demo: string;
  /** `null`: se vacía. */
  nuevo: string | null;
};

const DEMO = " Contenido de demostracion.";

export const TEXTOS_DEMOSTRACION: TextoDemostracion[] = [
  // --- Categorías de usada (las 8 sembradas; miniexcavadoras vino después) ---
  {
    tabla: "categorias_usada",
    slug: "bulldozer",
    demo: `Tractores de oruga de segunda mano, revisados antes de la entrega.${DEMO}`,
    nuevo: null,
  },
  {
    tabla: "categorias_usada",
    slug: "cargadores",
    demo: `Cargadores frontales y minicargadores usados.${DEMO}`,
    nuevo: null,
  },
  {
    tabla: "categorias_usada",
    slug: "compactadores",
    demo: `Rodillos y compactadores usados para suelo y asfalto.${DEMO}`,
    nuevo: null,
  },
  {
    tabla: "categorias_usada",
    slug: "excavadoras",
    demo: `Excavadoras hidraulicas usadas de distintas marcas y tonelajes.${DEMO}`,
    nuevo: null,
  },
  {
    tabla: "categorias_usada",
    slug: "minicargadores",
    demo: `Minicargadores de direccion deslizante usados.${DEMO}`,
    nuevo: null,
  },
  {
    tabla: "categorias_usada",
    slug: "motoniveladoras",
    demo: `Motoniveladoras usadas para mantenimiento de via.${DEMO}`,
    nuevo: null,
  },
  {
    tabla: "categorias_usada",
    slug: "retrocargadoras",
    demo: `Retrocargadoras usadas, la maquina mas versatil del inventario.${DEMO}`,
    nuevo: null,
  },
  {
    tabla: "categorias_usada",
    slug: "vibrocompactadores",
    demo: `Vibrocompactadores usados de tambor liso y pata de cabra.${DEMO}`,
    nuevo: null,
  },
  // --- Categorías de nueva ---
  {
    tabla: "categorias_maquinaria",
    slug: "cargadores",
    demo: `Minicargadores y equipos de carga compacta de las marcas que distribuimos.${DEMO}`,
    nuevo: null,
  },
  {
    tabla: "categorias_maquinaria",
    slug: "compactadores",
    demo: `Rodillos de suelo, de llantas y de doble rodillo para compactacion de base y asfalto.${DEMO}`,
    nuevo: null,
  },
  {
    tabla: "categorias_maquinaria",
    slug: "excavadoras",
    demo: `Excavadoras hidraulicas y miniexcavadoras de las marcas que distribuimos.${DEMO}`,
    nuevo: null,
  },
  // --- Marcas de maquinaria nueva ---
  {
    tabla: "marcas_maquinaria",
    slug: "aditamentos",
    demo: `Implementos y accesorios para adaptar la maquinaria a cada frente de obra: martillos, cucharones y acoples.${DEMO}`,
    nuevo:
      "Potencia tu trabajo con nuestra solución líder en el mercado de Aditamentos para maquinaria pesada en Colombia.",
  },
  {
    tabla: "marcas_maquinaria",
    slug: "dynapac",
    demo: `Compactacion y pavimentacion: rodillos de suelo, de llantas, de doble rodillo, pavimentadoras y reglas vibratorias.${DEMO}`,
    nuevo:
      "Descubre la nueva línea de equipos Dynapac con respaldo exclusivo de Partequipos Colombia.",
  },
  // --- Tipo de maquinaria nueva con la nota interna ---
  {
    tabla: "tipos_maquinaria",
    slug: "vibrocompactador-case-sv208",
    demo: "Rodillo vibratorio de suelo. Anomalia del sitio actual: este modelo cuelga al nivel de tipo, no de ficha. Se replica tal cual (ADR 0007).",
    nuevo:
      "El Vibrocompactador SV208 CASE combina potencia, alta fuerza centrífuga y visibilidad de 360 grados para alcanzar los más altos niveles de rendimiento. Con 99 hp (73,8 kW) de potencia, esta es una máquina de compactación altamente confiable, efectiva, de fácil mantenimiento y simple de manejar. Encuéntrala en Partequipos Colombia.",
  },
];
