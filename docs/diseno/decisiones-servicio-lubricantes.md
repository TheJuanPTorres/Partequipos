# Servicio técnico y Lubricantes ENI — páginas provisionales con el contenido real

Las dos páginas del mapa de alcance que faltaban:

- `/servicio-tecnico/`, con sus anclas;
- `/lubricantes/lubricantes-eni/`.

**PROVISIONALES hasta el diseño de Andrés**, con el lenguaje visual del sitio (el de las páginas de repuestos de D) y el **contenido real** del WordPress actual, sacado de la exportación XML.

**Fuentes:**

- el árbol de Elementor de las seis páginas en el XML (`scripts/servicio-lubricantes/extraer-xml.py`, que salta usuarios y comentarios);
- partequipos.com en vivo;
- el mapa de alcance (`Mapa de Navegación · Partequipos — Alcance de Migración.pdf`, secciones 03 y 04).

Inventario previo y decisiones: `Desktop\partequipos-cierre\propuestas\2026-10-14-servicio-tecnico-lubricantes-inventario.md`.

## 1. Decisiones de dirección (2026-10-14)

1. **Esquema aprobado** para el contenido real completo:
   - productos de lubricante con foto y PDF;
   - ancla en los bloques de página;
   - bloques «Galería» y «Vídeo de YouTube».
2. **Las 4 subpáginas de lubricantes** (auto liviano, auto pesado, engranajes, motos y scooter) pasan a ser **secciones** de la página de la marca, con un **301** de cada URL antigua a su ancla.
3. **Fotos de licencia dudosa: solo en el preview** hasta que confirme el cliente (**levantado el 2026-10-17 por decisión del cliente**, §4):
   - la galería de siniestros;
   - el banner de Hitachi.
4. **Vídeos:**
   - el de alistamiento, por el de **YouTube del cliente** en lugar del MP4 de 24,6 MB;
   - sin el vídeo de fondo de esa sección (13,5 MB), solo con foto;
   - el de la cabecera (3,1 MB), sí.
5. **Se conserva la cuarta ancla**, `#Siniestros`, además de las tres del mapa.

## 2. Cómo está hecho

| Pieza                                                                                                 | Dónde                                                                                     |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Ancla opcional en **todos** los bloques de página (validada: letra inicial, letras, cifras, «-», «_») | `src/collections/bloques/bloquesPagina.ts`, `src/lib/fields/ancla.ts`                     |
| Bloques nuevos «Galería», «Vídeo de YouTube» y «Formulario de contacto»                               | mismo fichero; componentes en `src/components/bloques/`                                   |
| Productos de lubricante: nombre, grado, grupo, foto y ficha (PDF de `documentos`)                     | `src/collections/CategoriaLubricante.ts`                                                  |
| Imagen de cabecera de la marca de lubricantes                                                         | `src/collections/MarcaLubricante.ts`                                                      |
| Página de la marca: cabecera y tarjetas de D, descripción, una sección por línea y el formulario      | `src/app/(site)/lubricantes/[marca]/page.tsx`, `src/components/lubricantes/`              |
| De los documentos a la vista (agrupar productos seguidos con el mismo grupo)                          | `src/lib/lubricantes/marca.ts` (+ pruebas)                                                |
| El destino de un redirect puede llevar ancla (`/a/b#seccion`)                                         | `normalizarDestino` y `separarAncla` en `src/lib/redirects/normalizar.ts`; `src/proxy.ts` |
| Importación del contenido real (simular, importar, retirar; con manifiesto)                           | `scripts/servicio-lubricantes/extraer-xml.py` e `importar.ts`                             |

**Las categorías de lubricante ya no tienen página:**

- su ruta `[categoria]` se quitó;
- salen del sitemap;
- su «Ver en el sitio» del panel lleva al ancla;
- su bloque SEO avisa de que no tiene página (`seoField({ sinPagina: true })`);
- un cambio en una categoría revalida la página de su marca.

