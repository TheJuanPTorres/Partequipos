# Importación del blog desde el WordPress actual

Importador de las entradas del blog de `partequipos.com` (WordPress) a la
colección `articulos` de Payload. **Solo preview** hasta que dirección decida
otra cosa. Fecha: 2026-10-06.

```
npm run preview:blog:simular    # no escribe nada: dice qué crearía y actualizaría
npm run preview:blog:importar   # crea o actualiza; repetirlo no duplica
```

Script: `scripts/blog/importar-wordpress.ts`. Piezas puras, con pruebas:
`src/lib/blog/wordpress.ts`. El informe JSON de cada pasada queda fuera del
repositorio, en `Desktop\partequipos-diseno\wordpress\blog\informe-<modo>.json`.

## Fuente

- API REST pública de WordPress (`/wp-json/wp/v2/`), **sin credenciales**: responde 200 con 53 entradas publicadas. Son 51 de `url-map.csv` y 2 posteriores al rastreo: `motor-de-giro-de-excavadora-sintomas-de-falla-causas-y-repuestos` (2026-07-28) y `que-significa-una-protuberancia-en-una-llanta-…` (2026-09-25).
- **Cada respuesta JSON llega precedida por los `<style>` de Elementor de cada entrada**, porque un plugin escribe en la salida. El importador lee desde el primer `[` o `{` del JSON (`extraerJsonWp`).
- **Educado con el servidor:** como mucho una petición cada 700 ms, con un User-Agent que dice qué es. Entradas, categorías e imágenes destacadas van en una petición cada una (listas con `include`). Las imágenes se descargan una a una.

## Qué se importa

| WordPress                     | Payload (`articulos`)                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `slug`                        | `slug`, **el mismo**: las URL del blog (`/<slug>/`) no cambian. Se comprueba al guardar        |
| `title`                       | `titulo` (entidades decodificadas)                                                             |
| `date_gmt`                    | `fechaPublicacion`                                                                             |
| Autor (Yoast `author`)        | `autor`, texto libre. Hoy todas las entradas dicen **«Analista.Mercadeo»**                     |
| Categoría                     | `categoria` (`categorias-blog` por slug; se crea si falta). Hoy, una: «Noticias»               |
| `excerpt`                     | `entradilla` (texto plano, sin «[…]», máx. 300 caracteres)                                     |
| `content`                     | `contenido` (Lexical), con las imágenes del cuerpo copiadas a `Media`                          |
| `featured_media`              | `imagenDestacada` (`Media`, con el `alt_text` de WordPress)                                    |
| Yoast `title` y `description` | `seo.metaTitle` / `seo.metaDescription`, **solo si no se repiten en otra entrada** (ver abajo) |

## Cómo se convierte el contenido

El contenido está hecho con Elementor (widgets de imagen y de texto). Antes de
convertirlo con `convertHTMLToLexical` de Payload, se aplana:

- **Contenedores fuera** (`div`, `section`, `span`, `figure`…): se quedan sus hijos.
- **Imágenes:** cada una pasa a un marcador que después es un nodo `upload` de la `Media`. Si va dentro de un enlace a la propia imagen, el enlace también se quita.
- **Tablas:** el editor del sitio no tiene tablas, así que cada fila pasa a un párrafo «celda · celda».
- **Shortcodes que quedan como texto** (`[if …]`, `[endif]`): se quitan.
- **Enlaces a `partequipos.com`:** pasan a rutas relativas. Las URL del sitio nuevo son las mismas.
- **Fuera:** `<h1>` del cuerpo (pasa a `<h2>`), `style`, `script`, `iframe`, `video` y formularios. Todo se cuenta en el informe; hoy no hay ninguno.
- **Comprobación:** se compara el texto antes y después de convertir. Hoy se conserva el **100 %** en las 53 entradas.

El DOM del servidor es **happy-dom**, que llega con `@lexical/headless` (dependencia de `@payloadcms/richtext-lexical`). No es dependencia directa y solo lo usa el script.

## Imágenes

- **Nombre determinista:** `wp-AAAA-MM-<nombre original>`. El Blob añade un sufijo aleatorio (subida directa, §10.39), así que se reconoce con `esMismaImagen`.
- **Repetir no duplica:** se reutiliza la copia más antigua y, si una pasada anterior dejó copias, se borran las que ningún artículo usa.
- **Solo JPEG, PNG y WebP** (`Media`, §10.28). **AVIF no se importa:** decodificarlo es justo el riesgo del CVE.
- **Texto alternativo:** el de WordPress si sirve. Si está vacío, es genérico o es el nombre del fichero, va uno de respaldo, «Ilustración del artículo «…» (n)», **que hay que revisar en el panel**.

## Resultado en el preview (2026-10-06)

| Qué                       | Resultado                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Entradas                  | **53 de 53 bien**, 0 fallos. 45 creadas y 8 actualizadas (las de demostración del preview, que ya tenían esos slugs) |
| Idempotencia              | Segunda pasada: 0 creadas, 53 actualizadas, 0 imágenes subidas, 0 borradas. `Media` con 158 imágenes `wp-*`          |
| Imágenes del cuerpo       | 112 importadas, **10 omitidas**                                                                                      |
| Imágenes destacadas       | 52 importadas, **1 omitida** (AVIF)                                                                                  |
| Alt de respaldo           | **40 imágenes en 16 entradas** (el `alt` de WordPress estaba vacío)                                                  |
| Tablas pasadas a párrafos | 4 (en 3 entradas)                                                                                                    |
| Shortcodes quitados       | 2 (`[if]` y `[endif]`, en 1 entrada)                                                                                 |
| SEO de Yoast              | Título en 30 y descripción en 25. En el resto se repetía en varias entradas y no se importa                          |

**Las 11 omitidas:**

| Motivo                                      | Entrada                                        | Fichero                                                 |
| ------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| 404 también en WordPress                    | martillos-hidraulicos-recomendaciones-de-uso   | `blk_trans.png` (píxel transparente del tema)           |
| 404, URL rota (`partequipos.comquipos.com`) | lubricantes-calidad-especificaciones-y-caract… | `lubricantes-eni-1..png` (×2), `lubricantes-eni-2..png` |
| AVIF                                        | tier-4-en-colombia-que-es-y-como-impacta…      | `result_img_big-1024x903.avif`                          |
| AVIF (cuerpo y destacada)                   | retroexcavadoras-la-maquina-todoterreno…       | `Hotspot-575SV-1024x576.avif`                           |
| AVIF                                        | partequipos-distribuidor-oficial-de-handok…    | `…kawasaki_repair_parts_for_pump.avif`                  |
| AVIF (×2)                                   | nok-sellos-especiales-para-maquinaria-pesada…  | `…Oil-Seal.avif`, `…Suspension-Parts.avif`              |
| AVIF                                        | moto-reductor-de-traslacion-de-excavadora…     | `sk135-swing-motor-…-1024x1024.avif`                    |

## Pendiente

- **Las 7 AVIF:** que el cliente o quien edite las suba en JPG o WebP.
- **Las 40 imágenes con alt de respaldo:** revisarlas en el panel («Imágenes», buscando «Ilustración del artículo»).
- **El autor «Analista.Mercadeo»:** confirmar con el cliente qué firma se publica.
- **El SEO repetido de Yoast** (23 títulos y 28 descripciones sin importar): redactarlos si se quiere uno propio. Mientras tanto, el sitio usa el título y la entradilla.
- **Las 2 entradas que no están en `url-map.csv`:** son URL nuevas. Decidir si entran en el mapa.
- **Producción:** no se ha tocado. Para llevarlo allí hace falta la decisión de dirección y un runbook.
