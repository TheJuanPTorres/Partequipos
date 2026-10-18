# Importación del catálogo de repuestos de WordPress

Las marcas, los tipos de equipo y los **modelos de repuestos** del WordPress
actual, como **datos**, con el **logo de cada marca**, a `marcas`,
`tipos-equipo`, `modelos-repuesto` y `Media`. Mismo método que los usados:
simulación, idempotencia, manifiesto y retirada exacta. Estudio previo y
decisiones de dirección:
`Desktop\partequipos-cierre\informes\2026-10-13-repuestos-wordpress-estudio.md`.

```
npm run preview:repuestos:simular            # sin escribir en la base ni en el Blob
npm run preview:repuestos:simular -- fotos   # además, comprueba en WordPress las fotos de los modelos
npm run preview:repuestos:importar           # escribe en el preview
npm run preview:repuestos:retirar            # deshace lo del manifiesto
```

Solo el **preview**: la carga en producción irá por runbook de dirección (§6).

> **LAS FOTOS DE LOS MODELOS SÍ SE IMPORTAN desde el 2026-10-17** (decisión
> del cliente: se migra toda la información de su web). Del 2026-10-13 al
> 2026-10-17 no se importaban (dirección). Detalle en §10.

## 1. Fuente: páginas de Elementor, extraídas del XML

En WordPress el catálogo **no es un tipo de contenido**: son 435 páginas de
Elementor bajo `/repuestos-maquinaria-pesada-colombia/`. Ninguna tiene campos
ACF, imagen destacada ni taxonomías, así que cada dato sale del árbol de
widgets.

| Paso | Qué                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| 1    | `python -I scripts/repuestos/extraer-xml.py <exportacion.xml> <salida.json>`                                  |
| 2    | La salida va a `Desktop\partequipos-cierre\repuestos-wordpress.json`. **Nunca al repositorio ni a `public/`** |

El extractor **no lee** autores, usuarios ni comentarios (la exportación los
tiene, con correo e IP). De cada página saca solo la **sección principal
visible en escritorio**: la primera sección de primer nivel que no está oculta
en escritorio y lleva un título. Así quedan fuera:

- la copia para móvil (oculta en escritorio);
- lo oculto en los tres tamaños (logo de la marca y una foto de 2024 de fondo);
- los bloques comunes: lista «Repuestos disponibles para…», plantillas
  incrustadas y llamada a WhatsApp.

## 2. Cómo se convierte cada dato

| WordPress                                          | Nuestro campo                   | Regla                                                                                                                                                                                        |
| -------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ruta                                               | marca, tipo, modelo             | Por profundidad bajo `repuestos-maquinaria-pesada-marcas/`. Los slugs, **tal cual** (§3.3), salvo los 3 con guion bajo (§4)                                                                  |
| Nombre de la marca                                 | `marcas.nombre`                 | El de `docs/inventario-repuestos.csv` («Case Construction», no «CASE CONSTRUCTION»)                                                                                                          |
| Logo de la marca                                   | `marcas.logo`                   | La serie «MARCA-NN.png» del sitio del cliente (§3)                                                                                                                                           |
| Título de la página de tipo                        | `tipos-equipo.nombre`           | Sin «Repuestos para maquinaria pesada» ni la marca del final: «Miniexcavadora»                                                                                                               |
| Título de la página de modelo                      | `modelos-repuesto.nombre`       | Sin «Repuestos (para)», con la escritura del cliente: «Excavadora CATERPILLAR 320B». Así el título por defecto del sitio nuevo, «Repuestos {nombre}», es el título de la página en WordPress |
| Lo que sigue a la marca en el nombre               | `codigo`                        | «320B». Con la marca entera o su primera palabra («CASE»). Si no aparece, del slug                                                                                                           |
| Texto de la sección principal                      | `descripcion`                   | **Tal cual** (dirección): texto plano, un párrafo por línea en blanco. Es de plantilla, 43 variantes                                                                                         |
| `<title>` que hoy publica el sitio (`url-map.csv`) | `seo.metaTitle` (tipo y modelo) | Sin el sufijo «- Partequipos» (el sitio nuevo añade « \| Partequipos»). **Vacío si coincide con el título por defecto**                                                                      |
| Meta descripción que hoy publica el sitio          | `seo.metaDescription`           | Tal cual. Es de plantilla, pero lleva el nombre de cada página y es la que ve Google                                                                                                         |
| Lista «Repuestos disponibles para…»                | —                               | **No es un dato** (dirección): es la misma en todos; la pinta la plantilla                                                                                                                   |
| Imagen de la sección principal del modelo          | —                               | **No se importa** (ver arriba)                                                                                                                                                               |