**Servicio técnico se compone con bloques:**

| Bloque                                                              | Ancla          |
| ------------------------------------------------------------------- | -------------- |
| Cabecera con vídeo (el `<h1>`)                                      | —              |
| Presentación con imagen                                             | `taller`       |
| Vídeo de YouTube, con el póster del vídeo de WordPress como portada | `alistamiento` |
| Presentación con imagen                                             | `posventa`     |
| Presentación con imagen, sin foto                                   | `Siniestros`   |
| Galería (solo en el preview)                                        | —              |
| Formulario de contacto                                              | `contacto`     |

Sus «Contenido» y «Secciones con ancla» de demostración se vacían al importar.

## 3. Erratas y desviaciones (para Andrés y el cliente)

> **Decisión del cliente (2026-10-18): las erratas y las mayúsculas, tal cual WordPress.** No se copian, por decisión de dirección: las dos fichas técnicas de otro producto y el texto de relleno de la cabecera. Lista para el cliente en `informes/2026-10-18-erratas-wordpress-para-el-cliente.md`.

| En el sitio actual                                                                                         | Aquí                                                                                                             | Por qué                                                                                                         |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| «I-RIDE RACING 10W-60» abre la ficha de I-SIGMA PERFORMANCE E7 15W-40                                      | Sin ficha                                                                                                        | Mejor sin ficha que con la de otro producto. **El cliente tiene que mandar la buena**                           |
| «MULTITECH CT PLUS 10W» abre la ficha de MULTITECH JD/F 10W-30                                             | Sin ficha                                                                                                        | Ídem                                                                                                            |
| «I-SINT 10W-40» no tiene ficha                                                                             | Sin ficha                                                                                                        | Ídem                                                                                                            |
| Varios productos con la foto de otro (OSO 46 y OSO 100 con la de ALARIA 7, MULTITECH CT con la de I-SIGMA) | Igual                                                                                                            | Es lo que publica el sitio; se anota para el cliente                                                            |
| «mOTO & SCOOTER», títulos en mayúsculas escritas a mano                                                    | **Tal cual** («mOTO & SCOOTER», «TRANSMISIONES»…), y en mayúsculas los que WordPress pinta en mayúsculas por CSS | Decisión del cliente (2026-10-18): todo como en WordPress. Hasta entonces, «Moto & scooter» y mayúscula inicial |
| Títulos «¿Tuviste un» + «ACCIDENTE CON TU MAQUINARIA AMARILLA?» en dos encabezados                         | Un solo título, con el texto tal cual: «¿TUVISTE UN ACCIDENTE CON TU MAQUINARIA AMARILLA?»                       | Un encabezado por sección; el texto, como lo pinta WordPress (decisión del cliente, 2026-10-18)                 |
| Subtítulo de la cabecera «Lorem ipsum dolor set amet» y titular animado «Better / Bigger / Faster»         | No se copian                                                                                                     | Texto de relleno del widget                                                                                     |
| Formulario de lubricantes con «Empresa», «Ciudad» y «¿Qué necesitas?»                                      | El formulario del sitio (nombre, correo, teléfono y mensaje)                                                     | Un solo formulario en todo el sitio, con Zod, Turnstile y aviso por SMTP                                        |
| Servicio técnico sin formulario (solo botones a Contáctanos)                                               | Bloque «Formulario de contacto» al final                                                                         | Lo pide el encargo; su texto es nuestro y se cambia en el panel                                                 |

**Desviaciones que quedan:**

- **Orden de las líneas:** por nombre (Auto liviano, Auto pesado, Engranajes, Motos & Scooter), porque las categorías no tienen campo de orden. En WordPress, motos va primero.
- **Galería sin visor a pantalla completa:** rejilla 4:3 con el punto focal.
- **Sin vídeos de fondo en alistamiento ni en lubricantes:** decisión 4.

