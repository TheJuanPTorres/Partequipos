# Home de Andrés (ux-9) — decisiones y plan de construcción

> Continúa `analisis-home-ux9.md`. Recoge las decisiones de dirección del
> 2026-09-23 sobre ese análisis, el inventario de imágenes y el plan por fases.
>
> **Regla que manda:** ux-9 es la versión **aprobada por el cliente**. Sus
> valores visuales son los del sitio público y se replican con precisión. Lo
> único que se aparta son las **desviaciones de accesibilidad** de §2, cada una
> con su motivo. Nada estético añadido por nosotros.

---

## 1. Inventario de imágenes

Fuente: `Desktop/partequipos-diseno/assets/` (fuera del repositorio), cruzada
con `elementor/1717.json`. Transparencia **medida** (píxeles con alfa < 10), no
supuesta por la extensión.

| Qué                              | Cifra                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Ficheros en `assets/`            | 1.035: **280 originales** y 755 copias que genera WordPress (`-300x200`, `-scaled`)                                     |
| Medios que referencia la página  | 87                                                                                                                      |
| …de widgets ocultos o de ejemplo | 25 (el widget de tarjetas expandibles, oculto en los tres cortes)                                                       |
| …que no están en `assets/`       | 15, todos de demostración de Unlimited Elements (`dynamic-wang-…-unsplash`, `ax_bg1/2`, `logo2…6`, `1…4.webp`, `1.jpg`) |
| Recortes con transparencia (PNG) | 87 en total; **la home usa 14**                                                                                         |

### Lo que se ve en la home, por sección

Peso y dimensiones del **original**. Lo que llega al visitante lo decide
`next/image` (WebP al ancho pintado), así que el peso de aquí es de almacén, no
de página; sirve para ver qué hay que recomprimir antes de subirlo.

| Sec. | Fichero                                                              | Tipo                  | Papel                              | Dimensiones         | Peso         |
| ---- | -------------------------------------------------------------------- | --------------------- | ---------------------------------- | ------------------- | ------------ |
| 1    | `Fondo.jpg`                                                          | foto de fondo         | fondo de la tarjeta                | 2048×1360           | 593 kB       |
| 1    | `Hero-1.png`                                                         | **recorte** (65 %)    | máquina delante del título         | 1476×1057           | 908 kB       |
| 2    | `hitachi.jpg`                                                        | foto de fondo         | tarjeta de marca                   | 1920×1280           | 477 kB       |
| 2    | `345345.jpg`                                                         | foto de fondo         | tarjeta de marca                   | 980×715             | 406 kB       |
| 2    | `double-drum-rollers-homepage.jpg`                                   | foto de fondo         | tarjeta de marca                   | 1920×1080           | 210 kB       |
| 2    | `Captura-de-pantalla-…2.54.34-p.m.png` y `…2.54.44…`                 | **captura** como logo | logo de marca                      | 284² · 276×262      | 20 · 11 kB   |
| 2    | `2344.jpeg`                                                          | foto                  | logo de marca                      | 447×447             | 16 kB        |
| 3    | `excavadora-amarilla-aislada-…-e1788914890653.png`                   | **recorte** (61 %)    | imagen de pestaña                  | 1617×1607           | **1.570 kB** |
| 3    | `potentes-excavadoras-accion-…-1.png`                                | **recorte** (75 %)    | imagen de pestaña                  | 1600×2000           | 652 kB       |
| 3    | `014_Cut01_2560x1710v0-2.png`                                        | **recorte** (58 %)    | imagen de pestaña                  | 1362×1475           | 374 kB       |
| 3    | `21134998_red_and_white_grunge_background-…`                         | textura               | fondo decorativo                   | 588×1000            | 81 kB        |
| 4    | `Mesa-de-trabajo-1…7` (9 ficheros)                                   | **recorte** (85–93 %) | logos del carrusel                 | 605×404             | 5–20 kB      |
| 4    | `logo1.png`                                                          | —                     | **elemento de ejemplo** del widget | 91×114              | 7 kB         |
| 5    | `235553.jpg` y 3 `hf_20260914_*.jpg`                                 | foto (3 por IA)       | tarjetas apiladas                  | 1500×837 · 1200×670 | 217–355 kB   |
| 7    | `hf_20260903_212148_…-1.mp4`                                         | **vídeo** (IA)        | fondo en bucle                     | 1920×1080           | **6.504 kB** |
| 7    | `2151307778.jpg`                                                     | foto (banco)          | póster del vídeo                   | 1500×1260           | 379 kB       |
| 9    | 7 fotos de ciudad (`Bogota.jpg`, `Cali.jpeg`…)                       | foto                  | ficha de sede en el globo          | 574–960 px          | 38–198 kB    |
| 10   | `Testimono-24.jpg`, `Video-Testimonio.jpg`, `Case.jpg`, `345345.jpg` | foto                  | tarjetas de testimonio             | 980–1400 px         | 233–406 kB   |
| 11   | `P1415_6500-2_red_211111.png`                                        | **recorte** (86 %)    | máquina junto a la FAQ             | 2250×2250           | 236 kB       |

Más **13 iconos SVG** (`settings.svg`, `engine_11747032.svg`, `oil-can.svg`…),
de 1–2 kB. Los que llevan número (`engine_11747032`, `debt_14644382`,
`meter-bolt_12400707`) tienen el formato de nombre de Flaticon: ver L2.

**Dos cosas que salen de la tabla:**

- **Ningún SVG puede subirse a `Media`**, que solo admite JPEG, PNG y WebP
  (mitigación del CVE, CLAUDE.md §10.28). Y es bueno que sea así: un SVG subido
  por un editor puede llevar script. Los iconos van **en el código**, no en
  Payload (ver fase B).
- El recorte de 1.570 kB de la sección 3 pesa **entre 2,4 y 4 veces** lo que
  sus dos vecinos de pestaña, con dimensiones parecidas. Recomprimirlo antes de
  subirlo es trabajo de carga de contenido; cuánto baja se mide entonces.

### Recortes de Caterpillar y Komatsu: **no hay**

Revisados los 87 recortes, uno por uno, en hojas de contacto. Marcas que **sí**
aparecen, por el rótulo pintado en la máquina: **Hitachi**, **LiuGong**,
**Yanmar**, **CASE** y **Dynapac**. El resto son máquinas amarillas o naranjas
**sin marca visible** (de banco o generadas), cazos, brazos, montones de tierra
y dibujos de línea. **Ninguno es Caterpillar ni Komatsu.**

Consecuencia: las diapositivas 2 y 3 del prototipo **conservan sus fotos libres**
(Wikimedia, CC0), que siguen siendo **solo de prototipo**. El contenido real del
carrusel sale de Payload (ADR 0009) y lo sube el cliente.

