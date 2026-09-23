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

| Pendiente                                                                                                                                                                                          | Antes de   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **Reexportar el MP4 de la sección 7 a H.264 de 8 bits.** Hoy es High 10 (10 bits): puede que Safari de iPhone no lo reproduzca y el visitante vea solo el póster (§4)                              | **Fase F** |
| **Versión más ligera del recorte de 1.570 kB de la sección 3** (`excavadora-amarilla-aislada-…-e1788914890653.png`), que pesa entre 2,4 y 4 veces lo que sus vecinos de pestaña (§1)               | **Fase D** |
| **El revelado del prototipo del hero usa `translateY` en px (50 px)**; el widget de Andrés usa `yPercent` (50 % del alto de la palabra). Se corrige al pasarlo a `Revelado` con el ritmo `portada` | **Fase C** |

---

## 8. Fase A — hecha, en revisión (2026-09-23)

Rama `feat/base-ux9`, **sin fusionar**.

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
