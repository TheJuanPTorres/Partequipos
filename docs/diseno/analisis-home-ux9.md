# Home de Andrés (ux-9) — análisis previo a construir

> **FASE 1, solo análisis. No se ha construido nada.** 2026-09-23.
>
> **ux-9 es la versión APROBADA por el cliente.** Sus valores visuales son los
> del sitio público y se replican con precisión, sin cambios estéticos. Lo único
> que se aparta son las correcciones de accesibilidad acordadas, y cada una se
> documenta como desviación con su motivo.

## 0. Fuente y cómo se verificó

**Fuente: los ficheros exportados de Elementor**, no la página pintada. Están
fuera del proyecto, en `Desktop/partequipos-diseno/`:

| Fichero                                                                       | Contenido                                                                                                                                                         |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `home-page.zip`                                                               | Kit del sitio: `site-settings.json` (colores y tipografías globales), **`content/page/1717.json` (ux-9)**, cabecera (`2162`), pie (`2178`) y las demás páginas UX |
| `elementor-2516-2026-09-23.json`                                              | ux-9 exportada suelta como plantilla                                                                                                                              |
| `bangluxor_titulo_revelado_palabras_scroll`, `bangluxor_acordeon_video_popup` | Widgets propios de Andrés (Unlimited Elements)                                                                                                                    |
| `jptv_menu_fullscreen_galeria_hover`                                          | Widget de menú: **no se usa en ux-9** (solo en UX 2 y UX 3)                                                                                                       |
| Imágenes originales                                                           | **Descargándose todavía** — §5.5 queda pendiente                                                                                                                  |

**Comprobado que es ux-9, y no otra versión:** el manifiesto del kit lista la
página 1717 como «Home Final» con URL `…/ux-9/`. Y `1717.json` y la plantilla
suelta `2516` tienen **el mismo contenido una vez quitados los ids** (535.400
caracteres idénticos; solo cambia una clave vacía de fondo): Elementor regenera
los ids al exportar, por eso no coinciden con los de la página publicada.

**Lo que se descartó por el camino, para que no se use por error:** en
Descargas había otro kit del mismo día (`home-completo.zip` y tres
`elementor-*.json`) que **es de otro cliente de Andrés**, `razandco` (una
joyería). Además, el primer borrador de este análisis se hizo con la página
pintada; queda sustituido por este.

---

## 1. Inventario de secciones, en orden

Once contenedores de primer nivel y 200 elementos. El 6 y el 7 son una pieza:
el 6 es un widget HTML con el código del efecto del 7. La banda roja «Ofrecemos
Soluciones para tus Proyectos» **es del pie**, no de la home.

| #   | Sección                                                              | Contenido (del JSON)                                                                                                                             | De dónde saldría en Payload                      | ¿Existe el modelo?                                                                                   |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 1   | **Hero** «Potencia Hitachi»                                          | Título, fondo, máquina recortada, párrafo en vidrio, «+», dos flechas                                                                            | Grupo `hero` en `Paginas` (`inicio`) — ADR 0009  | Decidido, sin implementar                                                                            |
| 2   | **Maquinaria pesada nueva**                                          | Carrusel de 3 tarjetas de marca (Hitachi, CASE, Yanmar): foto de fondo, logo, texto; botón «Ver todo»                                            | `marcas-maquinaria`                              | **A medias**: tiene `nombre`, `descripcion`, `logo`; **falta la foto de fondo** de la tarjeta        |
| 3   | **Maquinaria pesada usada** + «Marcas que respaldan nuestro trabajo» | Imagen grande de máquina; pestañas Excavadoras / Otros / Aditamentos; **6 tarjetas de equipo** con peso operativo, potencia y motor              | `equipos-usados` + `categorias-usada`            | **A medias**: el equipo usado tiene `anio`, `horometro`, `ubicacion`… **no** peso, potencia ni motor |
| 4   | **Carrusel de logos**                                                | **9 logos** en bucle (la página los repite para el efecto)                                                                                       | `marcas` (logo) o lista propia                   | Por decidir cuál                                                                                     |
| 5   | **Repuestos** «Encuentra maquinaria y repuestos rápido y fácil»      | 4 tarjetas apiladas: Blades y corte, Llantas y rines, Lubricantes, Filtración                                                                    | `categorias-tecnicas`                            | **A medias**: `nombre`, `descripcion`; **faltan** imagen, icono y enlace                             |
| 6–7 | **Nuestra compañía**                                                 | Vídeo de fondo en bucle que encoge con el scroll; marquee «MAQUINARIA PESADA EN COLOMBIA» → `/nosotros/`; botón que abre **un vídeo de YouTube** | Grupo en `Paginas` (`inicio`)                    | **Choca con `Media`**: solo admite JPEG, PNG y WebP (§10.28). El MP4 no entra                        |
| 8   | **Llamada a la acción**                                              | «Encuentra la maquinaria que tu operación necesita» + Catálogo + WhatsApp. **Se monta 180 px sobre la sección 7** (margen negativo)              | `Paginas` (`inicio`); WhatsApp desde `seoConfig` | En parte                                                                                             |
| 9   | **Sedes**                                                            | Globo interactivo (Mapbox) con **7 sedes**: coordenadas, foto, dirección por línea de negocio y teléfono                                         | Colección **nueva** `sedes`                      | **No existe.** Hoy hay una sola dirección, en `seoConfig`                                            |
| 10  | **Testimonios**                                                      | 4 tarjetas desplegables con foto, empresa, ciudad y texto                                                                                        | Colección **nueva** `testimonios`                | **No existe**                                                                                        |
| 11  | **Preguntas frecuentes**                                             | Acordeón de **5 preguntas**, imagen de máquina, «Solicita asesoría»                                                                              | Array en `Paginas` (`inicio`)                    | **No existe.** Daría JSON-LD `FAQPage`                                                               |