---

## 2. Desviaciones de accesibilidad

Cada una **se aparta de ux-9 a propósito**. El criterio es el del panel:
legibilidad y uso antes que fidelidad, y solo donde el diseño incumple.

### D1 — Niveles de encabezado

| En ux-9                                                                 | En el sitio                                                                                                                                |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ninguna `<h1>`**                                                      | El `<h1>` de la portada es **el logo de la cabecera**, con texto alternativo **«Partequipos — Repuestos y maquinaria pesada en Colombia»** |
| «Potencia Hitachi» en `<h2>`                                            | `<h2>`                                                                                                                                     |
| Títulos de sección («Maquinaria pesada nueva», «usada»…) en **`<div>`** | **`<h2>`**                                                                                                                                 |
| Una frase de apoyo («Trabajamos con fabricantes líderes…») en `<h2>`    | Párrafo                                                                                                                                    |
| Los 12 nombres de tarjeta de equipo en `<h2>`                           | **`<h3>`**                                                                                                                                 |
| Sedes: `<h3>` sin `<h2>` encima                                         | `<h2>` de sección y `<h3>` por sede                                                                                                        |

**Por qué:** los niveles de encabezado son la navegación de quien usa lector de
pantalla y la estructura que lee Google. Ni el aspecto ni el tamaño cambian: la
tipografía sigue siendo la de ux-9; cambia la etiqueta.

**Solo en la portada.** En el resto de páginas el logo sigue siendo un enlace
sin encabezado, y el `<h1>` es el título de cada una (§3.4 de CLAUDE.md).

### D2 — Movimiento

| Regla                                                             | Qué afecta                                                                                            |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Todo lo que se mueve solo lleva control de pausa** (WCAG 2.2.2) | Vídeo de fondo (7), marquee de texto (7), carrusel de logos (4). El carrusel del hero no rota solo    |
| **Todo respeta `prefers-reduced-motion`**                         | Además de lo anterior: revelados de título, parallax, tarjetas apiladas, vídeo que encoge, acordeones |

**No cambia el aspecto para quien no lo pide:** con movimiento permitido, todo
se ve y se mueve como en ux-9. El botón de pausa es la única pieza visible
nueva, y se dibuja con los mismos tokens del diseño. Con movimiento reducido,
cada pieza queda **en su estado final**: el texto visible, el vídeo en su
póster, el marquee quieto y legible.

### D3 — El vidrio del hero no sale de la tarjeta en tablet

Ya decidida (2026-09-23, `docs/design-tokens.md` §11.8): fuera de la tarjeta, el
texto blanco caía sobre blanco (1,05:1).

### D4 — Flechas del hero que funcionan

En ux-9 son `div` decorativos. Aquí son `<button>` con nombre accesible que
mueven un carrusel de **N diapositivas desde Payload** (ADR 0009, revisado).
**Con una sola diapositiva no se pintan.**

### Lo que NO es desviación y queda como está

Los tres fallos de contraste medidos (título del hero 2,4:1; rojo sobre
`#F0F0F0` 3,99:1; blanco sobre rojo 4,54:1, que pasa por poco) **no se tocan**
sin acuerdo con Andrés: corregirlos cambia el aspecto.

---

## 3. Propuesta para Andrés: velo en el hero

Retirado del prototipo el 2026-09-23. Se le propone, **no se aplica**.

**Qué es:** un degradado oscuro en la franja superior de la foto del hero, bajo
el título. Sube el contraste del título blanco, hoy **2,4:1**.

**El argumento, que es suyo:** en la **sección 2** él mismo usa esta técnica.
Las tarjetas de marca llevan un degradado de `#FFFFFF` a `#535353` al 81 % en
modo **multiplicar**, que no toca la parte alta de la foto y oscurece la baja,
justo donde va el texto blanco. El velo del hero sería la misma solución,
invertida hacia arriba porque allí el texto está arriba.

---

## 4. Vídeo: colección propia, `Media` no se toca

`Media` sigue restringida a JPEG, PNG y WebP por la mitigación del CVE
(§10.28). **No se amplía.**

### El MP4 de la sección 7, medido con `ffprobe`

| Dato       | Valor                                                       |
| ---------- | ----------------------------------------------------------- |
| Peso       | **6.504 kB** (6.659.783 bytes)                              |
| Duración   | 19,0 s, en bucle                                            |
| Resolución | 1920×1080 a 24 fps                                          |
| Tasa       | 2,8 Mbit/s                                                  |
| Códec      | H.264 perfil **High 10**, píxel `yuv420p10le` (**10 bits**) |
| Audio      | **ninguno**                                                 |

**Hallazgo, a verificar antes de construir:** el perfil High 10 **no es el que
decodifican los navegadores por hardware**; lo habitual en la web es H.264 de 8
bits. Chrome de escritorio en Windows lo reproduce (probado: `readyState` 4, la
reproducción avanza), pero **Safari de iPhone y Firefox no se han probado**, y
son justo los que pueden negarse. Si fallan, el visitante vería el póster y
nada más. La salida probable es **reexportarlo a H.264 de 8 bits** (lo hace el
cliente o Andrés, o se hace con `ffmpeg` antes de subirlo), que además bajaría
el peso. Se mide en la fase de esa sección, en dispositivo real.

### Colección `videos` (propuesta)

| Campo         | Tipo                                                                     | Por qué                                                                                       |
| ------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| fichero       | `upload`, `mimeTypes: ["video/mp4", "video/webm"]`, **límite de tamaño** | Lista propia de formatos, sin tocar la de `Media`                                             |
| `poster`      | relación **obligatoria** a `Media`                                       | Es lo que ve quien pide movimiento reducido, quien pausa y quien no puede reproducir el vídeo |
| `descripcion` | texto obligatorio                                                        | Qué muestra el vídeo, para quien no lo ve. Decorativo = se declara, no se deja vacío          |
| `decorativo`  | casilla                                                                  | Un vídeo de fondo sin información va con `aria-hidden`; si informa, necesita alternativa      |

**Lo que NO es campo:** el control de pausa. Es del **componente**, siempre
presente cuando el vídeo se reproduce solo (D2). Un editor no puede quitarlo.

Grupo del panel, icono, control de acceso (`escrituraContenido`, como `Media`)
y su migración, igual que cualquier colección nueva: el guardarraíl de
`grupos.test.ts` (§10.25) exige grupo e icono.

**A comprobar en la versión instalada, no en estas notas:** que Payload **no
pasa un vídeo por `sharp`** al subirlo (solo debería procesar imágenes). Es la
pieza que el CVE tocaba.

---

## 5. Nombres de variables: por su papel

