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
4. **Erratas corregidas** (para Andrés, §7).
5. Contenido de ejemplo permitido; aplica la excepción §10.38.

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
(migas, JSON-LD, `<h1>` de reserva y bloques) y es lo que usará `[...slug]`.

## 4. Lo que se aparta de ux-9

| Id  | Qué                                                                                                                    | Por qué                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| D1  | Antetítulos y etiquetas en `<p>`; en ux-9 todos los revelados son `<h2>`/`div`                                         | Jerarquía de encabezados real                         |
| D2  | Botón de pausa en el vídeo, el marquee y la rotación de tarjetas; con movimiento reducido, parado y sin vídeo          | WCAG 2.2.2                                            |
| N1  | Mapa como imagen fija (último fotograma)                                                                               | Decisión 3                                            |
| N2  | El mapa no desborda a 390 (en ux-9 el SVG mide 455 px y la página tiene scroll horizontal: 477 px)                     | Sin scroll horizontal                                 |
| N3  | Migas visibles encima de la cabecera (ux-9 no las tiene)                                                               | Decisión 2; desplaza la página unos 30 px hacia abajo |
| N4  | Copias del marquee como texto con `aria-hidden` y el texto una vez para el lector; en ux-9, ocho enlaces a «#»         | No hay destino; el lector no repite ocho veces        |
| N5  | Tarjetas: la plegada es un `<button aria-expanded>`, la abierta su enlace; al abrir con teclado el foco pasa al enlace | Teclado                                               |
| N6  | Texto de las tarjetas en Inter 300; en ux-9, Roboto (no cargada en el sitio)                                           | Una sola fuente                                       |
| N7  | Sin la entrada con desenfoque de las tarjetas                                                                          | Movimiento de una vez, sin valor                      |
| N8  | Botón de pausa de las tarjetas a la derecha de «Ver todo», no encima de las tarjetas                                   | Sobre la tarjeta plegada tapaba su zona de clic       |

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

| Comprobación                     | Resultado                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| Cajas y tipografía frente a ux-9 | 0–3 px en 1440, 1010 y 390 (salvo N2 y N3)                                            |
| Geometría de las tarjetas        | Idéntica en los tres cortes                                                           |
| `<h1>` / `<main>`                | 1 / 1                                                                                 |
| Scroll horizontal                | No, en los tres                                                                       |
| Teclado                          | Orden lógico, anillo visible, Intro abre la tarjeta y el foco pasa a su enlace        |
| Movimiento reducido              | Sin vídeo, marquee quieto, rotación parada, revelados y cifras visibles               |
| CLS                              | 0,00002–0,00007 en `next dev`: la llegada de Inter mueve 5 px «somos» del `<h1>` (§8) |

## 6. Rutas de control (decisión 2)

`/garantias/` **no existe** (404, no está en `url-map.csv`). Se usa
`/politica-de-garantia-de-repuestos/`, que es la página de garantías con
anclas (`#GARANTIA`, `#Devoluciones`), junto a `/servicio-tecnico/`
(`#taller`, `#posventa`).

## 7. Para Andrés

- **Erratas corregidas:** «Quienes somos» → «Quiénes somos»; «Respuestos
  disponibles» → «Repuestos disponibles».
- La cifra de «Cobertura nacional» no está en el export; el contador cae al
  valor por defecto de Elementor y la página pintada dice **100 %**. Se usa
  100 %. ¿Es el dato real? ¿Y a qué remite su asterisco?
- Separador de miles «,» (10,000), el de Elementor. En Colombia es habitual
  «.»: ¿se cambia?
- A 390 px el texto de la cabecera queda pegado al borde izquierdo de la
  tarjeta (relleno 0 en móvil): se replica tal cual.
- Las tres tarjetas llevan el mismo texto, de Dynapac: contenido de ejemplo.
- Alineación «Centro» en los revelados del export: el widget no la aplica
  (espera `center`) y se pintan a la izquierda; se replica lo pintado.

## 8. Pendientes

- **CLS de la fuente en el `<h1>`:** medir en el build del preview. Si
  persiste, la palanca es la carga de Inter (`layout.tsx`, §10.36), que es
  global: se decide con dirección.
- Ventana de migración (decisión 1).
- Animación del mapa (Lottie), PR aparte.
- Borrar `/laboratorio/nosotros/` y su entrada en `RUTAS_FUERA_DEL_SITEMAP`
  antes de fusionar.