### Las sedes, tal como vienen en el diseño

| Sede        | Líneas y direcciones                                                                                                       | Teléfono                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Bogotá      | Maquinaria: Diagonal 16 # 96 G – 85 · Repuestos: Carrera 68d # 17a – 84 · Almacén: Calle 6 Nro 26-73                       | (601) 492 62 60                   |
| Ibagué      | Maquinaria y repuestos: Carrera 48 Sur # 88 – 45, Av. Mirolindo                                                            | **ninguno**                       |
| Cali        | Maquinaria y repuestos: Calle 15 # 38 – 21, Acopi – Yumbo                                                                  | (602) 384 40 02                   |
| Istmina     | Maquinaria y repuestos: Bomba Zeuz la 70                                                                                   | **ninguno**                       |
| Montería    | Maquinaria y repuestos: Calle 78, Sevilla 1                                                                                | **ninguno**                       |
| Antioquia   | Maquinaria (Guarne): Autopista Medellín – Bogotá Km 26+800 · Almacén y repuestos (Medellín): Calle 16 # 45-104, El Poblado | (604) 448 58 78 · (604) 444 96 69 |
| Bucaramanga | Maquinaria y repuestos: KM 7 vía Bucaramanga – Girón 4 – 80                                                                | (607) 691 79 95                   |

Dato útil para §10.3 p.1 de CLAUDE.md: **las dos direcciones de Bogotá son las
de las dos razones sociales** que siguen pendientes de aclarar (`PARTEQUIPOS
MAQUINARIA S.A.S` y `PARTEQUIPOS S.A.S`). El diseño las presenta como dos líneas
de la misma marca. Son datos de una maqueta: hay que confirmarlos con el cliente
antes de publicarlos y de meterlos en JSON-LD.

### Contenido de relleno en el diseño aprobado

No confundirlo con contenido real: las **6 tarjetas de equipo usado son la
misma** («EXCAVADORA HITACHI ZX75US-7»); **3 de los 4 testimonios son el mismo**
(«Sentrac Ingeniería SAS · Casanare») y **ninguno tiene vídeo**, aunque el botón
dice «Ver Video»; casi todos los enlaces van a `#`; erratas «Catálgo» y «Ver
todas los repuestos».

---

## 2. Valores por punto de corte

Del JSON. Cortes del kit: **móvil ≤767**, **tablet 768–1024**, **escritorio
≥1025** (`viewport_md: 768`, `viewport_lg: 1025`).

**Cómo se adapta de verdad:** casi todo lo hace la **escala tipográfica global**
(§3) y el reflujo de los contenedores. 8 de las 11 secciones **no tienen ni un
ajuste propio para tablet**. Los ajustes por corte se concentran en el hero (3
de tablet, 11 de móvil), la sección 11 (5 de móvil) y las secciones 2 y 3.

