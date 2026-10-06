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
- **Enlaces a `partequipos.com`:** pasan a rutas relativas. Las URL del sitio nuevo son las mismas.
- **Fuera:** `<h1>` del cuerpo (pasa a `<h2>`), `style`, `script`, `iframe`, `video` y formularios. Todo se cuenta en el informe; hoy no hay ninguno.
- **Comprobación:** se compara el texto antes y después de convertir. Hoy se conserva el **100 %** en las 53 entradas.

El DOM del servidor es **happy-dom**, que llega con `@lexical/headless` (dependencia de `@payloadcms/richtext-lexical`). No es dependencia directa y solo lo usa el script.

## Imágenes

- **Nombre determinista:** `wp-AAAA-MM-<nombre original>`. El Blob añade un sufijo aleatorio (subida directa, §10.39), así que se reconoce con `esMismaImagen`.
- **Repetir no duplica:** se reutiliza la copia más antigua y, si una pasada anterior dejó copias, se borran las `wp-…` que ningún artículo usa.
- **Formatos:** JPEG, PNG y WebP, como admite `Media` (§10.28).
- **AVIF → WebP con sharp**, dentro del script (decisión de dirección). `Media` sigue sin admitir AVIF de entrada; la conversión se hace en la máquina que ejecuta el importador, con imágenes del propio WordPress del cliente, nunca en el servidor del sitio.
- **Texto alternativo:** el de WordPress si sirve. Si está vacío, es genérico o es el nombre del fichero, va uno de respaldo, «Ilustración del artículo «…» (n)», **que hay que revisar en el panel**.

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

| Qué                       | Resultado                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Entradas                  | **53 de 53 bien**, 0 fallos                                                                 |
| Imágenes                  | 165 en `Media` (`wp-*`), **7 de ellas AVIF convertidos a WebP**                             |
| Omitidas                  | **4**, que dan 404 también en WordPress (abajo)                                             |
| Alt de respaldo           | **44 imágenes** (el `alt` de WordPress estaba vacío)                                        |
| Tablas pasadas a párrafos | 4 (en 3 entradas)                                                                           |
| Shortcodes quitados       | 2 (`[if]` y `[endif]`, en 1 entrada)                                                        |
| Plugins quitados          | 53 bloques de valoración (kk-star-ratings), uno por entrada                                 |
| SEO de Yoast              | Título en 30 y descripción en 25. En el resto se repetía en varias entradas y no se importa |

**Las 4 omitidas:**

| Motivo                                      | Entrada                                        | Fichero                                                 |
| ------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| 404 también en WordPress                    | martillos-hidraulicos-recomendaciones-de-uso   | `blk_trans.png` (píxel transparente del tema)           |
| 404, URL rota (`partequipos.comquipos.com`) | lubricantes-calidad-especificaciones-y-caract… | `lubricantes-eni-1..png` (×2), `lubricantes-eni-2..png` |

## Pendiente

- **Las 44 imágenes con alt de respaldo:** revisarlas en el panel («Imágenes», buscando «Ilustración del artículo»).
- **El SEO repetido de Yoast** (23 títulos y 28 descripciones sin importar): redactarlos si se quiere uno propio. Mientras tanto, el sitio usa el título y la entradilla.
- **Producción:** con el runbook, cerca del lanzamiento.