Ni los identificadores de Elementor (`--e-global-color-primary`, `aa37d38`) ni
los nombres que les puso Andrés en el kit (`Principal`, `Secundario`, `M`,
`M BOLD`). Un nombre dice **para qué sirve**, así quien lo lea no necesita el
kit abierto. La columna de origen queda como trazabilidad.

| Variable                 | Valor                             | Papel                                 | Origen en el kit      |
| ------------------------ | --------------------------------- | ------------------------------------- | --------------------- |
| `--color-marca`          | `#E5242D`                         | Rojo de marca: botones, acentos       | `primary`             |
| `--color-marca-tenue`    | `#E5242D17`                       | Fondo de pestaña activa (rojo al 9 %) | `123d64f`             |
| `--color-texto`          | `#100F0F`                         | Texto principal                       | `text`                |
| `--color-texto-suave`    | `#56545A`                         | Texto secundario                      | `secondary`           |
| `--color-texto-fuerte`   | `#2E2E2E`                         | Texto de énfasis                      | `accent`              |
| `--color-fondo`          | `#FFFFFF`                         | Fondo de página                       | `099f28a`             |
| `--color-fondo-seccion`  | `#F0F0F0`                         | Fondo de sección alterna              | `a372504`             |
| `--texto-titulo-seccion` | 55 · 40 · 10vw                    | Título de sección                     | `primary`             |
| `--texto-titulo-bloque`  | 45 · 35 · 9vw                     | Título de bloque dentro de sección    | `secondary`           |
| `--texto-titulo-3`/`-4`  | 35 · 30 · 7,5vw / 30 · 25 · 6,5vw | Niveles 3 y 4 (0 usos en la home)     | `aa37d38` / `43da5c7` |
| `--texto-destacado`      | 20 · 20 · 18                      | Entradillas                           | `cd1706f` («M»)       |
| `--texto-cuerpo`         | 16 · 14 · 13, 300                 | Párrafos                              | `text`                |
| `--texto-etiqueta`       | 16 · 13 · 13, 500                 | Antetítulos, botones, etiquetas       | `accent`              |

Los `--color-*` van en el `@theme` de Tailwind v4, que genera las utilidades
con el mismo nombre (`bg-marca`, `text-texto-suave`). Los papeles de
`--texto-etiqueta` y `--texto-destacado` se confirman al construir cada sección:
si un uso no encaja, se renombra, no se fuerza.

**Choque a evitar:** en el sistema del cliente, `secondary` y `accent` son
**superficies**; en el kit son **colores de texto**. Nombrar por papel quita la
ambigüedad de raíz.

---

## 6. Licencias y permisos — pendiente del cliente y de Andrés

**No se resuelven aquí.** Bloquean producción, no la construcción: se construye
con lo que hay y **no se publica** hasta cerrarlas.

| #   | Qué                                                                                 | Qué hace falta                                                                                                                                                                                                                      | De quién                                     |
| --- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| L1  | **HelveticaNeue** (pie)                                                             | **Licencia web** a nombre del cliente, que cubra servirla con `@font-face` desde nuestro dominio. Sin ella, el pie va en Inter                                                                                                      | Cliente, vía Andrés                          |
| L2  | **Iconos de Flaticon** (`engine_11747032`, `debt_14644382`, `meter-bolt_12400707`…) | La licencia gratuita **exige atribución visible**. O se atribuye (texto y enlace que Flaticon indica), o se paga la licencia premium, o se sustituyen                                                                               | Andrés decide; el cliente paga si es premium |
| L3  | **Imágenes de banco y generadas por IA**                                            | Banco (`2151307778.jpg`, `excavadora-amarilla-aislada-…`, `potentes-excavadoras-…`): **licencia de cada una** y de qué banco sale. IA (`hf_2026…`, incluido el vídeo): **qué herramienta** y si sus términos permiten uso comercial | Andrés (procedencia), cliente (compra)       |
| L4  | **Testimonios**                                                                     | **Autorización escrita** de cada persona y empresa para publicar nombre, foto y cita con fines comerciales (Ley 1581 de 2012). Hoy **3 de 4 son el mismo relleno**                                                                  | Cliente                                      |
| L5  | **Mapa de sedes (Mapbox)**                                                          | **Cuenta de Mapbox del cliente**, no la de Andrés, con token **restringido a nuestros dominios**. Aceptar sus términos y su tramo de cobro. Añadir sus dominios a la CSP                                                            | Cliente                                      |

Y dos que salieron en el análisis, relacionadas:

- **Logos de fabricantes** (Hitachi, CASE, Yanmar, Dynapac, LiuGong): confirmar
  que el cliente puede usarlos como distribuidor.
- **Vídeo de YouTube** del botón de reproducir: confirmar que es del cliente, y
  cargarlo con `youtube-nocookie.com` solo al pulsar.

---

## 7. Plan de construcción por fases

Cada fase en su rama, con preview y prueba de humo antes de fusionar (§7).
**Cada sección se verifica pintada en los tres cortes** (390 · 1010 · 1440)
contra ux-9 al mismo ancho, con Chrome sin interfaz, como el hero.

| Fase  | Qué                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Esfuerzo    | Riesgo                                               |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------- |
| **A** | **Base.** Variables por papel (§5) en `@theme`; escala tipográfica de 8 estilos × 3 cortes; Inter con `next/font`. Componente **`Revelado`** sin GSAP (IntersectionObserver + CSS), parametrizado por instancia: escalón, duración, distancia, curva, umbral de disparo y etiqueta (**tres ritmos**: 0,06/0,9/100, 0,3/2/50 y 0,01/2/100). Pieza común de **pausa** y de `prefers-reduced-motion` (D2). Pruebas del componente                                                                 | **6–9 h**   | Bajo                                                 |
| **B** | **Payload.** `hero` con **array de diapositivas** en `Paginas` (ADR 0009). Campos que faltan: foto de fondo de `marcas-maquinaria`; peso operativo, potencia y motor de `equipos-usados`; imagen, icono y enlace de `categorias-tecnicas`. Colecciones nuevas **`sedes`**, **`testimonios`** (con la autorización de L4 como campo), **`preguntas-frecuentes`** y **`videos`** (§4). Una migración, verificada en la rama `preview` de Neon. Tipos regenerados. Guardarraíles de grupo e icono | **12–16 h** | Medio: migración sobre datos                         |
| **C** | **Cabecera + hero.** El logo pasa a `<h1>` solo en la portada (D1). Hero conectado a Payload, sustituye al prototipo                                                                                                                                                                                                                                                                                                                                                                           | 4–6 h       | Bajo                                                 |
| **D** | Secciones **2 y 3**: carrusel de marcas (`scroll-snap`) y pestañas ARIA con tarjetas de equipo usado                                                                                                                                                                                                                                                                                                                                                                                           | 8–11 h      | Medio                                                |
| **E** | Secciones **4 y 5**: carrusel de logos con pausa; tarjetas apiladas con `position: sticky`                                                                                                                                                                                                                                                                                                                                                                                                     | 6–9 h       | Medio                                                |
| **F** | Secciones **6–7 y 8**: vídeo que encoge (sticky + animación ligada al scroll), marquee con pausa, llamada a la acción con su solape de −180 px. Prueba del vídeo en **Safari de iPhone** (§4)                                                                                                                                                                                                                                                                                                  | 8–12 h      | **Alto**: la pieza más cara y la de peor rendimiento |
| **G** | Sección **9**: globo de sedes. **Depende de L5** (cuenta del cliente). Mapbox **solo al entrar en pantalla**, con lista de sedes en HTML como alternativa y para SEO. CSP ampliada                                                                                                                                                                                                                                                                                                             | 6–9 h       | Alto: 365 kB de JS de terceros                       |
| **H** | Secciones **10 y 11**: testimonios (acordeón) y FAQ (`<details>`)                                                                                                                                                                                                                                                                                                                                                                                                                              | 5–7 h       | Bajo                                                 |
| **I** | **Cierre.** Lighthouse local antes y después (mediana de 3), `qa`, repaso de teclado en toda la home, modo oscuro del sistema (§10.14)                                                                                                                                                                                                                                                                                                                                                         | 3–4 h       | —                                                    |
|       | **Total**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | **56–83 h** |                                                      |

