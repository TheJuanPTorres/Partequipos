# Home V2 — sección «Repuestos» (2026-10-16)

> **CORREGIDO el 2026-10-16 (dirección, agente C): son DOS TARJETAS APILADAS.**
> El #182 pintó una fila de categorías y una tarjeta grande. La sección 6 de la
> Home V2 es un widget `ucaddon_stacking_cards` con 2 elementos: al bajar, la
> segunda tarjeta sube y tapa a la primera. Cada tarjeta lleva **5 categorías
> técnicas**: las 10 de la página de categorías de WordPress. Lo de abajo, a
> partir de «Qué cambia respecto a ux-9», es la versión del #182 y queda como
> registro.

## Tarjetas apiladas (2026-10-16)

**Medido en la referencia pintada** (`partequipos.uxdesign.website`) a 390, 1010
y 1440:

- Las dos tarjetas miden 400 px, con radio 20 y sombra `0 10px 40px rgb(0 0 0 / 0.3)`.
- Se fijan a 150, 60 y 40 px del borde, y cada una queda 20 px más abajo que la anterior.
- La tapada encoge a 0,97 y se agrisa un 30 %. Son los valores por defecto del
  widget, los mismos que tenía la home antes de la V2: vuelve `TarjetasApiladas`.
- La primera queda a unos 40 px del título. Entre las dos hay 120 px de
  recorrido, y otros 120 hasta el botón.

**Aquí:**

| Pieza                     | Valor                                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Tarjetas                  | 2 de 5 categorías (`enTarjetas`, `src/lib/portada/seccionesE.ts`), en el orden de la portada                                       |
| Tarjeta                   | 400 px, 1200 de ancho (todo el ancho hasta 1220), radio 20, la sombra de la referencia                                             |
| Categoría                 | Foto cuadrada de 160 px (140 a 1010), título Inter negrita 20 px y «Ver todo» abajo                                                |
| Fijadas                   | 150 · 60 · 40 px, escalón de 20; **sin recorrido entre tarjetas** (antes 120 y 80): quedan a 40 px                                 |
| Tapada                    | Escala 0,97 y 30 % de gris, ligadas al scroll                                                                                      |
| «Ver todos los repuestos» | **40 px bajo las tarjetas** (en la referencia, 120: dirección lo quiere mucho más cerca); **70 px** de relleno debajo, como arriba |

**Las 10 categorías**, en el orden de la plantilla 40343 de WordPress (la de su
página de categorías):

1. Tren de rodaje
2. Filtración
3. Baldes y herramienta de corte
4. Lubricantes
5. Llantas y rines
6. Misceláneos
7. Componentes mayores
8. Motor diésel
9. Transmisión
10. Componentes hidráulicos

Cada una lleva su foto y su enlace a la página de categoría.

- **Fuente:** `scripts/contenido-real/extraer-xml.py`, que pasa de 4 a 10 categorías.
- **Fotos:** 5 nuevas. La de tren de rodaje es la misma de la tarjeta de
  repuestos de Nosotros, así que no se sube dos veces.
- **Títulos:** en minúscula salvo la primera letra, como «Llantas y rines».
  - En WordPress, «Tren de Rodaje», «Componentes Mayores» y «Repuestos para Motor Diesel».
  - «Componentes hidráulicos» va completo: la plantilla lo parte en dos encabezados.

**Importador:** guarda en el manifiesto el valor de antes de las categorías que
una pasada anterior no tocaba, así la retirada también devuelve las 6 nuevas.
**En el preview, importado el 2026-10-16:**

- 5 subidas y 10 categorías;
- 6 categorías nuevas en el manifiesto;
- la segunda simulación da 0 subidas.

**Producción:** lo hace dirección con una segunda pasada del runbook de
contenido real.

**Lo que se aparta del diseño:**

- `<h2>` en la sección y `<h3>` por categoría (la referencia usa `<h2>` en todas).
- «Ver todo» solo si la categoría tiene enlace, y descrito con `aria-describedby`.
- **Móvil:** cada categoría en una fila, con la foto de 72 px a la izquierda, y
  la tarjeta mide lo que su contenido, unos 515 px.
  - En la referencia van una por fila a todo el ancho y desbordan la tarjeta de 400 px.
  - Así la tarjeta fijada cabe entera en la pantalla.
