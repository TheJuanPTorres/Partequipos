# Home V2 — sección «Repuestos» (2026-10-16)

Fuente: export `elementor-3519-2026-10-15` (sección 6 del orden de la Home V2:
título, widget «Stacking Cards» y botón) y la referencia pintada
`partequipos.uxdesign.website`, medida a 390, 1010 y 1440. **Lo pintado manda**
(§9): la plantilla 3474 del widget es la que trae la fila de categorías.

## Qué cambia respecto a ux-9

- **Antes:** tarjetas apiladas (una por categoría técnica, a pantalla de 600 px, con apilado por scroll).
- **Ahora:** una tarjeta blanca de 1200 px (radio 20, sombra `0 10px 40px`) con la **fila de las categorías técnicas** (4 · 4 · 1 por fila a 1440 · 1010 · 390; cada una al 24 %, radio 30, relleno 30, foto de hasta 225 px, título Inter negrita 20/20/18 px y botón rojo «Ver todo») y, debajo, la **tarjeta grande** de la primera categoría (alto 400, 60 % texto con icono, título, descripción y «Ver más»; 40 % foto; en móvil la foto va debajo, de 120 px).
- Sin JavaScript de cliente: se retira `TarjetasApiladas` (el apilado ya no existe).
- Al pasar el ratón, la tarjeta de la fila pasa de blanco a `#fafafa` (medido).
- En móvil la tarjeta que envuelve la fila desaparece: en la referencia las cuatro tarjetas se salen de ella (el contenido desborda los 400 px); aquí se apilan sobre el fondo gris.

## Contenido real (decisión de dirección)

- Las categorías salen de `categorias-tecnicas` con posición en la portada, con sus fotos reales de WordPress: Baldes y herramienta de corte, Llantas y rines, Lubricantes y Filtración. La referencia lleva cuatro de maqueta (Tren de Rodaje, Filtración, «Baldes y…», Lubricantes).
- La tarjeta grande es la primera categoría de la portada, «Herramienta de corte (GETS)», con su descripción y su foto del panel. Sin descripción no se pinta.
- El texto del enlace de las tarjetas pasa a «Ver todo» (`seccionRepuestos.verMasTexto`, dato del panel; lo pone el importador de contenido real, que guarda el valor anterior para la retirada).

## Erratas de la referencia, para Andrés

1. **«Blades y corte»** debería decir **«Baldes y corte»**: «Blades» es inglés.
2. **«Baldes y...»** sale **cortado** en la tarjeta de la fila (título con puntos suspensivos).
3. El botón final dice «Ver todas los repuestos»: ya se corrigió antes a «Ver todos los repuestos» (D16 de ux-9).
4. La tarjeta de la fila desborda su contenedor de 400 px en móvil.

## Desviaciones

- `<h3>` por tarjeta bajo el `<h2>` de la sección (la referencia usa `<h2>`).
- Fotos decorativas (`alt` vacío); el título nombra la tarjeta; «Ver todo» la describe con `aria-describedby`.
- «Ver todo» solo si la categoría tiene enlace (la referencia enlaza «#»).
