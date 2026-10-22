# Blog — índice con la plantilla de Andrés y artículo con diseño propio (2026-10-21)

Fuente del diseño del índice: `Blog.json` (Elementor, plantilla «Blog page» de
Andrés; guardado en `Desktop\partequipos-diseno\wordpress\blog\Blog.json`).
Andrés **no** tiene plantilla de artículo.

## 1. Índice (`/noticias/` y `/category/<slug>/`)

Qué dice el export y qué se hizo:

| Pieza del export                                                                       | En el sitio                                                                                                                      |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Cabecera de 50 vh con dos títulos que se revelan por palabras                          | `HeroMarca` con `indice`: «Partequipos» / «Nuestro Blog». Sin vídeo de fondo (el export lleva uno): tono oscuro de los índices   |
| «Categorías» + buscador (píldora, borde de 3 px, fondo #f7f7f7)                        | Lateral al 30,78 %: título, buscador y casillas en un formulario GET                                                             |
| Filtro de casillas (círculo de 16 px, rojo al marcar, con recuento)                    | Igual, con recuento `(n)` y texto para lectores de pantalla                                                                      |
| «Filtros activos» y «Limpiar filtros» (botón rojo, negro al pasar)                     | Chips con ✕ (cada uno quita ese filtro) y «Limpiar filtros». El texto va blanco, no negro (el negro sobre #e5242d no llega a AA) |
| `post_blocks`: foto en caja con 10 px de relleno y radio 39 px, «Leer» en píldora roja | Tarjeta con foto, fecha y minutos, título, **extracto de unos 100 caracteres** y «Leer»                                          |
| Paginación de cuadrados de 32 px, el actual en negro                                   | Cuadrados de 44 px (objetivo táctil), el actual en negro, «‹ ›» y salto «…»                                                      |

- **Regla de las tarjetas (#281):** 3 por fila en escritorio con la última fila
  incompleta centrada, 1 o 2 centradas, 4 en 2 + 2; tablet 2 (la impar
  centrada), móvil 1. Solo CSS.
- **9 artículos por página** (3 × 3): 53 artículos → 6 páginas.
- **Filtros como en usados:** el módulo común `src/lib/filtros/` con una sola
  faceta («categoría»). La URL lleva los filtros (`?categoria=noticias`), una
  forma canónica por combinación (308 a ella), sin JavaScript funciona, y la
  vista filtrada o con búsqueda va `noindex, follow` con canónica a la página 1
  sin filtros (`metadataIndiceBlog`).
- **Búsqueda (`?buscar=`):** texto libre, no una faceta. Recortada a 60
  caracteres, sin tildes ni mayúsculas, exige todas las palabras sobre título,
  entradilla, categoría y el principio del cuerpo. Siempre `noindex`.
- **Paginación:** `/noticias/pagina/<n>/` y `/category/<slug>/pagina/<n>/`
  (el patrón de usados); `…/pagina/1/` redirige (308) a la página 1; las
  páginas n llevan «· página n» en el título y canónica propia.
- **Datos:** los artículos van en la caché de datos con la etiqueta
  `datos:blog` (`getIndiceBlog`, sin el cuerpo), que invalidan los ganchos del
  artículo y de la categoría. Antes el índice era estático; ahora se pinta en
  cada petición porque lee la query.

### URL que tenía WordPress y qué pasa con cada una

| URL de WordPress      | Estado antes                            | Ahora                                                                                                                      |
| --------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/noticias/`          | Índice real, con su meta description    | **Se mantiene** y es el índice con la plantilla nueva                                                                      |
| `/blog-partequipos/`  | Landing de la plantilla (la referencia) | **301 a `/noticias/`** (ya cargado, `huerfanas.ts`; ADR 0008)                                                              |
| `/category/noticias/` | Archivo automático, 200 e indexado      | **Se mantiene** con la misma plantilla y canónica propia (un 301 al índice filtrado lo perdería: el filtrado va `noindex`) |
| `/category/<otra>/`   | —                                       | Igual que `/category/noticias/`                                                                                            |

Hoy la única categoría es «Noticias»: el filtro de categorías muestra una sola
casilla. La cabecera de un archivo de categoría con otro nombre dice ese nombre
en lugar de «Nuestro Blog».

## 2. Artículo con diseño propio (detrás de un interruptor)

Interruptor **«Diseño del artículo»** (Páginas índice y contacto → Blog;
`blog.disenoArticulo`, por defecto «Provisional» = el artículo de siempre).
Cambiarlo revalida todo el sitio (los 53 artículos son estáticos).

Piezas (todas con tokens de Andrés: negro #100f0f, rojo #e5242d, grises
#56545a y #f7f7f7, esquinas de 30 px, píldoras):

- Cabecera baja oscura con migas, categoría (píldora roja), `<h1>`, fecha,
  minutos de lectura y autor. El alto del título y de la línea de fecha lo
  fija la copia invisible de siempre (CLS 0 al llegar Inter).
- Imagen destacada grande, esquinas de 30 px, con precarga.
- Columna de lectura de 720 px: títulos, listas con viñeta roja, citas,
  tablas (región con desplazamiento propio y foco de teclado), imágenes en
  `<figure>` con pie si el texto alternativo describe algo.
- «En este artículo» (índice de los h2 y h3): fijo a la izquierda desde 1025 px,
  desplegable encima del texto en el resto; el título que se lee se marca.
- Barra de progreso de lectura de 3 px, decorativa.
- Compartir: WhatsApp, LinkedIn y Facebook (enlaces de compartir, sin scripts
  de terceros) y «Copiar enlace» (solo con JavaScript).
- Llamada final oscura: «Contáctanos» abre la ventana emergente del formulario
  (con «Ciudad» y «¿Qué necesitas?», origen = el artículo), WhatsApp y, si
  procede, el enlace a una categoría del sitio.
- Tres artículos relacionados con las tarjetas del índice.
- SEO: URL, título, descripción, canónica e imagen social como antes;
  JSON-LD **`BlogPosting`** (con `articleSection` y `wordCount`) y
  `BreadcrumbList`. Con el interruptor apagado el JSON-LD sigue siendo `Article`.

### Cómo se relaciona un artículo con una categoría del sitio (PROPUESTA)

Hoy la categoría de un artículo es del blog («Noticias»), no del catálogo, y no
hay campo que las una. Sin esquema nuevo, la llamada final enlaza a la categoría
**cuyo nombre aparece en el título** (`categoriaRelacionada`): una palabra
distintiva (seis letras o más, sin «repuestos», «maquinaria», «componentes»…)
de una categoría técnica de repuestos o de una categoría de usados; gana la que
sale antes en el título, y las de repuestos van primero. Ejemplos:
«…protuberancia en una llanta…» → «Ver repuestos de Llantas y Rines»;
«Motor de giro de excavadora…» → «Ver excavadoras usadas». Sin coincidencia, no
se pinta el enlace.

Alternativa **exacta**: un campo «Categoría del sitio relacionada» en el
artículo (relación a una categoría técnica o de usada), editable en el panel.
Cuesta una migración más; queda a decisión de dirección.

## 3. Menú

«Blog» → `/noticias/` es un enlace más de la lista «Enlaces del menú» del
global **Cabecera** (los mismos datos alimentan el menú de escritorio y el
móvil). Queda en la **posición 5 (la última, antes del botón «Contáctanos»)**:
Maquinaria Pesada · Repuestos · Lubricantes · Servicio Técnico · Blog. Es un
enlace sencillo, sin desplegable. En el preview con
`npm run preview:blog:menu -- agregar|quitar`; en el sitio publicado, a mano
desde el panel (`runbook-blog-menu.md`).