| Sección             | Escritorio                                                                         | Tablet                        | Móvil                                           |
| ------------------- | ---------------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------- |
| 1 Hero, exterior    | alto mín. **88vh**; relleno **0 · 1,5 % · 1,5 % · 1,5 %**                          | =                             | =                                               |
| 1 Hero, tarjeta     | 86vh; centrado; radio 30; fondo `Fondo.jpg`                                        | relleno 50/30/30/30           | 85vh; `space-between`                           |
| 1 Título            | **120 px**, 600, 1,4em, blanco, centrado                                           | 70 px                         | 12vw                                            |
| 1 Solape            | fila del título con margen inferior **−250 px**                                    | =                             | =                                               |
| 1 Máquina           | 809 px; margen sup. 100 px; z 1                                                    | 631 px                        | margen sup. 200 px                              |
| 1 Flechas           | icono 21 px                                                                        | =                             | 15 px                                           |
| 1 Vidrio            | 400 px; relleno 30; `right 21px · bottom 94px`                                     | `right −20px · bottom −113px` | **oculto** (280 px, relleno 20, si se mostrara) |
| 1 Párrafo           | 16 px                                                                              | =                             | 13 px                                           |
| 2 Maquinaria nueva  | relleno 5 % · 3 %; radio 30; tarjetas de 30vh y radio 30                           | =                             | 3 ajustes                                       |
| 3 Maquinaria usada  | fila; relleno 0 · 3 %; radio 30; fondo `#F0F0F0`; columnas 45 % / 54 %             | **columna**; imagen 46 %      | imagen 72 %                                     |
| 3 Tarjeta de equipo | nombre 18 px / 700 (literal); icono 20 px en círculo `#E5242D17`                   | =                             | =                                               |
| 5 Repuestos         | relleno 70 · 10 · 30 · 10; fondo `#F0F0F0`                                         | =                             | =                                               |
| 7 Compañía          | exterior 88vh + 1,5 %; tarjeta 100vh, radio 30, velo `#100F0F`                     | =                             | =                                               |
| 8 CTA               | relleno 10 · 10 · 50 · 10; **margen sup. −180 px**                                 | =                             | =                                               |
| 10 Testimonios      | relleno 3 %                                                                        | =                             | =                                               |
| 11 FAQ              | relleno 16 % · 0 · 11 %; columnas 40 % / 60 %                                      | =                             | alto mín. 60vh; relleno 10 % · 5 %              |
| Botones             | radio **30 px** (2, 3, 5), **7 px** (8), **8 px** (11); el global del kit es 50 px |                               |                                                 |

### Contraste con lo que medimos del hero

**El JSON confirma todo lo medido:** 120/70/12vw, 600, 1,4em, el −250 px, la
máquina a 809/631 con 100/200 de margen, las flechas 21/15, el párrafo 16/13 y la
posición del vidrio (21/94 en escritorio, −20/−113 en tablet). Y el CSS
personalizado del vidrio —el único de toda la página— trae exactamente blanco al
12 %, borde de 1 px al 25 %, radio 30, desenfoque 18 px y sombra negra al 8 %.

La animación del título también coincide con el encargo: **escalón 0,3, duración
2, distancia 50**, `power3.out`, «top 85%», una vez.

**Y confirma un error del prototipo:** el margen exterior. Puse `8px`
suponiendo que «la tarjeta no pega a los bordes»; el diseño dice **88vh de alto
y relleno 0 · 1,5 % · 1,5 % · 1,5 %**.

---

## 3. Colores y tipografías globales del kit

De `site-settings.json`.

### Colores, traducidos a variables

```css
--kit-principal: #e5242d; /* primary, «Principal» */
--kit-secundario: #56545a; /* secondary, «Secundario» */
--kit-texto: #100f0f; /* text, «Texto» */
--kit-enfasis: #2e2e2e; /* accent, «Énfasis» */
--kit-blanco: #ffffff; /* 099f28a */
--kit-gris: #f0f0f0; /* a372504 */
--kit-rojo-tinte: #e5242d17; /* 123d64f: el rojo al 9 % */
```

