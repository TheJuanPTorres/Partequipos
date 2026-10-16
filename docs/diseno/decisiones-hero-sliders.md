# Hero de la portada — diseño de sliders de Andrés (2026-10-14)

**Fuente:** el export `elementor-3388-2026-10-14.json` (en
`Desktop\partequipos-diseno\wordpress\sliders-home\`) y su página pintada,
`https://partequipos.uxdesign.website/sliders-home/`.

**Encargo de dirección:**

- Solo valen las diapositivas **1** (Hitachi LANDCROS) y **2** (CASE, «Versatilidad. Fuerza. Experiencia.»). Las demás del diseño están sin terminar.
- Hay que medir contra la referencia a 390, 1010 y 1440, sin CLS.

## 1. Qué se puede hacer desde el panel, por diapositiva

| Campo                                      | Qué hace                                                                                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Título** (ahora texto de varias líneas)  | Un salto de línea parte el título. El lector de pantalla lo oye en una línea                                                                                           |
| **Escritorio: parte de arriba / de abajo** | Opcionales, los dos o ninguno. A 1025 px o más, el título se pinta partido: arriba, y abajo sobre la máquina, como en la diapositiva 2. Por debajo, el «Título» entero |
| **Posición de la máquina**                 | «Debajo del título», como hasta ahora, o «Sobre el título», que lo cruza en escritorio como en la diapositiva 1. En tablet y móvil va siempre debajo                   |
| **Texto circular**                         | Opcional. Gira despacio y se para con la pausa del hero y con «reducir movimiento». Decorativo: `aria-hidden`                                                          |

**El título sigue en el HTML:** un `<h2>` con el texto entero para los
lectores de pantalla. Lo pintado (líneas y partes) va oculto a ellos, así que
no se lee dos veces.

### 1.1 Solo la imagen de fondo (dirección, 2026-10-15)

Tres casillas por diapositiva, **marcadas por defecto** (la migración
`20261015_150333_hero_solo_fondo` rellena `true` en las existentes, y una fila
con `null` se pinta como siempre):

| Casilla                             | Desmarcada                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mostrar título**                  | El `<h2>` se queda, con su id y el texto **para lectores** (`soloLector`). Lo pintado conserva su sitio **invisible** (`visibility: hidden`, ya era `aria-hidden`) y sin título partido: la máquina queda donde estaría con título. Medido: quitándolo del flujo, el pase automático movía la caja de la máquina (CLS 0,069 a 390) |
| **Mostrar texto circular**          | El texto circular no sale en el HTML                                                                                                                                                                                                                                                                                               |
| **Mostrar recuadro de descripción** | El vidrio con el párrafo y el «+» no sale en el HTML (como una diapositiva sin párrafo ni enlace)                                                                                                                                                                                                                                  |

- El **título sigue obligatorio** en el panel: nombra la región, los puntos
  del carrusel y el anuncio al cambiar de diapositiva.
- Los **controles del carrusel** no cambian (misma caja a 390 y 1440, medida).
- En el panel, los campos de cada pieza se esconden con su casilla
  desmarcada; los datos no se borran.
- El importador del contenido real y la copia y retirada de la demo **no
  escriben el hero** (comprobado en el código: solo secciones 3, 4,
  «Nuestra Compañía», preguntas y SEO; la retirada compara la huella del hero
  antes y después y falla si cambia).

## 2. Maquetación

- **El título va ARRIBA** (desde el 2026-10-16, a la altura de la Home V2: §6). Antes iba centrado (D15). Sigue en el mismo sitio en todas las diapositivas, que era el objetivo de D15: en un carrusel el texto no salta.
- **La máquina va debajo, en el mismo flujo.** Ocupa lo que queda hasta los controles, así un título de varias líneas no se le monta encima.
- **Con «sobre»**, sube y cruza el título: desde el 2026-10-16, como la Home V2 (§6), a 15 px bajo su borde de arriba a 1440 y también en tablet. Antes, 38 px y solo en escritorio.
- **El vidrio se ve también en móvil**, como en el diseño; el de ux-9 lo ocultaba. Va encima de la fila de controles, para no taparlos.
- **Vidrio ancho:** con un párrafo largo (más de 130 letras), el vidrio de escritorio mide 500 px en vez de 400, como la diapositiva 2. Es uno para todas las diapositivas: así no cambia de tamaño al pasar.

## 3. Desviaciones (para Andrés)

| #   | Diseño                                                                                                                                  | Aquí                                                                                                                                            | Por qué                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | El título de la diapositiva 2 empieza ~90 px más arriba que el de la 1                                                                  | **Igual que el diseño desde el 2026-10-14** (decisión de dirección): en escritorio, un título partido sube a 35 px y su máquina vuelve a 762 px | Antes iba a la altura de la 1 (D15) y la máquina se quedaba en 545 px. Dirección prefiere el diseño, aunque el título no quede a la misma altura en todas las diapositivas |
| S2  | El «+» no enlaza a nada                                                                                                                 | Enlaza a la página de la marca, con nombre accesible                                                                                            | Un control que no hace nada confunde. Sin enlace, el «+» no se pinta                                                                                                       |
| S3  | En la diapositiva 2, «EXPERIENCIA.» queda por encima del vidrio                                                                         | Igual                                                                                                                                           | Se respeta. Se comprobó pintado que se lee                                                                                                                                 |
| S4  | En tablet, la máquina de la diapositiva 2 se monta sobre el título de cuatro líneas, y el vidrio de esa diapositiva ocupa todo el ancho | La máquina va debajo; el vidrio, de 400 px como en la 1                                                                                         | El título no se tapa; un vidrio para todas no cambia de tamaño al pasar                                                                                                    |
| S7  | En móvil el vidrio va pegado abajo (el diseño no tiene flechas ni puntos)                                                               | Encima de la fila de controles, anclado por arriba                                                                                              | Que no tape los controles, y CLS 0 al llegar Inter (el párrafo puede ganar una línea)                                                                                      |
| S5  | Velos distintos por diapositiva (gris en multiplicar / degradado negro)                                                                 | El velo de siempre (D14)                                                                                                                        | Contraste medido del título blanco con las fotos del cliente                                                                                                               |
| S6  | Los títulos en mayúsculas en el HTML                                                                                                    | Mayúsculas solo por CSS                                                                                                                         | El lector de pantalla no deletrea                                                                                                                                          |

## 4. Imágenes

Las cuatro (dos fondos y dos máquinas recortadas) son del diseño de Andrés:

- **Licencia para el sitio publicado: sin confirmar.** Están solo en el preview (`npm run preview:hero-sliders -- sembrar`).
- **Retirada:** `npm run preview:hero-sliders -- retirar` las quita y devuelve el hero de antes.

## 5. Medidas

Preview del PR, las dos diapositivas sembradas, contra la referencia pintada.
Posiciones respecto a la tarjeta, en px.

| Ancho | Elemento                       | Referencia                      | Aquí                            |
| ----- | ------------------------------ | ------------------------------- | ------------------------------- |
| 1440  | Título de la 1 (caja)          | y 124, alto 168, 120 px         | y 124, alto 168, 120 px         |
| 1440  | Máquina de la 1 («sobre»)      | x 198, y 162, 1000 × 429        | x 198, y 163, 1000 × 428        |
| 1440  | Texto circular                 | x 94, y 544, 120                | x 94, y 544, 120                |
| 1440  | Título de la 2, arriba / abajo | 110 px / y 490, alto 119, 85 px | 108 px / y 490, alto 119, 85 px |
| 1440  | Máquina de la 2                | y 139, 762 × 538                | y 291, 545 × 385 (S1)           |
| 1010  | Título de la 1                 | y 50, alto 91, 65 px            | y 50, alto 91, 65 px            |
| 1010  | Máquina de la 1                | 631 × 271                       | 631 × 270                       |
| 1010  | Texto circular                 | x 49, y 496, 100                | x 49, y 496, 100                |
| 1010  | Título de la 2                 | 55 px, 4 líneas                 | 51 px, 2 líneas                 |
| 390   | Título de la 1                 | y 50, alto 131, 12vw            | y 50, alto 131, 46,8 px (12vw)  |
| 390   | Texto circular                 | x 147, y 363, 70                | x 154, y 363, 70                |

**CLS de la carga** (5 s, sin movimiento reducido):

| Ancho | CLS     |
| ----- | ------- |
| 390   | 0       |
| 1010  | 0       |
| 1440  | 0,00001 |

El de 1440 es el residuo conocido del menú de la cabecera: también está en la
versión publicada.

**Dos arreglos que salieron al medir:**

- El cambio a Inter desplazaba el título (0,0006–0,004): Chrome cuenta el texto
  recentrado con `text-align`. Centrado con flex, como el título de antes: 0.
- El vidrio en móvil, anclado por abajo, se movía si el párrafo ganaba una
  línea. Anclado por arriba: 0.

## 6. Título, máquina, flechas y «+» de la Home V2 (2026-10-16)

**Fuente:** la sección 1 de `elementor-3519-2026-10-15.json`
(`Desktop\partequipos-diseno\wordpress\home-v2\`) y su página pintada,
`https://partequipos.uxdesign.website/`, medidas a 390, 1010 y 1440. Es el hero
de ux-9 con una sola diapositiva; aquí se aplica a todas.

**Decisión de dirección (2026-10-16):** el título y la máquina toman la altura
y el tamaño de la V2 (sustituyen a las medidas del §5 en esos dos puntos); el
«+» se queda **solo con enlace** (S2). Se conservan las casillas del §1.1, el
título partido (S1), la máquina «debajo», el texto circular, el vidrio en
móvil (S7), la pausa y los puntos.

Posiciones respecto a la tarjeta, en px, medidas en el preview del PR:

| Ancho | Pieza           | Home V2                                      | Aquí (antes → ahora)                    |
| ----- | --------------- | -------------------------------------------- | --------------------------------------- |
| 1440  | Título          | y 47, 120 px                                 | y 124 → **47**, 120 px                  |
| 1440  | Máquina «sobre» | x 294, y 62, 809 px                          | 1000 px en y 163 → **x 294, y 62, 809** |
| 1440  | Flechas         | x 30, 51 px sobre el borde, 62 entre centros | x 20, 40, 46 → **x 30, 51, 62**         |
| 1010  | Título          | y 103, 70 px                                 | y 50, 65 px → **y 103, 70 px**          |
| 1010  | Máquina «sobre» | y 48 (cruza el título), 631 px               | debajo, y 157 → **y 48, 631**           |
| 1010  | Flechas         | x 50, 106 px sobre el borde                  | x 40, 60 → **x 50, 106**                |
| 390   | Título          | y 74                                         | y 50 → **74**                           |
| 390   | Máquina         | y 257, 318 px de ancho                       | y 197, 338 → **y 257, 318**             |
| 390   | Flechas         | 30 px, x 40, 66 px sobre el borde            | 42 px, x 30 → **30 px, x 40, 66**       |

- **Flechas:** chevrón macizo de 21 px de alto (15 en móvil), dibujado aquí con
  la silueta del de la V2 (Font Awesome, que no usamos); 20 px entre las dos;
  al pasar el ratón, fondo rojo y chevrón blanco, también en la pausa.
- **«+»:** el aro de 30 px de la V2 (trazo 2,5, cruz de 10 px), dibujado aquí
  (el `add.svg` del kit es de Flaticon, L2). Sigue siendo un enlace con nombre
  accesible, y sin enlace no se pinta (S2).
- **Máquina «sobre» en tablet:** como la V2 a 1010, empieza 55 px por encima
  del título. **Con la foto de LANDCROS del preview (vista desde arriba y
  opaca) tapa buena parte del título a 1010**; si molesta, esa diapositiva se
  pasa a «Debajo del título» en el panel. El texto entero sigue en el `<h2>`.
- **Móvil:** la máquina queda en 318 × 160 (la V2, 318 × 228): la V2 no pinta
  el vidrio en móvil y aquí sí (S7), así que le queda menos alto.

**CLS** (preview del PR, sin tocar nada):

| Ancho | Carga   | Pase automático, una vuelta de 7 | `main`, pase automático |
| ----- | ------- | -------------------------------- | ----------------------- |
| 390   | 0       | 0,00001                          | 0,0035                  |
| 1010  | 0       | 0                                | 0,035                   |
| 1440  | 0,00001 | 0,00001                          | 0,105                   |

El pase automático **ya daba CLS en `main`**: la caja de la máquina era un solo
elemento que cambiaba de sitio entre diapositivas («sobre» o «debajo», títulos
de distinto alto), y el pase no es una entrada del usuario. Ahora la capa del
título y la máquina se monta nueva en cada diapositiva (`key`), y un elemento
nuevo no cuenta como desplazamiento.

### 6.1 La máquina «sobre» vuelve a su altura de antes del #184 (2026-10-16, dirección)

En la diapositiva 1 (Hitachi LANDCROS, la única con la máquina «sobre»), el
#184 subió la máquina recortada a la altura de la V2. **Dirección pide la
altura de antes**, sin tocar el resto del hero: el título sigue a la altura de
la V2 y la máquina conserva su ancho de la V2.

Borde de arriba de la máquina PINTADA, respecto a la tarjeta. Medido en los
previews de `8f16bc6` (antes), de `main` y del PR:

| Ancho | Antes del #184 | #184 | Ahora   | Ancho de la máquina |
| ----- | -------------- | ---- | ------- | ------------------- |
| 1440  | 163            | 62   | **163** | 809 (antes, 1000)   |
| 1010  | 157            | 48   | **157** | 631                 |
| 390   | 197            | 257  | **197** | 318 (antes, 338)    |

- **Escritorio y tablet:** `--hero-maquina-cruce` deja de ir ligado a la V2. Es
  `163px` (o `157px`) menos el alto hasta el final del título, de una línea.
- **Móvil:** «sobre» sigue debajo del título, pero con
  `--hero-maquina-aire-sobre: -8px` en vez de los 52 px de aire de las demás.
- **Lo demás no cambia:** el título, las flechas, el texto circular y las otras
  seis diapositivas, comparadas por nombre con las medidas del #184, quedan
  igual en los tres anchos.
- **CLS:** 0 en la carga y en el pase manual (0,00001 a 1440, el conocido).
- **A 1010** la máquina vuelve a montar sobre la parte de abajo del título,
  como antes.
