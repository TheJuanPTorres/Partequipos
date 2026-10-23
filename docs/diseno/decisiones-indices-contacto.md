# Páginas índice (repuestos y maquinaria), Contáctanos y Trabaja con nosotros — inventario y propuesta

Agente D, 2026-10-14. Plantillas de Andrés en `partequipos-diseno\wordpress\`:

| Plantilla                          | Fichero                                                   | Referencia pintada (WordPress de Andrés)                              |
| ---------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| «Repuestos para maquinaria pesada» | `repuesto-principal\Repuesto para maquinaria pesada.json` | `partequipos.uxdesign.website/ux-9/repuestos-para-maquinaria-pesada/` |
| «Categoría principal»              | `categoria-principal\Categoria Principal.json`            | `…/ux-9/ux-categoria-principal/`                                      |
| «Contáctanos»                      | `contacto\Contactanos.json`                               | `…/ux-9/contacto/`                                                    |
| «Trabaja con nosotros»             | `trabaja-con-nosotros\Trabaja con Nosotros.json`          | `…/ux-9/trabaja-con-nosotros/` (se construye desde el 2026-10-23, §4) |

Medidas tomadas de las referencias pintadas a 390, 1010 y 1440 (las dos primeras miden igual en alto: 2893, 2777 y 2871).

## 1. Las dos páginas índice son UNA plantilla

**Estructura (idéntica en las dos):** el encabezado de la página de marca (tarjeta redondeada con foto y velo, icono
de ratón) **sin logo y sin segunda línea**, y debajo una sección blanca de esquinas redondeadas con **seis tarjetas**
(tres por fila; la segunda fila es una repetición de relleno de Andrés y se oculta en móvil). Las tarjetas son las de
la página de marca: foto de 399 × 266, radio 20, panel blanco que sube sobre la foto, título de 20 px y «Ver todo →».

| Elemento                                 | Repuestos (`3172`)                                                                                                                     | Categoría principal (`2099`)                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Antetítulo (en negrita, sobre el título) | «Somos tu socio confiable en maquinaria pesada y repuestos»                                                                            | «Venta de repuestos»                              |
| Título                                   | **Pintado: «Repuestos para Maquinaria pesada»** (el JSON dice «Encuentra Maquinaria y Repuestos Rápido y Fácil»: manda lo pintado, §9) | «Encuentra Maquinaria y Repuestos Rápido y Fácil» |
| Párrafo                                  | «Partequipos SAS se enorgullece de ser tu destino de confianza para maquinaria pesada, repuestos y servicios técnicos de calidad…»     | no tiene                                          |
| Fondo                                    | La cabina de excavadora de la página de marca (`ZX130-7H…`, de Andrés, L3)                                                             | `564564.jpeg`: una excavadora Hitachi en una mina |
| Tarjetas                                 | «Maquinaria pesada nueva», «usada», «Aditamentos», **repetidas** (relleno)                                                             | las mismas                                        |

**Un solo componente** `IndiceTarjetas` (encabezado + rejilla de tarjetas, con los estilos de `marca.module.css`),
usado por `/repuestos-maquinaria-pesada-colombia/` y por `/maquinaria-pesada/`. Para el encabezado se añade un
`antetitulo` opcional a `VistaEncabezado` y la segunda línea pasa a ser opcional; las páginas de marca, tipo y
categoría no cambian.

## 2. Contenido real propuesto para las tarjetas

Las tarjetas de Andrés son relleno. Propuesta con **seis tarjetas reales** por página, **enlaces que ya existen** e
**imágenes de la web original** (`partequipos.com/wp-content/uploads/…`, del propio cliente; se suben a `Media` por
script, nunca al repositorio). Las imágenes se eligen mirando el preview; las de abajo son candidatas halladas en las
páginas actuales.

**Repuestos** (`/repuestos-maquinaria-pesada-colombia/`):

| #   | Tarjeta                     | Enlace                                                            | Imagen candidata                                      |
| --- | --------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | Repuestos por marca         | `…/repuestos-maquinaria-pesada-marcas/`                           | `2023/10/20210512-131831-Construction-equipment.jpeg` |
| 2   | Categorías técnicas         | `…/categoria-repuestos-para-maquinaria-pesada/`                   | `2023/10/2-2-pins-and-bushes_02.jpg`                  |
| 3   | Tren de rodaje              | `…/categoria-…/tren-de-rodaje-para-maquinaria-pesada/`            | `2025/07/Tren-de-rodaje-1-2.png`                      |
| 4   | Filtración                  | `…/categoria-…/filtracion-para-maquinaria-pesada/`                | `2023/10/filtros-donaldson.jpg`                       |
| 5   | Herramienta de corte (GETS) | `…/categoria-…/herramienta-de-corte-gets-para-maquinaria-pesada/` | `2025/09/Dientes-web-1-1.png`                         |
| 6   | Lubricantes                 | `/lubricantes/lubricantes-eni/`                                   | `2022/03/Lubricantes.jpg`                             |

**Maquinaria** (`/maquinaria-pesada/`):

| #   | Tarjeta                 | Enlace                                                           | Imagen candidata                                      |
| --- | ----------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | Maquinaria pesada nueva | `/maquinaria-pesada/maquinaria-pesada-nueva/`                    | `2024/04/76141-Hitachi.jpg`                           |
| 2   | Maquinaria pesada usada | `/maquinaria-pesada/maquinaria-pesada-usada/`                    | `2022/03/Imagen-ppal-4-scaled.jpg`                    |
| 3   | Aditamentos             | `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/` | `2024/04/grade-control.jpg`                           |
| 4   | Repuestos               | `/repuestos-maquinaria-pesada-colombia/`                         | `2023/10/20210512-131831-Construction-equipment.jpeg` |
| 5   | Lubricantes             | `/lubricantes/lubricantes-eni/`                                  | `2022/03/Lubricantes.jpg`                             |
| 6   | Servicio técnico        | `/servicio-tecnico/`                                             | `2022/05/DSC_0455-N-scaled.jpg`                       |

Con seis tarjetas desaparece la repetición de Andrés y **ninguna se oculta en móvil** (en ux-9 la segunda fila se
oculta porque es relleno; con contenido real ocultarla quitaría enlaces).

## 3. Contáctanos

Sin cambiar la URL (`/contactanos/`, hoy una página institucional que lleva el formulario). La plantilla:

- Antetítulo «Contacto Partequipos» y título (pintado: «Ponte en contacto con nosotro»; **errata**, se corrige a
  «Ponte en contacto con nosotros» y se anota para Andrés).
- A la izquierda una **foto** en tarjeta redondeada (`eed2c5bc…jpg`, dos trabajadores con casco: imagen de Andrés,
  L3, solo preview); a la derecha el formulario **de la página de marca**, con «Estoy interesado en» y «Quién soy»
  (ya existen `interes` y `perfil`), nombre, teléfono, correo y mensaje.
- «Canales adicionales» en rojo y **tres tarjetas** con sombra: «Llámanos», «Email» y «Dirección», con icono; sobre la
  tercera asoma una máquina decorativa (`excavadoras-1-01.png`, de Andrés, L3).
- Los datos salen del **global de la empresa** (`getEmpresa`: teléfono, WhatsApp, correo, dirección y ciudad), no se
  copian a mano. Las páginas del cliente legales/institucionales siguen en `[...slug]`; solo `contactanos` cambia.
- El diseño de Andrés no lleva el horario de atención que hoy muestra `/contactanos/`: se conserva debajo de las
  tarjetas (desviación, y es dato que va en el JSON-LD).

## 4. Trabaja con nosotros: SE CONSTRUYE (Juan Pablo, 2026-10-23)

Del 2026-10-14 al 22, `/nosotros/trabaja-con-nosotros/` redirigía con 301 a `https://partequipos.buk.co/trabaja-con-nosotros`
(decisión de dirección del 2026-10-14). Desde el 2026-10-23 es una página propia, en esa misma URL de WordPress, con la
plantilla de Andrés y las vacantes leídas del portal público de Buk. El 301 era código (`src/lib/redirects/fijos.ts`) y
se quitó con la página.