Uso en la home: blanco 72 veces, principal 46, texto 43, secundario 25; el gris
y el tinte, 7 cada uno; énfasis, 1.

**Una referencia colgada:** la sección 11 usa un global `94afbba` **que no existe**
en el kit. Elementor lo descarta al generar el CSS, así que ese fondo sale
transparente y se ve el `#F0F0F0` de debajo. Replicar: transparente.

### Tipografías, traducidas a variables

Todas en **Inter**. Escritorio · tablet · móvil:

| Global      | Nombre     | Peso | Interlineado | Escr. | Tablet | Móvil | Usos en la home |
| ----------- | ---------- | ---- | ------------ | ----- | ------ | ----- | --------------- |
| `primary`   | Principal  | 500  | 1,2em        | 55 px | 40 px  | 10vw  | 7               |
| `secondary` | Secundario | 500  | 1,2em        | 45 px | 35 px  | 9vw   | 2               |
| `aa37d38`   | H3         | 500  | 1,2em        | 35 px | 30 px  | 7,5vw | 0               |
| `43da5c7`   | H4         | 500  | 1,2em        | 30 px | 25 px  | 6,5vw | 0               |
| `cd1706f`   | M          | 400  | 1,3em        | 20 px | 20 px  | 18 px | 3               |
| `2e6cf84`   | M BOLD     | bold | 1,2em        | 20 px | 20 px  | 18 px | 0               |
| `text`      | Texto      | 300  | 1,4em        | 16 px | 14 px  | 13 px | 3               |
| `accent`    | Énfasis    | 500  | 1em          | 16 px | 13 px  | 13 px | 14              |

Botón global: radio 50 px, relleno 12 · 25 · 10 · 25, borde de 1 px.

**HelveticaNeue** (Light, Roman, Medium, Bold) es fuente personalizada del kit.
En la home aparece declarada en el texto de la FAQ, **pero debajo de una
tipografía global**, que es la que manda: en la página publicada ese texto sale
en Inter. Se usa de verdad en el **pie**.

### Diferencias con el sistema del cliente — SIN resolver

|                 | Kit de Andrés                                              | Sistema (`docs/design-tokens.md`)                  |
| --------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| Rojo            | `#E5242D`                                                  | `--primary` `#dc2626` (y `#D92035` en su logotipo) |
| Texto           | `#100F0F`                                                  | `--foreground` `#000000`                           |
| Fondo           | `#FFFFFF`                                                  | `--background` `#fcfcfc`                           |
| Gris de sección | `#F0F0F0`                                                  | `--secondary` `#f2f2f2` / `--muted` `#ededed`      |
| Rojo al 9 %     | `#E5242D17`                                                | sin equivalente                                    |
| Tipografía      | **Inter**, y HelveticaNeue en el pie                       | **Rubik**                                          |
| Escala          | **Propia**: 8 estilos con 3 cortes, móvil en `vw`          | **No define escala** (Tailwind v4)                 |
| Radios          | 30 px en tarjetas y botones; 7, 8 y 50 px en otros botones | escala multiplicativa, tope 18,7 px                |

**Trampa de nombres:** «secondary» y «accent» no significan lo mismo en los dos.
En el kit son **colores de texto de marca** (`#56545A`, `#2E2E2E`); en el
sistema, que sigue a shadcn, son **superficies** claras (`#f2f2f2`, `#ededed`).
Lo equivalente de verdad: `#56545A` ↔ `--muted-foreground` `#737373`, y
`#2E2E2E` ↔ `--accent-foreground` `#202020`.

---

## 4. Widgets y animaciones

### El título revelado por palabras — 12 instancias, no todas iguales

Widget propio de Andrés. Por defecto: `<h2>`, por palabra, escalón 0,06 s,
0,9 s, 100 px, `power3.out`, «top 85%», una vez. **Motor: GSAP + ScrollTrigger.**
**No respeta `prefers-reduced-motion`.**

