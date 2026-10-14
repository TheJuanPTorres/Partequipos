# Cabecera y megamenú: siempre fija, vidrio esmerilado y esquinas invertidas

Agente D, 2026-10-14. Petición de Andrés. Código: `src/components/layout/` (`Cabecera.tsx`, `Megamenu.tsx`,
`cabecera.module.css`, `megamenu.module.css`), `src/lib/cabecera/modo.ts` (con pruebas) y `scroll-padding-top` en
`globals.css`. **No se toca el hero** (es del agente A).

## 1. La cabecera NO se oculta: siempre visible y fija arriba

- **Antes:** a ≥ 1025 px se escondía al bajar (con el scroll anterior > 500 px) y reaparecía al subir o con el foco; por
  debajo de 1025 px no era fija (se iba con la página, medido en ux-9 y confirmado entonces como intencional).
- **Ahora:** `position: sticky` en **todos los anchos**. Se quitan el estado y el atributo `data-oculta`, el efecto
  del scroll y la regla `translateY(-110vh)`. `sticky` conserva su caja en el flujo: **sin CLS** (medido 0,0000 a
  1010 y ≤ 0,0007 a 1440 durante todo un recorrido).
- Tablet y móvil: misma barra, con el velo de vidrio al bajar en la portada y **sin encogerse**; el menú móvil
  abierto se desplaza por dentro (`max-height: calc(100dvh - 72px)`) para no salirse de la pantalla.
- **Anclajes:** `html { scroll-padding-top }` reserva el alto de la barra (72 px en tablet y móvil, 76 en escritorio,
  donde al bajar se encoge a 70): un `#ancla` o un foco no quedan debajo de ella. Medido: la sección ancla queda a 76
  y 72 px del borde, por debajo de la barra (70 y 71).
- **Guardarraíl** (`modo.test.ts`, en CI): falla si reaparece `data-oculta`, `setOculta`/`esconder`,
  `translateY(-110vh)`, o si la cabecera vuelve a `position: relative`.

## 2. Vidrio esmerilado en los paneles de los submenús

- `backdrop-filter: blur(20px) saturate(1.8)`: **el mismo que la barra**. Con `-webkit-` primero (CLAUDE.md §10.35).
- **La transparencia NO es la misma (desviación):** la barra usa blanco al 27 %. Con un velo tan ligero el texto no llega a
  AA sobre una foto oscura. Medido en el peor caso (fondo negro): con el 72 %, el gris `#56545a` da 3,77:1 y el rojo
  2,29:1. El panel es **blanco al 86 %**: texto 13,8:1, gris 5,39:1 (AA) y, sobre blanco, todo mejor.
- **Rojo de los textos del panel: `#be1620`** (los iconos conservan el rojo de marca). Con el rojo de marca `#e5242d`
  el peor caso daría 3,28:1; con `#be1620`, 4,56:1 (AA) sobre fondo negro y 6,32:1 sobre blanco.
- **Fondo de respaldo opaco** (blanco al 98 %, sin desenfoque) si el navegador no soporta `backdrop-filter`, y también con
  `prefers-reduced-transparency: reduce` (comprobado: esta máquina de pruebas lo tiene activo y el panel cae al respaldo).
- **Con un megamenú abierto en la portada, la barra toma el mismo vidrio (86 %)** en vez de quedar transparente o al
  27 %: así barra y panel se leen como una sola pieza. Es una decisión mía, no de la petición.
- El fundido de apertura va en las **capas y el contenido**, no en el panel: un ancestro con `opacity < 1` es «raíz de
  fondo» y el `backdrop-filter` de sus hijos perdería el desenfoque durante los 550 ms.
- Con `prefers-reduced-motion`: sin transiciones ni desplazamiento (el panel solo se centra), comprobado.

## 3. Esquinas superiores invertidas

Donde el panel se une a la cabecera, en vez de un ángulo de 90°, una curva **cóncava** de 20 px que se abre hacia fuera,
como las pestañas de Chrome al unirse a su barra.

- El panel mide `500 + 2 × 20` px: la caja de contenido va en el centro, entre las dos pestañas. Las esquinas de abajo
  siguen siendo convexas de 30 px.
- **Forma por máscara de gradientes** (sin JavaScript ni medidas: vale con cualquier alto y ancho): columna central,
  franja de abajo, dos cuartos de círculo convexos y las dos curvas cóncavas (lo de fuera del círculo de centro
  `(0, R)` y radio `R`, y su espejo). Tres capas con LA MISMA forma, salvo el grosor del filete:
  - `::before` **filete** de 1 px = forma exterior − forma interior (`mask-composite: subtract` / `add`);
  - `::after` **vidrio** = forma interior, con el `backdrop-filter`;
  - `.caja` = el contenido, encima y sin fondo.
    Así el vidrio y el borde siguen **exactamente** esa forma, sin cortes. Arriba no hay filete: ahí se une a la barra.
- El panel empieza **1 px por debajo del final de la barra, medido** (`ResizeObserver` sobre la cabecera; 70 px si está
  encogida): sin costura. Comprobado: 99 px el panel y 100 la barra a 1440.
- Sin soporte de máscaras (`@supports`), la caja blanca de siempre con sus esquinas de abajo.

## 4. Verificación (preview, 1440 y 1010, 36 comprobaciones, todas correctas)

Teclado completo intacto: Intro abre el panel y el foco pasa a su primer enlace; Escape cierra y devuelve el foco al
botón; Mayús+Tab desde el primer enlace cierra y vuelve al botón; el menú móvil abre con Intro y Escape lo cierra. Las
capturas a 1440 (portada y página interior) y a doble y triple densidad de las esquinas muestran las curvas, el filete
y el desenfoque (el brazo naranja de la foto se ve difuminado a través del panel).

## 5. Desviaciones para Andrés

| #   | Qué                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------- |
| D1  | La transparencia del vidrio del panel es del 86 %, no la de la barra (27 %): con la de la barra no hay AA sobre fotos oscuras.   |
| D2  | El rojo de los textos del panel es `#be1620` (el de marca da 3,28:1 sobre el peor fondo). Iconos y resto del sitio, sin cambio.  |
| D3  | En tablet y móvil la cabecera es ahora fija (antes se iba con la página, y se confirmó como intencional): lo pide esta petición. |
| D4  | Con un megamenú abierto en la portada, la barra toma el vidrio del panel (86 %).                                                 |
| D5  | Con transparencia reducida del sistema o sin `backdrop-filter`, el vidrio pasa a casi opaco (98 %) y sin desenfoque.             |