**Plantilla:** `trabaja-con-nosotros\Trabaja con Nosotros.json`, pintada en `…/ux-9/trabaja-con-nosotros/` (medida a
390, 1010 y 1440 el 2026-10-23):

- encabezado de la «Plantilla 1» (`HeroMarca` con `indice`);
- «Únete a nuestro equipo» (55 px) y la frase (510 px, `secondary`) en una fila sobre una línea;
- tarjetas en filas de cuatro, también a 1010, cada fila con su línea y 18 px. Tarjeta #FAFAFA con 30 px de relleno; cargo
  `cd1706f`; ciudad con icono rojo de 14 px; «Ver oferta» rojo con ojo y radio 30. En móvil, una por fila;
- «¿No ves una oferta para tu perfil?»: caja gris con radio 30 y la imagen recortada que sube 120 px (508 · 228 · 59 %).

**Desviaciones:**

| Diseño                                                                      | Aquí                                                                                                               | Por qué                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Formulario con nombre, correo y hoja de vida                                | Botón «Envíanos tu hoja de vida» al portal de Buk                                                                  | Juan Pablo: no guardamos datos personales           |
| Foto de fondo del encabezado y persona del bloque final (kit de Andrés, L3) | Campos opcionales en «Páginas índice y contacto» → «Trabaja con nosotros»; vacíos, tono oscuro y bloque sin imagen | Assets nunca al repositorio; licencia sin confirmar |
| Engranaje decorativo tras la persona (`image-3.png`)                        | No se pinta                                                                                                        | Asset del kit sin licencia                          |
| —                                                                           | Filtro por ciudad (enlaces `?ciudad=`), solo con 8 o más vacantes                                                  | Juan Pablo; `noindex` y canónica sin filtro         |
| —                                                                           | Estado sin vacantes: aviso y «Ver el portal de empleo»                                                             | El diseño no lo tiene                               |

