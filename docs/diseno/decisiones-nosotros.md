# Página Nosotros de ux-9 — decisiones

> Rama `feat/pagina-nosotros` (agente B). Diseño: export
> `Desktop\partequipos-diseno\wordpress\nosotros\elementor-3038-2026-10-02.json`.
> Referencia pintada: <https://partequipos.uxdesign.website/ux-9/nosotros/>.
> Ruta en el sitio: `/nosotros/` (`docs/url-map.csv`, fila 189). Slug sin cambios.

## 1. Inventario del export (2026-10-02)

Cinco secciones. **Ningún elemento tiene `hide_desktop`, `hide_tablet` ni
`hide_mobile`**: todo se pinta en los tres tamaños.

| #   | Sección (contenedor)   | Widgets                                                                                                            |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | Cabecera `36e8a780`    | Vídeo de fondo + `Hero.jpg`, velo negro · 2 × título revelado («Partequipos», «Quienes somos»)                     |
| 2   | Presentación `acca276` | **Lottie** del mapa de sedes · 2 × título revelado · `text-editor` (2 párrafos) · botón «Conoce más»               |
| 3   | Cifras `24d1a631`      | 3 × `counter` (+25 · 100 % · 10,000+) con título revelado de etiqueta                                              |
| 4   | Franja `71d4927`       | Foto de fondo con velo · `ucaddon_list_marquee` («Marcas Aliadas») · imagen absoluta `Dynapac-1-1.png`             |
| 5   | Soluciones `5aaee2d5`  | `icon-list` «En Partequipos» · título revelado · `ucaddon_expanding_content_cards` (3 tarjetas) · botón «Ver todo» |

