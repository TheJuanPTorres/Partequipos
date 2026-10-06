# Importación del blog desde el WordPress actual

Importador de las entradas del blog de `partequipos.com` (WordPress) a la
colección `articulos` de Payload. Hecho y probado en el preview; en producción
lo ejecuta dirección cerca del lanzamiento, con
`Desktop\partequipos-cierre\runbook-importar-blog-produccion.md`. Fecha:
2026-10-06.

```
npm run preview:blog:simular    # no escribe nada: dice qué crearía y actualizaría
npm run preview:blog:importar   # crea o actualiza; repetirlo no duplica
npm run preview:blog:retirar    # deshace exactamente la importación (manifiesto)
```

Script: `scripts/blog/importar-wordpress.ts <modo> <destino> [manifiesto=<ruta>]`.

- **Destinos:** `preview`, `produccion` y `prueba`. Producción exige la base Y el token de su almacén (`veredictoDestino`, el mismo de la copia de demostración); solo la usa dirección, con el runbook.
- **Piezas puras, con pruebas:** `src/lib/blog/wordpress.ts`.
- **Fuera del repositorio:** el informe JSON de cada pasada va a `Desktop\partequipos-diseno\wordpress\blog\informe-<modo>-<destino>.json`, y el manifiesto a `Desktop\partequipos-cierre\manifiesto-blog-<destino>.json`.

## Fuente

- API REST pública de WordPress (`/wp-json/wp/v2/`), **sin credenciales**: responde 200 con 53 entradas publicadas. Son las 51 del rastreo y 2 posteriores, `motor-de-giro-de-excavadora-sintomas-de-falla-causas-y-repuestos` (2026-07-28) y `que-significa-una-protuberancia-en-una-llanta-…` (2026-09-25). **Las 2 se añadieron a `url-map.csv`** el 2026-10-06, con su nota en `docs/crawl-reporte.md` §6.
- **Cada respuesta JSON llega precedida por los `<style>` de Elementor de cada entrada**, porque un plugin escribe en la salida. El importador lee desde el primer `[` o `{` del JSON (`extraerJsonWp`).
- **Educado con el servidor:** como mucho una petición cada 700 ms, con un User-Agent que dice qué es. Entradas, categorías e imágenes destacadas van en una petición cada una (listas con `include`). Las imágenes se descargan una a una.

## Qué se importa

| WordPress                     | Payload (`articulos`)                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `slug`                        | `slug`, **el mismo**: las URL del blog (`/<slug>/`) no cambian. Se comprueba al guardar           |
| `title`                       | `titulo` (entidades decodificadas)                                                                |
| `date_gmt`                    | `fechaPublicacion`                                                                                |
| Autor                         | `autor` = **«Partequipos»** (decisión de dirección; en WordPress todas dicen «Analista.Mercadeo») |
| Categoría                     | `categoria` (`categorias-blog` por slug; se crea si falta). Hoy, una: «Noticias»                  |
| `excerpt`                     | `entradilla` (texto plano, sin «[…]», máx. 300 caracteres)                                        |
| `content`                     | `contenido` (Lexical), con las imágenes del cuerpo copiadas a `Media`                             |
| `featured_media`              | `imagenDestacada` (`Media`, con el `alt_text` de WordPress)                                       |
| Yoast `title` y `description` | `seo.metaTitle` / `seo.metaDescription`, **solo si no se repiten en otra entrada** (ver abajo)    |

**La firma en el sitio:** el campo «Autor» se cambia por artículo en el panel, sin esquema (ya existía).

- **Vacío:** el artículo dice «Por Partequipos».
- **En el JSON-LD:** `author` es una `Organization` («Partequipos») si el campo está vacío o dice «Partequipos»; con un nombre de persona, una `Person` (`autorJsonLd`).

## Cómo se convierte el contenido

El contenido está hecho con Elementor (widgets de imagen y de texto). Antes de
convertirlo con `convertHTMLToLexical` de Payload, se aplana:

- **Contenedores fuera** (`div`, `section`, `span`, `figure`…): se quedan sus hijos.
- **Imágenes:** cada una pasa a un marcador que después es un nodo `upload` de la `Media`. Si va dentro de un enlace a la propia imagen, el enlace también se quita.
- **Tablas:** el editor del sitio no tiene tablas, así que cada fila pasa a un párrafo «celda · celda».
- **Widgets de plugins que no son del artículo:** las estrellas de valoración («5/5 - (1 voto)», kk-star-ratings, en las 53 entradas) se quitan.
- **Shortcodes que quedan como texto** (`[if …]`, `[endif]`): se quitan.
- **Enlaces a `partequipos.com`:** pasan a rutas relativas, sin codificar y con la barra final del sitio (las URL del sitio nuevo son las mismas). Si la ruta **no está en `url-map.csv`**, se pregunta a WordPress (HEAD, sin seguir) adónde la lleva: si la redirige a una ruta del mapa, el enlace pasa a esa ruta; si no, se queda y va al informe.
- **Fuera:** `<h1>` del cuerpo (pasa a `<h2>`), `style`, `script`, `iframe`, `video` y formularios. Todo se cuenta en el informe; hoy no hay ninguno.
- **Limpieza del Lexical ya convertido** (`limpiarLexical`): fuera las alineaciones heredadas de estilos en línea (`justify` y `center`) y los párrafos vacíos; y encabezados sin saltos de nivel: el primero es un h2 (el h1 es el título de la página) y ninguno baja más de un nivel respecto al anterior.
- **Comprobación:** se compara el texto antes y después de convertir. Hoy se conserva el **100 %** en las 53 entradas.

El DOM del servidor es **happy-dom**, que llega con `@lexical/headless` (dependencia de `@payloadcms/richtext-lexical`). No es dependencia directa y solo lo usa el script.

## Imágenes