| Sección        | Texto                                                                               | Etiqueta | Escalón · duración · distancia | Disparo  | Curva        |
| -------------- | ----------------------------------------------------------------------------------- | -------- | ------------------------------ | -------- | ------------ |
| 1              | Potencia Hitachi                                                                    | **h2**   | 0,3 · 2 · 50                   | 85 %     | power3.out   |
| 1              | Párrafo del vidrio                                                                  | div      | 0,06 · 0,9 · 100               | 85 %     | power3.out   |
| 2, 3, 5, 8, 10 | Títulos de sección («Maquinaria pesada nueva/usada», «Encuentra…», «La confianza…») | **div**  | 0,06 · 0,9 · 100               | **95 %** | power3.out   |
| 3              | Marcas que respaldan nuestro trabajo                                                | **div**  | 0,06 · 0,9 · 100               | 95 %     | power3.out   |
| 3              | Trabajamos con fabricantes líderes…                                                 | **h2**   | 0,01 · 2 · 100                 | 85 %     | power3.out   |
| 7              | Nuestra Compañía                                                                    | **h2**   | 0,01 · 2 · 100                 | 85 %     | power3.out   |
| 7              | En Partequipos somos expertos…                                                      | **h3**   | 0,01 · 2 · 100                 | 85 %     | power3.out   |
| 11             | Preguntas frecuentes                                                                | **h2**   | 0,06 · 0,9 · 100               | 85 %     | **back.out** |

### El resto

| Widget                                                            | Sección | Qué hace (ajustes del JSON)                                                                                                                                     | Motor                                                                                        | `prefers-reduced-motion` |
| ----------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------ |
| **Vídeo que encoge + marquee** (HTML a mano)                      | 6–7     | Vídeo al 40 % con radio 32 px en 350 px de scroll; marquee «MAQUINARIA PESADA EN COLOMBIA» a 90 px/s, `clamp(36px, 6vw, 110px)`, `#0A0A0A` → `#E5242D` al pasar | **GSAP + ScrollTrigger** (vídeo) · CSS (marquee)                                             | **Solo el marquee**      |
| **Tarjetas apiladas** (`stacking_cards`)                          | 5       | 4 tarjetas, `scroll_related_animation`                                                                                                                          | **GSAP + ScrollTrigger** — la página publicada carga **una segunda copia** propia del widget | No                       |
| **Carrusel de logos** (`logo_marquee`)                            | 4       | 9 logos, 90 px/s, pausa al pasar el ratón                                                                                                                       | CSS + jQuery                                                                                 | No                       |
| **Acordeón con vídeo** (propio, `bangluxor_acordeon_video_popup`) | 10      | Activo el 2.º, se abre al pasar el ratón, 700 ms, tarjeta abierta ×3, inactivas desenfocadas 14 px, se apila en móvil (≤767)                                    | JS propio, sin GSAP                                                                          | **Sí**                   |
| **Acordeón con iconos** (`uc_icon_accordion`)                     | 11      | 5 preguntas                                                                                                                                                     | Web Animations + jQuery                                                                      | No                       |
| **Botón de reproducción** (`blox_play_button`)                    | 7       | Abre `youtube.com/watch?v=lcIx96OBAWU`                                                                                                                          | jQuery + ventana emergente                                                                   | —                        |
| **Tarjetas expandibles** (`expanding_content_cards`)              | 2       | **Oculto en los tres cortes**, con 7 elementos de ejemplo de Instagram: **widget muerto**                                                                       | —                                                                                            | —                        |
| Carrusel anidado (Elementor Pro)                                  | 2       | 3 tarjetas de marca                                                                                                                                             | Swiper                                                                                       | —                        |
| Pestañas anidadas (Elementor Pro)                                 | 3       | Excavadoras / Otros / Aditamentos; pestaña con fondo rojo al 9 %                                                                                                | JS de Elementor                                                                              | —                        |
| **Globo de sedes** (HTML a mano)                                  | 9       | Mapbox GL JS 3.20, estilo `light-v11`, 7 sedes                                                                                                                  | Mapbox GL                                                                                    | **Sí**                   |
| Efectos de movimiento de Elementor                                | 1       | Parallax: título a velocidad 1, vidrio a 0,5                                                                                                                    | JS de Elementor                                                                              | No                       |
| Animación de entrada `fadeIn`                                     | 2, 3    | 4 elementos                                                                                                                                                     | CSS de Elementor                                                                             | —                        |

**Dependen de GSAP:** el título revelado (12 instancias), las tarjetas apiladas y
el vídeo que encoge. **Respetan `prefers-reduced-motion`:** solo el marquee de la
sección 7, el acordeón de testimonios y el globo.

