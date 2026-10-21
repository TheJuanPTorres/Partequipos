# Ficha de maquinaria nueva con la plantilla de Andrés (4036)

Decisiones al replicar la plantilla **«Ficha maquinaria nueva»** de Andrés
(Elementor 4036) en las fichas de maquinaria **nueva** y de **aditamentos
nuevos** (`/maquinaria-pesada/maquinaria-pesada-nueva/marcas/{marca}/{tipo}/{modelo}/`,
las mismas URL). Fecha: 2026-10-21. La **usada** (también los aditamentos
usados) sigue con la ficha V2 (`decisiones-ficha.md`), sin cambios.

## 1. Fuente

| Qué                 | Dónde                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| Export de Elementor | `Desktop\partequipos-diseno\elementor-4036-2026-10-21.json` (llegó a `Descargas`; copiado ahí)            |
| Página pintada      | **No disponible**: el sitio de Andrés está en mantenimiento. Se replica del export, como la «Plantilla 1» |
| Código              | `src/components/ficha/FichaNueva.tsx` y `fichaNueva.module.css`, encima de las clases de la V2            |
| Lógica pura         | `src/lib/maquinaria/fichaNueva.ts` (datos de la cabecera, «Otras/Otros», título, enlace 360), con pruebas |

La 4036 es la V2 (export 3166) con otra cabecera y otras secciones debajo: la
galería, las migas en píldora, las pastillas de datos, los botones y las
tarjetas comparten medidas con la V2, así que se reutilizan sus clases
(`ficha.module.css`, que no se toca) y lo nuevo va en su propio módulo.

## 2. Bloque a bloque

