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
| Ruta                                               | marca, tipo, modelo             | Por profundidad bajo `repuestos-maquinaria-pesada-marcas/`. Los slugs, **tal cual** (§3.3); los que no se pueden guardar tal cual quedan pendientes (§4)                                     |
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
pensados para fondo oscuro: **sobre fondo claro no se ven**. Quien pinte las
páginas de repuestos (el agente D) tiene que ponerlos sobre fondo oscuro o
pedir otra versión al cliente. Tampoco sirven como imagen al compartir
(`og:image`) sobre fondo blanco.

- El de Hitachi se llama «OKADA-07.png» en WordPress; su texto alternativo allí
  dice Hitachi, y lo es (comprobado a la vista).
- Nombre en `Media`: `wp-logo-<id del adjunto>-<marca>.png`; texto alternativo
  «Logo de {marca}». Una segunda ejecución no los vuelve a subir.

## 4. Lo que no se importa, y lo pendiente

| Qué                                                                                                                                               | Cuántas | Qué se hace                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Borradores `-copy`                                                                                                                                | 2       | Nada (ADR 0004)                                                                                                                                                                                                          |
| Ammann (marca y su tipo) y PES Parts Equipment Solutions                                                                                          | 3 URL   | **301 al índice de marcas de repuestos** (dirección; pendiente de confirmar con el cliente)                                                                                                                              |
| Modelos CASE con un nivel de más (`…/cargador-frontal-case-construction/repuestos-para-maquinaria-pesada-excavadora-case-construction/<modelo>/`) | 4       | **301 a su página madre**, la «Excavadora» de CASE, que sí se migra (dirección)                                                                                                                                          |
| **Modelos con guion bajo en el slug** (`…-d6k_`, `…-dx225lca-cebdx_`, `…-dx340lca_`)                                                              | 3       | **PENDIENTES DE DIRECCIÓN.** `formatSlug` quita el `_` y la URL cambiaría (§3.3). `…-dx340lca_` duplica a `…-dx340lca`; los otros dos no tienen gemelo. `redirects-map.csv` decía «ruta conservada idéntica», y no lo es |
| Fotos de los modelos                                                                                                                              | 324     | No se importan (dirección)                                                                                                                                                                                               |
| Las 32 páginas de categoría técnica                                                                                                               | 32      | Necesitan plantilla y ruta nuevas (hoy dan 404)                                                                                                                                                                          |

Las 7 redirecciones se crean en `Redirects` con origen «Migración». **En un
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
| `modelos-repuesto` | 344   | 288     | 56                        |
| Logos en `Media`   | 13    | 13      | —                         |
| `redirects`        | 7     | 7       | —                         |

- **Modelos:** 344 de los 347 de WordPress (los 3 de slug pendiente fuera); 344
  con texto; código sacado del nombre en 343 (sin código, la «Excavadora» de
  CASE). Sin duplicados de tipo + slug.
- **SEO:** 308 modelos y 18 tipos guardan su título actual porque difiere del
  título por defecto (p. ej. el título de WordPress dice «Minexcavadora» y el
  `<title>` publicado, «Miniexcavador»). Meta descripción en los 344.
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

Runbook de dirección, sin ejecutar todavía: vaciar la demo (§10.6), importar
con el destino de producción y comprobar las 7 redirecciones allí. Falta antes
la decisión de los 3 slugs con guion bajo.