**Vacantes:** `src/lib/vacantes/`, módulo aislado. La página solo usa `obtenerVacantes()`; el día de la API oficial de Buk
(`GET /recruiting/selection_processes`, con clave del cliente: `informes/2026-10-23-buk-vacantes.md`) se cambia el lector y
la página no se toca.

- Se lee el listado desde el servidor, como mucho cada 6 h (también tras un fallo), con un User-Agent propio y sin seguir
  redirecciones.
- La última copia buena se guarda en el global «Vacantes de Buk» y se pinta si la lectura falla o el marcado cambia
  (`MarcadoCambiado`). Sin copia, estado vacío. Una lista vacía en Buk es «no hay vacantes».
- El interruptor «Leer vacantes de Buk» está en ese global. Al guardarlo se invalida `datos:vacantes`.
- Cargo como frase, con las siglas (`SIGLAS` de `cargo.ts`) y sin el lugar del final (la ubicación de Buk o un lugar de
  `LUGARES`, con guion o sin él); ciudad aparte. Las erratas se quedan.
- SEO: el de la página institucional `nosotros/trabaja-con-nosotros` del panel, si existe. La ruta comodín y el sitemap la
  excluyen (`SLUGS_CON_RUTA_PROPIA`) y el sitemap la anuncia una vez.
- El enlace «Trabaja con nosotros» del pie es dato del panel (global «Pie de página»).

## 5. Esquema (APROBADO por dirección el 2026-10-14, una sola migración)

Global `paginas-indice` («Páginas índice y contacto», grupo «Partes del sitio»), **solo opcionales** salvo el título y
el enlace de cada tarjeta. Migración `20261014_054118_paginas_indice`: crea las tablas y **siembra con SQL explícito
los textos y las seis tarjetas de cada página** (título y enlace), sin imágenes.

- `repuestos` y `maquinaria` (dos grupos iguales): `antetitulo`, `titulo`, `texto`, `fondo` y `tarjetas` (hasta 6:
  `titulo`, `enlace`, `imagen`).
- `contacto`: `antetitulo`, `titulo`, `tituloCanales`, las tres etiquetas de los canales, `tituloHorario`, `foto` e
  `imagenDecorativa`. Teléfono, correo y dirección salen del **global de la empresa**.

## 6. Decisiones de dirección (2026-10-14) y desviaciones del diseño

