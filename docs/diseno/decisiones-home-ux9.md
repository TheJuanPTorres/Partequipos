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
no se usó nunca (el póster tiene el suyo en `Media`), y **no había ningún vídeo**: 0 en el preview (contado tras migrar) y 0 en producción (contado antes de fusionar). **Lección:** un cambio en
una colección, aunque sea «quitar una opción», puede cambiar el esquema; hay que
generar la migración en el mismo commit, o la recoge por sorpresa la siguiente.

---

## 12. Cabecera (2026-09-24, directa a producción por la reunión)

Fuente: `elementor-2629-2026-09-24.json`, idéntico valor a valor a la
plantilla 2162 del kit. Geometría medida en ux-9 **pintado desde su HTML
guardado**, porque la página estaba en modo mantenimiento. Los estáticos del
servidor sí respondían.

| Qué                      | ux-9                              | Nuestro                                   |
| ------------------------ | --------------------------------- | ----------------------------------------- |
| Alto 1440 · 1010 · 390   | 100 · 71 · 67 px                  | 100 · 71 · 66 px                          |
| Tarjeta del hero empieza | justo debajo de la cabecera       | igual; la foto no pasa por debajo         |
| Espacio entre enlaces    | 170 · 106 · 115 px                | idéntico (el bloque, 8 px a la izquierda) |
| Enlaces · activo         | global `text` #100F0F · `primary` | igual                                     |
| Iconos móviles           | global `secondary` #56545A        | igual                                     |

### LECCIÓN — un color fijo no vale si tiene referencia global

En el export, un ajuste puede llevar **a la vez** un valor fijo (`title_color:
"#F0F0F0"`) y una referencia en `__globals__` (`title_color` → `text`). **En
Elementor manda la global**; el fijo es un resto sin uso. La primera versión
de la cabecera tomó el fijo y pintó el menú en `#F0F0F0` sobre el cielo claro
del hero: ilegible. Corregido en el mismo día.

**Regla:** al leer un export de Elementor, **resolver primero `__globals__`**
contra `site-settings.json`, y usar el fijo solo si no hay referencia.

**Revisión hecha (script sobre 1717.json, secciones 1–3, y la cabecera):**

- **Sección 1 (fase C) y sección 2:** ningún fijo contradice a su global.
- **Sección 3 (fase D):** hay fijos que contradicen a su global, pero **en todos
  ya se había usado la global**: fondo de la tarjeta, nombre e iconos de la
  ficha. El borde de «Ver producto» es `none`, así que no se pinta.
- **Una excepción consciente:** el texto de «Ver producto» en **4 de las 6
  tarjetas**, las de las pestañas «Otros» y «Aditamentos». Su global es
  `secondary`, gris `#56545A` sobre el rojo (≈ 2,3:1), mientras que las 2 de
  «Excavadoras» usan blanco. Aquí va **blanco en todas**: es lo que se ve
  pintado en ux-9, es consistente y es legible. Anotado para Andrés.

### Decisiones tomadas deprisa, a revisar

- `Logo-1.png` de Andrés en `public/` (transparente, letras oscuras). Es el
  logo del cliente, sin la licencia pendiente de las fotos.
- **Encogido al bajar:** el «85 px» del export se interpreta como logo al
  85 %, con `transform` para no desplazar la página (CLS 0).
- **Menú móvil provisional:** no está diseñado.
- **Botón «Contáctanos»:** en ux-9 queda 15 px más a la izquierda. Sin
  investigar.

### PENDIENTE — el título del hero, desde la fase C

Comparando pintados, en ux-9 el título queda unos **15 px** bajo el borde de la
tarjeta; en el nuestro, unos **60 px**. **No lo introdujo la cabecera**: se ve
igual en las capturas de la fase C. La medida numérica en ux-9 da cajas
contradictorias (el texto sale por encima de su caja), probablemente por el
`transform` de su animación. Hay que medirlo con la animación terminada.

---

## 13. Pie (2026-09-24, directo a producción por la reunión)

Fuente: `elementor-2696-2026-09-24 (1).json`. Colores de las **referencias
globales** (§12):

- Fondo de la tarjeta: `primary`.
- Texto y borde del botón: `099f28a`.
- Columnas: `a372504`.
- Títulos de columna: tipografía `2e6cf84` (M BOLD).
- Lema: tipografía `secondary`.
- Redes: `icon_background 099f28a`, `icon_color text` y hover `primary`.

Punto de retorno antes de empezar: `dpl_4gcAnPLNaeB9xsBNdzqqxC88eUpw`.

**Contraste medido en la página pintada** (390, 1010 y 1440; portada y
«Servicio técnico»):

| Elemento                                     | Contraste                                 |
| -------------------------------------------- | ----------------------------------------- |
| Lema y botón de WhatsApp (blanco sobre rojo) | **4,54:1**, AA por poco, ya anotado en §2 |
| Títulos y enlaces de columna                 | 16,79:1                                   |
| Texto de la empresa                          | 19,14:1                                   |
| Franja legal                                 | 7,47:1                                    |
| Iconos de redes                              | 19,14:1                                   |

Sin desbordes ni errores de consola.

### Desviaciones

| #   | En ux-9                                                                                                      | Aquí                                                                                                 | Por qué                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | «Trabaja con nosotros», «Zona de clientes», «Financiación»                                                   | **No se pintan**                                                                                     | No tienen destino. **Pendiente del cliente:** sus URL                                                                                                       |
| P2  | Redes con etiquetas cruzadas («Google Plus» con icono de LinkedIn, «Tiktok» con el de YouTube), Font Awesome | Solo las de `seoConfig` (Facebook, Instagram, YouTube), con su nombre real. Iconos de Tabler         | Un nombre accesible equivocado es un enlace que miente; Font Awesome no está en el proyecto                                                                 |
| P3  | Sin franja legal                                                                                             | Franja inferior: tratamiento de datos primero, las demás páginas legales, dirección y teléfono       | **No es estética:** la Ley 1581 obliga a enlazar la política de datos                                                                                       |
| P4  | Texto de la empresa en HelveticaNeue, sin global                                                             | Inter                                                                                                | Licencia web pendiente (**L1**)                                                                                                                             |
| P5  | «Ayudamos sectores…»                                                                                         | «Ayudamos **a** sectores…»                                                                           | Corrección de redacción. **Para Andrés**                                                                                                                    |
| P6  | «Somos una empresa…» en `<h3>`                                                                               | Párrafo en negrita. Títulos de columna en `<h2>`                                                     | No es un encabezado; con `<h3>` saltaba un nivel en páginas sin `<h2>`                                                                                      |
| P7  | Buscador                                                                                                     | **No se pinta**                                                                                      | Funcionalidad no cotizada; un cuadro que no busca es un defecto. Esfuerzo, abajo                                                                            |
| P8  | Máquina decorativa `Partequipos3553.png`, girada 90°, solo escritorio                                        | **Campo opcional «Imagen decorativa» del global `pie`**, en `Media`. Vacío: la tarjeta va sin imagen | Foto de banco con licencia pendiente (**L3**), y el repositorio es **público**: no puede ir a `public/`. En producción solo para la demo (CLAUDE.md §10.33) |

El isotipo de la marca de agua (`Icon.png`) sí va, en `public/`: es el isotipo
del cliente.

### Propuesta: el pie en un global de Payload

**Qué iría en el global `pie`:** el lema, el texto de la empresa, las tres
columnas y el texto del botón. Las columnas, como un array de título más
enlaces con etiqueta y destino, validados con `validarEnlace`, como el hero.

**Qué no:** las redes y los datos de contacto. Ya están en `seoConfig` y
alimentan el JSON-LD `Organization`; duplicarlos permitiría que el pie y el
JSON-LD dijeran cosas distintas. Si el cliente los quiere editar, se mueven
los dos juntos a un global `empresa`.

**Esfuerzo: 3–4 h.** Incluye la migración (un grupo nuevo, sin datos
existentes sobre los que decidir), la revalidación de todo el sitio al
guardar (`revalidatePath("/", "layout")`) y su prueba.

### Buscador: esfuerzo, NO construido

`/buscar?q=` sobre modelos de repuestos, marcas (las dos líneas), equipos
nuevos y usados, y artículos:

| Parte                                                                                                             | Horas      |
| ----------------------------------------------------------------------------------------------------------------- | ---------- |
| Consulta en `src/lib/queries/` con la API local: `like` por nombre en 5–6 colecciones, con tope por tipo          | 2–3        |
| Página `/buscar` dinámica, resultados agrupados, estado vacío, `noindex` y fuera del sitemap (con su guardarraíl) | 2–3        |
| Formulario accesible (GET, sin JS obligatorio) en el pie y, si se quiere, en la cabecera                          | 1          |
| Normalizar tildes y mayúsculas («camión» = «camion»)                                                              | 1–2        |
| Verificación y prueba                                                                                             | 1–2        |
| **Total**                                                                                                         | **7–11 h** |

**Riesgos:**

- Cada búsqueda son 5–6 consultas a la base en tiempo de petición. Con el
  pooler de §10.7 es asumible; sin él, no.
- `like` no ordena por relevancia. Si hace falta, el paso siguiente es la
  búsqueda de texto completo de Postgres (`tsvector`), con migración: +4–6 h.

### Imagen decorativa del pie: geometría medida (2026-09-24)

Medido en ux-9 pintado, desde su HTML guardado, a 1440, 1280 y 1025:

- **Tamaño y giro:** 536 px de ancho sin girar, constante; girada 90° a la
  derecha, con `brightness(0.94) saturate(1.32)`.
- **Posición, ya girada:** su borde inferior queda 1 px por debajo de la
  tarjeta, y sobresale por la derecha el 11 % del ancho de la tarjeta menos
  66 px (80, 64 y 39 px). Oculta por debajo de 1025.
- **CSS:** se replica con la caja sin girar en `right: calc(133px - 11%)`,
  `bottom: -68px`. Esos valores se deducen de la medida para una imagen de
  proporción 4:5 como la de ux-9. Con otra proporción, la posición cambia.
- **Fallo de ux-9 que NO se replica:** a 1440 la imagen creaba **23 px de
  scroll horizontal**. Aquí el pie corta en horizontal con `overflow-x: clip`,
  que no crea contenedor de scroll y deja que sobresalga hacia arriba.