**Decisiones que se toman dentro de su fase, no ahora:**

- **B:** los iconos de `categorias-tecnicas`. No pueden ir a `Media` (SVG). Salida
  probable: un `select` con los iconos del código; qué juego de iconos depende de
  L2.
- **B:** el carrusel de logos (sección 4) sale de `marcas` o de una lista propia.
- **G:** si Mapbox no llega (L5), la sección se construye con la lista y sin globo.
- **H:** JSON-LD `FAQPage`. Es marcado válido, pero Google dejó de mostrar el
  resultado enriquecido de FAQ para la mayoría de sitios: se pone por corrección
  estructural, no esperando un resultado visible.

**Lo que no depende de nadie y puede empezar ya:** A y B. De la C en adelante,
el contenido real sigue bloqueado por el cliente (CSV, WordPress), así que las
secciones se construyen con los textos de ux-9 sembrados en `development`.

### Pendientes anotados antes de sus fases

| Pendiente                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Antes de   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| **Reexportar el MP4 de la sección 7: a H.264 de 8 bits Y por debajo de 4 MB.** Hoy es High 10 (10 bits), y puede que Safari de iPhone no lo reproduzca y el visitante vea solo el póster (§4). Y pesa 6,5 MB: la colección `videos` admite **4 MB como máximo**, porque la subida pasa por una función de Vercel que corta a 4,5 MB (§9). Las dos condiciones a la vez; si no cabe en 4 MB con calidad aceptable, se decide la subida directa con ruta propia (§9) | **Fase F** |
| **RESUELTO (§11)** — versión más ligera del recorte de 1.570 kB de la sección 3: PNG con paleta, **558 kB**, exacta en todo píxel visible                                                                                                                                                                                                                                                                                                                          | **Fase D** |
| **El revelado del prototipo del hero usa `translateY` en px (50 px)**; el widget de Andrés usa `yPercent` (50 % del alto de la palabra). Se corrige al pasarlo a `Revelado` con el ritmo `portada`                                                                                                                                                                                                                                                                 | **Fase C** |
| **El parpadeo del hero:** un bloque ya visible al cargar se pinta, se oculta al hidratar y se revela (limitación de `Revelado`, §8). Resolverlo **sin retrasar el LCP**, que en la home es el título o la foto del hero, y **medir antes y después** (Lighthouse local, mediana de 3, y el LCP en la página pintada)                                                                                                                                               | **Fase C** |

---

## 8. Fase A — hecha y fusionada (2026-09-23)

Rama `feat/base-ux9`, fusionada a `main` tras verificarla en el preview.

| Pieza                       | Dónde                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Colores por papel           | `@theme` de `src/app/(site)/globals.css` → `bg-marca`, `text-texto-suave`…                                                   |
| Escala tipográfica          | Mismo fichero: variables `--texto-*` con los cortes de ux-9 (767 / 1024) y una utilidad por estilo (`texto-titulo-seccion`…) |
| Inter                       | `layout.tsx`, variable: **un** fichero para los cinco pesos                                                                  |
| Revelado sin GSAP           | `src/components/movimiento/Revelado.tsx` + `ritmos.ts` (puro, probado)                                                       |
| Pausa y movimiento reducido | `usePausa`, `useMovimientoReducido`, `BotonPausa`                                                                            |
| Banco de pruebas            | `/laboratorio/movimiento/`: **404 en producción**, fuera del sitemap por decisión escrita                                    |

**Lo que NO toca:** ninguna plantilla existente cambia de clases. Lo único que
les llega es la fuente.

### Hallazgo: el sitio NO usaba Geist — se pintaba en Arial

`globals.css` traía `body { font-family: Arial, Helvetica, sans-serif }` del
andamiaje, y eso pisaba la variable de Geist. Medido en la página pintada: las
21 plantillas en **Arial**. Y aun así cada página **precargaba 52 kB** de Geist
(23 + 29 kB) que no se usaban en ninguna parte. El cambio real de la fase A para
las páginas existentes es **Arial → Inter**, no Geist → Inter.

### Impacto medido sobre las páginas que ya existen

Una ruta por plantilla (21: portada, institucional, contacto, los 5 niveles de
repuestos, los 6 de maquinaria nueva, usada, lubricantes, blog y su categoría,
artículo), pintadas con Chrome sin interfaz a 390, 1010 y 1440 px, antes y
después, sobre builds locales contra `development`:

| Comprobación            | Antes              | Después                                                                               |
| ----------------------- | ------------------ | ------------------------------------------------------------------------------------- |
| Desborde horizontal     | 0 de 63            | **0 de 63**                                                                           |
| Errores de consola      | 0                  | **0**                                                                                 |
| Un solo `<h1>`          | 63 de 63           | **63 de 63**                                                                          |
| Fuente pintada          | Arial              | **Inter**                                                                             |
| Altura de página        | —                  | igual o **+0,6 a +3,8 %**: Inter es más ancha que Arial y algunas líneas parten antes |
| `npm run qa` (198 URLs) | 0 errores, 1 aviso | **0 errores, el mismo aviso**                                                         |