**Sustitutos sin GSAP, a validar al construir (no decidido):** revelado → el
del prototipo (IntersectionObserver + transición CSS), **parametrizado por
instancia** porque hay tres ritmos distintos; tarjetas apiladas y vídeo que
encoge → `position: sticky` con animación ligada al scroll y respaldo mínimo en
JS; marquees → CSS; acordeones → `<details>`; pestañas → patrón ARIA; carrusel →
`scroll-snap`.

---

## 5. Riesgos

### 5.1 Encabezados

- **Ninguna `<h1>` en toda la página** (decisión pendiente, ya conocida).
- **La jerarquía no se corresponde con la estructura:** los cuatro títulos de
  sección («Maquinaria pesada nueva», «usada», «Encuentra maquinaria…», «La
  confianza…») son **`<div>`**, y en cambio son `<h2>` una frase de apoyo
  («Trabajamos con fabricantes líderes…») y **los 12 nombres de las tarjetas de
  equipo** (el widget de encabezado sin nivel puesto sale en `h2`). En Sedes hay
  `<h3>` sin `<h2>` encima. **Replicar el marcado tal cual sería replicar el
  defecto**: los niveles de encabezado son accesibilidad y SEO, no estética, así
  que corregirlos encaja como desviación documentada.

### 5.2 Contraste

| Caso                                                                          | Contraste                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blanco sobre el rojo del kit (botones, banda del pie)                         | **4,54 : 1** — pasa por 0,04                                                                                                                                                                                                            |
| **Rojo sobre `#F0F0F0`** (antetítulos pequeños en las secciones grises 3 y 5) | **3,99 : 1 — falla** para texto pequeño                                                                                                                                                                                                 |
| `#56545A` sobre blanco / gris                                                 | 7,47 / 6,55 — pasan                                                                                                                                                                                                                     |
| Texto sobre foto en el hero                                                   | ya medido: falla (título 2,4)                                                                                                                                                                                                           |
| Texto sobre foto en tarjetas de marca (2), vídeo (7), testimonios (10)        | **sin medir.** En la sección 2 el velo es un degradado de `#FFFFFF` a `#535353` al 81 % en modo **multiplicar**: no toca la parte alta de la foto y oscurece la baja, que es donde va el texto blanco. Ayuda, pero depende de cada foto |

### 5.3 Movimiento

- **Nada de lo que se mueve solo tiene pausa**, salvo al pasar el ratón: vídeo de
  fondo en bucle, dos marquees, carrusel. WCAG 2.2.2 lo exige para lo que dure más
  de 5 s.
- **Solo 3 de las piezas animadas respetan `prefers-reduced-motion`** (§4).
- Tarjetas apiladas y vídeo que encoge fijan la sección durante el scroll.

### 5.4 Oculto en móvil

- El **vidrio del hero** —párrafo y enlace «+»— desaparece en móvil.
- El widget de tarjetas expandibles está oculto en todos los cortes.

### 5.5 Peso de imágenes — PENDIENTE de las originales

El JSON referencia **85 ficheros de medios**; muchos son de widgets ocultos o de
ejemplo (`gallery1…6`, `logo1…6`, `placeholder`, fotos de Unsplash de demo), así
que lo que de verdad carga la página es bastante menos. El peso se medirá cuando
estén las originales. Ya se sabe que el **vídeo** de la sección 7 es un MP4 y que
el globo carga **Mapbox GL** (unos 365 kB de JavaScript comprimido, más teselas).

### 5.6 Licencias y datos de terceros — no es técnico, pero bloquea producción

- **Imágenes de procedencia a confirmar**: 7 con nombre típico de banco de imágenes
  (`2151307778.jpg`, `excavadora-amarilla-aislada-archivo-png-fondo-transparente…`,
  `potentes-excavadoras-accion-…`), 3 que **parecen generadas por IA** (`hf_2026…`,
  y también el vídeo), 2 **capturas de pantalla** usadas como logo, iconos con
  nombre típico de Flaticon (`engine_11747032.svg`…), que en su licencia gratuita
  exige atribución, y un fondo `21134998_red_and_white_grunge_background`.