- **«Reducir movimiento»:** sin barrido ni escala; una tarjeta tras otra, sin
  `sticky`, con 20 px entre ellas.
- **Teclado:** el foco dentro de una tarjeta tapada la sube por encima de la
  que la tapa (`:focus-within`), para que el enlace enfocado se vea (WCAG 2.4.11).
- Sin la tarjeta grande «Blades y corte» del #182: dirección pide 5 categorías
  en cada tarjeta.

### Ajuste de dirección (2026-10-17)

- **Hueco entre las tarjetas:** antes de que la segunda subiera se veía un hueco de 160 px a 1440 (120 a 390), el recorrido de la referencia más los escalones. Ahora es 0 y la segunda queda a 40 px de la primera, los dos escalones de 20. El barrido es el mismo: la primera se fija y la segunda sube y la tapa. «Reducir movimiento» (20 px, sin fijar) y el teclado no cambian.
- **Botón y «Nuestra Compañía»:** el relleno de abajo de la sección pasa de 30 a 70 px, el mismo que arriba. «Nuestra Compañía» no lleva relleno superior, así que es toda la separación.

## Versión del #182 (sustituida)

Fuente: export `elementor-3519-2026-10-15` (sección 6 del orden de la Home V2).

### Qué cambia respecto a ux-9

- **Antes:** tarjetas apiladas (una por categoría técnica, a pantalla de 600 px, con apilado por scroll).
- **Ahora:** una tarjeta blanca de 1200 px (radio 20, sombra `0 10px 40px`) con la **fila de las categorías técnicas** (4 · 4 · 1 por fila a 1440 · 1010 · 390; cada una al 24 %, radio 30, relleno 30, foto de hasta 225 px, título Inter negrita 20/20/18 px y botón rojo «Ver todo») y, debajo, la **tarjeta grande** de la primera categoría (alto 400, 60 % texto con icono, título, descripción y «Ver más»; 40 % foto; en móvil la foto va debajo, de 120 px).
- Sin JavaScript de cliente: se retira `TarjetasApiladas` (el apilado ya no existe).
- Al pasar el ratón, la tarjeta de la fila pasa de blanco a `#fafafa` (medido).
- En móvil la tarjeta que envuelve la fila desaparece: en la referencia las cuatro tarjetas se salen de ella (el contenido desborda los 400 px); aquí se apilan sobre el fondo gris.

### Contenido real (decisión de dirección)

- Las categorías salen de `categorias-tecnicas` con posición en la portada, con sus fotos reales de WordPress: Baldes y herramienta de corte, Llantas y rines, Lubricantes y Filtración. La referencia lleva cuatro de maqueta (Tren de Rodaje, Filtración, «Baldes y…», Lubricantes).
- La tarjeta grande es la primera categoría de la portada, «Herramienta de corte (GETS)», con su descripción y su foto del panel. Sin descripción no se pinta.
- El texto del enlace de las tarjetas pasa a «Ver todo» (`seccionRepuestos.verMasTexto`, dato del panel; lo pone el importador de contenido real, que guarda el valor anterior para la retirada).

## Erratas de la referencia, para Andrés

1. **«Blades y corte»** debería decir **«Baldes y corte»**: «Blades» es inglés.
2. **«Baldes y...»** sale **cortado** en la tarjeta de la fila (título con puntos suspensivos).
3. El botón final dice «Ver todas los repuestos»: ya se corrigió antes a «Ver todos los repuestos» (D16 de ux-9).
4. La tarjeta de la fila desborda su contenedor de 400 px en móvil.

### Desviaciones

- `<h3>` por tarjeta bajo el `<h2>` de la sección (la referencia usa `<h2>`).
- Fotos decorativas (`alt` vacío); el título nombra la tarjeta; «Ver todo» la describe con `aria-describedby`.
- «Ver todo» solo si la categoría tiene enlace (la referencia enlaza «#»).
