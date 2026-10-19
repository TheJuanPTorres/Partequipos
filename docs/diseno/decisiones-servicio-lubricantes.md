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
