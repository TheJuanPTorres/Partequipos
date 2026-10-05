# Ficha de producto de maquinaria nueva (ux-9, V2)

Decisiones al replicar la **ficha de producto V2** de Andrés en las 80 fichas de
maquinaria nueva de `url-map.csv`
(`/maquinaria-pesada/maquinaria-pesada-nueva/marcas/{marca}/{tipo}/{modelo}/`,
sin cambiar slugs). Fecha: 2026-10-05.

## 1. Fuente

| Qué                 | Dónde                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Export de Elementor | `Desktop\partequipos-diseno\wordpress\ficha-producto\elementor-3166-2026-10-05.json`                                              |
| Página pintada      | `https://partequipos.uxdesign.website/ux-9/ux-categoria-principal/categoria-secundaria/ficha-producto-v2/` (página 2523)          |
| Widgets             | `uc_slider_image` y `remote_tabs` (Unlimited Elements), en `wordpress\widgtes\`; el resto son de Elementor                        |
| Medidas             | Tomadas de la página pintada a 390 · 1010 · 1440 (manda lo pintado); los valores están en `src/components/ficha/ficha.module.css` |

La V1 («Ficha producto», página 2288) quedó descartada por dirección.

## 2. Qué es cada bloque

| Bloque de ux-9                               | En el sitio                                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Galería + miniaturas sincronizadas           | `GaleriaFicha` (cliente) con `imagenes` del equipo; reproducir y pantalla completa arriba a la izquierda                        |
| Fondo desenfocado de la tarjeta              | La foto actual a 64 px con `filter: blur`. En ux-9 son copias desenfocadas a mano de cada foto: aquí no hace falta otro fichero |
| Migas en píldora                             | Las migas de la ruta, con enlaces (ver desviación 1)                                                                            |
| Título                                       | `<h1>` con el `nombre`                                                                                                          |
| 4 datos con icono (Peso, Año, Serial, Horas) | Las filas de la ficha técnica marcadas «Destacar», con su icono de Tabler (máximo 4; el panel no deja guardar 5)                |
| «Cotizar el equipo»                          | Baja al formulario de cotización                                                                                                |
| «Habla con un experto»                       | WhatsApp con el número de la empresa (global `seo`) y el nombre y la URL del equipo ya escritos                                 |
| Logo + texto                                 | Logo de la marca (`marcas-maquinaria.logo`); `entradilla`, `descripcion` y los «Puntos destacados»                              |
| «Ficha técnica» (lista)                      | Todas las filas de la ficha técnica (etiqueta: valor)                                                                           |
| «Descargar ficha técnica completa»           | El PDF de `fichaTecnicaPdf` (colección `documentos`, solo PDF). Sin documento, el botón no sale                                 |
| Compartir (WhatsApp, correo, imprimir)       | Enlaces `wa.me/?text=` y `mailto:` con la URL de la ficha, e `window.print()`. Sin scripts de terceros                          |
| «Otras referencias de esta categoría»        | Hasta 3 equipos nuevos del mismo tipo, sin el de la página; 3, 2 o 1 según el ancho. Sin otros equipos, no sale                 |
| Llamada a contactar                          | Texto y botones en el código; la imagen, del global **«Ficha de producto»** del panel. El engranaje de fondo es el de la marca  |
| (no está en el diseño)                       | El formulario de cotización que ya existía, debajo de la llamada a contactar (decisión de dirección)                            |

JSON-LD: `Product` (ahora con la ficha técnica como `additionalProperty`) y
`BreadcrumbList` completo.

## 3. Cambios de esquema (una sola migración, `20261005_142945_ficha_producto`)

- Colección nueva **`documentos`**: solo `application/pdf`, comprobado por
  contenido (`formatoDePdfPermitido`), máximo 4 MB, en el Blob con la guarda
  del almacén. Nunca en `Media` (CLAUDE.md §10.28).
- `equipos-nuevos`: en cada fila de la ficha técnica, **«Destacar»** y
  **«Icono»** (8 opciones de Tabler); y el campo **«Ficha técnica completa
  (PDF)»**. El campo antiguo de imágenes de folletos solo cambia de nombre en el
  panel.
- Global nuevo **`ficha-producto`** con la imagen de la llamada a contactar.

## 4. Desviaciones de ux-9 (para Andrés)

| #   | Qué                                                                                                                                                                                                   | Por qué                                                                                                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1  | **Migas completas en la píldora** (Inicio / Maquinaria pesada / Nueva / Marcas / marca / tipo / equipo). En móvil pasan a dos líneas si no caben. ux-9 pinta solo «Inicio / Maquinaria pesada nueva/» | Decisión de dirección: que sean las migas reales y enlazadas. El `BreadcrumbList`, completo                                                                                                |
| F2  | Los **4 datos** salen de la ficha técnica (peso, potencia, motor…). ux-9 pinta Peso, Año, Serial y Horas                                                                                              | Año, serial y horas son de maquinaria USADA; un equipo nuevo no los tiene                                                                                                                  |
| F3  | Botones de **reproducir y pantalla completa** sobre un círculo oscuro                                                                                                                                 | En ux-9 son iconos blancos finos que casi no se ven sobre una foto clara                                                                                                                   |
| F4  | La **miniatura activa** lleva un borde rojo                                                                                                                                                           | En ux-9 no se sabe cuál está puesta                                                                                                                                                        |
| F5  | La galería se puede **deslizar con el dedo** y, en pantalla completa, tiene flechas, cierre y Escape                                                                                                  | Teclado y móvil                                                                                                                                                                            |
| F6  | En móvil, el **título blanco** lleva una sombra suave                                                                                                                                                 | Sobre el fondo desenfocado claro, el blanco solo no se lee                                                                                                                                 |
| F7  | **Formulario de cotización** debajo de la llamada a contactar; «Contáctanos» y «Cotizar el equipo» bajan a él                                                                                         | Decisión de dirección: es por donde entran los leads                                                                                                                                       |
| F8  | Iconos de **Tabler**, no los de Flaticon del kit                                                                                                                                                      | Licencia L2 pendiente (`docs/diseno/pendientes-andres.md`)                                                                                                                                 |
| F9  | «Puntos destacados» del equipo, como lista bajo el texto                                                                                                                                              | Es contenido que ya existe en el panel y el diseño no tiene sitio para él                                                                                                                  |
| F10 | Con **movimiento reducido**, la galería cambia de foto sin deslizar                                                                                                                                   | WCAG 2.3.3                                                                                                                                                                                 |
| F11 | Las **pastillas de datos** van en columnas fijas de 190 a 270 px (4 por fila en tablet, 2 en escritorio y móvil), con el icono y el texto a la izquierda                                              | ux-9 las fija en 190 px con el texto centrado y datos cortos. Los de una ficha técnica son más largos (salían en tres líneas), y con el texto centrado se movían al llegar la fuente (CLS) |

## 5. Erratas del diseño (para Andrés)

- «Contactanos» → **«Contáctanos»**.
- El texto de relleno es de una máquina **usada** (ZX17U-5A, año, horas,
  serial) en una ficha de **nueva**, y las migas dicen «Maquinaria pesada
  nueva».

## 6. Impresión

`@media print` en `ficha.module.css`: fuera cabecera, pie, botones,
miniaturas, compartir, otras referencias, llamada a contactar y formulario.
Queda la primera foto, el título, los datos, la descripción y la ficha técnica.

## 7. Contenido de ejemplo en el preview

`npm run preview:ficha:sembrar` / `preview:ficha:retirar`
(`scripts/ficha/ficha-preview.ts`). En los 4 primeros equipos Hitachi del tipo
«excavadoras-hitachi» pone fotos de ux-9, una ficha técnica con 4 filas
destacadas, el texto de ux-9 y un PDF de prueba; y la imagen de la llamada a
contactar en el global. Marca «EJEMPLO UX-9 —»; los valores anteriores se
guardan en un manifiesto fuera del repositorio y la retirada los restaura.
Solo preview (guardián de base y almacén).

En producción, la imagen de Andrés de la llamada a contactar va con el permiso
temporal de §10.38, cargada por dirección desde el panel.

## 8. Verificación (preview, 2026-10-05)

| Qué                                    | Resultado                                                                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `<h1>`                                 | Uno (el nombre del equipo), a 390, 1010 y 1440                                                                                               |
| JSON-LD                                | `Product` con marca, 3 imágenes y 6 `additionalProperty`; `BreadcrumbList` con los 7 niveles                                                 |
| Otras referencias visibles             | 3 (1440), 2 (1010), 1 (390)                                                                                                                  |
| Desbordamiento horizontal              | 0 px en los tres anchos                                                                                                                      |
| Galería con teclado                    | Miniatura → cambia la foto (las demás, `inert`); pantalla completa se abre y, al cerrar, el foco vuelve al botón                             |
| Movimiento reducido                    | Sin transiciones (galería y botones)                                                                                                         |
| Impresión                              | Sin cabecera, pie ni botones; primera foto, título, datos, descripción y ficha técnica                                                       |
| Panel, por efecto (`npm run qa:ficha`) | `documentos` rechaza un PNG llamado .pdf y un PDF cortado (en español) y acepta uno válido; la ficha técnica rechaza 5 destacadas y acepta 4 |
| **CLS**                                | **0,00011 (390) · 0,0002 (1010) · 0,00011 (1440)**                                                                                           |

**CLS ACEPTADO, mismo criterio que Nosotros (decisión 6 de
`decisiones-nosotros.md`).** Es la llegada de Inter (sin precarga, §10.36):
los separadores de las migas, los dos puntos de los datos y el elemento del
menú de la cabecera se corren unos píxeles dentro de su línea. Antes de las
columnas fijas y de la etiqueta y el valor en líneas aparte (F11) era 0,003,
porque los datos cambiaban de línea al llegar la fuente.

**Sin revisar en pantalla:** el formulario del panel con «Destacar» e
«Icono». `npm run panel:revision` necesita `.env.editor-preview.local`, que no
está en esta copia de trabajo; ya incluye las pantallas nuevas (Documentos,
global «Ficha de producto» y un equipo con PDF).