## 3. Los logos: blancos, para fondo oscuro

La única serie que cubre las 13 marcas es la del propio sitio del cliente,
«MARCA-NN.png» (2023, 419–872 px de ancho): `LOGOS_DE_MARCA` en
`src/lib/repuestos/wordpress.ts`. **Son logos BLANCOS sobre transparente**,
pensados para fondo oscuro: **sobre fondo claro no se ven**. Dirección los pide
al cliente **en color**; mientras tanto, las páginas de repuestos los pintan
sobre una placa oscura (PR #125). Tampoco sirven como imagen al compartir
(`og:image`) sobre fondo blanco.

- El de Hitachi se llama «OKADA-07.png» en WordPress; su texto alternativo allí
  dice Hitachi, y lo es (comprobado a la vista).
- Nombre en `Media`: `wp-logo-<id del adjunto>-<marca>.png`; texto alternativo
  «Logo de {marca}». Una segunda ejecución no los vuelve a subir.

## 4. Lo que no se importa, y las redirecciones

| Qué                                                                                                                                               | Cuántas | Qué se hace                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Borradores `-copy`                                                                                                                                | 2       | Nada (ADR 0004)                                                                                                                                                                                                                                                                                 |
| Ammann (marca y su tipo) y PES Parts Equipment Solutions                                                                                          | 3 URL   | **301 al índice de marcas de repuestos** (dirección; pendiente de confirmar con el cliente)                                                                                                                                                                                                     |
| Modelos CASE con un nivel de más (`…/cargador-frontal-case-construction/repuestos-para-maquinaria-pesada-excavadora-case-construction/<modelo>/`) | 4       | ~~301 a su página madre~~ **Desde el 2026-10-17, modelos del TIPO anidado «Excavadora», con su URL de WordPress, sin 301** (§11)                                                                                                                                                                |
| **Modelos con guion bajo en el slug** (`…-d6k_`, `…-dx225lca-cebdx_`, `…-dx340lca_`)                                                              | 3       | **El `_` no se permite en los slugs del sitio** (dirección, 2026-10-13). `…-d6k_` y `…-dx225lca-cebdx_` se guardan sin él, con **301 desde la URL de WordPress**; `…-dx340lca_` es la misma página que `…-dx340lca`: no se crea, solo el **301 a `…-dx340lca`**. `redirects-map.csv`, corregido |
| Fotos de los modelos                                                                                                                              | 324     | **Se importan desde el 2026-10-17** (decisión del cliente, §10). Antes no (dirección)                                                                                                                                                                                                           |
| Las 32 páginas de categoría técnica                                                                                                               | 32      | Necesitan plantilla y ruta nuevas (hoy dan 404)                                                                                                                                                                                                                                                 |

Las 10 redirecciones (3 de Ammann y PES, 4 de CASE y 3 de los slugs con guion
bajo) se crean en `Redirects` con origen «Migración». **En un
preview no se pueden comprobar** (§10.22): se comprueban en producción.

**La página CASE «Excavadora» colocada como modelo** (bajo «Cargador
frontal»): es una página de tipo en el nivel de modelo. Hasta el 2026-10-17 iba
como modelo «Excavadora CASE CONSTRUCTION», sin código; **desde entonces es un
TIPO anidado con sus 4 modelos** (§11).

**La demo del preview que no existe en WordPress** (dirección: se retira antes
de importar): 2 tipos de Caterpillar (`…-bulldozer-caterpillar` y
`…-retrocargadora-caterpillar`; WordPress escribe `buldozer` y
`retrocargador`) y sus 25 modelos, 21 con el slug de un modelo real que
habrían quedado duplicados bajo el tipo equivocado. El script **se para** si la
demo a retirar no es exactamente esa (o nada, en una segunda ejecución), y
también si alguna solicitud apunta a uno de esos modelos. Sus datos quedan en
el manifiesto; **la retirada de la importación no los vuelve a crear**. En
producción la demo se vacía entera antes (§10.6).

## 5. Resultado en el preview (2026-10-13)

| Colección          | Total | Creados | Actualizados (de la demo) |
| ------------------ | ----- | ------- | ------------------------- |
| `marcas`           | 13    | 8       | 5                         |
| `tipos-equipo`     | 32    | 24      | 8                         |
| `modelos-repuesto` | 346   | 290     | 56                        |
| Logos en `Media`   | 13    | 13      | —                         |
| `redirects`        | 10    | 10      | —                         |

- **Modelos:** 346 de los 347 de WordPress (`…-dx340lca_` va por 301 a
  `…-dx340lca`); 346 con texto; código sacado del nombre en 345 (sin código, la
  «Excavadora» de CASE). Sin duplicados de tipo + slug.
- **SEO:** 310 modelos y 18 tipos guardan su título actual porque difiere del
  título por defecto (p. ej. el título de WordPress dice «Minexcavadora» y el
  `<title>` publicado, «Miniexcavador»). Meta descripción en los 346.
- **Los slugs con guion bajo** se añadieron después (PR de seguimiento): 2
  modelos y 3 redirecciones más sobre la importación del PR #124.
- **Blob:** 13 subidas (los logos). Nada más.
- **Retirada probada de punta a punta:** borró los 288 modelos, 24 tipos, 8
  marcas, 7 redirecciones y 13 logos creados, devolvió los 69 registros
  actualizados a sus valores de antes (5 marcas, 8 tipos y 56 modelos, con sus
  textos y SEO de la demo) y los 13 logos dieron 404. Después se volvió a
  importar.
- **Un script no revalida el sitio** (los `revalidatePath` de los ganchos
  fallan fuera de Next, «static generation store missing»): las páginas
  prerenderizadas toman los datos en el siguiente despliegue.

**Fotos de los modelos** (medido el 2026-10-13; se importan desde el 2026-10-17, §10): 324 subidas
(30 AVIF que pasan a WebP con `sharp` en la máquina que importa; `Media` sigue
sin admitir AVIF, §10.28; el `sharp` 0.35.4 lleva libheif 1.23.2, la versión
corregida del aviso). Con `fotos`, las 324 responden en WordPress y las AVIF se
convierten sin error (7,8 MB → 4,3 MB). El adaptador del Blob hace **un `put`
por fichero** (`uploadFile.js`; `Media` sin tamaños derivados ni subida por
partes).

## 6. Para producción

Runbook de dirección (`Desktop\partequipos-cierre\runbook-importar-repuestos-produccion.md`),
**EJECUTADO el 2026-10-14**. Volver a ejecutarlo (pasos 1 a 7) solo añade
las imágenes de los tipos (§7): 32 subidas al Blob; el resto, sin cambios.

## 7. Imagen de los tipos y fondo de las marcas (agente C, 2026-10-14)

Para que las páginas de marca y de tipo usen las imágenes y textos **reales**
de WordPress y no los de ejemplo de ux-9. Estudio de las 15 páginas de marca y
las 33 de tipo (todo lo visible en escritorio; las plantillas comunes que incrustan, en una muestra):

| Qué hay en WordPress                                                                                           | Campo de D                    | Qué se hace                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La foto de cada tipo: la tarjeta «Repuestos para maquinaria pesada excavadora CATERPILLAR» (`call-to-action`)  | `tipos-equipo.imagen`         | **Se importa**: la primera tarjeta visible de la página del tipo que no es la de WhatsApp. Las 32                                                                   |
| Fondo del encabezado de la marca                                                                               | `marcas.fondoHero`            | **No existe**: el encabezado visible no tiene foto; la única («Banner-principal-2») está oculta en los tres tamaños. Se deja vacío y se quita el de EJEMPLO de ux-9 |
| Título y presentación del encabezado («REPUESTOS PARA MAQUINARIA PESADA CATERPILLAR En Colombia» y su párrafo) | `marcas.descripcion` y global | Ya se importaban (§2); el global ya dice lo mismo                                                                                                                   |
| La página de tipo repite el encabezado y el párrafo de su marca                                                | `tipos-equipo.descripcion`    | Ya se importaba (§2)                                                                                                                                                |
| «Repuestos según tipo de máquina», «Nuestras categorías de repuestos», «Testimonios reales»                    | Global `repuestos-marca`      | Ya coinciden. El enlace de la tarjeta dice «VER MÁS» en WordPress y «Ver todo» en ux-9: manda ux-9                                                                  |

**Sin campo en el sitio nuevo** (no se importan; sin esquema):

- «Por qué elegirnos»: lista común y una frase con la marca, con una foto de banco.
- Las tarjetas de WhatsApp («Estamos aquí para ayudarlo»), algunas con una foto de la marca.
- «Nuestros productos y servicios» y las plantillas comunes de categorías, formulario y sedes.

**Cómo se importa la imagen del tipo:**

- **Fuente:** `extraer-xml.py` añade `tarjeta` a cada página. Una fuente anterior al 2026-10-14 no lo lleva, y la importación se para y pide extraerla de nuevo.
- **Formato:** sale de los **bytes**, no de la extensión. JPEG, PNG y WebP van tal cual; AVIF y HEIF pasan a WebP (`formatoDeImagen`). Hoy son 29 JPEG, 2 WebP y 1 PNG, de 62 kB a 1,6 MB.
- **Nombre en `Media`:** `wp-tipo-<id del adjunto>-<tipo>-<marca>`, nunca el nombre del fichero de WordPress. Una segunda ejecución no la vuelve a subir.
- **Texto alternativo:** «Excavadora Caterpillar». El de WordPress no sirve: es de relleno y a veces describe otra máquina («retroescavadora» en un bulldozer).
- **No pisa a un editor:** la imagen se pone solo si el campo está vacío, es de EJEMPLO de ux-9 (`repuestos-marca-…`) o ya es una `wp-tipo-…` (`puedeSustituirImagen`). La simulación lista en `conImagenDeEditor` los tipos que no toca.
- **Manifiesto:** el valor de antes de cada campo cambiado (imagen del tipo, fondo de la marca) queda en `imagenes`, solo la primera vez. La retirada lo devuelve antes de borrar las subidas.
- **El ejemplo de ux-9** (`npm run preview:repuestos-marca:retirar`, de D) solo devuelve el fondo y la imagen de los tipos si **siguen** siendo los de ejemplo: ya no deja los tipos sin su imagen real.

**Las tarjetas «Maquinaria pesada usada» y «Aditamentos»** (global `repuestos-marca`) **no existen en WordPress**:
allí no tienen imagen propia. Por decisión de dirección (2026-10-14), en lugar de las de ejemplo de ux-9 llevan una foto
real (`IMAGENES_TARJETAS`, `wp-tarjeta-<adjunto>-…`), con la misma regla de no pisar a un editor y su valor de antes en
el manifiesto:

- **usadas:** la primera foto de una de las 128 unidades importadas (una excavadora Hitachi en patio). Se descartaron
  las que llevan el número de serie en el nombre del fichero (§9; lo comprueba una prueba);
- **aditamentos:** la primera tarjeta visible de la página de aditamentos de WordPress (un martillo hidráulico Okada).

**Resultado en el preview (2026-10-14):**

- 32 imágenes subidas y 32 tipos con su imagen; quitado el fondo de ejemplo de Caterpillar.
- Segunda pasada: 0 subidas, mismos números.
- **Retirada completa:** devolvió los 69 registros y las 33 imágenes cambiadas a su valor de antes (el fondo de ejemplo de Caterpillar, las imágenes de ejemplo de los tipos de la demo) y los 45 ficheros dieron 404; después se volvió a importar (32 de 32 tipos con su imagen)

## 8. Series de un tipo: Hitachi EX y ZAXIS (agente C, 2026-10-17)

**Qué había en WordPress.** La página de marca de Hitachi (y sus dos páginas de tipo) no pintaba una tarjeta por tipo,
sino **cuatro por serie**: «excavadora HITACHI EX», «… ZAXIS», «miniexcavadora HITACHI EX» y «… ZAXIS». Cada una era una
tarjeta de Elementor **sin enlace**, con un botón «VER MÁS» que desplegaba una lista de modelos **en texto, sin enlaces**.
No tenían URL, texto ni SEO propios: los modelos cuelgan de los dos tipos (excavadora y miniexcavadora), como los
importamos. Revisadas las 13 páginas de marca y las 33 de tipo publicadas: **solo Hitachi** tiene el caso.

> Las 4 páginas «de nivel 4» de la extracción **no** eran las series de Hitachi: son las 4 excavadoras de CASE (§4).

**Cómo se recupera (decisión de dirección):**

| Pieza           | Qué                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Esquema         | «Series» (array opcional: nombre y foto; el orden es el de las filas) en `tipos-equipo`, y «Serie» (texto validado contra las de su tipo) en el modelo  |
| Migración       | `20261018_033818_series_repuestos`, solo esquema                                                                                                        |
| Página de marca | Un tipo con series pinta una tarjeta por serie (título de WordPress y su foto, o la del tipo) que enlaza a `…/<tipo>/#serie-<nombre>`                   |
| Página de tipo  | Los modelos se agrupan bajo «Serie EX», «Serie ZAXIS»…, con su ancla; los que no tienen serie, al final en «Otros modelos». Una serie vacía no se pinta |
| URL y SEO       | **Sin URL nuevas, sin 301 y sin bloque SEO por serie**: WordPress no los tenía                                                                          |

Lógica pura en `src/lib/repuestos/series.ts` (con pruebas); las otras 12 marcas, sin series, se pintan como siempre.

**Datos:** `scripts/repuestos/series.ts` (`npm run preview:repuestos:series:simular|aplicar|retirar`), con el plan en
`src/lib/repuestos/seriesHitachi.ts`:

- EX y ZAXIS, en ese orden, en los 2 tipos. EX usa la foto del tipo (la misma de WordPress); las 2 de ZAXIS se
  descargan del WordPress del cliente como `wp-serie-…-zaxis` (dirección: como las demás fotos de tipo). Texto
  alternativo corregido: en WordPress la de excavadora ZAXIS decía «Hitachi CX 200».
- La serie de cada modelo, **por el prefijo de su código** (EX… → EX, ZX… → ZAXIS). Así se corrige la errata de
  WordPress, que listaba la ZX450LC-5 como «EX450LC-5» entre las miniexcavadoras EX. Reparto: excavadora 11 EX ·
  15 ZAXIS; miniexcavadora 6 EX · 14 ZAXIS.
- Manifiesto `Desktop/partequipos-cierre/manifiesto-series-<destino>.json` con lo de antes; la retirada lo devuelve y
  borra las fotos (comprueba el 404). Idempotente. No revalida: después, redesplegar.

Sitio publicado: `Desktop/partequipos-cierre/runbook-series-hitachi.md` (dirección).

**Resultado en el preview (2026-10-17):** simulación con 11 · 15 y 6 · 14; aplicado; segunda pasada «(ya estaban)» y
sin fotos nuevas; **retirada probada** (46 modelos y 2 tipos devueltos, las 2 fotos en 404) y vuelto a aplicar. Las
líneas `[revalidación] falló … static generation store missing` son las de siempre al escribir fuera de Next: no
revalida, por eso se redespliega.

## 9. «Qué incluye» de las 10 categorías técnicas (agente D, 2026-10-18)

Dirección, a partir de los puntos 7, 8 y 17 de la auditoría de estructura de B
(`2026-10-17-auditoria-estructura-listados.md`).

**Qué se construyó**

- **Panel:** campo «Qué incluye» (`grupos`) en cada categoría técnica: hasta 12
  grupos, cada uno con **nombre**, casilla **«Mostrar en la web»**, **foto** y la **lista de
  productos** (hasta 40).
  Migración `categorias_tecnicas_grupos` y `categorias_tecnicas_grupos_productos`
  (solo esquema; el contenido lo pone el importador).
- **Sitio:** la página de categoría pinta una tarjeta por grupo (foto, nombre y
  «Ver productos»), con la lista en un `<details>` nativo: sin JavaScript, con
  teclado y lector de pantalla, y con la lista en el HTML aunque esté plegada. Un
  grupo con «Mostrar en la web» desmarcado no sale. Sin grupos, el apartado no se pinta. Lógica pura en `src/lib/repuestos/grupos.ts`.
- **Tipos de repuestos:** la página de tipo reutiliza el bloque «Nuestras categorías
  de repuestos» de las marcas (`CategoriasMarca`, con su título del global), tras los
  modelos y antes del contacto.

**De dónde sale el contenido.** Cada categoría de WordPress es una página de
Elementor con una columna por grupo: un carrusel de fotos, un título, el botón
«VER MÁS» y una lista de iconos que el botón despliega por JavaScript. Se importa
la **primera foto** del carrusel, el título y cada línea de la lista. Extractor:
`scripts/repuestos/extraer-categorias-grupos.py` (no lee usuarios ni comentarios; la
salida va a `Desktop\partequipos-cierre\`, no al repositorio).

**TAL CUAL ESTÁ EN WORDPRESS (decisión del cliente, 2026-10-18: «se migra todo aunque
esté mal»).** Ni nombres ni listas se corrigen: se conservan las mayúsculas, el «PARA
MAQUINARIA PESADA» de los títulos y las erratas («ENFRIAMENTO», «TRANSIMISIÓN»,
«lLANTA», «pCR»…). Solo se quitan las etiquetas HTML y se juntan los espacios. El texto
alternativo de la foto es el propio nombre del grupo. Las erratas se arreglan desde el
panel cuando el cliente quiera.

**Lo que WordPress tiene oculto** (en escritorio, en los tres tamaños): casi todo son
copias de tarjetas que sí se ven (se descartan, manda la visible), pero **8 grupos no se
enseñan y no tienen copia visible**: «Llanta maciza», «Llanta y rin», «Llanta TBR radial»
y «Llanta PCR radial» (llantas), «Sistema de enfriamiento» y «Sistema lubricación
motor» (motor diésel), «Tándem» (transmisión) y «Líquido de frenos» (lubricantes). Se
importan con la casilla **«Mostrar en la web» desmarcada** (el resto, marcada), para que
el cliente los active si quiere. El extractor los lista como avisos.

**Resultado de la extracción** (grupos · productos): tren de rodaje 7 · 37, filtración
6 · 25, herramienta de corte 7 · 33, lubricantes 9 · 29, llantas y rines 7 · 26,
misceláneos 7 · 61, componentes mayores 6 · 29, motor diésel 6 · 34, transmisión 7 · 46
y componentes hidráulicos 9 · 54. En total, **71 grupos (63 visibles y 8 ocultos), 70
fotos distintas** y 374 productos.

**Importador** `scripts/repuestos/importar-grupos-categorias.ts`
(`npm run preview:grupos-categorias:{simular,importar,retirar}`):

- como los demás: manifiesto fuera del repositorio, retirada exacta (devuelve cada
  categoría a su valor de antes, borra las fotos y comprueba que dan 404) y doble
  cierre en la simulación (sin token del Blob y con `create`/`update`/`delete`
  bloqueados);
- **no pisa lo del panel**: una categoría que ya tiene grupos y no son los que escribió
  esta misma importación se deja como está (`accionGrupos`, con pruebas);
- idempotente: las fotos ya subidas (`wp-grupo-<categoría>-<n>`) se reconocen por su
  nombre y no se repiten.

**Subpáginas viejas (punto 17).** Donaldson, Fleetguard, ITR, CF, llantas OTR, los
baldes y Ammann siguen con su 301 a la categoría. Sus productos ya están en la
lista de la categoría (p. ej. «Filtro de aire», «Cadena», «Llanta OTR convencional»);
sus páginas de marca de filtro, tipos de balde o líneas de PES **no** se recrean como
apartados propios (nada en la auditoría lo pide más allá de «recogerlos dentro de este
apartado»).

**Para el sitio publicado:** `runbook-grupos-categorias-lanzamiento.md`.

## 11. Tipo anidado: la «Excavadora» de CASE (agente C, 2026-10-17)

**Qué hay en WordPress** (auditoría de B, punto 1; decisión de dirección): «Excavadora» de CASE es un **tipo** colgado de
«Cargador frontal», con **4 modelos** con página propia (CX210B, CX220C, CX350B y CX350C), un nivel más abajo que las demás
fichas. Son las 4 páginas «de nivel 4» de la extracción:

```
…/repuestos-para-maquinaria-pesada-case-construction/
  repuestos-para-maquinaria-pesada-cargador-frontal-case-construction/   ← tipo padre
    repuestos-para-maquinaria-pesada-excavadora-case-construction/       ← tipo anidado
      repuestos-excavadora-case-construction-cx210b/                     ← sus modelos
```

Hasta ahora la madre iba como un **modelo** del cargador y las 4 hijas, por **301** a ella. Ahora:

| Pieza           | Qué                                                                                                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Esquema         | «Cuelga de» (`tipoPadre`, mismo marca, un solo nivel) y `slugPadre` (oculto, lo pone el servidor) en `tipos-equipo`. La URL del tipo usa el segmento `<slugPadre>/<slug>` (`src/lib/repuestos/anidado.ts`)     |
| Rutas           | `[marca]/[tipo]/[modelo]` sirve la ficha **o** la página del tipo anidado; `[marca]/[tipo]/[modelo]/[submodelo]` (nueva) sirve sus fichas. El contenido, común: `PaginaTipoRepuestos` y `PaginaModeloRepuesto` |
| Resto del sitio | Tarjeta de la marca, megamenú, sitemap, migas (con el tipo padre), revalidación y 301 automáticos, «Ver en el sitio», buscador y destinos de redirección (`clasificarDestino`, 6 segmentos) usan el segmento   |
| Guardas         | `comprobarPadre`: misma marca, no él mismo, un solo nivel, y que su slug no sea el de un modelo del padre (las dos URL serían la misma). Si cambia el slug del padre, sus hijos se actualizan y dejan su 301   |
| Importador      | `importar-repuestos.ts` ya no crea la madre como modelo ni las 4 redirecciones: en una base nueva, después se ejecuta `tipo-anidado.ts`                                                                        |

**Datos:** `scripts/repuestos/tipo-anidado.ts` (`npm run preview:repuestos:anidado:simular|aplicar|retirar`), desde la
extracción de WordPress:

1. guarda en el manifiesto y **borra el modelo madre** (su URL pasa a ser la del tipo);
2. crea el tipo «Excavadora» bajo «Cargador frontal», con el texto, el SEO de la página viva y la foto de su tarjeta
   (`wp-tipo-15850-…`);
3. crea los 4 modelos con su texto, su SEO y su foto (`wp-repuesto-<adjunto>-…`, el criterio de las fotos de los modelos de A, §10);
4. guarda y **borra las 4 redirecciones 301** hacia la madre.

Idempotente; la retirada (`manifiesto-tipo-anidado-<destino>.json`) lo deshace al revés y vuelve a crear la madre y las 301. No revalida: después, redesplegar. Sitio publicado: `Desktop/partequipos-cierre/runbook-case-excavadora.md`.

## 10. Fotos de los modelos (agente A, 2026-10-17, decisión del cliente)

**El cliente decide migrar toda la información de su web**, aunque esté mal o
desactualizada (CLAUDE.md §10.38). Las fotos de los modelos, que no se
importaban, pasan al campo **«Imágenes (galería)»** que `modelos-repuesto` ya
tenía: **sin migración**. La ficha del modelo ya pinta esa galería.

- **Qué foto:** la de la sección principal de su página en WordPress que no sea
  la **genérica de relleno** (la que sale en 5 páginas o más,
  `fotosGenericas`; hoy una, en 21 modelos). **324 modelos con foto y 323
  ficheros**: una foto la comparten dos modelos y se sube una vez.
- **22 modelos sin foto:** 21 solo tienen la genérica y uno no tiene ninguna.
- **El fichero:** `wp-repuesto-<adjunto>-<modelo>.<ext>`. El formato sale de
  los bytes: las 30 AVIF van a WebP en la máquina que importa (`Media` no
  admite AVIF). Texto alternativo: el de WordPress, o el nombre del modelo si
  es flojo (`altDeRepuesto`).
- **No se pisa lo de un editor:** solo se pone si la galería está vacía o
  solo tiene fotos `wp-repuesto-`. El valor de antes queda en `imagenes` del
  manifiesto y la retirada lo devuelve antes de borrar las fotos.
- **Una segunda pasada no sube nada:** cada foto se busca por su adjunto.
- **Sitio publicado:** `runbook-repuestos-fotos-modelos.md` (en
  `Desktop\partequipos-cierre\`, lo ejecuta dirección): la misma importación
  de siempre, que ahora añade las fotos.

**Hecho en el preview el 2026-10-17:**

- **Importación:** 324 modelos con foto y 323 ficheros.
- **Segunda pasada:** `subidas 0 · yaSubidas 323`.
- **Manifiesto:** 370 ficheros (los 47 de antes y las 323 fotos) y 67 imágenes cambiadas (las 11 de antes y la galería, vacía, de los 56 modelos que no creó la importación).

**Incidente al probarlo, resuelto en el preview:** parar desde Claude Code la primera ejecución en segundo plano **no paró el proceso de Node** (Windows), y corrieron dos importaciones a la vez:

- quedaron **216 fotos duplicadas** sin usar;
- un modelo con la copia repetida de la foto compartida;
- el manifiesto, pisado por los dos procesos.

Un script de un solo uso borró los duplicados (por Payload, que los quita también del Blob), unificó la foto y completó el manifiesto. La segunda pasada lo confirmó. **Regla: nunca dos ejecuciones del importador a la vez**, y tras cortar una, comprobar que no queda ningún `node` con `importar-repuestos` antes de relanzar.