- **Logotipos de marca** (Hitachi, CASE, Yanmar, Dynapac, LiuGong): confirmar que
  el cliente puede usarlos como distribuidor.
- **HelveticaNeue es tipografía comercial**: servirla en la web exige licencia web.
- **Testimonios**: fotos de personas reales y nombres de empresas. Publicarlos con
  fines comerciales exige autorización (Ley 1581 de 2012).
- **El vídeo del botón de reproducir es de YouTube**: confirmar que es del cliente,
  y usar `youtube-nocookie` para no poner cookies de terceros al cargar.
- **Mapbox**: el globo usa un token de la **cuenta personal de Andrés**. Hay que
  usar una cuenta del cliente, restringida por dominio. Mapbox cobra por encima de
  su tramo gratuito y recibe la IP de cada visitante. Y la CSP (§10.16) no permite
  hoy sus dominios: el mapa se rompería el día que la política pase a bloquear.

---

## 6. ¿Traen datos sensibles los ficheros?

**Revisado antes de copiar nada.** Resultado:

| Qué                                                                  | Dónde                                               | ¿Sensible?                                                                                                                 |
| -------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Token de Mapbox** de la cuenta personal de Andrés (`andres199207`) | Widget HTML del globo, en `1717.json` y `2516.json` | **Sí.** Es público por diseño, pero es **suyo**: no debe entrar al repositorio                                             |
| **Correo del administrador** de WordPress                            | `wp-content/*.xml` del kit                          | **Sí**                                                                                                                     |
| **Login y nombre visible** del autor de WordPress                    | `wp-content/*.xml` y `manifest.json`                | **Sí**                                                                                                                     |
| Teléfonos                                                            | Sedes                                               | **No**: son los fijos públicos de cada sede                                                                                |
| Claves de API, contraseñas, secretos                                 | —                                                   | **Ninguno** (buscados tokens de Mapbox privados, Stripe, Google, GitHub, Slack, `api_key`, `secret`, `password`, `Bearer`) |
| Código personalizado (GSAP, «Lineas», arreglo de fondos)             | `custom-code.json`                                  | Vacío: solo se exportó el título                                                                                           |

Una falsa alarma que conviene dejar escrita: la primera búsqueda de teléfonos
dio cuatro «móviles». Eran **dígitos de números decimales largos**
(`0.450000000000000011102230…`), no teléfonos.

**Qué entraría al repositorio, si se decide copiar algo:** `site-settings.json` y
`1717.json`, **con el token de Mapbox sustituido por un marcador**. **No** entran
los XML de `wp-content/` ni el `manifest.json`, que llevan los datos del autor.
Y **nada de la exportación de razandco**, que es de otro cliente, a un
repositorio que además es público.

---

## 7. Qué cambia en el prototipo con la regla «ux-9 es lo aprobado»

| Pieza del prototipo (`proto/hero-andres`) | Con la regla                                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| Velo del título                           | Añadido estético pendiente → **fuera**, salvo que se acuerde como corrección de accesibilidad |
| Peso 700 y −0,01em                        | Añadido estético → **fuera**                                                                  |
| Carrusel de tres diapositivas             | **El diseño aprobado no tiene carrusel** → decisión necesaria (abajo)                         |
| Ajuste del título al ancho                | Solo hacía falta por el carrusel → cae con él                                                 |
| Margen exterior 8 px                      | **Error mío**, confirmado por el JSON → 88vh y 0 · 1,5 % · 1,5 % · 1,5 %                      |
| Vidrio dentro en tablet                   | Corrección de accesibilidad **acordada** → se queda, documentada                              |

**Decisión que no me corresponde:** las flechas del diseño no hacen nada.
Replicarlas «con precisión» deja dos controles inertes. Salidas: dibujarlas como
decoración (sin rol de botón ni foco), quitarlas, o que funcionen, lo que exige
un carrusel y más contenido.

---

## 8. Lo que necesito para seguir

1. **Las imágenes originales**, para cerrar §5.5.
2. **La decisión sobre las flechas** (§7).
3. **Si los niveles de encabezado se corrigen** como desviación de accesibilidad (§5.1).
4. Para producción, no para construir: licencias de imágenes, iconos y
   HelveticaNeue; autorización de los testimonios; cuenta de Mapbox del cliente;
   confirmar las direcciones y teléfonos de las sedes.
