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

> **LAS FOTOS DE LOS MODELOS NO SE IMPORTAN (dirección, 2026-10-13).** Según
> el mapa de navegación, los modelos son enlaces dentro de su tipo; sus fotos,
> solo si el cliente confirma que tendrán página propia. La simulación las
> sigue contando (§5) para cuando se decida.

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
| Modelos CASE con un nivel de más (`…/cargador-frontal-case-construction/repuestos-para-maquinaria-pesada-excavadora-case-construction/<modelo>/`) | 4       | **301 a su página madre**, la «Excavadora» de CASE, que sí se migra (dirección)                                                                                                                                                                                                                 |
| **Modelos con guion bajo en el slug** (`…-d6k_`, `…-dx225lca-cebdx_`, `…-dx340lca_`)                                                              | 3       | **El `_` no se permite en los slugs del sitio** (dirección, 2026-10-13). `…-d6k_` y `…-dx225lca-cebdx_` se guardan sin él, con **301 desde la URL de WordPress**; `…-dx340lca_` es la misma página que `…-dx340lca`: no se crea, solo el **301 a `…-dx340lca`**. `redirects-map.csv`, corregido |
| Fotos de los modelos                                                                                                                              | 324     | No se importan (dirección)                                                                                                                                                                                                                                                                      |
| Las 32 páginas de categoría técnica                                                                                                               | 32      | Necesitan plantilla y ruta nuevas (hoy dan 404)                                                                                                                                                                                                                                                 |

Las 10 redirecciones (3 de Ammann y PES, 4 de CASE y 3 de los slugs con guion
bajo) se crean en `Redirects` con origen «Migración». **En un
preview no se pueden comprobar** (§10.22): se comprueban en producción.

**La página CASE «Excavadora» colocada como modelo** (bajo «Cargador
frontal»): es una página de tipo en el nivel de modelo. Va como modelo
«Excavadora CASE CONSTRUCTION», sin código, para que su URL siga viva.

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

**Fotos de los modelos, por si el cliente las confirma:** serían 324 subidas
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

**Resultado en el preview (2026-10-14):**

- 32 imágenes subidas y 32 tipos con su imagen; quitado el fondo de ejemplo de Caterpillar.
- Segunda pasada: 0 subidas, mismos números.
- RETIRADA_PREVIEW