- **Nombre determinista:** `wp-AAAA-MM-<nombre original>`. El Blob añade un sufijo aleatorio (subida directa, §10.39), así que se reconoce con `esMismaImagen`.
- **Repetir no duplica:** se reutiliza la copia más antigua y, si una pasada anterior dejó copias, se borran las `wp-…` que ningún artículo usa.
- **Formatos:** JPEG, PNG y WebP, como admite `Media` (§10.28).
- **AVIF → WebP con sharp**, dentro del script (decisión de dirección). `Media` sigue sin admitir AVIF de entrada; la conversión se hace en la máquina que ejecuta el importador, con imágenes del propio WordPress del cliente, nunca en el servidor del sitio.
- **Texto alternativo**, de mejor a peor fuente (`altParaMedia`):
  1. el de WordPress, si pasa la regla de `altFlojo` (#67);
  2. el **pie de foto** o el **título de la imagen** en WordPress, si describen algo (`textoDescriptivo`: al menos tres palabras, alguna en español, sin identificadores);
  3. «Ilustración de «sección», en el artículo «título»», con el encabezado (o párrafo corto en negrita) bajo el que va la imagen;
  4. «Ilustración del artículo «título» (n)».

  Los dos últimos **quedan marcados para el editor** (empiezan por «Ilustración»). Al repetir la importación solo se rehacen los alt que escribió el importador: los que haya tocado un editor no se tocan.

## Manifiesto y retirada

- **El manifiesto apunta lo que la importación crea** (artículos, imágenes y categorías) y el **valor anterior de cada artículo que ya existía**: título, slug, fecha, autor, entradilla, categoría, imagen destacada, contenido y SEO.
- **Se escribe tras cada paso:** si se corta, se repite y sigue.
- **`retirar`** devuelve los artículos que ya existían a su valor anterior y borra lo creado. Comprueba, pasados 70 s, que los ficheros dan 404 y renombra el manifiesto a `…retirado-<fecha>.json`. **Nunca borra lo que no creó la importación.**

## Resultado en el preview (2026-10-06, tras los cambios de dirección)

**Prueba del ciclo completo**, con huellas de artículos, imágenes `wp-*` y categorías:

1. Partida: 52 artículos (se quitó uno para probar también «crear»), 158 imágenes y 1 categoría (huella `b2a70a0cf80e451b`).
2. Importación: 1 creado, 52 actualizados y 7 imágenes creadas (los AVIF, ya en WebP).
3. Segunda pasada: 0 creados y 0 subidas.
4. Retirada: 52 devueltos, 1 borrado y 7 imágenes borradas, con sus ficheros en 404.
5. **Huella final IDÉNTICA a la de partida.**

Después se importó de nuevo: el preview queda con el blog completo.

| Qué                         | Resultado                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| Entradas                    | **53 de 53 bien**, 0 fallos                                                                 |
| Imágenes                    | 165 en `Media` (`wp-*`), **7 de ellas AVIF convertidos a WebP**                             |
| Omitidas                    | **4**, que dan 404 también en WordPress (abajo)                                             |
| Alt marcados para el editor | **47 imágenes** (el `alt` de WordPress estaba vacío; ver «Calidad del contenido»)           |
| Tablas pasadas a párrafos   | 4 (en 3 entradas)                                                                           |
| Shortcodes quitados         | 2 (`[if]` y `[endif]`, en 1 entrada)                                                        |
| Plugins quitados            | 53 bloques de valoración (kk-star-ratings), uno por entrada                                 |
| SEO de Yoast                | Título en 30 y descripción en 25. En el resto se repetía en varias entradas y no se importa |

**Las 4 omitidas:**

| Motivo                                      | Entrada                                        | Fichero                                                 |
| ------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| 404 también en WordPress                    | martillos-hidraulicos-recomendaciones-de-uso   | `blk_trans.png` (píxel transparente del tema)           |
| 404, URL rota (`partequipos.comquipos.com`) | lubricantes-calidad-especificaciones-y-caract… | `lubricantes-eni-1..png` (×2), `lubricantes-eni-2..png` |

## Calidad del contenido (2026-10-06)

Revisión de los 53 artículos ya importados en el preview. Lo mecánico se arregló en el importador y se volvió a importar; el resto queda aquí.

### Enlaces dentro del contenido

| Qué                                           | Resultado                                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Enlaces internos (a `partequipos.com`)        | **32**, ya como rutas relativas                                                           |
| En `url-map.csv`                              | 11 directos y la portada (`https://partequipos.com`, `http://www.partequipos.com/` → `/`) |
| Redirigidos por WordPress a una ruta del mapa | **2** (`/maquinaria/` → `/maquinaria-pesada/`)                                            |
| **Sin destino** (ya dan 404 hoy en WordPress) | **9 rutas** en 14 enlaces (abajo)                                                         |
| Externos                                      | 44, tal cual (`pe-partsshop.com` en 11 entradas, `hitachicm.com`)                         |

**Rutas sin destino, con la propuesta (NO aplicada):**

| Ruta vieja                                                                                      | Enlaces | Propuesta                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `/maquinaria/maquinaria-nueva/excavadoras/` (una con `#hitachi`)                                | 5       | `/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras/`                                          |
| `/maquinaria/maquinaria-nueva/cargadores/`                                                      | 2       | `/maquinaria-pesada/maquinaria-pesada-nueva/cargadores/`                                           |
| `/maquinaria/maquinaria-nueva/miniexcavadoras/`                                                 | 3       | `/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras/` (no hay categoría propia)                |
| `/maquinaria/maquinaria-nueva/{bulldozer, minicargadores, motoniveladoras, retrocargadores}/`   | 7       | `/maquinaria-pesada/maquinaria-pesada-nueva/` (no hay categoría propia) o la marca correspondiente |
| `/maquinaria-pesada/maquinaria-pesada-nueva/nuestras-marcas/case-construction/retrocargadores/` | 1       | `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/`             |
| `/lubricantes/` (403 en WordPress)                                                              | 1       | `/lubricantes/lubricantes-eni/`                                                                    |

Esos 14 enlaces ya están rotos hoy en WordPress. Si se aprueba la propuesta, son 9 filas en una tabla del importador (o 9 redirects en `Redirects`).

### Textos alternativos de las 165 imágenes

- **Flojos según la regla de C (#67): 0.**
- **Marcados para el editor («Ilustración…»): 47.** De ellos, 27 apariciones con la sección donde va la imagen («Ilustración de «¿Por qué una protuberancia es una señal de alerta?», en el artículo «…»») y 21 con el de respaldo, porque antes de la imagen no hay ni encabezados ni párrafos en negrita.
- **Desde el título de la imagen en WordPress: 6** (7 apariciones). Describen algo, pero son nombres de fichero sin tildes y con restos; conviene que el editor los repase:
  - «Sistema hidráulico del pistón para los tractores niveladoras excavadores»
  - «Fuga de aceite FUSO canter senales comunes»
  - «Tendencias en sistemas hidraulicos y neumaticos»
  - «Mantenimiento de maquinaria pesada lima»
  - «Bombas hidraulicas de engranajes»
  - «Tipos de cilindros hidraulicos ashm»
- **Pies de foto:** ninguno útil (los dos que hay dicen «Version 1.0.0»).

### Restos de WordPress

| Qué                                | Resultado                                                                                                                                                                                                             |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shortcodes                         | 2 (`[if]`, `[endif]`), quitados                                                                                                                                                                                       |
| Estilos en línea                   | 0 en el texto; **5 alineaciones** (2 `justify`, 3 `center`), **quitadas**                                                                                                                                             |
| iframes, vídeos, formularios       | 0                                                                                                                                                                                                                     |
| Párrafos vacíos                    | **2, quitados**                                                                                                                                                                                                       |
| Encabezados que se saltan niveles  | **4 artículos** empezaban en h3 o h4: **corregidos** (empiezan en h2, sin saltos)                                                                                                                                     |
| **Artículos sin encabezados**      | **42.** 26 de ellos usan **170 párrafos cortos en negrita** como títulos. **Propuesta (NO aplicada):** convertirlos en h2 o h3. Cambia la estructura del texto y cómo lo lee un buscador, así que lo decide dirección |
| Saltos de línea dentro de párrafos | 188, de listas escritas a mano con `<br>`. Se quedan                                                                                                                                                                  |

### Plantilla de artículo (medida a 390 y 1440)

Medida con dos artículos largos: `tornamesa-de-excavadora-…` (52 párrafos, 5 imágenes) y `tier-4-en-colombia-…` (encabezados y una tabla convertida). Capturas en `Desktop\partequipos-cierre\capturas\blog-calidad\`.

| Qué                          | Medido                                                         | Valoración                                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ancho del texto              | 358 px a 390 · 672 px a 1440 (`max-w-2xl`)                     | Bien                                                                                                                                                        |
| Longitud de línea            | 37 caracteres a 390 · 76 a 1440                                | Bien (lo ideal, 45–75; a 1440, justo en el límite)                                                                                                          |
| Texto                        | Inter 16/24, gris oscuro sobre blanco                          | Bien                                                                                                                                                        |
| **Espacio entre párrafos**   | **0 px**                                                       | **Falla**: los párrafos se leen como un bloque. El `space-y-4` del `RichText` no llega a los párrafos, que no son hijos directos                            |
| **Jerarquía de encabezados** | h2 20 px/500 · **h3 16 px/500, igual que el texto**            | **Falla**: el h3 casi no se distingue                                                                                                                       |
| **Imágenes del cuerpo**      | `<img>` directa al Blob, sin `next/image` y sin carga diferida | **Falla**: en móvil se descarga la de 1024 px aunque se pinte a 358, y todas se cargan al abrir la página. Llevan ancho y alto, así que el CLS es 0         |
| Tablas                       | Pasadas a párrafos «celda · celda»                             | Se leen, pero se pierde la tabla. Con el editor de tablas de Lexical (`EXPERIMENTAL_TableFeature`) se podrían conservar: cambia la configuración del editor |
| Desbordamiento · CLS         | 0 · 0                                                          | Bien                                                                                                                                                        |

**La plantilla de artículo todavía no tiene el diseño de ux-9.** Las tres fallas son de la plantilla, no del importador: se arreglan con un convertidor propio del nodo `upload` del `RichText` (con `next/image`) y con espacios y tamaños en sus clases. Quedan como propuesta.

## Pendiente

- **Las 47 imágenes marcadas:** revisarlas en el panel («Imágenes», buscando «Ilustración»), y también las 6 que salen del título de la imagen.
- **Los 14 enlaces sin destino y los 170 títulos en negrita:** propuestas de arriba, pendientes de decisión.
- **La plantilla de artículo:** espacio entre párrafos, jerarquía de encabezados e imágenes con `next/image`.
- **El SEO repetido de Yoast** (23 títulos y 28 descripciones sin importar): redactarlos si se quiere uno propio. Mientras tanto, el sitio usa el título y la entradilla.
- **Producción:** con el runbook, cerca del lanzamiento.