| #   | Decisión / desviación                                                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `/maquinaria-pesada/` pasa a la plantilla de seis tarjetas (antes, una lista de dos enlaces).                                                                                                                                                                                |
| D2  | **Título de repuestos: el PINTADO** («Repuestos para Maquinaria pesada»). El JSON exportado dice «Encuentra Maquinaria y Repuestos Rápido y Fácil» (que es el de la página de maquinaria): **diferencia JSON / pintado para Andrés.**                                        |
| D3  | El antetítulo de «Categoría principal» pintado es «Venta de repuestos» (relleno que no corresponde a maquinaria): **decidido por dirección (2026-10-14): «Maquinaria nueva y usada»** (ya sembrado por la migración).                                                        |
| D4  | Seis tarjetas **reales** (marcas, categorías, tren de rodaje, filtración, GETS, lubricantes / nueva, usada, aditamentos, repuestos, lubricantes, servicio técnico) en vez de las tres repetidas de Andrés; ninguna se oculta en móvil. Fotos de la web original del cliente. |
| D5  | La principal de repuestos ya no enlaza directamente a cada marca y cada categoría (lo hacía la versión provisional anterior): enlaza a los dos índices y a tres categorías; el resto, a un clic de distancia.                                                                |
| D6  | Contáctanos: el título es el `<h1>` (en ux-9, `<h2>`); errata «con nosotro» corregida; el horario de atención se conserva bajo las tarjetas de canales; el teléfono y el correo son enlaces; la foto se oculta en móvil, como en ux-9.                                       |
| D7  | Contáctanos **pinta la tarjeta roja del pie**, como la plantilla (antes se ocultaba, decisión del 2026-10-06 para la ficha de producto).                                                                                                                                     |
| D8  | «Trabaja con nosotros» **NO se construye** (2026-10-14): 301 a Buk. **SUSTITUIDA el 2026-10-23**: página propia con las vacantes de Buk (§4).                                                                                                                                |

## 7. Imágenes

`npm run preview:indices:sembrar` / `:retirar` (solo preview, con manifiesto): sube las fotos de las tarjetas y las
cuatro de los huecos (fondos de los encabezados, foto y máquina de Contáctanos), **todas de la web original del
cliente** (`partequipos.com`). Las de Andrés (L3) ya no se usan.

**Fotos reales de los huecos** (propuesta del agente D, 2026-10-14; buscadas en la biblioteca completa de la web original,
20.002 imágenes, sin las galerías de unidades usadas):

| Hueco               | Elegida                                                          | Por qué                                                                                 | Descartadas                                                                                                                 |
| ------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Fondo de repuestos  | `PARA-REPUESTOS-BANNER-PPAL` (2022/04), cadena de tren de rodaje | Es el banner principal de repuestos de su web; oscura y metálica, deja leer texto claro | Baldes en bodega, filtros STAL (fondo blanco: no sirve bajo texto claro)                                                    |
| Fondo de maquinaria | `maquinaria-hitachi-001` (2024/05), Hitachi en un patio          | Es su banner de maquinaria; máquina del color de marca                                  | Retroexcavadora CASE, CAT 966H sobre fondo blanco                                                                           |
| Foto de Contáctanos | `Tecnico-partequipos-Sede-guarne` (2022/05), recorte vertical    | Única foto **de su gente trabajando** que cabe en un retrato                            | Equipo con camisas rojas (horizontal: en vertical se cortan personas); fotos de _call center_ y manos con piezas (de banco) |
| Máquina decorativa  | `865c.png`, motoniveladora CASE (marca que representa)           | PNG con **transparencia real**, 2000 × 1614, recorte limpio                             | Komatsu `pc210lc-10` (sustituida por decisión de dirección); baldes y piezas del cliente (no son una máquina)               |

**Avisos:** la CASE (y la Hitachi del fondo de maquinaria) son fotos de catálogo del fabricante: **el cliente debe
confirmar su licencia** (la web original no tiene una máquina recortada propia); la del técnico, aprobada por dirección, ya la
usa la tarjeta de servicio técnico (misma persona, otro recorte). **No hay** foto de asesores comerciales en retrato: si
se quiere una mejor, la tiene que hacer el cliente.