Widgets de Unlimited Elements: `bangluxor_titulo_revelado_palabras_scroll` (ya
en `wordpress\widgtes\`), `list_marquee` y `expanding_content_cards`
(exportados por dirección el 2026-10-02; leídos su plantilla y su JS). El Lottie
es un widget nativo de Elementor.

## 2. Decisiones de dirección (2026-10-02)

1. **Migración al final, en ventana.** Primero todo lo que no necesita
   esquema, verificado con datos fijos en una ruta de pruebas que se borra
   antes de fusionar (`/laboratorio/nosotros/`, 404 en producción, `noindex`,
   fuera del sitemap, sin enlaces).
2. **Bloques, no grupo por slug.** Campo nuevo `bloques` (tipo `blocks`) en
   `paginas`, con cinco tipos reutilizables. `secciones` no se toca. Una sola
   migración, solo de esquema.
   - Una página **con** bloques pinta migas + bloques + JSON-LD; su texto
     enriquecido y sus «secciones» no se pintan, y el panel lo avisa en esos
     dos campos.
   - Una página **sin** bloques queda igual: se demuestra pintando
     `/servicio-tecnico/` y `/politica-de-garantia-de-repuestos/` antes y
     después, a 390 y 1440 (ver §6: `/garantias/` no existe).
   - Un solo `<h1>`: el del bloque de cabecera o, sin cabecera, el título.
   - Bloques en camelCase, etiquetas del panel en español, `interfaceName` en
     cada uno.
3. **Lottie: imagen fija.** Último fotograma del mapa, capturado de la página
   pintada, en la Media del preview y con texto alternativo. La animación, en
   un PR posterior con aprobación propia (exige dependencia nueva, §2 de
   CLAUDE.md). El JSON queda en `wordpress\nosotros\`.
   **Superada el 2026-10-04:** animación aprobada con `lottie-web` ligera (§9).
   La imagen fija sigue: es el respaldo.
4. **Erratas corregidas** (para Andrés, §7).
5. Contenido de ejemplo permitido; aplica la excepción §10.38.

**Ventana (2026-10-02), decisiones añadidas:**

6. **CLS:** caja fija como el título del hero (§10.36); si no llega a 0, se
   acepta y se documenta junto al del menú. **No se precarga Inter.**
7. **Migas solo para lectores de pantalla**, con el JSON-LD `BreadcrumbList`.
   Los botones de pausa, visibles.
8. `/nosotros/`: el texto de relleno puede dejar de verse; la entradilla
   sigue como meta descripción.

## 3. Bloques (forma de datos)

Tipos en `src/lib/bloques/vista.ts`. Los componentes reciben las relaciones ya
resueltas (URL, medidas, `alt`), así no dependen del esquema.

| Bloque (`blockType`)  | Campos                                                                           |
| --------------------- | -------------------------------------------------------------------------------- |
| `cabeceraVideo`       | antetítulo, título (`<h1>`), vídeo (`videos`), imagen (`media`, si no hay vídeo) |
| `presentacionImagen`  | imagen (`media`), antetítulo, título, texto enriquecido, botón (texto y enlace)  |
| `cifras`              | lista de prefijo, número, sufijo y etiqueta                                      |
| `franjaMarquee`       | texto del marquee, imagen de fondo, imagen frontal (PNG transparente)            |
| `tarjetasExpandibles` | antetítulo, título, tarjetas (título, texto, imagen, enlace), botón              |

Componentes en `src/components/bloques/`; `PaginaConBloques` compone la página
(migas, JSON-LD, `<h1>` de reserva y bloques) y la usa `[...slug]` cuando la
página tiene bloques. Configuración en `src/collections/bloques/bloquesPagina.ts`;
traducción desde Payload en `src/lib/bloques/desdePayload.ts`; aviso del panel
en `src/components/admin/AvisoBloques.tsx`.

**Migración `20261002_204606_paginas_bloques`:** solo esquema. Siete tablas
nuevas (`paginas_blocks_*`) con sus índices y claves foráneas; ninguna tabla
existente cambia; el `down` solo borra esas siete.

**Corrección en la ventana:** la primera versión (`20261002_202057`) tenía una
clave foránea de 66 caracteres (`paginas_blocks_tarjetas_expandibles_tarjetas_imagen_id_media_id_fk`);
Postgres la corta a 63, la base no cuadraba con el snapshot y «Migrar desde
cero» falló en tres commits seguidos sin que lo viera hasta el tercero. Se
deshizo en el preview con su propio `down` (lote 19), el bloque
`tarjetasExpandibles` pasó a `dbName: paginas_blocks_tarjetas_exp` (58
caracteres; el `blockType` no cambia) y la migración se regeneró. **Nunca
llegó a producción.** Lección: comprobar «Migrar desde cero» en el MISMO
commit que trae la migración, no dar el CI por verde por el último check.

## 4. Lo que se aparta de ux-9

| Id  | Qué                                                                                                                     | Por qué                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| D1  | Antetítulos y etiquetas en `<p>`; en ux-9 todos los revelados son `<h2>`/`div`                                          | Jerarquía de encabezados real                   |
| D2  | Botón de pausa en el vídeo, el marquee y la rotación de tarjetas; con movimiento reducido, parado y sin vídeo           | WCAG 2.2.2                                      |
| N1  | Mapa animado encima de la imagen fija; con movimiento reducido o si falla la carga, la imagen fija (ux-9 anima siempre) | WCAG 2.3.3 y degradación (§9)                   |
| N2  | El mapa no desborda a 390 (en ux-9 el SVG mide 455 px y la página tiene scroll horizontal: 477 px)                      | Sin scroll horizontal                           |
| N3  | Migas solo para lectores; aparecen mientras su enlace tiene el foco (como el enlace de salto)                           | Decisión 7; WCAG 2.4.7                          |
| N4  | Copias del marquee como texto con `aria-hidden` y el texto una vez para el lector; en ux-9, ocho enlaces a «#»          | No hay destino; el lector no repite ocho veces  |
| N5  | Tarjetas: la plegada es un `<button aria-expanded>`, la abierta su enlace; al abrir con teclado el foco pasa al enlace  | Teclado                                         |
| N6  | Texto de las tarjetas en Inter 300; en ux-9, Roboto (no cargada en el sitio)                                            | Una sola fuente                                 |
| N7  | Sin la entrada con desenfoque de las tarjetas                                                                           | Movimiento de una vez, sin valor                |
| N8  | Botón de pausa de las tarjetas a la derecha de «Ver todo», no encima de las tarjetas                                    | Sobre la tarjeta plegada tapaba su zona de clic |
| N9  | Botón de pausa del mapa, abajo a la derecha de su caja, solo mientras se mueve                                          | WCAG 2.2.2: dura 6 s, más de 5                  |
| N10 | El mapa se carga al acercarse (una pantalla antes); ux-9 lo carga con la página                                         | Fuera de las demás páginas y del arranque (§9)  |

## 5. Medidas (ux-9 pintado, 2026-10-02)

Medidas con puppeteer (`headless`, ventana de 900 px de alto) tras bajar por
toda la página. Lo esencial, todo en el CSS de cada bloque:

- **Márgenes de página:** tarjetas a 1,5vw; contenido a 3vw; sección de
  soluciones con 5vw arriba y abajo.
- **Cabecera:** radio 30, alto mínimo 540 (450 en móvil), relleno 2,9vw (0 en
  móvil), texto en caja de 680 px centrada; velo `#000` al 45 % en `multiply`.
- **Cifras:** caja de 1140; filete rojo de 1 px a la derecha salvo la última;
  etiqueta en caja de 237 px con el texto a la izquierda; hueco inferior
  41 / 28 / 11 px.
- **Contador:** 2 s, curva «swing» de jQuery, separador «,» (medido: 1.420 a
  los ~470 ms de 2 s).
- **Franja:** alto 774 (765 en móvil), contenedor mínimo de 792; velo
  `#CACACA` al 74 % en `multiply`; texto de 110 px (40 / 10vw), ocho copias a
  −50 % en 80 s; máquina de 704 / 631 px / 80vw a 3vh del borde inferior.
- **Tarjetas:** alto 538, hueco 26, plegada 60 px, radio 30, transición 0,8 s
  `cubic-bezier(0.05, 0.61, 0.41, 0.95)`; rotación cada 4 s; a 500 px o menos,
  en columna, 460 px de alto y sin rotación.
- **Botones:** «Conoce más» radio 10 y hueco 5; «Ver todo» radio 30 y hueco 12.
- **Revelados:** cabecera al 95 %; presentación con escalón 0,08 y duración
  0,75; etiquetas de cifras con `back.out`; título de soluciones al 95 %.

### Verificación de la ruta de pruebas (local, contra la base del preview)

| Comprobación                     | Resultado                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Cajas y tipografía frente a ux-9 | 0–3 px en 1440, 1010 y 390 (salvo N2 y N3)                                                                |
| Geometría de las tarjetas        | Idéntica en los tres cortes                                                                               |
| `<h1>` / `<main>`                | 1 / 1                                                                                                     |
| Scroll horizontal                | No, en los tres                                                                                           |
| Teclado                          | Orden lógico, anillo visible, Intro abre la tarjeta y el foco pasa a su enlace                            |
| Movimiento reducido              | Sin vídeo, marquee quieto, rotación parada, revelados y cifras visibles                                   |
| CLS                              | 0,000024–0,000066, igual en `next dev` y en el preview: la llegada de Inter mueve «somos» del `<h1>` (§8) |

### Verificación de `/nosotros/` con bloques (preview `7ab7f1c`, 2026-10-02)

| Comprobación                     | Resultado                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------- |
| Cajas y tipografía frente a ux-9 | 0–2 px en 1440, 1010 y 390 (salvo N2, y anchos de caja que no cambian lo pintado) |
| Hero bajo la cabecera            | 100 / 71 / 66 px (ux-9: 100 / 71 / 67; el píxel es de la cabecera)                |
| `<h1>` / `<main>` / JSON-LD      | 1 / 1 / `BreadcrumbList`; migas ocultas a la vista                                |
| Teclado                          | Orden lógico; Intro abre la tarjeta y el foco pasa a su enlace                    |
| Movimiento reducido              | Sin vídeo, marquee y rotación parados                                             |
| CLS                              | 0,000024 (1010), 0,000066 (390), 0,00012 (1440), en todas las cargas (abajo)      |

**CLS ACEPTADO (decisión 6).** La caja del texto de la cabecera ya es fija
(680 px), que es la técnica del título del hero (§10.36), y no basta: lo que
se mueve no es la caja, sino la segunda palabra DENTRO de la línea. Al llegar
Inter (sin precarga), «Quiénes» cambia de ancho y «somos» se corre 3–5 px; a
1440 entra también un nodo de texto del título de la presentación, sin cambio
de caja. Misma causa que el desplazamiento del menú de la cabecera que ya
acepta §10.36 (0,0000057), mayor. Lighthouse lo redondea a 0.

## 6. Rutas de control (decisión 2)

`/garantias/` **no existe** (404, no está en `url-map.csv`). Se usa
`/politica-de-garantia-de-repuestos/`, que es la página de garantías con
anclas (`#GARANTIA`, `#Devoluciones`), junto a `/servicio-tecnico/`
(`#taller`, `#posventa`).

**Resultado:** sin cambios. Se capturó el `<main>` en el preview anterior a
los bloques (`f651203`) y en el de la ventana (`7ab7f1c`), a 390 y 1440,
forzando el mismo fondo en las dos (el `body` pasó de #FCFCFC a #FFFFFF en
`main` por un cambio del agente A en `globals.css`, ajeno a esta rama):
**0 bytes distintos** en las cuatro capturas; `<h1>`, anclas, índice, texto
y caja del `<main>` idénticos, y cada ancla lleva a su sección.

## 7. Para Andrés

- **Erratas corregidas:** «Quienes somos» → «Quiénes somos»; «Respuestos
  disponibles» → «Repuestos disponibles».
- La cifra de «Cobertura nacional» no está en el export; el contador cae al
  valor por defecto de Elementor y la página pintada dice **100 %**. Se usa
  100 %. ¿Es el dato real? ¿Y a qué remite su asterisco?
- Separador de miles «,» (10,000), el de Elementor. En Colombia es habitual
  «.»: ¿se cambia? **Vuelto a medir el 2026-10-04**: la página publicada
  pinta «10,000+» (el contador lleva `data-delimiter=","` y a mitad de cuenta
  se lee «9,794»), así que se respeta, porque manda lo pintado. Si Andrés lo
  cambia a «.», es una línea en `formatearCifra` (`src/lib/bloques/vista.ts`).
- **Corregido el 2026-10-04 (PR #65):** las cifras se quedaban en «+0», «0%»
  y «0+» si se llegaba bajando con el scroll normal (fallo nuestro, del
  contador, no del diseño).
- A 390 px el texto de la cabecera queda pegado al borde izquierdo de la
  tarjeta (relleno 0 en móvil): se replica tal cual.
- Las tres tarjetas llevan el mismo texto, de Dynapac: contenido de ejemplo.
- Alineación «Centro» en los revelados del export: el widget no la aplica
  (espera `center`) y se pintan a la izquierda; se replica lo pintado.

## 8. Pendientes

- **Producción:** la página Nosotros con bloques **no está** en producción.
  La migración se aplicará con el despliegue de la fusión (solo esquema: la
  página queda sin bloques y se pinta como hoy). Llevar los bloques y sus
  medios es la ampliación del runbook de copia (§10.38), que ejecuta dirección.
- **Lo que dejará de verse en `/nosotros/` de producción** cuando tenga
  bloques: la entradilla («Más de dos décadas suministrando repuestos y
  servicio para maquinaria pesada.») y dos párrafos. Todo es texto de relleno
  nuestro (§10.6), sin secciones con ancla; la entradilla sigue como meta
  descripción (decisión 8).
- ~~Animación del mapa (Lottie), PR aparte con aprobación propia.~~ Hecha (§9).
- Para Andrés, §7.

## 9. Mapa animado (2026-10-04)

**Aprobado por dirección:** `lottie-web` **5.13.0** exacta, solo la versión
ligera (`lottie_light`, sin expresiones ni `eval`). Componente
`AnimacionLottie` (de cliente) dentro del bloque «Presentación con imagen»,
que sigue siendo de servidor.

**Cómo se comporta en ux-9** (medido pintado a 1440, 1010 y 390, ventana de
900 px y de 250 px de alto):

- Espera en el **fotograma 0** hasta que la caja asoma a la pantalla.
- Entonces se reproduce **una vez**: 180 fotogramas a 30 fps, **6,0 s**.
- Se queda en el último fotograma. **No se repite** al salir y volver.
- Ignora el movimiento reducido.

**El nuestro:**

| Qué                 | Cómo                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Carga               | Import dinámico de `lottie_light` y `fetch` del JSON, **solo** cuando la caja está a menos de una pantalla (`rootMargin: 100%`)        |
| Arranque            | Al asomar un píxel (como ux-9). Si asoma antes de cargar, arranca en cuanto carga                                                      |
| Duración            | **5,97 s** (ux-9: 6,0 s), medida por las mutaciones del SVG                                                                            |
| Último fotograma    | Igual al de ux-9 a 1440: **0,14 %** de píxeles distintos (antialiasado). A 1010 y 390, escalado a la columna (N2)                      |
| Movimiento reducido | No descarga nada; se ve la imagen fija                                                                                                 |
| Fallo de carga      | Queda la imagen fija; `console.error` con prefijo `[animacion]`                                                                        |
| Caja                | `aspect-ratio` de la imagen fija; la animación va en una capa absoluta encima. Igual animada, reducida y con fallo                     |
| Accesibilidad       | La imagen nunca sale del árbol de accesibilidad (solo `opacity: 0`): su `alt` nombra lo que se ve. La capa del SVG lleva `aria-hidden` |
| Pausa (N9)          | «Pausar la animación del mapa» mientras se mueve; desaparece al terminar (salvo que tenga el foco: entonces «Reproducir» la repite)    |

**La imagen fija y el JSON tienen la misma proporción** (910 × 1302 y
1073 × 1536: 0,2 px de diferencia de alto a 455 px), así que la caja no
cambia al pasar de una a otra.

**Peso:** `lottie_light` es un chunk aparte de 168 kB sin comprimir; el JSON,
415 kB servidos con brotli desde el Blob.

**Probado en la red, en el preview, bajando cada página entera:** `/`,
`/contactanos/`, `/servicio-tecnico/` y `/maquinaria-pesada/` **no descargan**
ni el chunk ni el JSON; `/nosotros/` sí, al acercarse el mapa.

**N10 (carga perezosa) tiene un coste en el peor caso:** si se salta de golpe
al mapa desde lejos (ventana de 250 px), arranca a los 0,54 s de asomar
(ux-9, 0,11 s, porque lo cargó con la página). Bajando con el scroll normal,
la pantalla de margen da tiempo de sobra.

**Datos:** colección `animaciones` (solo `application/json`, comprobado por
contenido en `formatoDeAnimacionPermitido`: forma de Lottie, sin expresiones
ni imágenes externas, máximo 4 MB; deja el ancho y el alto en el registro) y
campo opcional `lottie` en el bloque. Se llama `lottie` y no `animacion`
porque con este la clave foránea pasaría de 63 bytes (65). Migración
`20261004_052512_animaciones`, solo esquema.

**Lock:** `npm install` en Windows volvió a tirar `@emnapi/*` (§10.5), y la
regeneración completa traía 62 subidas de versión ajenas, entre ellas `sharp`
(§10.18). Se añadió **solo** la entrada de `lottie-web` al lock anterior
(7 líneas) y `npm ci` lo validó.

**LCP de `/nosotros/`, antes y después** (método vigente de §10.3 p.14:
Lighthouse 13.4.1 por línea de comandos, móvil, _simulated throttling_, solo
Performance; 9 corridas alternadas con calentamiento, contra las URL fijas de
los previews de `1d29fa1` —sin animación— y `4e2757f`, con la misma base):

| Variante | LCP (mediana)          | TBT (mediana) | Rendimiento | CLS máx |
| -------- | ---------------------- | ------------- | ----------- | ------- |
| Sin mapa | **3,96 s** (3,13–4,45) | 132 ms        | 85          | 0,0001  |
| Con mapa | **3,88 s** (3,63–5,13) | 254 ms        | 80          | 0,0001  |

- **El LCP no cambia:** la diferencia está dentro del ruido, y el elemento LCP
  no es el mapa.
- **El TBT sube unos 120 ms.** En el móvil simulado de Lighthouse (CPU frenada
  cuatro veces) el mapa está a la vista al cargar, así que lottie-web se carga,
  analiza el JSON y anima durante la medición. Es el coste real de la
  animación; ux-9 lo paga igual, y además en todas las cargas.
- El CLS de 0,0001 es el desplazamiento de Inter de §5, igual en las dos.