Revisado a ojo en las dos que más crecen (blog a 390 px, maquinaria nueva a
1440 px): mismas cajas, solo cambia dónde parten las líneas. A 390 px, en el
menú de la cabecera, «Contacto» pasa a la segunda línea, que ya existía.

### Lighthouse móvil, local, mediana de 3

| Plantilla               | Antes: puntuación · LCP  | Después: puntuación · LCP |
| ----------------------- | ------------------------ | ------------------------- |
| Portada                 | 88 · 2,96 s              | 96 · 2,72 s               |
| Contacto                | 90 · 3,07 s              | 93 · 3,05 s               |
| Artículo                | 93 · 3,05 s              | 97 · 2,65 s               |
| Ficha de maquinaria     | 87 · 3,30 s              | 92 · 3,14 s               |
| Modelo de repuestos     | 89 · 3,34 s              | 92 · 3,07 s               |
| **Fuentes descargadas** | **2 ficheros · 53,4 kB** | **1 fichero · 48,4 kB**   |

**CLS 0 en todas, antes y después.** Lo que sí es atribuible al cambio: **un
fichero de fuente menos y 5 kB menos**, porque Inter variable sustituye a los
dos de Geist. La subida de puntuación **no se atribuye**: entre corridas del
mismo código la puntuación ya se movía hasta 19 puntos (74 a 93 en la portada),
y la mejora de TBT apunta más al estado de la máquina que a 5 kB de fuente.
Conclusión prudente: **Inter no empeora nada medible**.

### El revelado, probado pintado (`/laboratorio/movimiento/`)

| Caso                                        | Resultado                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Con movimiento                              | Oculto antes del disparo; a 250 ms, a medio camino; al final, opacidad 1 y quieto. Los tres ritmos y la curva con rebote |
| **`prefers-reduced-motion`**                | **Las cinco instancias visibles y quietas SIN hacer scroll**; la franja de prueba, parada y con «Reproducir»             |
| Sin JavaScript                              | Todo visible                                                                                                             |
| Entrando por un ancla al final de la página | Los bloques que quedaron por encima, visibles (un IntersectionObserver a secas los dejaba ocultos)                       |
| Lector de pantalla                          | Encabezados con `aria-label` del texto entero y palabras fuera del árbol; el párrafo, legible sin `aria-label`           |
| Pausa                                       | Para la franja y cambia su nombre a «Reproducir la franja»                                                               |

**Limitación conocida:** un bloque ya visible al cargar se pinta, se oculta al
hidratar y se revela. Solo afecta al hero; se decide en la fase C.

### En el preview — las 21 plantillas

- **Prueba de humo: verde** en los tres despliegues de la rama.
- **Ruta a ruta** con `vercel curl`, no con `qa` (contra un preview mide
  producción, §10.21). Criterio: 200, un `<h1>`, **un** fichero de fuente
  precargado, ningún rastro de Geist, `canonical` y `noindex`.
- **Primera pasada (`partequipos-o5a0txlxl`): 13 de 21.** Las otras **8** —blog
  por categoría y artículo, lubricantes, usada por categoría y tres de
  maquinaria nueva— dieron 404, y **no por la fase A**: el preview anterior sin
  este cambio (`bcb4890`) daba los mismos 404, y la base del preview tenía **0**
  artículos, **0** marcas de lubricante y **0** categorías de usada, frente a 8,
  1 y 8 en producción. La rama de Neon se clonó el 2026-09-16, antes de sembrar
  esas secciones en producción. _(Este documento dijo primero «12 de 21» y «las
  otras 9»: estaba mal contado. Eran 13 y 8.)_
- **Dirección refrescó la rama `preview` desde `production`** (2026-09-23).
  Segunda pasada sobre `partequipos-hemmu9t58`: **las 8 en 200** con el mismo
  criterio. **Las 21 plantillas quedan verificadas en el preview**, no solo en
  local. Procedimiento para las próximas fases: CLAUDE.md §10.21.

---

## 9. Vídeo: cómo se sube (fase B, 2026-09-23)