**En PRODUCCIÓN:** las 10 de las tarjetas, y las 4 de los huecos **si dirección las aprueba** (runbook §1b); si no, esos
huecos quedan vacíos y las páginas lo toleran. Pasos en `runbook-indices-produccion.md` (en `partequipos-cierre`), con
los ficheros listos en `partequipos-diseno\wordpress\indices\assets\`.

## 8. Coordinación

- `/maquinaria-pesada/` es la sección de **B**: avisado en `ESTADO.md`. Su #140 (categoría secundaria) no la toca.

## 9. Tarjetas de la «Plantilla 1» como el diseño (agente C, 2026-10-18)

Dirección comparó las tarjetas del componente común (`IndiceTarjetas` → `TarjetasMarca` con `indice`; los índices de
Repuestos y Maquinaria y las 5 páginas de marca de nueva) con la referencia de ux-9. La referencia pintada está en
mantenimiento: se replicó del export (`wordpress/plantilla-1/elementor-3569-2026-10-18.json`) y de las capturas de
dirección a 1440 (`capturas-andres/plantilla-1/`). Solo cambia la variante de índice (`.tarjetasIndice`); las tarjetas de
la página de marca de repuestos siguen igual.

| Qué                  | Antes                          | Ahora (como el diseño)                                                                                                                                                                   |
| -------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recuadro             | Blanco macizo                  | **Vidrio** del export: blanco al 12 %, borde blanco al 25 %, `backdrop-filter: blur(18px)` y sombra suave, con un degradado al 60 % de blanco donde acaba la foto y a blanco a los 54 px |
| Solape sobre la foto | 54 px                          | **34 px**: los −54 del export más los 20 px de hueco de Elementor entre foto y recuadro (28–34 px en las capturas)                                                                       |
| Aire entre filas     | 0 a 1440 (pegadas)             | **32 px** (unos 32 en las capturas; 30 en móvil)                                                                                                                                         |
| Fotos                | Las de fondo blanco se perdían | Caja gris claro con `mix-blend-mode: multiply`: el blanco de las fotos de producto toma el gris y se ven las 4 esquinas y el borde de arriba alineado; recorte estable al encoger        |
| Botón                | Flecha de 14 px, sin borde     | Flecha maciza de 16 px a 12 px del texto y borde de 1 px de su color, como el export                                                                                                     |

**Medido en el preview, 7 páginas × 390, 1010 y 1440:** fotos a la misma altura en cada ancho (234 · 296 · 279 px) y con
radio de 20 px en las 4 esquinas; aire entre filas de 30 · 32 · 32 px; **contraste del título contra el píxel más oscuro de
su fondo real (texto oculto), 16,2:1 como mínimo** (AA pide 4,5); el botón no cambia de colores; sin desbordamiento ni
errores. Capturas y medidas en `Desktop/partequipos-cierre/informes/capturas-2026-10-18-plantilla1/` (con el lado a lado de
la referencia a 1440).

**Recuadro que se desplaza con el scroll (2026-10-18, dirección: «sí, como la referencia»).** El export lo trae
(`motion_fx_translateY`, tipo elemento, velocidad 0,5). Fórmula de Elementor: −(recorrido − 50) × velocidad, donde el
recorrido es el % de la ventana que la tarjeta lleva atravesado: +25 px al asomar por abajo, 0 en el centro (la posición
de siempre) y −25 px al salir por arriba (`src/lib/repuestos/desplazamiento.ts`, con pruebas). `RecuadrosConScroll`
(componente de cliente: depende del scroll) solo mueve los recuadros a la vista, con `transform` y una vez por fotograma.
Con «reducir movimiento», quieto (en el componente y en el CSS). **Medido en las 7 páginas × 3 anchos:** recorrido +23 · 0 ·
−10 px con la tarjeta entrando, centrada y arriba; con «reducir movimiento», 0 en las tres; el scroll no suma CLS (el de la
carga, ≤ 0,0025, es el mismo con y sin «reducir movimiento»); contraste del título con la tarjeta arriba (el recuadro más
subido sobre la foto) de **8,65:1 como mínimo**; sin errores.

**La foto al pasar el ratón (2026-10-18, dirección).** Antes se encogía a 0,95 y asomaba el gris de la caja con las
esquinas descuadradas. Ahora llena SIEMPRE la caja: en reposo, `scale(1.08)`; al pasar el ratón, baja a 1, nunca por
debajo; la caja recorta con `overflow: hidden` y `clip-path: inset(0 round 20px)`. Con «reducir movimiento», quieta a
1,08 y sin animación. **Medido a 1440 en las 7 páginas** (cada tarjeta, ratón fuera, a mitad de la animación y encima):
escala 1,08 → 1, la foto cubre la caja en los tres momentos, radio de 20 px en las 4 esquinas; el recuadro con el scroll
igual que en el #249; con «reducir movimiento», 1,08 fija y el recuadro quieto.

**Antetítulo de la cabecera en blanco (2026-10-18, dirección).** «Somos tu socio confiable…» pasa del rojo del diseño a
**blanco**, con foto y sin ella: el rojo no se leía sobre la foto (desviación del diseño, anotar para Andrés). En blanco,
con el velo de siempre (negro al 45 %), no llegaba a AA sobre las fotos claras (3,38–3,97:1: el fondo detrás llegaba a
rgb(140,140,140)); el velo de la cabecera de la «Plantilla 1» pasa al **60 %** (solo `.heroIndice`; las cabeceras de
marca y tipo de repuestos no cambian). **Medido contra el píxel más claro de su fondo real (texto oculto), 7 páginas × 390,
1010 y 1440:** 5,78:1 como mínimo con foto; 19:1 en la cabecera oscura sin foto (Aditamentos). Captura a 1440 en
`capturas-2026-10-18-plantilla1/antetitulo-*-1440-despues.png`.

## 10. Tarjetas ocultables y última fila centrada (agente C, 2026-10-19, petición del cliente)

- **Ocultar sin borrar.** Cada tarjeta de «Páginas índice y contacto» (Repuestos y Maquinaria) tiene la casilla «Mostrar en la web», marcada por defecto. Desmarcada, `tarjetasDeIndice` no la pinta; vacía (filas anteriores) cuenta como marcada. Migración `20261019_205349_indice_tarjetas_mostrar`, solo esquema (`DEFAULT true`).
- **Índice de Repuestos:** solo «Repuestos por marca» y «Categorías técnicas». Las otras cuatro (Tren de rodaje, Filtración, Herramienta de corte (GETS) y Lubricantes) se conservan desmarcadas. En el preview, desmarcadas por SQL; en el sitio publicado, desde el panel con `runbook-indice-repuestos-dos-tarjetas.md`.
- **Última fila centrada.** Una rejilla CSS no centra una fila a medias, así que en `.tarjetasIndice` la lista pasa a flex con salto de línea y `justify-content: center`, y cada tarjeta mide exactamente una columna de la rejilla de antes: `(100% − (n − 1) × 20 px) / n`, con n = 3, 2 o 1 según el ancho. Las filas completas quedan igual; el recuadro con scroll (#249) no cambia (solo `transform`).
- Vale para todas las páginas con `IndiceTarjetas`: índices de Repuestos, Maquinaria pesada y usados, y las marcas de nueva.
- **Sustituido por §11** (el mismo día): el centrado pasa a una rejilla de 6 columnas y la regla cambia con 4 tarjetas.

## 11. Regla de colocación de las tarjetas (agente A, 2026-10-19, petición del cliente)

Para **todas** las secciones de `TarjetasMarca`: tipos de la marca de repuestos, categorías del tipo de repuestos, «Plantilla 1» de los índices (Repuestos, Maquinaria pesada, usados) y marcas de nueva.

| Tarjetas                           | Escritorio (≥ 1025 px)                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| 1 o 2                              | Centradas                                                                                |
| 4                                  | 2 + 2, centradas. **El único caso de 2 columnas**                                        |
| Cualquier otro (3, 5, 6, 7, 8, 9…) | 3 columnas, la última fila incompleta centrada (5 → 3 + 2; 7 → 3 + 3 + 1; 8 → 3 + 3 + 2) |

- **Tablet** (768–1024): 2 columnas, la última impar centrada. **Móvil:** 1 columna.
- **La tarjeta no cambia de ancho:** mide una columna de la rejilla de 3 (de 2 en tablet), también cuando van 2 por fila.
- **Cómo:** rejilla de 6 columnas (4 en tablet) con cada tarjeta ocupando 2; las de una fila incompleta empiezan una columna más a la derecha (`nth-child` / `nth-last-child`, y `:has()` para «exactamente 4»). Con el mismo hueco entre columnas, 2 de 6 miden lo mismo que 1 de 3. Solo CSS, sin JavaScript; las filas siguen igualando el alto de sus tarjetas y el recuadro con scroll (#249) no cambia.
- Sustituye al flex del §10, que solo cubría los índices.
