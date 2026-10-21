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

| Bloque de la plantilla                                     | En el sitio                                                                                                                                                                                                          | Ajuste                                                                                                                                               |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tarjeta de cabecera con degradado rojo `#CE2A2C` → blanco  | Tarjeta **blanca** de radio 30 sobre el gris de la página, como las demás tarjetas del sitio                                                                                                                         | Dirección: sin el degradado. Sin el fondo desenfocado de la V2 (`GaleriaFicha sinFondo`)                                                             |
| Galería con miniaturas (`uc_slider_image` + `remote_tabs`) | `GaleriaFicha` de la V2, sin cambios                                                                                                                                                                                 | Con una sola foto (la mayoría hoy) no hay miniaturas                                                                                                 |
| «Ver en vista 360» (abre una ventana emergente)            | `BotonVista360`: solo si el equipo tiene **«Vista 360 (enlace)»**; abre el enlace en un marco dentro de una ventana emergente                                                                                        | Campo nuevo (§3). Borde del negro del kit: el naranja `#E58624` de la plantilla no está en la paleta (errata)                                        |
| Migas «Inicio / Maquinaria pesada nueva/»                  | Las migas completas en la píldora, como la V2                                                                                                                                                                        | En tablet y móvil, píldora gris sobre blanco (la de la V2 era para la foto desenfocada)                                                              |
| Título: «YANMAR / ViO50-6a» (escritorio) y nombre (móvil)  | **Un solo `<h1>`** con las dos variantes: marca y referencia (`codigo`) en dos líneas en escritorio y tablet; el nombre completo en móvil                                                                            | Sin referencia (los aditamentos), el nombre en todas. En móvil, título negro: el blanco de la plantilla iba sobre el degradado rojo                  |
| Descripción (un párrafo)                                   | La `entradilla` y la «Descripción comercial» (texto enriquecido), bajo el título                                                                                                                                     | Un título dentro de la descripción se pinta como texto en negrita, para no competir con el `<h1>`                                                    |
| 5 datos con icono                                          | **Como mucho 5 características** (regla del cliente, §4): potencia neta, peso operativo, motor, fuerza de tracción máxima y ancho de la zapata; si falta alguna, otras filas reales de la ficha técnica, en su orden | Pastillas en el gris del kit: las de vidrio de la plantilla no se ven sobre blanco. Iconos de Tabler (los de la plantilla son de Flaticon, L2)       |
| «Ficha técnica» (abre una ventana emergente)               | `BotonVisorPdf`: el PDF del equipo en el **visor tipo libro** (#295) dentro de una ventana emergente. Sin PDF, no sale                                                                                               | Sin «Páginas como imágenes», abre el PDF en otra pestaña (§5). Tamaño grande del #306                                                                |
| «Habla con un experto»                                     | Igual que antes: WhatsApp con el nombre y la URL del equipo                                                                                                                                                          | Tamaño grande del #306. **No hay «Cotizar»** (dirección)                                                                                             |
| «Otras Excavadoras»: franja con foto y título              | `tituloOtras`: «Otras»/«Otros» según la primera palabra del tipo. Foto: la «Imagen de la tarjeta» del tipo; vacía, la primera foto de su primer equipo (`primeraFotoPorTipo`)                                        | —                                                                                                                                                    |
| Tarjetas: foto, nombre, datos, «Ver más» y «Ficha técnica» | Hasta **3 equipos del mismo tipo** (el tipo ya es de la marca), sin el de la página; las 3 primeras de sus 5 características; «Ficha técnica» en el visor, solo con PDF                                              | **Regla de tarjetas del sitio (#281):** la plantilla oculta la 3.ª en tablet y la 2.ª y 3.ª en móvil; aquí se ven todas. Foto 3:2 entera, como la V2 |
| CTA del operario con casco                                 | **La nuestra**: «Contáctanos para recibir asesoría» con la foto del mecánico, «Contáctanos» (formulario en ventana) y «WhatsApp» (`RecuadroAsesoria`, el mismo de la V2)                                             | Dirección                                                                                                                                            |
| Formulario de Elementor (con n.º de documento)             | **El nuestro** (`ContactoMarca`): «Contacto Partequipos», «Si deseas más información, contáctanos», **Ciudad** y **«¿Qué necesitas?»**, sin n.º de documento                                                         | La solicitud es una cotización con el equipo como referencia (`configContactoMarca` con `equipo`), como el formulario de la V2                       |
| Testimonios (acordeón de vídeos)                           | `SeccionTestimonios` de la portada                                                                                                                                                                                   | —                                                                                                                                                    |

**Quedó fuera de la plantilla**, y por qué:

- **Logo de la marca, «Compartir» e «Imprimir»** de la V2: no están en la 4036.
- **El texto de la V2 en su propia sección:** la descripción pasa a la cabecera.
- **El movimiento de las pastillas de datos con el scroll** (`motion_fx`): no
  aporta nada y movería el contenido (CLS).
- **La tabla de especificaciones de la V2:** regla del cliente, máximo 5
  características (§4). Las filas siguen guardadas y en el JSON-LD.

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

## 4. Máximo 5 características (regla del cliente, 2026-10-21)

La ficha enseña **como mucho 5 características**, las de la cabecera de la
plantilla, y **no hay tabla de especificaciones aparte**. **No hay campos
nuevos:** salen de las filas de «Ficha técnica» del equipo (`datosDeCabecera`),
y no cambia ningún dato guardado.

1. **Por prioridad:** Potencia neta, Peso operativo, Motor, Fuerza de tracción
   máxima y Ancho de la zapata, las que tenga.
2. **Si falta alguna,** se completa hasta 5 con otras filas reales de su
   ficha técnica, **en el orden en que están guardadas**.
3. **Con menos de 5 filas,** las que tenga. Nunca se inventa nada.
4. **Etiquetas (dirección):** las 5 de prioridad salen con su nombre uniforme
   («Potencia neta», «Peso operativo», «Motor», «Fuerza de tracción máxima»,
   «Ancho de la zapata»), venga como venga de WordPress; las de relleno, con su
   etiqueta tal cual. **Los valores no se tocan nunca.**

**Emparejado de etiquetas.** Se comparan normalizadas (`normalizar`: sin
tildes, en minúsculas, sin «:» final y con un solo espacio) contra unos
patrones por prioridad, en orden de preferencia:

| Prioridad                 | Patrones (normalizados)                                                                                            | Variantes encontradas en las 103 fichas                                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Potencia neta             | empieza por «potencia neta» o «potencia nominal del volante neta»; si no, «potencia» a secas                       | POTENCIA NETA (36), Potencia Neta (5), Potencia Neta (SAE J1349) (5), Potencia neta (SAE J1349) (3), Potência neta (SAE J1349) (1), Potencia neta del motor (2), … a 2500 rpm (1), del volante Neta (2), Potencia (9) |
| Peso operativo            | «peso operativo / operacional / de operación / en funcionamiento»                                                  | PESO OPERATIVO (56), Peso operativo (17), Peso de operación (6), Peso operacional (3), Peso operacional sin cabina (1), Peso en funcionamiento (1)                                                                    |
| Motor                     | «motor» a secas; «(marca y) modelo del motor»                                                                      | MOTOR (45), Motor (12), Marca y modelo del motor (11)                                                                                                                                                                 |
| Fuerza de tracción máxima | «fuerza de tracción máxima»; si no, «fuerza de tracción» o «barra de tracción parada» (la misma medida, dirección) | Fuerza de tracción máxima (3), FUERZA DE TRACCIÓN MÁXIMA (3), Fuerza de tracción (1)                                                                                                                                  |
| Ancho de la zapata        | «ancho de (la) zapata»                                                                                             | Ancho de la zapata (5), ANCHO DE LA ZAPATA (3)                                                                                                                                                                        |

**Lo que NO se empareja, a propósito:**

- **La potencia BRUTA** (14 filas, «Potencia Bruta (ISO 14396)»…) no ocupa el
  sitio de la neta: si hace falta, entra de relleno con su propia etiqueta.
- **«Motor de arranque», «Aceite del motor…», «Fabricante del Motor» y «Tipo
  del Motor»** no son «Motor».
- **Las fuerzas de excavación** y **«Número de zapatas»** tampoco.

**«Destacar»** ya no cambia la ficha: elige los datos de la tarjeta del equipo
en la página de su marca. Las tarjetas de «Otras …» llevan las 3 primeras de
sus 5 características.

**Lo que se enseña, en el preview** (103 equipos nuevos):

- 46 equipos con 5 características, 19 con 4 y 25 con 3;
- 13 sin ninguna: los aditamentos sin ficha técnica.

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

## 6. Sin desplazamiento al llegar Inter

Inter llega sin precarga (CLAUDE.md §10.36). Con la descripción en la cabecera,
al cambiar de fuente la descripción, el título de escritorio y las pastillas
ganaban o perdían una línea, y la cabecera se movía. Medido en el 1150M: CLS
0,1237 a 1010 y 0,0219 a 1440.

**Arreglo (`.reserva` de `fichaNueva.module.css`):** la misma idea que la
cabecera del artículo, una copia invisible del texto (`data-reserva`) en la
fuente de respaldo, ensanchada y en negrita, que fija el alto.

- **Descripción:** su texto plano (`reservaDescripcion`), con los párrafos
  separados exactamente una línea.
- **Título de escritorio y cada pastilla:** también llevan su copia.

**Comprobado:** con Inter bloqueado y sin bloquear, los altos son los mismos
en la descripción y en las pastillas.

## 7. Cortes

Escritorio ≥ 1025, tablet 768–1024 y móvil ≤ 767, como la V2. Las medidas en
el preview, en el informe del PR.