- **Accesibilidad y carga:** decorativa (`alt` vacío y `aria-hidden`), con
  carga diferida (bajo el pliegue, no toca el LCP), `sizes="536px"`.

### La imagen decorativa sobre el final de la página (2026-09-24)

**Método:** 21 plantillas, a 1025, 1280 y 1440 (los anchos donde se muestra).
Se cruzan las cajas de cada línea de texto y de cada elemento visible anterior
al pie con los **píxeles opacos reales** del recorte. Se leen del canal alfa,
deshaciendo el giro. No basta con la caja: el PNG es transparente en su
mayor parte.

**Resultado:**

- **1280 y 1440: no tapa nada en ninguna.** El contenido mide como máximo
  1024 px y va centrado; el cucharón cae en el margen derecho.
- **1025: tapa en 9 de 21.** Portada, contacto, lubricantes Eni, aditamentos,
  ficha de bulldozer, vibrocompactadores, nosotros, marca Bobcat (1 punto,
  marginal) y ficha Bobcat E32. Aquí el contenido llega al borde derecho.

**Propuesta, NO aplicada:** con imagen y a partir de 1025, el margen superior
del pie pasa de 70 a **170 px**. Es general, no página a página.

| Ancho | Vuelo de la imagen | Hueco libre hoy, mín.–máx. | Hueco con la propuesta |
| ----- | ------------------ | -------------------------- | ---------------------- |
| 1025  | 242 px             | 153–178 px                 | 253–278 px             |
| 1280  | 212 px             | 163–188 px                 | 263–288 px             |
| 1440  | 193 px             | 170–195 px                 | 270–295 px             |

**Garantía:** el hueco mínimo con la propuesta supera el vuelo en todos los
anchos.

**Qué no cambia:** tablet, móvil y el pie sin imagen.

**Por qué 100 px fijos y no la cifra exacta de cada ancho:** el vuelo depende
del alto de la tarjeta, que CSS no conoce. Una cifra fija que cubre el peor
caso (1025) es robusta.

**El coste:** a 1280 y 1440 añade 100 px de blanco donde hoy no hace falta.

---

## 14. Fase 2 — verificación, ajuste fino y cabecera (2026-09-29)

Rama `feat/home-fase-2`, un PR en borrador para toda la fase, un commit por
paso (plan de 10 pasos de la fase 2a). Fotos de ux-9 (licencia L3 pendiente)
sembradas **solo en el preview** (CLAUDE.md §10.33 p.2).

Decisiones de dirección para esta fase:

- **Paso 5:** si ux-9 no esconde la cabecera en móvil, se replica eso.
- **Paso 7:** si el contraste de los iconos móviles sobre el hero falla, se
  para con la propuesta antes de tocar nada.

### 14.1 Siembra del preview (2026-09-29)

`npm run preview:sembrar`, con `preview:db:check` antes y después (12
migraciones, sin marcador `dev`). Comprobado en la rama `preview` de Neon, en
solo lectura:

- **11 imágenes de prueba, las 11 en el almacén del preview** y ninguna en el
  de producción. `Fondo.jpg` y `Hero-1.png` ya estaban de la fase C: el script
  no las duplicó.
- Diapositiva «Potencia Hitachi» la primera, con fondo y frontal de prueba;
  máquina de la sección 3; Hitachi, CASE y Yanmar con logo y tarjeta; equipos
  de prueba 9 y 10, disponibles.
- **Aparte, anotado sin tocar:** la rama `preview` conserva 5 registros de
  `media` (ids 1–5) clonados de producción que apuntan al almacén de
  producción, del que se borraron el 2026-09-28 los ids 1, 2 y 5
  (CLAUDE.md §10.33). En el preview son imágenes rotas si algo las enlaza.

### 14.2 Línea base contra ux-9 (2026-09-29)

**Método.** ux-9 desde su HTML guardado (`<base>` al servidor de ux-9, que
sigue sirviendo su CSS y su JS); el nuestro, el preview de la rama con las
fotos sembradas, por el bypass de automatización. Chrome sin interfaz, a 390,
1010 y 1440, tras recorrer la página y dejar terminar las animaciones.
Coordenadas **relativas a la sección** (la cabecera, a sí misma). Dos lecturas
separadas 2 s, iguales en los dos sitios (§10.24).

**Una trampa del instrumento, anotada:** la primera pasada comparó cajas no
equivalentes —el `span` del texto en ux-9 contra el botón entero en el
nuestro, y diapositivas clonadas del carrusel de ux-9 fuera de la ventana—.
La segunda compara botón con botón, pestaña con pestaña y diapositivas
visibles. Y el **título del hero** no se puede comparar por su caja: en ux-9
las letras se pintan por encima de la caja (la contradicción de §12); se midió
por los **píxeles blancos de las letras** en la captura.

#### Cabecera

| Qué (MEDIDO)                   | 1440 ux-9 · nuestro                                                                              | 1010 ux-9 · nuestro                 | 390 ux-9 · nuestro                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Alto                           | 100 · 100                                                                                        | 71 · 71                             | **67 · 66**                                                                                                    |
| Logo (x, y, ancho × alto)      | 39,24 187×51 · igual                                                                             | 412,10 187×51 · igual               | 110,10 170×**47** · 170×**46**                                                                                 |
| Enlaces del menú (x)           | 454 · 624 · 730 · 845, **idénticos**                                                             | —                                   | —                                                                                                              |
| Botón «Contáctanos» (x)        | **1209 · 1224** (+15)                                                                            | —                                   | —                                                                                                              |
| Iconos móviles (x izq. · der.) | —                                                                                                | 30 · 950, y 18 → **27 · 953, y 21** | 18 · 342, y 15 → **15 · 345, y 18**                                                                            |
| **Al bajar**                   | ux-9: **alto 100 → 70** y logo al 85 % (159×43, y 13). Nuestro: alto **100**, logo 159×43 (y 28) | —                                   | ux-9: **no es fija**: se va con la página, sin velo ni encogido. Nuestro: fija, velo, logo 145×40 y se esconde |
| Se esconde a los 300 px        | ux-9 **no** (umbral 500). Nuestro **sí** (120)                                                   | —                                   | ux-9 no aplica (no es fija)                                                                                    |

#### Hero

| Qué (MEDIDO)                          | 1440          | 1010          | 390            |
| ------------------------------------- | ------------- | ------------- | -------------- |
| Tarjeta                               | idéntica      | idéntica      | idéntica       |
| Letras del título bajo el borde, ux-9 | 14 px         | 96 px         | 90 px          |
| Ídem, nuestro                         | 66 px         | 159 px        | 64 px          |
| **Diferencia**                        | **+52 abajo** | **+63 abajo** | **−26 arriba** |

Mismo alto de letra en los tres anchos (86 · 50 · 32 px): mismo tamaño.

#### Sección 2

**Idéntica** en los tres anchos: alto de la sección (691 · 624 · 625/622, −3 px
a 390), «Venta de maquinaria», título, tarjetas de marca (418×270 a 1440; la
diapositiva de ux-9 mide 20 px más porque incluye su relleno de 10) y «Ver
todo» (648,569 145×40 a 1440; 2 px más arriba a 390).

#### Sección 3

| Qué (MEDIDO)       | 1440                                                                                  | 1010                                | 390                            |
| ------------------ | ------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------ |
| Alto de la sección | 1278 · 1279                                                                           | **1867 · 1994** (+127)              | 1881 · 2474 (D5 y D10)         |
| Máquina            | 629×786, idéntica                                                                     | **368×460 · 451×563**               | 272×340, idéntica              |
| Título, botones    | idénticos                                                                             | desplazados **+104** por la máquina | título y «Ver todas» idénticos |
| Pestañas           | alto igual; ux-9 tiene 3 (D11), así que las nuestras empiezan 177 px más a la derecha | ídem                                | ux-9 acordeón (D10)            |

**Diferencia nueva:** a **1010 la máquina es 83 px más ancha** que en ux-9, y
empuja la sección 127 px. A 1440 y 390 coincide.

#### Pie

| Qué (MEDIDO)      | 1440          | 1010          | 390           |
| ----------------- | ------------- | ------------- | ------------- |
| Alto tarjeta roja | 360 · **342** | 282 · **267** | 250 · **235** |
| Lema              | idéntico      | idéntico      | idéntico      |

**Desbordes:** ux-9 tiene scroll horizontal (23 px a 1440, **331 px a 390**); el
nuestro, 0.

#### Las 4 diferencias del ajuste fino (§10.33 p.10), medidas

| Diferencia anotada                   | Hoy (MEDIDO)                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| Tarjeta roja del pie 18 px más baja  | **Confirmada**: −18 a 1440, y también −15 a 1010 y a 390                        |
| Título del hero ~45 px más abajo     | **Confirmada y precisada**: +52 a 1440, +63 a 1010; a **390, 26 px más ARRIBA** |
| «Contáctanos» 15 px más a la derecha | **Confirmada**: 1209 frente a 1224                                              |
| Menú 8 px más a la izquierda         | **NO se reproduce**: los 4 enlaces están en la misma x que en ux-9 a 1440       |

#### Las tres decisiones del p.7 frente a ux-9