**El límite:** las funciones de Vercel cortan el **cuerpo de la petición en
4,5 MB** y devuelven 413 `FUNCTION_PAYLOAD_TOO_LARGE`, en todos los planes
([documentación de Vercel](https://vercel.com/docs/functions/limitations),
«Request body size»). **Y la respuesta, igual**: un vídeo servido por
`/api/videos/file/…` pasaría por una función. El MP4 de ux-9 pesa 6,5 MB, así
que por la subida normal **no entra**.

**La subida directa del navegador a Blob existe** (`clientUploads` de
`@payloadcms/storage-vercel-blob` 3.89.0) y **no se ha activado**, por tres
cosas leídas en su código:

1. **Es de todo el plugin, no de una colección**: activarla la aplicaría
   también a `Media`, la colección restringida por el CVE (§10.28).
2. **El token de subida no limita nada**: la ruta que lo emite devuelve
   `addRandomSuffix`, `allowOverwrite: true` y la caché, **sin tipos de
   contenido ni tamaño máximo**. Cualquier usuario del panel podría subir
   cualquier fichero, de cualquier tamaño, y **sobrescribir** uno existente
   —incluido el logo, que no está en `Media` (§10.8)—.
3. **El fichero se publica ANTES de validarse**: Payload lo descarga de Blob
   para comprobar el tipo, pero para entonces ya tiene URL pública.

**Lo que se hizo:** colección `videos` con subida NORMAL y **tope de 4 MB**,
por debajo del límite. Encaja con el pendiente que ya existía —el MP4 hay que
reexportarlo a H.264 de 8 bits antes de la fase F— y con el rendimiento: 19 s
de fondo en bucle no necesitan 6,5 MB. Servido directo desde Blob
(`disablePayloadAccessControl`), así la respuesta no pasa por una función.

**Si el vídeo reexportado no cabe en 4 MB**, la salida no es `clientUploads`
tal cual: sería una ruta propia con `handleUpload` de `@vercel/blob/client`
que fije `allowedContentTypes`, `maximumSizeInBytes` y un prefijo de ruta, y
`allowOverwrite: false`. Es trabajo aparte y se decide entonces.

**Formato por contenido**, como en `Media`: `formatoDeVideoPermitido` acepta MP4
por **lista de marcas** de la caja `ftyp` —AVIF y HEIC empiezan igual, y un
AVIF es el formato del CVE— y WebM por su cabecera EBML.

**No probado de punta a punta:** la subida real de un vídeo. En local no se
puede: el Blob de `development` **es el de producción** (almacén
`sr2s4ngkjzfzpxhi`, §10.4), y una subida de prueba escribiría en el real. Se
prueba en el preview, que tiene almacén propio.

---

## 10. Fase C — cabecera y hero (2026-09-23)

| Pieza                                    | Dónde                                                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hero desde Payload                       | `HeroPortada.tsx` + `src/lib/portada/hero.ts` (descarta diapositivas sin fondo; enlace solo con nombre accesible). Sustituye al prototipo                                            |
| Logo como `<h1>` solo en la portada (D1) | `LogoCabecera.tsx`: `useSelectedLayoutSegment` (no `usePathname`, que en una regeneración devuelve `/index`), prerenderizado en el servidor. Nombre: el título de la página `inicio` |
| Logo al tamaño pintado                   | 184×36 en vez de 1614×317: se pide a **256 px** en vez de 1920                                                                                                                       |
| Revelado sin parpadeo                    | `Revelado` con `alCargar`: animación por `@keyframes` desde el primer pintado                                                                                                        |
| Punto focal                              | `focalPoint: true` en `Media`; `object-position` en el fondo del hero y en las imágenes del blog con `object-cover`                                                                  |

### El parpadeo, medido antes y después

Traza fotograma a fotograma de la opacidad de la primera palabra del título,
inyectada antes de cargar la página (6 cargas: 1440 y 390 px × 3), y
Lighthouse móvil local, mediana de 3:

|                         | Parpadeo                                                                    | LCP mediana | Elemento LCP             |
| ----------------------- | --------------------------------------------------------------------------- | ----------- | ------------------------ |
| Antes (observador)      | **6 de 6**: opacidad 1 a ~140 ms, 0 a ~240 ms al hidratar, y vuelve a subir | 3,05 s      | imagen de fondo del hero |
| Después (CSS al cargar) | **0 de 6**: arranca en 0 y sube hasta 1                                     | 2,99 s      | imagen de fondo del hero |

**No retrasa el LCP:** el LCP es la imagen de fondo en las dos, así que ocultar
el título al primer pintado no lo toca; la diferencia está dentro del ruido.
Con movimiento reducido el texto está visible y quieto a los 50 ms; sin
JavaScript la animación CSS corre igual y acaba visible.

**Límite de la medición:** con las imágenes de demostración de `development`
(40 kB), no con la foto de ux-9 (593 kB). El orden de LCP (imagen antes que
título) no cambia con una foto más pesada; la cifra absoluta sí.

### Verificado en la página pintada (local, contra `development`)

- `<h1>` único en la portada (el logo, «Partequipos — Repuestos y maquinaria
  pesada en Colombia», `aria-current`); en `/nosotros/` el `<h1>` es su título
  y el logo un enlace «Partequipos — Inicio».
- Carrusel: flecha derecha por teclado cambia de diapositiva y lo anuncia.
- Geometría a 390 · 1010 · 1440: tarjeta 717 · 774 · 774 px, **idéntica al
  prototipo** medido contra ux-9 en sus rondas; vidrio dentro de la tarjeta;
  sin desborde.
- `qa` completo: 0 errores. Enseñado a no avisar de imágenes `fill`
  (`data-nimg="fill"`): van en una caja con tamaño y no causan CLS.

### Pendiente dentro de la fase C

- **Punto focal no sobrescribe el fichero:** a verificar en el preview con una
  imagen subida allí, midiendo el Blob **pasados los 60 s** de propagación.
- **El hero con las fotos reales de ux-9** en el preview: la portada de
  producción no tiene diapositivas, así que hoy el hero no se pinta en
  producción hasta que un editor las cree.

### Lighthouse móvil con la foto real (2026-09-24)

Corrido por dirección desde las DevTools, en incógnito, **Lighthouse 13.4.1**,
móvil, _simulated throttling_, solo Performance. «Antes» = portada de
producción (sin hero); «después» = alias del preview de la fase C, con la
diapositiva «Potencia Hitachi» y las fotos de ux-9 (\`Fondo.jpg\` 593 kB,
\`Hero-1.png\` 908 kB).

**Validación:**

- Las seis corridas, misma versión (13.4.1) y URL final correcta; ninguna en la
  pantalla de acceso de Vercel.
- **\`despues-1\` descartada:** \`runtimeError: NO_FCP` —la página no llegó a
  pintarse (pestaña sin primer plano, §10.20)—. El «después» queda con **2**
  corridas: su mediana es la media de las dos.
- **\`antes-1\` atípica** (arranque en frío): TTFB 931 ms, _render delay_ 9 s,
  Speed Index 14,5 s frente a 1,05–1,32 de sus compañeras. La mediana la
  absorbe.

| Métrica      | Antes (mediana de 3)         | Después (mediana de 2)        |
| ------------ | ---------------------------- | ----------------------------- |
| Performance  | 99 (84 · 99 · 100)           | 99 (99 · 99)                  |
| **LCP**      | 1,82 s                       | **1,56 s**                    |
| FCP          | 1,06 s                       | 1,04 s                        |
| TBT          | 85 ms                        | 98 ms                         |
| CLS          | 0                            | 0                             |
| Speed Index  | 1,32 s                       | 1,19 s                        |
| Elemento LCP | el \`<h1>\` de texto del CMS | **la foto de fondo del hero** |

**Lectura:** el hero **no empeora** el LCP; lo baja 0,26 s. El elemento LCP
pasa de un texto grande, que esperaba a la fuente y al pintado, a una imagen
de **36 kB precargada con prioridad alta** (fases: TTFB 150 · retraso de carga
30–67 · descarga 175–185 · pintado 82 ms). **1,56 s, por debajo de 2,5.**

**Por qué tan distinto del 2,99 s local:** aquello era Lighthouse 12 por línea
de comandos contra \`next start\` en local, sin CDN, con las imágenes de
demostración. Métodos distintos: no se comparan entre sí.

**Frente a la línea base 73 / 90 / 83 (2026-09-22):** solo como referencia. Hoy
la misma portada de producción da 84 / 99 / 100 con la otra herramienta
(DevTools, Lighthouse 13.4.1, otra máquina): el cambio de método mueve la
puntuación más que el hero. Al cliente, las cifras de antes y después **de esta
tanda**, que sí son comparables entre sí.

### La foto se sirve AMPLIADA en móvil (confirmado)

Lighthouse móvil emula 412 × 823 px a densidad 1,75. La tarjeta mide unos
400 × 708 px y la foto (3:2, proporción 1,506) la cubre con \`object-cover\`:
para cubrir 708 px de alto se pinta a **~1.066 px de ancho CSS**, o sea
**~1.866 px físicos**. Con \`sizes="100vw"\` el navegador calcula 412 × 1,75 =
721 y pide **w=750**: la foto se amplía **~2,5 veces**. Borrosa en cualquier
móvil en vertical (en un iPhone de 390 px a densidad 3 pide w=1200 para
~2.600 px necesarios: ~2,2 veces).

### Recomendación (NO aplicada; decisión pendiente)

1. **\`sizes\` por la proporción de cada imagen.** La altura manda cuando la
   ventana es más estrecha que la proporción de la foto por la altura de la
   tarjeta. Con la tarjeta a ~86vh y una foto de proporción \`p\`:
   \`sizes="(max-aspect-ratio: {86·p}/100) {86·p}vh, 100vw"\`. Para \`Fondo.jpg\`
   (\`p\` = 1,506): \`(max-aspect-ratio: 129/100) 129vh, 100vw\`. Se calcula en el
   componente con el ancho y el alto de cada foto, así sirve para cualquier
   diapositiva. En escritorio apaisado no cambia nada (sigue 100vw).
2. **Calidad 60 solo para los fondos del hero.** Medido con \`sharp\` sobre
   \`Fondo.jpg\` (mismo codificador que \`next/image\`; a 1920/75 da los 156 kB
   que sirve el preview):

   | Ancho | q75    | q65    | q60        | q55    |
   | ----- | ------ | ------ | ---------- | ------ |
   | 1080  | 67 kB  | 58 kB  | 55 kB      | 52 kB  |
   | 1920  | 156 kB | 136 kB | **127 kB** | 119 kB |

   Exige declarar \`images.qualities: [60, 75]\` en \`next.config.ts\`: Next 16
   solo admite por defecto la 75. A validar a ojo por Andrés: es una foto de
   fondo con texto encima.

3. **LCP estimado** con \`sizes\` ajustado + q60: Lighthouse móvil pediría w=1920
   (1.866 px necesarios) → **127 kB** en vez de 36 (+91 kB). Al ancho de banda
   simulado (~1,6 Mbit/s ≈ 200 kB/s) son ~0,45 s más: **LCP ≈ 2,0 s**. Con q75,
   156 kB → **≈ 2,2 s**. Las dos por debajo de 2,5. **Es una estimación**: se
   mide de nuevo con el cambio aplicado, con este mismo método.

Pendiente de medir con la foto real, lo que queda de la fase C: nada más. El
punto focal y la regeneración, verificados (arriba).

### Medición con el `sizes` por proporción (2026-09-24)

Mismo método (Lighthouse 13.4.1, DevTools, incógnito, móvil, _simulated
throttling_), **tres corridas válidas** del «después». Las tres piden el fondo
a **w=1920, 157 kB**, y su elemento LCP es la foto.

| Métrica     | `sizes="100vw"` (mediana de 2) | `sizes` por proporción (mediana de 3) |
| ----------- | ------------------------------ | ------------------------------------- |
| Performance | 99                             | **98** (98 · 95 · 98)                 |
| **LCP**     | 1,56 s                         | **2,24 s** (2,24 · 2,30 · 2,24)       |
| FCP         | 1,04 s                         | 1,09 s                                |
| TBT         | 98 ms                          | 122 ms                                |
| CLS         | 0                              | 0                                     |
| Speed Index | 1,19 s                         | 1,33 s                                |

**+0,68 s de LCP por +121 kB de foto**: el precio de dejar de servirla ampliada
2,5 veces. Coincide con la estimación previa (≈ 2,2 s). **2,24 s: por debajo de
2,5, con 0,26 s de margen**, y con poca dispersión entre corridas (2,24–2,30).
La corrida 2 descargó la foto más despacio (658 ms frente a ~245) y es la de
menor puntuación; la mediana no la recoge.

**Calidad 60, si algún día hiciera falta** (no aplicada: cambio visual que
decide Andrés): a 1920 px pasa de 156 a 127 kB (−29 kB). Al ancho de banda
simulado (~200 kB/s) son **~0,15 s menos: LCP ≈ 2,1 s**. Margen de 0,26 → ~0,4 s.

**Regla desde aquí** (dirección, 2026-09-24; completa en CLAUDE.md §10.3
p.14): esta medición —**LCP 2,24 s**— es la referencia de la home. Tras cada
fase que añada algo a la portada se repite con el mismo método. **> 2,4 s** →
calidad 60 en los fondos del hero, con validación visual de Andrés. **> 2,5 s
aun así** → se para y se analiza.

---

## 11. Fase D — secciones 2 y 3 (2026-09-24)

Rama `feat/fase-d-secciones-2-3`.

| Pieza                                   | Dónde                                                                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Lógica pura (tarjetas, pestañas, ficha) | `src/lib/portada/secciones.ts` + `secciones.test.ts`                                                                                    |
| Consultas                               | `getMarcasDePortada` y `getEquiposUsadosDePortada` en `src/lib/queries/getMaquinaria.ts` (dos consultas con tope, una por pestaña)      |
| Sección 2                               | `SeccionMaquinariaNueva.tsx` (servidor) + `CarruselMarcas.tsx` (cliente, `scroll-snap`, sin Swiper) + `maquinariaNueva.module.css`      |
| Sección 3                               | `SeccionMaquinariaUsada.tsx` (servidor, pinta las tarjetas) + `PestanasUsada.tsx` (cliente, patrón ARIA) + `maquinariaUsada.module.css` |
| Máquina decorativa de la sección 3      | Campo nuevo **opcional** `paginas.seccionUsada.imagen` (solo en `inicio`). Migración `20260924_143657_fase_d_portada`                   |
| Portada de prueba del preview           | `npm run preview:hero-prueba` siembra y retira también las secciones 2 y 3                                                              |

**Sin GSAP.** Los títulos usan `Revelado` (disparo al 95 %, ritmo `titulo`) y
la frase de marcas el ritmo `pausado`. El panel de pestañas aparece con el
`fadeIn` de Elementor (0,75 s) y la foto de la tarjeta crece al pasar el ratón
(×1,1 en 0,3 s), como en ux-9. **Con movimiento reducido**: títulos visibles y
quietos (medido: 24 palabras, 0 ocultas o desplazadas), sin aparición del panel,
sin crecimiento y con desplazamiento instantáneo del carrusel.

### Medido contra ux-9 pintado, en los tres cortes

Los valores **no salen de la captura**: se midió cada elemento de su página
pintada (Chrome sin interfaz) y se cotejó con la nuestra, en coordenadas
relativas a la sección. Lo que no depende de las imágenes coincide al píxel:

| Elemento (1440)              | ux-9                      | Nuestro                   |
| ---------------------------- | ------------------------- | ------------------------- |
| Sección 2                    | 1440 × 691                | 1440 × 691                |
| Tarjetas de marca            | x 63 · 511 · 959, 418×270 | x 63 · 511 · 959, 418×270 |
| Texto de la tarjeta          | 217, 357                  | 217, 357                  |
| «Ver todo»                   | 648, 569 · 145×40         | 648, 569 · 145×40         |
| Título «usada»               | 955, 121 · 418×132        | 955, 121 · 418×132        |
| Pestañas                     | y 293, alto 46            | y 293, alto 46            |
| Tarjeta de equipo            | 684, 379 · 679 de ancho   | 684, 379 · 679 de ancho   |
| Nombre · primer dato · botón | x 998 · y 399 / 499 / 684 | x 998 · y 399 / 499 / 684 |

A 1010 y 390 igual (tarjetas de marca de 440 y 327, flechas en x 40 y 22, logo
de 100 y 120 px, pestañas de 43 de alto, tarjetas de equipo de 465 en tablet).
Lo que cambia de alto se debe a las **imágenes de demostración** de
`development` (la máquina de ux-9 es 4:5; la de demo, 4:3): la distancia de la
máquina al titular de marcas es la misma (179 px a 1440, 41 a 1010).

**Un ajuste que salió de medir:** el hueco entre tarjetas de marca es **30 px**,
no 20: Swiper suma su `spaceBetween` de 10 a los 10 px de relleno de cada
diapositiva. La primera versión daba 20.

### Desviaciones de esta fase

| #   | En ux-9                                                                                                     | Aquí                                                                                     | Por qué                                                                                                                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Títulos en `<div>`, frase en `<h2>`, nombres de tarjeta en `<h2>`                                           | `<h2>`, `<p>` y `<h3>`                                                                   | Ya decidida (§2)                                                                                                                                                                                                                                        |
| D5  | En **móvil** la tarjeta de equipo sigue en fila y la columna de texto empieza en **x = 382 de 390**         | La tarjeta se **apila**: imagen arriba, texto debajo, con los mismos valores             | Medido: nombre, ficha y «Ver producto» quedan **fuera de la pantalla**. Es un fallo del diseño, no una decisión                                                                                                                                         |
| D6  | Iconos de Flaticon (`debt`, `meter-bolt`, `engine`, `settings`, `blog-text`)                                | Iconos de **Tabler** equivalentes, mismo tamaño y color                                  | **L2**: la licencia gratuita de Flaticon exige atribución visible. Tabler (MIT) ya es dependencia aprobada; va en componentes de servidor, así que no añade JavaScript. **Primer uso fuera del panel.** Si Andrés resuelve L2, se cambian por los suyos |
| D7  | Swiper en **bucle**: flechas y puntos aunque las tres tarjetas quepan                                       | Sin bucle. Si todo cabe, **no hay flechas** y la fila de puntos queda vacía, con su alto | Unas flechas que no llevan a ninguna parte son un control falso. Con 4 o más marcas con foto aparecen también en escritorio                                                                                                                             |
| D8  | Puntos pulsables de 6 px, 18 px entre centros                                                               | Los puntos **indican**; no se pulsan (`aria-hidden`)                                     | WCAG 2.5.8 pide 24 px de objetivo, y no cabe sin cambiar su aspecto. Las flechas y el gesto ya navegan                                                                                                                                                  |
| D9  | Las tarjetas de marca **no enlazan**                                                                        | Cada tarjeta enlaza a **su marca**                                                       | Sin cambio visual. Enlaces internos a las páginas de marca (SEO) y un destino evidente para quien pulsa la tarjeta                                                                                                                                      |
| D10 | En **móvil** las pestañas pasan a acordeón: «Otros» y «Aditamentos» quedan **debajo** del contenido abierto | Siguen siendo pestañas: todas arriba, a todo el ancho, mismo aspecto                     | El patrón ARIA exige la lista junta; partirla lo rompe                                                                                                                                                                                                  |
| D11 | Pestaña **«Aditamentos»**                                                                                   | **No se pinta**                                                                          | Sin fuente en la línea usada: «Aditamentos» es una «marca» de la línea **nueva** (ADR 0007). **Decisión pendiente de dirección.** «Excavadoras» es la categoría `excavadoras`; «Otros», el resto                                                        |
| D12 | La máquina de la sección 3 sube 140 px **encima** del botón «Ver todo»                                      | El botón queda **por encima**                                                            | En ux-9 el recorte es transparente y el botón se ve, pero el `<img>` se queda el clic en la zona que solapa (a 390 px, el botón entero)                                                                                                                 |

**Y dos que no son desviación, anotadas para no confundirlas:**

- **«Ver producto» lleva a la categoría**, no a la máquina: el equipo usado no
  tiene URL propia (ADR 0007). El nombre accesible es el texto visible, y el
  enlace se describe con el `<h3>` de su tarjeta (`aria-describedby`).
- **El decimal va con coma** («8,4 t»), no con el punto de ux-9: es la
  convención de Colombia (`es-CO`), la misma del resto del sitio.

### Textos de la sección: interfaz, no contenido

«Venta de maquinaria», «Maquinaria pesada nueva/usada», «Marcas que respaldan
nuestro trabajo», su frase y los botones están **en el código**, como los
títulos de la navegación y los de la portada anterior («Qué encontrarás aquí»).
Las tarjetas, sus textos, fotos y fichas **salen de Payload**. Si el cliente
quiere editar esos títulos, es un grupo más en `inicio`, con migración: no se
hizo sin que nadie lo pidiera.

### El recorte de 1.570 kB: resuelto sin pérdida visible

El pendiente de §7. Medido con `sharp`:

| Versión                          | Tamaño     | Píxeles visibles distintos |
| -------------------------------- | ---------- | -------------------------- |
| Original (RGBA)                  | 1.570 kB   | —                          |
| RGBA recomprimida, sin paleta    | 1.560 kB   | 0 (bytes idénticos)        |
| **PNG con paleta, mismo tamaño** | **558 kB** | **0**                      |
| 1200 px, WebP q90                | 240 kB     | con pérdida                |

**Por qué la paleta sale exacta:** el original solo tiene **255 colores
visibles** —ya estaba cuantizado— guardados como RGBA de 32 bits. Una paleta de
256 entradas los representa todos. Las únicas diferencias están en el color de
píxeles **totalmente transparentes**, que no se ven. **−64 % sin tocar un píxel
visible.** El script de prueba sube esta versión.

### Una deriva de esquema que salió al generar la migración

`payload migrate:create` añadió, además de la columna nueva, **`DROP COLUMN`
de `videos.focal_x` y `videos.focal_y`**: el commit `0d2dbd3` (fase C) puso
`focalPoint: false` en `Video` **sin migración**, y las columnas seguían en las
bases. Se queda en esta migración, anotado en ella: un punto focal de un vídeo
no se usó nunca (el póster tiene el suyo en `Media`). **Lección:** un cambio en
una colección, aunque sea «quitar una opción», puede cambiar el esquema; hay que
generar la migración en el mismo commit, o la recoge por sorpresa la siguiente.