## 4. Fotos de licencia dudosa

> **DECISIÓN DEL CLIENTE (2026-10-17): se importan en todos los destinos.** El cliente decide migrar toda la información de su web tal como está. Su contenido es su responsabilidad (CLAUDE.md §10.38). El importador ya no salta ninguna; `dudosa: true` queda en el JSON solo como lista. Para el sitio publicado, `runbook-servicio-lubricantes-dudosas.md` (en `Desktop\partequipos-cierre\`, lo ejecuta dirección).

Hasta el 2026-10-17 llevaban `dudosa: true` en el JSON del extractor e importar las saltaba en cualquier destino que no fuera el preview; el bloque o la tarjeta se pintaba igual, sin foto. Son 11:

- Las 7 de la galería de siniestros: miniaturas de YouTube, imágenes de Twitter y una de prensa.
- El banner de Hitachi de posventa.
- **Además, por el mismo criterio:** las fotos de 3 tarjetas de lubricantes. Por su nombre son de banco o de terceros: dos de Freepik y una de DeviantArt.

**Cómo se levantó:** se quita el salto del importador y se repite la importación en el sitio publicado (la segunda pasada no duplica: solo sube las 11 y las pone en su bloque o su tarjeta).

## 5. Medido en el preview (2026-10-14)

- **Importación:** 73 imágenes, 1 vídeo y 67 PDF; la segunda pasada no sube nada (155 reutilizados).
- **HTML:** un `<h1>` por página; las anclas `taller`, `alistamiento`, `posventa`, `Siniestros` y `contacto` en servicio técnico, y las 4 líneas en lubricantes, con 67 fichas.
- **Sitemap:** sin las subpáginas. Los 301 no se pueden comprobar en un preview (§10.22): allí las subpáginas dan 404.
- **Pintado a 390, 1010 y 1440:** sin imágenes rotas, sin desborde horizontal y sin errores de consola. Nosotros, igual.
- **Fallo encontrado al pintar y corregido:** la columna de imagen de «Presentación con imagen» tiene un alto mínimo de 677 px, medido para el mapa de Nosotros. Con una foto apaisada dejaba un hueco grande. Ahora, foto apaisada sin animación: sin ese alto mínimo y a todo el ancho de su columna. El mapa de Nosotros es vertical y no cambia.

## 6. Diseño propio de servicio técnico (aprobado por dirección el 2026-10-19; SUSTITUIDO por el §7)

Andrés no tiene plantilla para esta página. Dirección aprobó la muestra v2 (PR #262) y se aplica a `/servicio-tecnico/`. Lleva el lenguaje de la web nueva (Inter, rojo del kit, radios de 30 px, vidrio, velos y movimiento suave) con composición propia:

- cabecera con vídeo, el texto abajo a la izquierda y un tablero de vidrio «¿Qué necesitas?» con las 4 secciones;
- el taller sobre la textura de WordPress, con la frase de garantía como sello;
- el alistamiento con su vídeo de fondo y los dos vídeos al mismo nivel: el del taller y el corto de YouTube con su miniatura local;
- la posventa en vidrio sobre la foto;
- los siniestros como proceso paso a paso y la galería, presentada por «Trabajamos con las principales aseguradoras», en un mosaico sin huecos (`tamanosBento`);
- la llamada a solicitar un técnico, con formulario y WhatsApp.

**Cómo se edita.** El campo **«Diseño»** de Páginas (`diseno`: «Bloques» o «Servicio técnico») elige la plantilla (`PlantillaServicioTecnico`), que toma cada bloque por su ancla. Campos nuevos, todos opcionales:

| Campo                                                                   | Para qué                                                                                                                                        |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| «Vídeo del taller» y «Vídeo de fondo» en «Vídeo de YouTube»             | Los dos vídeos del alistamiento                                                                                                                 |
| «Textura de fondo» en «Presentación con imagen» y «Proceso paso a paso» | La textura de las secciones                                                                                                                     |
| «Texto de presentación» en «Galería»                                    | La frase bajo el titular                                                                                                                        |
| Bloque nuevo «Proceso paso a paso»                                      | Título, entradilla, pasos (etiqueta y texto), botón y textura. En cualquier otra página se pinta como tarjetas numeradas (`BloqueProcesoPasos`) |

Migración `20261019_144109_servicio_tecnico_diseno`, solo esquema; las demás páginas quedan en «Bloques».

**Lo que faltaba frente a WordPress** (inventario del 2026-10-19), con `importar.ts`:

- la textura `Fondo-2.png`;
- el vídeo alojado de las etapas, que es otro vídeo, no el corto de YouTube;
- el vídeo de fondo de #alistamiento;
- la miniatura del corto de YouTube.

Los dos vídeos van **recomprimidos** por el tope de 4 MB: 480p y sin sonido. Dirección pedirá al cliente subir el de las etapas a YouTube. En WordPress no hay logos de aseguradoras.

**Textos nuestros, editables:**

- «Solicitar un técnico», «¿Qué necesitas?», «Vídeo del taller» y «En YouTube» son de la plantilla;
- la frase de la galería es el «Texto de presentación» del bloque.

## 7. Plantilla de Andrés para servicio técnico (aprobada por dirección el 2026-10-19, PR #269)

Andrés mandó su plantilla (`elementor-4010-2026-10-19.json`) y sustituye al diseño propio del §6. La referencia pintada estaba en mantenimiento, así que se replicó del export. Sigue el mismo interruptor: «Diseño: Servicio técnico» en Páginas (`PlantillaServicioTecnico`), con los mismos bloques. **Sin esquema.**

**Lo que replica:**

- cabecera de vídeo con «Partequipos» y «Servicio técnico» revelados por palabras (`Revelado`);
- cuatro tarjetas con icono que llevan a cada sección. Los iconos son de Tabler; los SVG de Andrés son de su web;
- cada sección con su línea, su antetítulo (el texto de su tarjeta) y dos columnas: el medio y el texto con «Contáctanos»;
- **alistamiento:** carrusel con el vídeo de las etapas y el corto de YouTube (`CarruselVideos`) y, al lado, el texto de **posventa**. Así lo compone Andrés: no hay sección de posventa, y la tarjeta «Servicio postventa» lleva a ese texto;
- **siniestros:** la galería es la de la ficha (`GaleriaFicha`), los 3 pasos van en tarjetas con icono y «Trabajamos con las principales aseguradoras» cierra la sección.

**Decisiones de dirección:**

- la foto de Hitachi de posventa no se pinta (sigue en el bloque);
- los títulos, en MAYÚSCULAS como en WordPress (migración tal cual);
- el vídeo de las etapas sigue recomprimido a 480p. **No está en YouTube:** `Fi2WeEeeeFI` es el corto «Proceso de alistamiento Maquinaria Pesada Usada», y `XHOmBV4js_E` es el vídeo de ejemplo de Elementor;
- **el contacto final es el bloque de las plantillas de Andrés de repuestos** (`ContactoMarca`): antetítulo = título del bloque de formulario («Contacto Partequipos»), título revelado = su texto («Si deseas más información, contáctanos»), con «Ciudad» y el mensaje como «¿Qué necesitas?».

**Se conserva sin estar en la plantilla:** la frase destacada del taller, en negrita bajo su texto.

**Ya no se pintan** (los campos siguen en el panel): la textura, el vídeo de fondo y el texto de la galería. El mosaico (`tamanosBento`) se retiró. `importar.ts` ya solo sube el vídeo de las etapas y la miniatura de YouTube.

**Desviaciones:**

| Desviación                                                         | Motivo                                            |
| ------------------------------------------------------------------ | ------------------------------------------------- |
| El carrusel no pasa solo, y sus puntos tienen 24 px de área táctil | Son vídeos: pasar solo los cortaría a mitad       |
| Las tarjetas van de 2 en 2 en tablet y móvil                       | El export las deja en una fila de 4               |
| El vídeo de cabecera, solo en escritorio                           | Como en todo el sitio                             |
| Las tarjetas, en el gris del kit `#F0F0F0`                         | El global `a3f07e1` no está en el kit que tenemos |
| La galería lleva de fondo la foto desenfocada                      | Es la de la ficha                                 |

## 8. Página general de lubricantes con la plantilla de Andrés (2026-10-20, dirección)

Plantilla 809451 (`Desktop\partequipos-diseno\wordpress\lubricantes\elementor-809451-2026-10-20.json`). Estructura que se
queda: **Lubricantes** (general, esta) → **Lubricantes ENI** (su plantilla llegará) → cada categoría de ENI (Motos &
Scooter, Auto liviano, Auto pesado y Engranajes; su plantilla llegará).

- **`/lubricantes/` es una URL NUEVA.** Antes daba 404 (no estaba en el rastreo ni en el url-map, y no redirigía; la
  que redirige es `/lubricantes-eni/` → ENI, y sigue igual). Entra en el sitemap y en los destinos válidos de
  redirección (`destino.ts`). Migas visuales ocultas, `BreadcrumbList` (Inicio › Lubricantes), título, descripción y
  canónica propios, un solo `<h1>`.
- **Encabezado:** el de las páginas índice («Plantilla 1»: 70 % de la ventana, antetítulo «Partequipos», «Nuestros
  Lubricantes» revelado por palabras e icono del ratón que baja al bloque). El export pinta un **vídeo del kit** con
  gris en «multiply»: no se usa (licencia L3). En su lugar, una foto opcional del panel; sin ella, el tono oscuro de
  los encabezados sin foto.
- **Bloque a dos columnas** (recuadro blanco de radio 30 y relleno del 3 %): a la izquierda el **formulario de
  solicitud** (el nuestro: «Ciudad» y «¿Qué necesitas?»; sin n.º de documento, Ley 1581); a la derecha «Máxima
  protección y eficiencia para tu maquinaria.», el texto, el **logo de la marca destacada** (`LogoMarca`, el de la
  marca en el panel) y **«Ver catálogo»** a su página. En móvil, una columna sobre otra.
- **Textos editables** en «Páginas índice y contacto» → «Página «Lubricantes» (la general)»: antetítulo, título, foto
  de fondo, título y texto del bloque, marca destacada (vacía, la primera marca) y texto del botón. Vacíos, los del
  diseño (`TEXTOS_LUBRICANTES`, `src/lib/lubricantes/general.ts`).
- **Megamenú y menú móvil:** «Lubricantes» pasa a desplegable (`panelLubricantes`): «Ver todos los lubricantes» (→
  `/lubricantes/`) y, por marca, «Lubricantes <marca>» con «Ver todo» a su página y sus categorías **por nombre** (el
  orden de las secciones de la página de ENI). Cada categoría va a su **«Enlace en el menú»** (campo nuevo de las
  categorías de lubricante) o, vacío, a su sección (ancla) de la página de la marca: cuando cada categoría tenga
  página, se cambia ahí. El panel se abre tanto si el enlace de la cabecera apunta a `/lubricantes/` como a la página
  de una marca. **Desde el 2026-10-20 apunta a `/lubricantes/`** (`runbook-cabecera-lubricantes.md`, **EJECUTADO por
  dirección** y comprobado pintado a 1440 y 390: en móvil, el texto «Lubricantes» lleva a la general y el «+»
  despliega ENI y sus 4 categorías).
- **Refresco:** las marcas y categorías de lubricante llevan el gancho del megamenú (también al cambiar el «Enlace en
  el menú»), y guardar una marca revalida además `/lubricantes/` (el logo).
- Migración `20261020_064422_lubricantes_general`, **solo esquema**.

**Desviaciones, para Andrés:**

- El vídeo de fondo del encabezado no se usa (licencia); foto opcional del panel en su lugar.
- El antetítulo va en blanco, como en el resto de páginas índice (decisión de dirección del 2026-10-18: el rojo no se
  leía sobre la foto).
- El botón del export lleva un sobre (`envelope-dot`); aquí, una flecha, porque lleva al catálogo y no al contacto.
- El título del grupo del menú es «Lubricantes <nombre de la marca en el panel>» («Lubricantes Eni» hoy); para que
  diga «ENI», se cambia el nombre de la marca en el panel.

## 9. Lubricantes ENI con la plantilla de Andrés «Categoría Lubricantes» (2026-10-21, dirección; PR #318)

> **Superado en parte por el §10 (2026-10-22):** cada línea tiene su página, la de la marca ya no lista los productos
> ni lleva «Ver catálogo», y el orden de las líneas sale del campo «Orden».

**Fuente:** la página pintada «Categoría Lubricantes» (3946) del sitio de diseño. El export `elementor-811423` que
nombraba el encargo no estaba en disco. **Cambia el diseño, no el contenido:** las líneas siguen siendo secciones de
`/lubricantes/lubricantes-eni/` con su ancla (`#motos-scooter`, `#auto-liviano`, `#auto-pesado`, `#engranajes`), que es
adonde llevan el megamenú y los 301 de las URL viejas.

**Orden** (`PaginaMarcaLubricantePlantilla`):

1. **Cabecera** de las páginas índice (`HeroMarca` con `indice`):
   - la «Imagen de cabecera» de la marca o, vacía, el fondo oscuro;
   - el logo (`LogoMarca`);
   - «Lubricantes {nombre}» revelado por palabras, en el único `<h1>`;
   - la entradilla y el icono del ratón.

   Detrás, la franja del **«Color principal» de la marca en el panel** (`estiloDeMarca`). Vacío, ninguna franja: no
   se inventan colores.

2. **Una tarjeta por línea** (`TarjetasMarca` con `indice` y `cuatroEnUnaFila`):
   - la foto de la línea de siempre, su nombre y «Ver todo» al ancla;
   - con 4, en una fila en escritorio (como la plantilla) y 2 + 2 en tablet y móvil;
   - las 4 visibles en todos los anchos (la plantilla oculta 2 en tablet y pone 1 por fila en móvil: son variantes
     de la maqueta).
3. **Los productos de cada línea**, como estaban (`SeccionesLubricante`).
4. **El bloque final** (`BloqueLubricantes`):
   - nuestro formulario («Ciudad» y «¿Qué necesitas?», sin documento), el mismo que abren los botones «Cotizar»;
   - título y texto de la página general (grupo «Lubricantes» de «Páginas índice y contacto»), que al guardarse
     revalida también esta página;
   - el logo de la marca y «Ver catálogo».

**Desviaciones:**

- **`Lubricantes.jpg` de la plantilla no se usa.** Es un fotograma de banco (1920 × 1080) subido al sitio de diseño
  en 2026-10, no una foto del WordPress del cliente. Manda el campo «Imagen de cabecera» de la marca.
- **«Ver catálogo» baja a la primera línea.** La página no puede enlazarse a sí misma y no existe un PDF de catálogo
  de ENI en el WordPress (solo las fichas de cada producto).
- **Nombres y orden de las líneas, los de los datos** («Motos & Scooter», «Engranajes»; en la plantilla, «Motos y
  Scooters» y «Engranaje»). El orden es alfabético por nombre (la plantilla pone Motos primero); cambiarlo exigiría un
  campo de orden en las categorías.

**Interruptor:** la casilla «Diseño propio» de la marca sigue, desmarcada.

- **Desmarcada**, la plantilla de Andrés. Sustituye a la provisional, que se quitó.
- **Marcada**, el diseño propio del #260 (`PaginaMarcaLubricante`), que se queda en el código.

## 10. Una página por línea con la plantilla de Andrés «Ficha producto lubricante» (2026-10-22, dirección; PR #318)

**Fuente:** el export `elementor-4039-2026-10-22.json` y su página pintada (3969, `ficha-producto-lubricantes/`),
medida a 390, 1010 y 1440. Sustituye a lo que el §9 decía de los listados y de «Ver catálogo».

**URL: las de WordPress, tal cual.** Las 4 líneas tenían dirección propia (`docs/url-map.csv`):
`/lubricantes/lubricantes-eni/{motos-scooter,auto-liviano,auto-pesado,engranajes}/`. Del 2026-10-14 al 21 llevaban un
301 a su ancla de la página de la marca; la migración `20261022_014813_lubricantes_lineas_paginas` **borra esos 4
301** (solo si siguen apuntando a su ancla). Si se quedaran, taparían la página y el ancla, que ahora lleva a la
página, haría un bucle.

**Página de la línea** (`[marca]/[categoria]/page.tsx`, `PaginaLineaLubricante`):

1. **Cabecera** de las páginas índice (`HeroMarca` con `indice`, sin franja, como la plantilla):
   - fondo: la «Imagen de cabecera» de la línea (campo nuevo) o, vacía, su «Imagen» (la foto de su tarjeta, del
     WordPress del cliente); sin ninguna, el fondo oscuro;
   - **migas visibles** encima del logo («Inicio / Lubricantes Eni / Motos & Scooter», los items del `BreadcrumbList`;
     la plantilla pinta «Lubricantes ENI» en ese sitio);
   - el logo (`LogoMarca`), «Lubricantes {línea}» revelado por palabras en el único `<h1>`, el texto (la entradilla de
     la línea o, vacía, la de la marca) y el icono del ratón.
2. **Productos por grupos** (`ProductosLinea`): una barra blanca de 30 px de radio por grupo con su título y las
   tarjetas debajo (foto, «NOMBRE GRADO», «Cotizar» y «Ficha técnica»). **Regla de tarjetas:** 4 por fila en
   escritorio, 2 en tablet, 1 en móvil, mismo ancho y la última fila centrada.
   - **«Cotizar»** abre la ventana emergente con el producto como referencia («Lubricante Eni I-RIDE RACING 5W-40»;
     tipo «cotización», con Ciudad y «¿Qué necesitas?»). Sin JavaScript, baja al formulario.
   - **«Ficha técnica»** abre el PDF en nuestro visor si el documento tiene «Páginas como imágenes»; si no, en otra
     pestaña. Sin PDF, sin botón (hoy 3 productos: I-RIDE RACING 10W-60, I-SINT 10W-40 y MULTITECH CT PLUS 10W). Las
     páginas se generan con `visor.ts fichas … de=lubricantes` (en el preview, los 67 PDF; en el sitio publicado,
     `runbook-lubricantes-lineas-visor.md`, en `Desktop\partequipos-cierre\`).
3. **Nuestro formulario** al final, como en la página de la marca (`BloqueLubricantes`), sin «Ver catálogo».

SEO: título por defecto «{línea} | Lubricantes {marca}» (`tituloPorDefecto.categoriaLubricante`, editable en
«Buscadores y redes sociales» de la línea, que ya no dice «sin página»), descripción = la del texto de la cabecera,
canónica, `BreadcrumbList` (Inicio › Lubricantes Eni › línea) y entrada en el sitemap. Revalida al guardar la línea, su
marca, «Páginas índice y contacto» o un documento.

**Grupos: los de los datos.** Motos & Scooter («mOTO & SCOOTER», «REFRIGERACIÓN») y Engranajes (9 grupos, p. ej.
«TRANSMISIONES», «HIDRÁULICOS · OSO») los tienen. **Auto liviano y Auto pesado no tienen grupos**: sus productos van en
una sola rejilla, sin barra (el `<h1>` ya nombra la línea), en el orden del panel. Para darles grupos basta con
rellenar «Grupo» en sus productos. Los títulos se pintan en tipo frase («Moto & scooter», «Refrigeración»), como la
plantilla, sin tocar el dato de WordPress (que va en mayúsculas, con la errata «mOTO»).

**Página de la marca** (`/lubricantes/lubricantes-eni/`): sin los listados; quedan la cabecera, las 4 tarjetas
(«Ver todo» a cada página) y el bloque final, **sin «Ver catálogo»** (en `/lubricantes/` se queda). **Las anclas
viejas** (`#auto-liviano`…) que haya enlazadas desde fuera llevan a su página con un script en línea al principio de la
página (`scriptAnclasALineas`, `location.replace`; el ancla no llega al servidor).

**Orden de las líneas:** campo «Orden» nuevo (en la página de la marca y en el megamenú; sin orden, por nombre). La
migración lo pone como la plantilla: Motos & Scooter, Auto liviano, Auto pesado, Engranajes.

**Megamenú:** «Enlace en el menú» vacío lleva ahora a la página de la línea (antes, a su ancla). No hay que tocar el
dato.

**Desviaciones:**

- **`Moto.jpg` y el logo «iRide» (`Recurso-21`) de la plantilla no se usan:** no están en el WordPress del cliente
  (son del sitio de diseño, 2026-10). La cabecera usa la foto de la línea, y la barra del grupo va sin imagen: los datos
  no tienen logo de sublínea (habría que añadir un campo).
- **La última fila, centrada** (la plantilla la deja a la izquierda y con otro ancho), por la regla de tarjetas.
- **«Ficha técnica» en una línea** (a 1440 la plantilla la parte en dos).
- La plantilla cierra con una caja roja con «WhatsApp»; aquí va nuestro formulario (dirección).

**Interruptor:** con «Diseño propio» marcado, la marca sigue pintando el #260 con las líneas como secciones; las
páginas de línea existen igual.

### 10.1 Fotos de producto con el mismo formato (2026-10-22, dirección)

Dirección vio fotos mucho más grandes que otras en las tarjetas (las I-RIDE MOTO S&T frente a la RACING 5W-40) y
tarjetas desiguales. Dos causas, medidas en el sitio publicado:

1. **El recuadro crecía con las fotos verticales.** `aspect-ratio: 1 / 1` es solo un mínimo: una foto en el flujo de
   1087 × 1973 lo estiraba a 273 × 496 a 1440 (y la de 389 × 584, a 273 × 410), y su fila pasaba de 451 a 650 px. A
   390 no se notaba. **Arreglo (CSS):** la foto va posicionada dentro del recuadro (`position: absolute; inset: 0`),
   con `object-fit: contain`: recuadro cuadrado e igual en todas, botella entera y centrada.
2. **Las propias imágenes traen márgenes distintos:** la botella ocupa del 74 % al 100 % del alto de su imagen, así
   que con el mismo recuadro unas se ven más grandes. **Arreglo (datos):** `scripts/lubricantes/fotos-uniformes.ts`
   recorta el fondo (transparente o casi blanco) y centra la botella en un lienzo blanco de 800 px, ocupando el
   86 % del lado en su dimensión mayor (`src/lib/lubricantes/fotoUniforme.ts`, con pruebas). Sube fotos NUEVAS
   (`lub-uniforme-…webp`) y las pone en los productos; las originales se quedan y la retirada vuelve a ellas
   (manifiesto). En el preview: 56 fotos y 70 productos. Sitio publicado: `runbook-lubricantes-fotos-uniformes.md`.

**Límite:** la foto de I-SIGMA UNIVERSAL 20W-50 es de 225 × 225 en WordPress y se amplía ×3,1: se ve más blanda.
Mejor sustituirla por una foto mayor del cliente.