| Bloque de la plantilla                                     | En el sitio                                                                                                                                                                                         | Ajuste                                                                                                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tarjeta de cabecera con degradado rojo `#CE2A2C` → blanco  | Tarjeta **blanca** de radio 30 sobre el gris de la página, como las demás tarjetas del sitio                                                                                                        | Dirección: sin el degradado. Sin el fondo desenfocado de la V2 (`GaleriaFicha sinFondo`)                                                             |
| Galería con miniaturas (`uc_slider_image` + `remote_tabs`) | `GaleriaFicha` de la V2, sin cambios                                                                                                                                                                | Con una sola foto (la mayoría hoy) no hay miniaturas                                                                                                 |
| «Ver en vista 360» (abre una ventana emergente)            | `BotonVista360`: solo si el equipo tiene **«Vista 360 (enlace)»**; abre el enlace en un marco dentro de una ventana emergente                                                                       | Campo nuevo (§3). Borde del negro del kit: el naranja `#E58624` de la plantilla no está en la paleta (errata)                                        |
| Migas «Inicio / Maquinaria pesada nueva/»                  | Las migas completas en la píldora, como la V2                                                                                                                                                       | En tablet y móvil, píldora gris sobre blanco (la de la V2 era para la foto desenfocada)                                                              |
| Título: «YANMAR / ViO50-6a» (escritorio) y nombre (móvil)  | **Un solo `<h1>`** con las dos variantes: marca y referencia (`codigo`) en dos líneas en escritorio y tablet; el nombre completo en móvil                                                           | Sin referencia (los aditamentos), el nombre en todas. En móvil, título negro: el blanco de la plantilla iba sobre el degradado rojo                  |
| Descripción (un párrafo)                                   | La `entradilla` y la «Descripción comercial» (texto enriquecido), bajo el título                                                                                                                    | Un título dentro de la descripción se pinta como texto en negrita, para no competir con el `<h1>`                                                    |
| 5 datos con icono                                          | Potencia neta, Peso operativo, Alcance máximo en el suelo, Profundidad máxima de excavación y Motor, **solo los que tenga** (§4)                                                                    | Pastillas en el gris del kit: las de vidrio de la plantilla no se ven sobre blanco. Iconos de Tabler (los de la plantilla son de Flaticon, L2)       |
| «Ficha técnica» (abre una ventana emergente)               | `BotonVisorPdf`: el PDF del equipo en el **visor tipo libro** (#295) dentro de una ventana emergente. Sin PDF, no sale                                                                              | Sin «Páginas como imágenes», abre el PDF en otra pestaña (§5). Tamaño grande del #306                                                                |
| «Habla con un experto»                                     | Igual que antes: WhatsApp con el nombre y la URL del equipo                                                                                                                                         | Tamaño grande del #306. **No hay «Cotizar»** (dirección)                                                                                             |
| _(no está en la plantilla)_                                | **«Más especificaciones»**: las filas de la ficha técnica que la cabecera no enseña, en dos columnas en escritorio. Sin filas de más, no sale                                                       | Se conserva para no quitar contenido de la página (no tocar el SEO). 59 de 103 equipos la tienen                                                     |
| «Otras Excavadoras»: franja con foto y título              | `tituloOtras`: «Otras»/«Otros» según la primera palabra del tipo. Foto: la «Imagen de la tarjeta» del tipo; vacía, la primera foto de su primer equipo (`primeraFotoPorTipo`)                       | —                                                                                                                                                    |
| Tarjetas: foto, nombre, datos, «Ver más» y «Ficha técnica» | Hasta **3 equipos del mismo tipo** (el tipo ya es de la marca), sin el de la página; datos como las tarjetas de la página de marca (`datosDeTarjeta`, 3); «Ficha técnica» en el visor, solo con PDF | **Regla de tarjetas del sitio (#281):** la plantilla oculta la 3.ª en tablet y la 2.ª y 3.ª en móvil; aquí se ven todas. Foto 3:2 entera, como la V2 |
| CTA del operario con casco                                 | **La nuestra**: «Contáctanos para recibir asesoría» con la foto del mecánico, «Contáctanos» (formulario en ventana) y «WhatsApp» (`RecuadroAsesoria`, el mismo de la V2)                            | Dirección                                                                                                                                            |
| Formulario de Elementor (con n.º de documento)             | **El nuestro** (`ContactoMarca`): «Contacto Partequipos», «Si deseas más información, contáctanos», **Ciudad** y **«¿Qué necesitas?»**, sin n.º de documento                                        | La solicitud es una cotización con el equipo como referencia (`configContactoMarca` con `equipo`), como el formulario de la V2                       |
| Testimonios (acordeón de vídeos)                           | `SeccionTestimonios` de la portada                                                                                                                                                                  | —                                                                                                                                                    |

**Quedó fuera de la plantilla**, y por qué:

- **Logo de la marca, «Compartir» e «Imprimir»** de la V2: no están en la 4036.
- **El texto de la V2 en su propia sección:** la descripción pasa a la cabecera.
- **El movimiento de las pastillas de datos con el scroll** (`motion_fx`): no
  aporta nada y movería el contenido (CLS).

**No cambia:** las URL, los metadatos (título, descripción, canónica, `noindex`
mientras el sitio esté cerrado), el JSON-LD (`Product` con **todas** las filas
de la ficha técnica y `BreadcrumbList`) y los datos de los equipos.

## 3. Vista 360

Campo opcional **«Vista 360 (enlace)»** (`equipos-nuevos.vista360`, texto)
con migración `20261021_052023_equipo_nuevo_vista360` (solo esquema: una
columna). Es un **enlace**, no un fichero: la vista 360 la aloja su proveedor
(Matterport, Kuula, un visor propio…) y la ficha la abre en una ventana
emergente. Solo `https` y sin usuario ni contraseña (`validarVista360`).

- Sin enlace, no hay botón.
- Sin JavaScript, el botón abre el enlace en otra pestaña.
- El marco solo existe con la ventana abierta, así que la página no carga nada del proveedor hasta que se pulsa.
- **CSP:** hoy está en `Report-Only` y el marco funciona. Al pasar a la fase 2 (§10.16), el dominio del proveedor tendrá que entrar en `frame-src`.

## 4. Los cinco datos de la cabecera

**No hay campos nuevos:** los cinco existen ya en el panel como filas de
«Ficha técnica» de cada equipo, con etiquetas variadas y erratas de WordPress
(«ALANCE MAXIMO EN EL SUELO», «Máx. profundidad de excavación», «Potencia neta
(SAE J1349)»…). `datosDeCabecera` las reconoce por la etiqueta y pinta la
etiqueta y el valor **tal cual** están en la fila; si el equipo no tiene el
dato, no sale. Para la potencia prefiere la neta; si el fabricante solo da
otra, sale esa con su propia etiqueta. «Motor de arranque» no cuenta como motor.

Si el editor marca **«Destacar»** en alguna fila (hasta 4), salen esas en su
lugar, como antes. Las filas que no salen en la cabecera van a «Más
especificaciones».

Cobertura en el preview (103 equipos nuevos, 2026-10-21):

| Dato        | Equipos que lo tienen |
| ----------- | --------------------- |
| Peso        | 84                    |
| Motor       | 68                    |
| Potencia    | 66                    |
| Profundidad | 32                    |
| Alcance     | 26                    |

- **Los cinco datos:** 15 equipos.
- **Ninguno:** 16 equipos, los aditamentos (que no tienen ficha técnica) y 3 más.

## 5. «Ficha técnica» en el visor

El visor necesita las **«Páginas como imágenes»** de cada documento (nunca
pdf.js en el navegador). Los PDF de las fichas técnicas no las tenían. El modo
**`fichas`** de `scripts/documentos/visor.ts` las genera de una vez: descarga
cada PDF de «Ficha técnica completa (PDF)» sin páginas, lo rasteriza con
`rasterizar-pdf.mjs` y sube sus páginas. Lo deja en el manifiesto, y `retirar`
lo deshace igual que lo demás.

- **En el sitio publicado**, mientras no se ejecute el runbook, el botón abre el PDF en otra pestaña: nunca un botón roto.
- **Ligero:** el HTML lleva solo la URL y las medidas de cada página. Los `srcset` se calculan al abrir la ventana (`paginasDelLibro`, compartida con el bloque «Documento en visor»), y `page-flip` se descarga al interactuar con el libro.
- **Tamaño de la ventana:** el libro abierto cabe en el alto de la pantalla. Su ancho no pasa de alto × proporción de la página × 2.

**Equipos nuevos sin PDF: 15 de 103**, sin botón «Ficha técnica»:

- los 13 aditamentos;
- el vibrocompactador Case SV208;
- el bulldozer Case 1150M.

## 6. Cortes

Escritorio ≥ 1025, tablet 768–1024 y móvil ≤ 767, como la V2. Las medidas en
el preview, en el informe del PR.