| Decisión                  | ¿Choca con ux-9?                                                                                                                                                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Logo-1.png` en `public/` | **No.** Mismo fichero, mismo tamaño y posición (1 px de alto menos en móvil). MEDIDO                                                                                                                                                                 |
| Encogido: logo al 85 %    | **En parte.** El logo al 85 % coincide exacto (159×43). Pero ux-9 **además baja el alto de la cabecera de 100 a 70 px** (`custom_height_header: 70` del export), y el nuestro no. En móvil ux-9 no encoge nada porque su cabecera no es fija. MEDIDO |
| Menú móvil provisional    | **Sin referencia.** En el HTML guardado de ux-9 el icono de hamburguesa no tiene enlace ni acción: pulsarlo no abre nada. MEDIDO. INFERIDO: el menú de ux-9 dependía de algo que la copia guardada no conserva, o no estaba hecho                    |

**Para el paso 5 (movimiento), con la decisión de dirección:** a 390 ux-9 **no
esconde** la cabecera porque **no es fija**: se va con el contenido. «Replicar
eso» significa una cabecera **no fija en móvil**. A 1010 no se ha medido (la
misma plantilla lleva `elementor-hidden-tablet`, así que se espera lo mismo:
INFERIDO); se mide en el paso 5.

### 14.3 Lighthouse

**Parada del paso 0 de la fase 2c (2026-09-30).** Tres corridas de dirección
desde las DevTools, contra el alias de la rama: LCP **2,99 · 2,81 · 2,51 s**
(mediana **2,81**, por encima del tope de 2,5 de §10.3 p.14), rendimiento
93 · 94 · 97. Frente a la referencia de la fase C (2,24 s): mismo JavaScript
(165 kB) y 13 imágenes en vez de 3, porque ahora están sembradas las de las
secciones 2 y 3.

Dos sondas por línea de comandos, **alternando** las dos variantes en la misma
máquina y minuto a minuto:

- Bloqueando las imágenes de las secciones 2 y 3: 2,70 frente a 2,59 s. La
  hipótesis «las imágenes nuevas retrasan el LCP» **no se sostiene**.
- Fase C frente a fase 2, sin tocar nada: **3,40 s (2,80–4,59) frente a
  2,83**. La fase C, con el código de la referencia de 2,24, da hoy **más**
  que la fase 2: todo apunta al entorno de medida, no al código.

**Decisión de dirección (fase 2c):** la parada por LCP se aplica a la
**fusión**, no al desarrollo; se mide **una vez al final**, con el método nuevo
(CLI, 9 corridas válidas alternadas y una carga de calentamiento). El
resultado va en §14.5.

### 14.4 Cambios de la fase

Cada cambio, verificado **pintado** en el preview a 390, 1010 y 1440 (y entre
1025 y 1279 donde aplica), contra ux-9 desde su HTML guardado.

| Commit    | Cambio                                                   | Antes (MEDIDO)                                                                           | Después (MEDIDO)                                                                                                                    |
| --------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `877aceb` | El cargador del preview entrecomilla los argumentos      | Un argumento con espacios llegaba partido                                                | Llega entero; prueba con un proceso real y un control que reproduce el corte                                                        |
| `91b5848` | Comentario de `cabecera.module.css` (§10.35)             | Culpaba a `var()`                                                                        | Culpa al orden. CSS servido **idéntico byte a byte** (62.067 bytes)                                                                 |
| `bdb72e8` | Icono «+» del hero con Tabler (L2)                       | Trazado del kit; aro 30, cruz 12. **47 SVG / 165 trazados** del kit en `src/`            | `IconCirclePlus`: aro 30, cruz 10, misma caja de 30×30. **0** trazados del kit en `src/`                                            |
| `99838cd` | «Contáctanos» en su columna (tres commits)               | x = 1224 a 1440 (ux-9, 1209)                                                             | Columnas, logo, menú y botón **idénticos** a ux-9 a 1280, 1440 y 1920                                                               |
| `ba09d0a` | Título del hero a la altura de ux-9                      | Letras bajo el borde de la tarjeta: 66 · 159 · 65 (1440 · 1010 · 390; ux-9 13 · 96 · 90) | **13 · 96 · 90**                                                                                                                    |
| `a117d78` | Tarjeta roja del pie                                     | 342 · 267 · 235 (ux-9 360 · 282 · 250)                                                   | **360 · 282 · 250**; botón de WhatsApp igual (153×40 · 135×37, icono 16 · 13, hueco 5)                                              |
| `70573ef` | Máquina de la sección 3 a 1010                           | 451×563 (ux-9 368×460); título de la sección +104                                        | **368×460**; título de la sección de vuelta a 851                                                                                   |
| `3bf7acf` | Movimiento de la cabecera en escritorio; no fija ≤1024   | Fija en todos los anchos; se escondía a 120 px, velo a 10, 0,3 s ease                    | Ver abajo                                                                                                                           |
| —         | Contraste de los iconos móviles a scroll 0               | **7,28:1** en el peor píxel (390, 768, 1010): los iconos van sobre el fondo de la página | **Sin cambio**: pasa de largo el 3:1. Nada pendiente de Andrés                                                                      |
| `29a6f61` | Sección 3 sin hueco cuando falta la imagen               | Ver abajo                                                                                | Ver abajo                                                                                                                           |
| —         | 5 registros huérfanos de `media` en el preview (ids 1–5) | Clonados de producción, apuntando a su almacén                                           | Borrados con la API local tras comprobar **0 referencias** en las 31 columnas con FK a `media` y en Lexical. `media` del preview: 0 |

**Movimiento de la cabecera (`3bf7acf`)**, medido fotograma a fotograma con
scroll progresivo de 25 px, ux-9 contra el nuestro:

| Qué                 | ux-9                                  | Nuestro                                                                            |
| ------------------- | ------------------------------------- | ---------------------------------------------------------------------------------- |
| Esconder y mostrar  | 411 ms, 58 fotogramas, 0 ↔ −990       | 412 ms, 58 fotogramas, 0 ↔ −990                                                    |
| Curva               | —                                     | Diferencia máxima 4–8 px; cruza el borde a 75/76 ms (esconder) y 325/326 (mostrar) |
| Velo y encogido     | Desde 60 px; alto 100 → 70; logo 85 % | Igual                                                                              |
| Se esconde          | Si la posición anterior pasa de 500   | Igual                                                                              |
| CLS de la secuencia | **0,07** (sale del flujo al encoger)  | **0** (recorte con `clip-path`)                                                    |
| ≤ 1024 px           | No es fija (1024, 1010, 800 y 390)    | No es fija                                                                         |
| Movimiento reducido | No lo respeta                         | No se esconde; sin transiciones                                                    |

**Sección 3 sin imagen (`29a6f61`).** «Antes» es el despliegue de `main`, que
no tiene imágenes; «después», el preview tras retirar la siembra (§14.5).

| Qué (MEDIDO)                         | Antes                                                                             | Después                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Tarjeta sin foto                     | Columna de foto **vacía**: 177–258 px de ancho en escritorio, 30 px de alto a 390 | Sin columna: el texto ocupa la tarjeta (679 px a 1440, 321 a 390); a 390 la tarjeta, 12 px más baja |
| Reserva de la máquina, en escritorio | **139 px** vacíos: el título de marcas a 159 px del borde de la sección           | Título a **85 px**, a la altura de «Venta de maquinaria» de la derecha (1025, 1100, 1279 y 1440)    |
| Reserva de la máquina, en columna    | 1 px (≤ 1024)                                                                     | Igual                                                                                               |
| Con imágenes                         | —                                                                                 | **Idéntico** a antes en 390, 1010, 1025, 1100, 1279 y 1440                                          |

**Lo que se midió y NO era hueco por falta de imagen** (anotado en la fase 1b,
CLAUDE.md §10.33 p.14):

- A 390, el espacio entre «Ver todas las excavadoras» y «Venta de
  maquinaria»: son el espacio final (93) y el superior de la columna derecha
  (55) de ux-9. Con imágenes, «Venta de maquinaria» queda a la misma altura
  que en ux-9 (728).
- A 1010, la mitad derecha vacía: en ux-9 la columna derecha también mide el
  54 % en columna (título de 101 a 519).
- El pie entre 1025 y 1279 **sin imagen decorativa**: margen de 70 px en
  1025, 1100 y 1279. La reserva de 170 px solo entra con imagen
  (`data-con-imagen`).

**Desviaciones que quedan, a propósito:**

- **«Contáctanos» entre 1025 y ~1250 px:** en ux-9 se sale de su columna, y a
  1025 hasta 5 px fuera de la página. Aquí se queda dentro, pegado a la
  derecha de la columna (x = 817 · 891 a 1025 · 1100; ux-9 853 · 915).
- **CLS del encogido**, no replicado (arriba).
- **Cruz del «+» de 10 px** en vez de 12: es la proporción de Tabler.
- **Residuo a 1010:** «Ver producto» +18 px y la sección 3 +23 px de alto.
  INFERIDO: el contenido de la tarjeta; no estaba en la lista del ajuste fino.
- **Cabecera a 390:** 66 px frente a 67 (1 px), fuera de la lista.
- **«Menú 8 px más a la izquierda»** no se reproduce: los 4 enlaces están en
  la misma x que en ux-9. Se da por cerrado.

**Incidencia de Vercel:** `70573ef` **no generó despliegue**, como en §10.30
(CI verde, sin despliegue ni prueba de humo). Lo desplegó el commit siguiente,
`3bf7acf`, que lo contiene.

### 14.5 Medición final

**Sección 3 sin imagen, pintada** en el preview `09f2ac2`, desplegado tras
retirar la siembra: resultados en la tabla de `29a6f61` (§14.4). El alto de la
sección no cambia (lo marca la columna derecha) y el pie queda con su margen de
70 px en todos los anchos. Después se volvió a sembrar el preview para la
medición final.

**Lighthouse final (2026-09-30)**, con el método vigente de CLAUDE.md §10.3
p.14: Lighthouse 13.4.1 por línea de comandos, móvil, _simulated throttling_,
solo Performance, variantes alternadas, una carga de calentamiento de cada una
que no cuenta, contra las **URL fijas**:

- **Fase C:** `partequipos-pcjcvm425` (commit `5dc579f`, que solo añade
  documentación a `e65b75e`, el código de la referencia de 2,24 s).
- **Fase 2:** `partequipos-oue9ctnyh` (commit `b448c59`), con las fotos
  sembradas en el preview.

| Tanda             | Fase C: LCP mediana (mín.–máx.) | Fase 2: LCP mediana (mín.–máx.) | benchmarkIndex (medianas) |
| ----------------- | ------------------------------- | ------------------------------- | ------------------------- |
| 1 (9 + 9)         | **2,15 s** (2,07–3,02)          | **2,23 s** (2,20–3,03)          | 2339 · 2142               |
| 2 (9 + 9)         | **2,80 s** (2,06–2,98)          | **2,28 s** (2,20–2,96)          | 2276 · 2340               |
| Las 18, juntas    | 2,31 s                          | 2,23 s                          | 2317 · 2202               |
| Referencia fase C | 2,24 s (3 corridas, DevTools)   | —                               | 1864 (1863–2021)          |

En todas las corridas el elemento LCP es la **foto de fondo del hero**, como en
la referencia. Ningún JSON contiene el secreto ni nombra la cabecera de bypass
(comprobado en los 36).

**Criterio aplicado:**

1. **Tanda 1:** fase C 2,15 (≤ 2,4) y fase 2 2,23 (< 2,6): ni «entorno» ni
   «código». Según la regla, 9 corridas más de cada una.
2. **Tanda 2:** fase C **2,80 ≥ 2,6: ENTORNO.** La regla da como nueva
   referencia la mediana de la fase 2, **2,28 s**, con umbrales **2,44 s**
   (calidad 60 con Andrés) y **2,54 s** (parar).

**Lo que hay que leer junto al criterio, sin adornarlo:**

- La distribución es **bimodal en las dos variantes**: casi todas las corridas
  caen en ~2,1–2,3 s o en ~2,8–3,0 s (solo dos quedan entre medias: 2,50 y 2,52), y la proporción de corridas lentas cambia de una
  tanda a otra (fase C: 2 de 9 por encima de 2,6 s en la primera y 5 de 9 en la segunda). Eso
  mueve la mediana de la fase C de 2,15 a 2,80 **sin cambiar una línea**.
- El benchmarkIndex **no** lo explica: las corridas lentas salen con índices
  de 2117 a 2545, igual que las rápidas. Y hoy la máquina puntúa ~20 % **más**
  que el día de la referencia (2317 frente a 1864).
- **En ninguna de las dos tandas la fase 2 queda peor que la fase C**; con las
  18 juntas, 2,23 frente a 2,31. El código de la fase 2 no empeora el LCP.
- Tomar 2,28 s como referencia nueva sale de la regla; es de dirección
  decidir si se adopta ese valor o las 18 juntas. **CLAUDE.md §10.3 p.14 no se
  ha tocado** en la referencia: sigue en 2,24 s hasta esa decisión.

JSON en `Desktop\partequipos-cierre\lighthouse\lh-final-*` y `lh-final2-*`.

**Actualización (2026-09-30, cierre de la fase 2):** dirección adoptó **2,28 s**
como referencia, con umbrales 2,44 y 2,54 s. Ya está en CLAUDE.md §10.3 p.14.

## 15. Carrusel del hero para la demo al cliente (2026-09-30)

Rama `feat/hero-slider`, PR en borrador. **Solo preview:** el contenido de la
demo (fotos del cliente, derecho de uso confirmado, CLAUDE.md §10.0.1) está
sembrado en la rama `preview` de Neon y en su Blob. Nada en producción.

### 15.1 Qué hacía el hero antes

- Admitía **N diapositivas** desde Payload (ADR 0009), con flechas y teclado.
- El cambio era **seco**: sin pase automático, sin puntos y sin gesto.
- Campos de cada diapositiva: título (obligatorio), párrafo, imagen de fondo
  (obligatoria), imagen frontal recortada (**opcional**), enlace del «+» y su
  nombre. Las diapositivas de la demo van **sin imagen frontal**, porque no hay
  recortes: solo fondo.

### 15.2 ux-9, medido pintado

- **El hero de ux-9 NO es un carrusel:** 0 sliders en la tarjeta y el título
  no cambia en 12 s. Las flechas son dibujo (ADR 0009).
- **El único carrusel de ux-9 es el de la sección 2** (Swiper), y es el que se
  copia:

| Qué             | ux-9 (MEDIDO)                                                                    |
| --------------- | -------------------------------------------------------------------------------- |
| Pase automático | Cada **5 s** (`autoplay.delay` 5000; cambios medidos a ~5,5 s con la transición) |
| Transición      | **Deslizamiento** horizontal (`effect: slide`), **500 ms**                       |
| Bucle           | Sí                                                                               |
| Controles       | 2 flechas y puntos (uno por diapositiva)                                         |
| Gesto           | Sí (`allowTouchMove`)                                                            |
| Al interactuar  | **Se detiene** el pase (`disableOnInteraction`)                                  |
| Ratón encima    | El export dice «pausa», pero **pintado NO pausa** (sigue cambiando en 11 s)      |

### 15.3 Lo implementado

| Qué                     | Nuestro                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Pase, transición, bucle | Igual: 5 s, deslizamiento de 500 ms con `ease` (API de animaciones web), bucle                                                      |
| Flechas, puntos, gesto  | Igual. Puntos **pulsables**, con objetivo de 24 px (WCAG 2.5.8) y nombre «Diapositiva N de 4: título»                               |
| Al interactuar          | Igual: se detiene; el botón pasa a «Reproducir»                                                                                     |
| **Botón de pausa**      | **Nuevo** (WCAG 2.2.2), el de D2, con el aspecto de las flechas                                                                     |
| Foco dentro             | El pase **espera** mientras el foco está en el hero                                                                                 |
| Ratón encima            | No pausa, como ux-9 pintado: el hero ocupa casi toda la pantalla                                                                    |
| Movimiento reducido     | **Sin pase automático** (empieza en pausa, D2) y cambio seco, sin deslizamiento                                                     |
| Teclado                 | Flechas izquierda y derecha dentro del hero                                                                                         |
| Lector de pantalla      | Anuncia la diapositiva solo tras una acción del usuario; con el pase automático, nada                                               |
| Carga                   | Solo el primer fondo con prioridad. **Los demás no existen en el HTML**: se añaden tras el `load`, y siempre el siguiente al activo |

**Desviaciones nuevas:**

- **D13 — carrusel en el hero.** ux-9 no tiene carrusel en el hero; se copia
  el de su sección 2, más la pausa y lo de accesibilidad de arriba.
- **D14 — velo sobre la foto y vidrio oscurecido. PENDIENTE DE APROBACIÓN DE
  ANDRÉS.**
  - Las fotos del cliente tienen cielos claros detrás del título blanco.
  - **Sin velo, medido bajo los píxeles de las letras:** título 1,0–1,4:1
    (p10) en tres de las cuatro, y párrafo 1,6–2,7:1 en dos.
  - **Con el velo** (degradado negro del 55 % arriba al 15 % a media altura y
    40 % abajo) y el vidrio en negro al 28 % (en ux-9, blanco al 12 %):
    - título ≥ 4,0:1 (p10) a 1010 y 390;
    - párrafo ≥ 5,9:1 en las cuatro.
  - A 1440 la máscara de letras no fue fiable; la comprobación ahí es visual,
    con las capturas.
- **Defecto anotado, sin tocar:** a ≥ 1025 px las letras van a 13 px del borde
  de la tarjeta, como en ux-9, y la **tilde de «PRECISIÓN»** sale por encima,
  blanca sobre el fondo claro de la página. Ocurre con todo título con tilde
  en mayúscula. Para Andrés: ¿se baja el título o se acepta?

### 15.4 Contenido de la demo (solo preview)

`npm run preview:demo:sembrar` sube las fotos **ya reducidas** y deja en el
hero solo las diapositivas de la demo. Quita del hero la de prueba «Potencia
Hitachi», pero sus fotos se quedan en Media.

| Diapositiva       | Foto                                      | JPG (2560 px, calidad 80, sin metadatos) | Punto focal |
| ----------------- | ----------------------------------------- | ---------------------------------------- | ----------- |
| Fuerza Hitachi    | ZX245USLC-6 (original 8192×5464, 33,6 MB) | 2560×1708, **818 kB**                    | 48 / 45     |
| Potencia LiuGong  | 856H (5472×3648, 8,5 MB)                  | 2560×1707, **810 kB**                    | 60 / 60     |
| Precisión Dynapac | Dynapac.png (3520×4704, 21,7 MB)          | 1916×2560, **537 kB**                    | 62 / 55     |
| Precisión Yanmar  | Yanmar.png (2560×1708, 5,7 MB)            | 2560×1708, **670 kB**                    | 45 / 50     |

- **CASE no tiene diapositiva:** en `cliente-hero` no llegó ni la 580SV ni la
  SR240B. Tampoco llegó ningún TIF.
- El JPG no es lo que descarga el visitante: `/_next/image` sirve WebP al ancho
  pedido.
- Los originales no se suben: quedan en `Desktop\partequipos-diseno\cliente-hero\`
  y los reducidos en su subcarpeta `web\`.

**Textos, primera lista (sembrada):**

- Yanmar: Precisión. Tecnología. Confianza.
- CASE: Versatilidad. Fuerza. Experiencia.
- Dynapac: Precisión. Compactación. Desempeño.
- Hitachi LANDCROS: Fuerza. Tradición. Respaldo.
- LiuGong: Potencia. Productividad. Capacidad.

**Segunda lista, alternativa para que elija el cliente:**

- Yanmar: Precisión. Ingeniería. Detalle.
- CASE: Fuerza. Versatilidad. Trayectoria.
- Dynapac: Control. Precisión. Compactación.
- Hitachi LANDCROS: Fuerza. Tradición. Respaldo.
- LiuGong: Capacidad. Productividad. Evolución.

Los títulos siguen el patrón de ux-9, «<primera palabra> <marca>». Con la
segunda lista cambiarían a «Precisión Yanmar», «Control Dynapac» y «Capacidad
LiuGong». Todo se edita en el panel.

**Restaurar la diapositiva de prueba después de la demo:**

1. `npm run preview:demo:retirar`: quita las diapositivas de la demo y sus
   imágenes, y comprueba que el Blob responde 404.
2. `npm run preview:sembrar`: vuelve a poner «Potencia Hitachi» la primera.
3. Redesplegar el preview.

### 15.5 Verificación y LCP (2026-09-30)

**Pintado**, en el despliegue de la demo `partequipos-20jdd8edg` (commit
`f9c461f`), a 1440, 1010 y 390:

- Las 4 diapositivas se ven y el pase cambia cada ~5 s.
- El deslizamiento, las flechas, los puntos y el teclado funcionan, y a 390
  también el gesto.
- La pausa deja el carrusel quieto 7 s. Con movimiento reducido no hay pase y
  el botón ofrece «Reproducir».
- Un solo `h1` y sin scroll horizontal.
- **CLS:** 0 a 1010 y 390; 0,0034 a 1440.
- **Cascada:** solo se pide el primer fondo antes del LCP. El segundo, después
  (1904 ms frente a 1592 a 1440; 397 frente a 360 a 1010; 417 frente a 352 a
  390).
- Capturas en `Desktop\partequipos-cierre\capturas-hero-demo\`.

**Un falso negativo del instrumento, anotado:** en Chrome sin interfaz el
párrafo del vidrio sale **vacío** en las capturas. La animación de las
palabras dentro de un elemento con `backdrop-filter` no se repinta, aunque el
estilo calculado diga que terminó. En Chrome con interfaz **se ve**, también
al cambiar de diapositiva (comprobado a mano).

**LCP: 9 + 9 corridas alternadas**, con el método de CLAUDE.md §10.3 p.14,
contra el código de `main` (preview `partequipos-7jdioum0m`, commit `9c9018a`,
mismo árbol que `main`):

| Variante                    | LCP mediana (mín.–máx.) | Imagen del LCP (móvil, `w=1920`, WebP q75) |
| --------------------------- | ----------------------- | ------------------------------------------ |
| `main` («Potencia Hitachi») | 2,58 s (2,23–4,01)      | `Fondo.jpg` de ux-9: **157 kB**            |
| Demo («Fuerza Hitachi»)     | **4,00 s** (3,63–4,32)  | ZX245USLC-6 del cliente: **419 kB**        |

**Supera los 2,44 s** y también el umbral de parada de 2,54 s. **No afecta a
la demo**, que es en el preview, pero **esta rama no se puede fusionar así.**

**Causa, medida:** el peso de la foto. En móvil el fondo se pide a 1920 px,
porque la tarjeta la recorta por la altura (`sizesFondoHero`). Las fotos del
cliente, con mucho detalle, pesan 346–424 kB a ese ancho, frente a los 157 kB
de la de ux-9. Con la red simulada (~1,6 Mb/s), los 262 kB de más son ~1,3 s:
casi toda la diferencia.

**Opciones, para dirección:**

1. **Calidad 60: no basta.** Quita ~57 kB por foto, unos 0,3 s.
2. **Recorte propio para móvil** (`<picture>` con una versión vertical de cada
   foto): el móvil pediría ~720 px en vez de 1920. Es la palanca grande, pero
   exige un campo nuevo en Payload (con su migración, así que primero los
   guardarraíles de §10.33 p.5) o recortar a mano.
3. **Primera diapositiva con una foto más ligera**, o preparada a propósito.

## 16. Carrusel «premium» (2026-09-30, a petición de dirección)

Rama `feat/hero-premium`, PR #7. Sustituye el deslizamiento de §15 por:

| Qué                 | Cómo                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Transición          | **Fundido cruzado** de 1,2 s, `cubic-bezier(0.4, 0, 0.2, 1)`. La que entra aparece encima y la que sale sigue opaca debajo: sin parpadeo |
| Ken Burns           | La foto activa pasa de escala 1,00 a 1,06 durante su permanencia (7 s + 1,2 s del fundido), solo `transform`, desde el punto focal       |
| Intervalo           | **7 s**, marcados por la **línea de progreso** del punto activo: cuando su animación termina, pasa la diapositiva                        |
| Texto               | Título y párrafo entran con un fundido de 600 ms y suben 12 px, 300 ms después del cambio (la primera, quieta)                           |
| Pausa               | Botón, ratón encima o foco dentro detienen a la vez la línea, el Ken Burns y el pase                                                     |
| Movimiento reducido | Sin Ken Burns, sin fundido, texto quieto y sin pase automático                                                                           |
| Carga               | Las fotos 2 y siguientes se añaden desde código **cuando la primera ha terminado de cargar**                                             |

**D15 — posición del título, PENDIENTE DE ANDRÉS.** A petición de dirección,
el título va centrado en la tarjeta, algo por encima del centro. Mínimo arriba:
64 px en escritorio y 40 en móvil. En ux-9 va pegado arriba. La tarjeta
conserva su alto: el hueco del título sigue en el flujo.

**El velo (D14) se oscurece en la franja central**, porque ahí va ahora el
título. Con el degradado anterior el título quedaba en 2,2–2,7:1 en cuatro
casos. Con el nuevo, **≥ 4,0:1 (p10) en las cuatro diapositivas** a 1440, 1010
y 390, y el párrafo ≥ 5,8:1.

**Verificado pintado en el preview** (`partequipos-rfgpq54mi`), a 1440, 1010 y
390:

| Qué                  | Resultado                                                                           |
| -------------------- | ----------------------------------------------------------------------------------- |
| Fundido              | La entrante llega a 1 en ~1,17 s; la saliente, opaca debajo en todos los fotogramas |
| Texto                | Empieza a ~370 ms y está completo a ~840 ms                                         |
| Intervalos           | 7,00–7,04 s                                                                         |
| Ken Burns            | 1,000 → 1,037 en 5 s; nunca por debajo de 1                                         |
| Tilde de «PRECISIÓN» | Dentro de la tarjeta: letras a 194 (1440), 269 (1010) y 276 px (390) del borde      |
| Pausa                | Con el botón y con el ratón: quieto 9 s, línea detenida                             |
| Gesto y reducido     | Gesto en móvil correcto; con movimiento reducido, sin pase ni Ken Burns             |
| Estabilidad y página | CLS 0, sin scroll horizontal, un solo `h1`                                          |
| Cascada              | La 2.ª foto se pide después del LCP y de acabar la 1.ª                              |

Fotogramas de una transición: `Desktop\partequipos-cierre\capturas-premium\transicion-*.png`.

### 16.1 Ajustes (2026-09-30, PR #8)

**Título frente a la máquina recortada.**

- **Con imagen frontal:** composición de ux-9. El título va en el flujo, en su
  posición medida (letras a 13 px del borde a 1440), y la máquina, debajo.
- **Sin imagen frontal:** el título centrado de §16 (D15).
- **Solape medido con máscaras** (letras en magenta, máquina como silueta),
  con la diapositiva de prueba «Potencia Hitachi», sembrada en el preview solo
  para esto y retirada después:

  | Ancho | ux-9 tal cual                 | Con la máquina bajada             |
  | ----- | ----------------------------- | --------------------------------- |
  | 1440  | El brazo pisa las letras 3 px | Bajada 16 px: 0 px, 13 px de aire |
  | 1010  | 18 px                         | Bajada 30 px: 0 px, 12 px de aire |
  | 390   | 0 px, 89 px de aire           | Sin bajada                        |

  La bajada es solo `transform`, así que la tarjeta no cambia de alto.

- **Límite del instrumento:**
  - De las lecturas alineadas a la tarjeta, 2 de cada 3 dan 0 px. La tercera
    sale con la silueta desplazada unos 52 px, sin que la página cambie.
  - Las capturas normales confirman el aire (`solape-*.png`).

**CLS que apareció con la diapositiva de prueba, corregido.** El vidrio
cambiaba de alto entre diapositivas por dos causas: un párrafo más largo y un
«+» que solo tenía una de ellas. CLS 0,009 a 1440 y 0,0175 a 1010. Arreglo:

- todos los párrafos apilados en una celda de rejilla, con solo el activo
  visible;
- el hueco del «+» reservado si alguna diapositiva lo tiene.

Resultado: **CLS 0** en los tres anchos.

**Colores desde los globales del kit** (`__globals__` manda sobre el valor
fijo):

| Pieza                         | Antes                   | Ahora                                                                             |
| ----------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| Rojo de las flechas           | `#e5242d` fijo          | `var(--color-marca)`, global `primary` (el `__globals__` del icono)               |
| Párrafo del vidrio            | `#fff`                  | `var(--color-fondo)`, global `099f28a` (su `text_color`)                          |
| Línea de progreso             | `#fff`                  | `var(--color-fondo)`, global `099f28a`                                            |
| Puntos, pista y foco          | blanco/negro inventados | `color-mix` sobre `--color-fondo` y `--color-texto`                               |
| Velo y fondo del vidrio (D14) | negro `rgb(0 0 0 / x)`  | `color-mix` sobre `--color-texto`, global `text` (#100F0F): el kit no tiene negro |

- **Se quedan como están**, porque el export los trae fijos y sin global:
  - el título (#FFFFFF);
  - el fondo de las flechas (#FFFFFF94, el nuestro al 58 %).
- **Contraste después del cambio:**
  - preview: título ≥ 3,63:1 (p10) y párrafo ≥ 4,81:1 (p10);
  - producción, antes de fusionar: título ≥ 4,29:1 y párrafo ≥ 6,47:1.

**Exports de Elementor disponibles:**

| Fichero                                    | Qué es                               | Dónde                         |
| ------------------------------------------ | ------------------------------------ | ----------------------------- |
| `docs/diseno/elementor/1717.json`          | Secciones de la home (hero incluido) | Repositorio                   |
| `docs/diseno/elementor/site-settings.json` | Globales (colores y tipografías)     | Repositorio                   |
| `elementor-2516-2026-09-23.json`           | «home-page» (página)                 | `Desktop\partequipos-diseno\` |
| `elementor-2629-2026-09-24.json`           | «header»                             | `Desktop\partequipos-diseno\` |
| `elementor-2696-2026-09-24 (1).json`       | «footer»                             | `Desktop\partequipos-diseno\` |
| `home-page.zip`                            | Kit completo                         | `Desktop\partequipos-diseno\` |

**No falta ninguno** de la home, el hero, la cabecera o el pie. El hero no
tiene export propio: es la primera sección de la home. Los globales solo están
en `site-settings.json`.

### 16.2 Título siempre en el mismo sitio (2026-09-30, PR #9)

**DESVIACIÓN DE ux-9 POR DECISIÓN DE DIRECCIÓN, PENDIENTE DE ANDRÉS.**
Sustituye a la regla de §16.1 («con máquina recortada, composición de ux-9»).
Motivo: en un carrusel el texto no puede saltar de sitio entre diapositivas.

- **Título:** siempre centrado en la tarjeta, en la misma posición haya o no
  máquina. Su caja tiene el alto fijo de una línea a tamaño completo (dos en
  móvil). Un título que encoge para caber se centra dentro, así que la caja no
  se mueve.
- **Párrafo:** en el vidrio, que tampoco se mueve entre diapositivas (alto
  fijo, §16.1).
- **Máquina recortada, en su propia caja** (`.capaMaquina`, absoluta; la
  tarjeta no cambia de alto):
  - **Arriba:** el borde inferior del bloque del título más 16 px, con el
    mismo cálculo que el centrado. Por eso el relleno inferior del texto pasa
    a `22cqi`: el mismo número sirve a los dos.
  - **Derecha:** deja libre el vidrio más 16 px. En móvil no hay vidrio.
  - **Abajo:** por encima de flechas y puntos más 16 px. En tablet y
    escritorio la fila no va pegada al borde, porque el contenido se centra;
    su sitio se calcula desde el alto de la tarjeta.
  - La imagen va contenida y apoyada abajo.

**Medido pintado** en el preview, con la diapositiva de prueba «Potencia
Hitachi» (sembrada para esto y retirada al acabar):

| Ancho | Título (y de la caja) igual en las 5 | Aire máquina–título | Máquina–vidrio | Máquina–controles |
| ----- | ------------------------------------ | ------------------- | -------------- | ----------------- |
| 390   | Sí (278)                             | 16 px               | Sin vidrio     | 16 px             |
| 768   | Sí (271)                             | 16 px               | 16 px          | 16 px             |
| 1010  | Sí (269)                             | 16 px               | 16 px          | 16 px             |
| 1025  | Sí (228)                             | 16 px               | 16 px          | 16 px             |
| 1280  | Sí (201)                             | 16 px               | 16 px          | 16 px             |
| 1366  | Sí (191)                             | 16 px               | 16 px          | 16 px             |
| 1440  | Sí (184)                             | 16 px               | 16 px          | 16 px             |
| 1920  | Sí (132)                             | 16 px               | 16 px          | 16 px             |

- **Primera versión, corregida:** en la primera pasada el título cambiaba hasta
  13 px de y a 768, 1025 y 1280, porque los títulos que encogen tenían una caja
  más baja. Se corrigió con el alto fijo.
- **CLS:**
  - 0 en el pase automático y con clics, con las fuentes registradas.
  - Dos pasadas completas dieron 0,003–0,004 una vez, y no se reprodujo al
    buscar la fuente.
- **Contraste**, con el título centrado sobre las 5 diapositivas: título
  ≥ 3,63:1 (p10) y párrafo ≥ 4,81:1.

**La lectura inestable de ~52 px de §16.1 era un fallo de la medición, no un
estado real:**

- En producción, sin estilos inyectados, se registró la posición de la máquina
  en cada fotograma durante 25 s de pase automático y un clic: unos 1.900
  fotogramas por ancho.
- **Nunca cambió** (81 px a 1440 y 134 a 1010, respecto a la tarjeta). Lo
  único que variaba era el título en su entrada de 12 px.
- En la lectura anómala, la silueta de 1440 tenía los mismos píxeles que la de
  1010: la captura se tomó en otro estado de la página, no la vio un
  visitante.
- Con la máquina en su propia caja absoluta, además, su posición ya no depende
  del flujo de la tarjeta.

---

## 17. LCP móvil: precarga del recorte y AVIF (fase 4, paso 0, 2026-10-01)

**Precarga.** Con el recorte vertical (CLAUDE.md §10.36), el `<picture>` del
hero no tenía precarga: el `preload` de `next/image` solo conoce la foto de
escritorio. La primera diapositiva emite ahora **dos** `preload()` de React 19
con `media` complementarios, `(max-width: 767px)` y `(min-width: 768px)`, cada
uno con el mismo `srcset` y `sizes` que su `<source>` o `<img>`.

El navegador solo atiende la que encaja con su ancho. Demostrado en la red:
una sola foto por ancho, pedida por la precarga (`initiatorType: link`).

**AVIF.** `images.formats: ["image/avif", "image/webp"]`. Afecta solo a la
salida: `Media` sigue sin admitir AVIF de entrada (el CVE de CLAUDE.md
§10.28). El recorte a 390 px pasa de 209 kB en WebP a 105 kB en AVIF.

**Límite de Vercel Hobby** (documentación de agosto de 2026):

- **Cuota:** 5.000 transformaciones al mes.
- **Qué cuenta:** cada MISS o STALE. La clave de caché incluye `Accept`, así
  que AVIF y WebP son dos transformaciones.
- **Al pasarse:** las imágenes **nuevas** dan 402 y se ve su `alt`.
- **Caché:** las del Blob se cachean un año (`max-age` del Blob).

| Escenario                         | Transformaciones                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| Hoy (~19 imágenes)                | Menos de 200                                                                       |
| Catálogo real (~930 imágenes)     | ~2.800 por formato                                                                 |
| Peor caso, el mes del lanzamiento | ~5.600, por encima de Hobby: **el lanzamiento necesita Pro**, que ya era requisito |

**Medido** (Lighthouse 13.4.1, 9 + 9 corridas alternadas): **2,94 s**, frente
a 3,38 s del código anterior. No llega a 2,44 s: antes de que termine la foto
(94 kB) se descargan ~314 kB entre documento, Inter (48 kB), CSS y JS.

Palancas que quedan, a decisión de dirección:

- no precargar Inter;
- calidad 60 en el fondo del hero (con Andrés);
- el orden de las diapositivas;
- el JS de la portada.

Detalle en el informe `2026-10-01-fase4-paso0-lcp-movil.md`.

---

## 18. Fase E — secciones 4 y 5 (2026-10-01)

**Fuentes:**

- El export: `c57ff81` y `351c67f0` (sección 4); `1f904ecd`, `5929bf8c`,
  `2b1c018b`, `5b81de61` y `1c74077d` (sección 5). `__globals__` manda sobre el
  valor fijo.
- **Medido pintado** lo que los widgets no traen en el JSON: Logo Marquee y
  Stacking Cards, de Unlimited Elements, no tienen zip ni CSS en el export.

### Sección 4 — carrusel de logos

| Qué (MEDIDO en ux-9) | 1440         | 1010      | 390       |
| -------------------- | ------------ | --------- | --------- |
| Logos por vista      | 5            | 3         | 2         |
| Caja (relleno 20)    | 258 × 180    | 307 × 180 | 165 × 180 |
| Logo (`contain`)     | 218 × 140    | 267 × 140 | 125 × 140 |
| Hueco a la derecha   | 30           | 30        | 30        |
| Vuelta               | 81 s, lineal | 81 s      | 81 s      |

- **Movimiento:** la pista de ux-9 lleva **cuatro copias** de los 9 logos y se
  desplaza la mitad en 81 s (`transition_speed` 9000 × 9), es decir, **4,5 s
  por logo**. Se replica igual, con la duración calculada por número de logos.
- **Pausa al pasar el ratón**, como ux-9.
- **Sección:** blanca, radio 30 y 20 px arriba y abajo: 220 px en total.

**Datos:** lista propia en la portada (`paginas.seccionLogos.logos`: logo y
nombre). No sale de `marcas` ni de `marcas-maquinaria`, porque ux-9 mezcla las
dos líneas y además incluye a Donaldson, que no está en ninguna. Sin logos, la
sección no se pinta.

### Sección 5 — tarjetas apiladas

| Qué (MEDIDO en ux-9)   | 1440                | 1010 | 390                    |
| ---------------------- | ------------------- | ---- | ---------------------- |
| Caja                   | 1140 centrada       | 990  | 370                    |
| Tarjeta                | 600 alto, radio 20  | ídem | ídem; foto debajo, 180 |
| Foto                   | 40 % a la derecha   | 40 % | todo el ancho          |
| Fijada (`sticky`)      | 150 px              | 60   | 40                     |
| Escalón entre apiladas | 20 px               | 20   | 20                     |
| Hueco entre tarjetas   | 100 px              | 100  | 100                    |
| Título de tarjeta      | 45 px (`secondary`) | 35   | 9vw                    |
| Texto                  | 16 / 300, #333      | 14   | 13                     |

**Escala ligada al scroll, medida en ux-9 cada 150 px:**

- Cada tarjeta encoge desde que llega arriba hasta ~150 px después de que se
  apile la última.
- Llega a `1 − 0,03 × (tarjetas encima)`, es decir 0,91 · 0,94 · 0,97 · 1, con
  freno al final.

Replicada sin GSAP (`TarjetasApiladas`): `requestAnimationFrame` solo mientras
la lista está a la vista, con curva cuadrática de salida.

| Desplazamiento | ux-9 (tarjetas 1 · 2 · 3) | Nuestro               |
| -------------- | ------------------------- | --------------------- |
| 300            | 0,978 · 1 · 1             | 0,978 · 1 · 1         |
| 750            | 0,951 · 0,996 · 1         | 0,950 · 0,996 · 1     |
| 1200           | 0,931 · 0,969 · 1         | 0,930 · 0,968 · 1     |
| 1800           | 0,915 · 0,946 · 0,980     | 0,914 · 0,945 · 0,978 |

**Posiciones** a 1440, 1010 y 390 (separador, antetítulo, título, tarjetas y
botón): iguales a ux-9 al píxel. CLS 0 y sin scroll horizontal en los tres
anchos.

**Datos:** `categorias-tecnicas`, con el campo nuevo **`ordenPortada`**:

- vacío, la categoría no sale;
- 1, 2, 3…: el orden de las tarjetas.

Un solo campo elige y ordena; así el orden de ux-9 no depende del nombre. El
título y el texto son los de la categoría.

**Sin foto** (producción, mientras las de ux-9 sigan en L3): la tarjeta se
pinta solo con el texto, medido quitando la foto en la página pintada.

- **A ≥ 768 px**, el texto ocupa la tarjeta entera.
- **En móvil**, la tarjeta mide lo que su texto (326–368 px), sin la franja de
  180 px de la foto.

### Desviaciones de esta fase

| #   | ux-9                                         | Nuestro                                                            | Por qué                                       |
| --- | -------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| D1  | Título y tarjetas en `<div>`                 | `<h2>` y `<h3>`                                                    | Jerarquía de encabezados                      |
| D2  | Carrusel sin pausa (solo al pasar el ratón)  | Botón de pausa abajo a la derecha; quieto con movimiento reducido  | WCAG 2.2.2, aprobado                          |
| D6  | Iconos SVG del kit (Flaticon, L2)            | Tabler: `settings`, `wheel`, `bucket-droplet`, `filter` y `engine` | Licencia L2                                   |
| D16 | «Ver todas los repuestos»                    | «Ver todos los repuestos»                                          | Errata                                        |
| D17 | «Ver más» en todas, enlazando a `#`          | Solo si la categoría tiene enlace                                  | Un botón que no lleva a ningún sitio          |
| D18 | Las copias del carrusel se leen cuatro veces | Solo la primera es accesible                                       | Lector de pantalla                            |
| D19 | Escala con GSAP                              | `requestAnimationFrame`; sin escala con movimiento reducido        | Sin dependencia; las tarjetas se apilan igual |

### Assets — solo en el preview

Se siembran con `npm run preview:fase-e:sembrar` y se quitan con `retirar`. El
script se niega si la base o el Blob no son los del preview.

- **9 logos de fabricantes** (`assets/08/Mesa-de-trabajo-*`): Hitachi, CASE,
  Yanmar, Dynapac, Donaldson, Volvo, Caterpillar, Hyundai y Komatsu.
  - El uso como distribuidor está **por confirmar** (§6).
  - A la lista de §6 le faltaban Caterpillar, Komatsu, Volvo, Hyundai y
    Donaldson.
- **4 fotos de tarjeta:** `235553.jpg` (banco) y tres `hf_20260914_*` (IA),
  las cuatro L3.

**En producción, sin esos assets:**

- La sección 4 no se pinta, porque no hay logos.
- La sección 5 sale con tarjetas de solo texto en cuanto dirección asigne
  `ordenPortada`, icono y enlace a las categorías desde el panel.

---

## 19. Fase F — secciones 6, 7 y 8 (2026-10-01)

**Fuentes:**

- El export: `19fb55e9`, `74556815`, `26964688`, `3f91730a` y `1a1256e3` (sección 7); `1e1e3861`, `37ba086b`, `7977e122` y `4f9102b5` (sección 8).
- El **código del efecto**, que vive en el widget HTML `6b438010` de la sección 6. La sección 6 no pinta nada: es ese script.
- Lo pintado, medido en el HTML guardado de ux-9 a 1440, 1010 y 390.

### Sección 7 — «Nuestra Compañía»

| Qué (ux-9)              | Valor                                                                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contenedor              | Relleno 0 · 1,5 % · 1,5 % · 1,5 %                                                                                                                                                        |
| Tarjeta                 | Alto 100vh, radio 30, relleno 10, contenido centrado                                                                                                                                     |
| Fondo                   | Vídeo `hf_20260903_212148` en bucle y sin sonido; respaldo `2151307778.jpg`                                                                                                              |
| Velo                    | `text` (#100F0F) al 21 %                                                                                                                                                                 |
| Título                  | «Nuestra Compañía», `primary`, blanco; ritmo `pausado` (0,01 · 2 s), disparo al 85 %                                                                                                     |
| Texto                   | 490 px, `cd1706f` (20 / 20 / 18), blanco, mismo ritmo                                                                                                                                    |
| Botón de reproducir     | Círculo de 80 px, `primary`, icono blanco; abre YouTube `lcIx96OBAWU`                                                                                                                    |
| **Fijado** (> 768 px)   | 350 px de scroll, `scrub` 0,6                                                                                                                                                            |
| **Encogido**            | Escala 1 → 0,4 y radio 0 → 32, lineal                                                                                                                                                    |
| **Capa blanca fija**    | Opacidad 0 → 1 en el primer 8 %, 1 hasta el 75 %, 0 al 100 %                                                                                                                             |
| **Texto en movimiento** | «MAQUINARIA PESADA EN COLOMBIA •» × 3 × 2 grupos, Inter 600 en mayúsculas, `clamp(36px, 6vw, 110px)`, #0A0A0A (rojo al pasar el ratón), 90 px/s, detrás del vídeo; enlaza a `/nosotros/` |
| ≤ 768 px                | Sin fijado, sin encogido y sin texto en movimiento                                                                                                                                       |

**Medido en ux-9 a 1440**, tarjeta según el desplazamiento dentro del fijado:

| Desplazamiento | Tarjeta    | Escala | Radio | Capa blanca |
| -------------- | ---------- | ------ | ----- | ----------- |
| 0              | 1397 × 900 | 1      | 0     | 0           |
| 175            | 978 × 630  | 0,7    | 16    | 1           |
| 350            | 559 × 360  | 0,4    | 32    | 0           |

**Replicado sin GSAP:**

- El fijado es CSS (`sticky` dentro de un recorrido de 100vh + 350 px).
- La escala, el radio y la capa los calcula `requestAnimationFrame` a partir del scroll, con alcance de ~0,6 s como el `scrub`.
- La duración del texto en movimiento sale del ancho real del grupo: 90 px/s.

**Vídeo:**

- `preload="none"`: solo se reproduce mientras la tarjeta está a la vista.
- El póster va debajo con `next/image`; es lo que se ve antes de cargar, al pausar y con movimiento reducido.
- `aria-hidden` si el vídeo está marcado como decorativo.

**Datos** (`paginas.seccionCompania`):

- `video`: relación con `videos`.
- `youtube`: URL validada (`src/lib/fields/youtube.ts`, con pruebas). Solo `youtube.com`, `youtu.be` y `youtube-nocookie.com` por https, con id de 11 caracteres.

**YouTube** (`DialogoYouTube`, reutilizable en la fase H):

- El iframe no existe hasta pulsar, y siempre desde `youtube-nocookie.com`.
- `<dialog>` nativo con `showModal()`: el foco queda dentro, se cierra con Escape o pulsando el fondo, y el foco vuelve siempre al botón.
- Al cerrar, el iframe se destruye.

### Sección 8 — «Encuentra la maquinaria que tu operación necesita»

| Qué (ux-9) | Valor                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| Contenedor | Relleno 10 · 10 · 50 · 10, **margen superior −180 px**                                                |
| Título     | 735 px, `primary`, #100F0F, 30 px debajo; ritmo `titulo`, disparo al 95 %                             |
| Botones    | «Catálogo» y «WhatsApp»: radio 7, borde 1 px, `primary`; al pasar el ratón, `text`; 20 px entre ellos |

**Dónde cae el −180** (medido en ux-9):

- **Por encima de 768 px**, el recorrido del fijado deja libre ese hueco: el título queda 100 px por debajo de la tarjeta ya encogida.
- **A 768 px o menos** no hay fijado, y el título se pinta **sobre** el final del vídeo, en oscuro sobre la imagen. Se replica, y su contraste queda **pendiente de Andrés**, como los demás contrastes de ux-9 que fallan.

### Desviaciones de esta fase

| #   | ux-9                                                                                 | Nuestro                                                                                             | Por qué                                   |
| --- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| D1  | Título de la 8 en `<div>`; texto de la 7 en `<h3>`                                   | `<h2>` y `<p>`                                                                                      | Jerarquía                                 |
| D2  | Vídeo y texto en movimiento sin pausa; el encogido no respeta el movimiento reducido | Botón de pausa en la tarjeta; con movimiento reducido, póster sin vídeo ni encogido, y texto quieto | WCAG 2.2.2, aprobado                      |
| D6  | Iconos de Font Awesome                                                               | Tabler (`truck`, `brand-whatsapp`, `player-play`)                                                   | Sin la fuente de iconos                   |
| D16 | «Catálgo»                                                                            | «Catálogo»                                                                                          | Errata                                    |
| D20 | Ventana de YouTube del widget de Andrés: foco devuelto solo si se abrió con teclado  | `<dialog>` nativo: foco dentro y devuelto siempre                                                   | Teclado                                   |
| D21 | El primer enlace del texto en movimiento recibe foco, invisible tras el vídeo        | Ningún enlace del texto en movimiento recibe foco; sigue siendo enlace con el ratón                 | Foco visible                              |
| D22 | —                                                                                    | **Sin vídeo** (producción), a ≤ 768 px la sección 8 no sube                                         | Título oscuro sobre tarjeta oscura: 1,0:1 |

### Assets — solo en el preview

Se siembran con `npm run preview:fase-f:sembrar` y se quitan con `retirar`. El script se niega si la base o el Blob no son los del preview.

- **Vídeo** `hf_20260903_212148`, **reexportado** en local a H.264 High de 8 bits:
  - 1920 × 1080 a 1,5 Mbit/s, dos pasadas, sin audio, `+faststart`;
  - **3.679.952 bytes**, por debajo del tope de 4 MiB;
  - VMAF 91,3 frente al original.
  - Está en `Desktop/partequipos-diseno/web/`, nunca en el repositorio.
  - Generado por IA: L3.
- **Póster** `2151307778.jpg`: banco, L3.
- **YouTube** `lcIx96OBAWU`: titularidad por confirmar con el cliente.

**En producción, sin ellos:**

- La tarjeta se ve en oscuro (`text`, #100F0F) con el velo y el texto blanco.
- Por encima de 768 px, el fijado, el encogido y el texto en movimiento funcionan igual.
- Sin YouTube, no hay botón de reproducir.

---

## 20. Fase H — secciones 10 y 11 (2026-10-01)

**Fuentes:**

- **El export:** `306ba9d3`, `7150fed1` y `4d701aa3` (sección 10); `1945efcb`, `73c4efc3`, `709b7472`, `69024d18`, `68ccfda2` y `5a2d8e5d` (sección 11).
- **El código del widget de Andrés** del acordeón de testimonios (`bangluxor_acordeon_video_popup`, su `css.tpl` y `html.tpl`). Se aplican sus valores por defecto, porque el export solo cambia el texto del botón.
- **El acordeón de la FAQ**, de Unlimited Elements: no trae CSS en el JSON, así que se **midió pintado**.

### Sección 10 — testimonios

| Qué (ux-9)       | Valor                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Contenedor       | Relleno 3 %                                                                                                                   |
| Título           | 815 px, `primary`, 60 px debajo; ritmo `titulo`, disparo al 95 %                                                              |
| Pista            | 560 px de alto, 12 de hueco; tarjetas con radio 14                                                                            |
| Abierta          | La **segunda** al cargar; crece ×3 en 700 ms `cubic-bezier(.65,0,.35,1)`                                                      |
| Cerradas         | Foto con desenfoque de 14 px y escala 1,15                                                                                    |
| Abierta, detalle | Degradado inferior negro al 70 %; «Ver Video» en píldora arriba a la izquierda (14 px, borde blanco al 55 %, vidrio de 10 px) |
| Textos           | Nombre `clamp(24px, 2.4vw, 34px)`; lugar `clamp(16px, 1.5vw, 21px)`; texto 13 px, peso 300, blanco al 85 %                    |
| Con ratón        | Se abre al pasar por encima y vuelve a la inicial al salir                                                                    |
| Con dedo         | Se abre al pulsar                                                                                                             |
| < 768 px         | Apiladas: 96 px cerradas, 460 la abierta                                                                                      |

**Medido en ux-9 a 1440** (pista de 1354 px): tarjetas de 253 · 659 · 253 · 253 px, con las cerradas en 253 × 644. **A 390:** 110 · 460 · 110 · 110 px.

**Datos:** `testimonios`.

- **Contenido de la tarjeta:**
  - en grande, la **empresa** («EMT SAS»), que es lo que pinta ux-9;
  - en pequeño, la **ciudad**;
  - el texto, la cita;
  - la foto lleva como `alt` el **nombre de la persona**.
- **Campo nuevo `youtube`**, con la misma validación que la sección 7. Los cuatro de ux-9 tienen vídeo, al contrario de lo que decía la nota de la fase B.
- **Solo los publicados:** la API local salta el control de acceso, así que el filtro va en la consulta **y** en la lógica, con prueba. Un testimonio no se publica sin la autorización (L4, gancho de la fase B).

**Sin desplazamiento de layout al pasar el ratón.** El widget de ux-9 cambia
el `flex-grow` de las tarjetas, y eso es layout: al pasar el ratón por una
tarjeta y salir, **medido, 0,19 de CLS**. El navegador no excluye el
movimiento del ratón como «entrada», así que lo sumarían los usuarios reales.

Aquí, a 768 px o más:

- todas las tarjetas miden lo que mide la abierta (3u);
- se colocan con `transform`;
- la parte visible de las cerradas la recorta `clip-path`.

Ni `transform` ni `clip-path` mueven el layout. Con `cover`, el recorte
centrado enseña lo mismo que la caja estrecha de ux-9. Medido después:

| Ancho | Tarjetas visibles (1.ª a 4.ª, la 2.ª abierta) | CLS al pasar el ratón |
| ----- | --------------------------------------------- | --------------------- |
| 1440  | 220 · 659 · 220 · 220                         | **0**                 |
| 1010  | 152 · 457 · 152 · 152                         | **0**                 |

Sin scroll horizontal: la pista recorta (`overflow-x: clip`) las cajas que
sobresalen.

### Sección 11 — preguntas frecuentes

| Qué (ux-9)                   | Valor                                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sección                      | Relleno 16 % · 0 · 11 % · 0, fondo #F0F0F0                                                                                                          |
| Columnas                     | 40 % y 60 %, relleno 5 %. En móvil, apiladas: la izquierda con alto mínimo de 60vh, la derecha con relleno 10 % · 5 %                               |
| Izquierda                    | Título de 412 px con curva de rebote (`back.out(1.4)`), disparo al 85 %; texto `text` en #56545A; «Solicita asesoría» con radio 8                   |
| Acordeón, cabecera (MEDIDA)  | Blanca, relleno 10, radio 10, 10 px entre preguntas                                                                                                 |
| Acordeón, icono (MEDIDO)     | Caja roja de 40 con radio 8, icono blanco de 18                                                                                                     |
| Acordeón, pregunta (MEDIDA)  | `cd1706f` en #000; + / − de 11 px en #56545A                                                                                                        |
| Acordeón, respuesta (MEDIDA) | Relleno 20, peso 300, #616161                                                                                                                       |
| Estado inicial               | Todas cerradas; al abrir una se cierra la anterior                                                                                                  |
| Máquina                      | 64 % de ancho, `top: −29 %` y `left: −22,777 %` (en móvil −4 % y −15 %), volteada y girada −13°; brillo 70, contraste 94, saturación 115; z-index 1 |

**Implementación:**

- `<details>` nativo con `name` compartido: al abrir una se cierra la otra, sin JavaScript, como el widget.
- JSON-LD `FAQPage` con las mismas preguntas. Sin preguntas no se emite.

**Datos:** `preguntas-frecuentes` publicadas, por orden; la máquina, en el campo nuevo `paginas.seccionFaq.imagen`.

### Desviaciones de esta fase

| #   | ux-9                                                                   | Nuestro                                                                                                                    | Por qué                                                                                                                           |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Títulos en `<div>`; nombres de la tarjeta en `<div>`                   | `<h2>` y `<h3>`; la pregunta en `<summary>`                                                                                | Jerarquía                                                                                                                         |
| D2  | Las tarjetas animan siempre                                            | Con movimiento reducido, sin transiciones                                                                                  | Aprobado                                                                                                                          |
| D6  | Iconos del kit y de Font Awesome                                       | Tabler (`message-question`, `player-play`); + / − en CSS                                                                   | Licencia L2                                                                                                                       |
| D20 | Ventana de YouTube propia del widget                                   | El `<dialog>` común de la sección 7                                                                                        | Foco                                                                                                                              |
| D24 | En móvil, la tarjeta cambia de alto en 700 ms                          | 450 ms                                                                                                                     | El cambio de alto es layout, y el navegador solo lo excluye del CLS durante 500 ms tras el toque. Con 700 ms, 0,009 de CLS medido |
| D23 | Las tarjetas son `div` con `tabindex`; «Ver Video» igual en las cuatro | Cada tarjeta lleva un botón con `aria-expanded`; el texto de las cerradas está oculto al lector; «Ver el vídeo de EMT SAS» | Teclado y lector de pantalla. Con el ratón se ve igual                                                                            |

### Assets — solo en el preview

Se siembran con `npm run preview:fase-h:sembrar` y se quitan con `retirar`. El script se niega si la base o el Blob no son los del preview.

- **4 testimonios** con los textos de ux-9; tres de ellos son el mismo relleno.
  - Su «autorización» es **de prueba** y lo dice en la referencia.
  - Están en **L4**: hace falta autorización real de cada persona y empresa.
- **4 fotos:** `Video-Testimonio.jpg`, `Testimono-24.jpg`, `345345.jpg` y `Case.jpg`. Son de personas reales (L4) y de procedencia por confirmar (L3).
- **YouTube** `hBeMsx5WEko` y `hV33sXph6sU`: titularidad por confirmar con el cliente.
- **Máquina** `P1415_6500-2_red_211111.png`: L3.
- **5 preguntas de ux-9:** son contenido redactado, no un asset con licencia. En producción las carga dirección o el cliente desde el panel.

**En producción, sin ellos:** las dos secciones no se pintan hasta que haya testimonios publicados o preguntas publicadas. Si hay preguntas pero no máquina, la sección 11 sale sin la imagen y sin hueco.

---

## 21. LCP móvil, cierre (fase 5, 2026-10-01)

**Método:** Lighthouse 13.4.1 por línea de comandos, móvil; 9 + 9 corridas alternadas con calentamiento, contra URL fijas. Cada variante se mide contra el código de `main` en el mismo preview (`demgsmou4`) y **en la misma tanda**.

### (a) JS de la portada

**Desglose** con el analizador de Turbopack (`next experimental-analyze --output`, ruta `/`):

- JS de cliente comprimido: ~232 kB.
  - **212 kB son de Next y React:** React DOM 63, router ~45 y el resto del marco.
  - **~15 kB son del sitio:** portada 7,4, hero 2,7, movimiento 1,8, cabecera 1,4 e iconos 1,3.
- `polyfill-nomodule` (38,5 kB) va con `nomodule`: los navegadores modernos no lo descargan, y en los JSON de Lighthouse no aparece.

**Cambio:** los componentes de cliente bajo el hero salen del chunk inicial con `next/dynamic`, desde un fichero de cliente (`portada/diferidos.tsx`), con SSR. Son las secciones 2, 3, 4, 5, 7 y 10. Desde un componente de servidor, `next/dynamic` no parte el JS: lo dice la guía de Next 16.

**Resultado:** el chunk de la página se queda con el hero (2,4 kB) y cada sección va en el suyo. Medido: **2,49 s** frente a 2,72 s; CLS 0.

### (b) Inter sin precarga

**Antes, el origen del 0,0027 de CLS del título del hero:**

- Cuando Inter llega después del primer pintado (~550–720 ms, 4 de cada 8 cargas sin caché a 1440), el título pasa de 1047 a 991 px de ancho.
- Su caja era `fit-content` y está centrada, así que se desplazaba de x = 197 a x = 225.
- **Arreglo:** el título va a todo el ancho de su capa (`width: 100%`), con el texto centrado igual. Resultado: 0 desplazamientos del título en 16 cargas sin caché (10 a 1440 y 6 a 390).
- **Resto:** un elemento del menú de la cabecera se desplaza 3 px, con un valor de **0,0000057**. Ocurre con y sin precarga.

**Sin precarga** de Inter (`preload: false`), con el título fijo: **2,57 s** frente a 2,91 s. CLS 0 en Lighthouse, y en las cargas sin caché solo queda el 0,0000057 del menú.

### Juntas, y producción

| Variante                  | Mediana | `main` en la tanda |
| ------------------------- | ------- | ------------------ |
| (a) + (b)                 | 2,81 s  | 2,96 s             |
| Producción (los recortes) | 2,83 s  | 2,87 s             |

**No se llega a 2,44 s.** El ruido entre tandas (el mismo `main`, de 2,72 a 2,96 s) es del orden de la mejora, y el resto del LCP lo ocupa el JS del marco.

Se aplican (a), (b) y el arreglo del título, y **se cierra el tema** (CLAUDE.md §10.36).
