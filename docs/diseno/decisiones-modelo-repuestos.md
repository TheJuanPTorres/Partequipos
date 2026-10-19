# Página de modelo de repuestos — diseño propio (2026-10-19)

> **APAGADO en el sitio publicado (dirección, 2026-10-19): solo se publican diseños de Andrés.** El global «Páginas de
> marca de repuestos» tiene el interruptor **«Diseño de las páginas de modelo»** (disenoModelo), por defecto
> **«Provisional»**: una página sencilla con el mismo contenido de WordPress (modelo/ModeloProvisional.tsx: migas
> visibles, antetítulo, título de WordPress como <h1>, marca, tipo y código, el párrafo completo, las fotos, «repuestos
> disponibles para…» con la lista de piezas donde WordPress la pinta y los enlaces a sus categorías, la tarjeta de ayuda
> en sencillo y el formulario con «Ciudad»). El diseño propio de abajo sigue en el código y se enciende con «Diseño
> propio»; queda como referencia hasta que llegue la plantilla de Andrés. Migración
> 20261019_181113_diseno_modelo_repuestos (solo esquema, DEFAULT 'provisional').

**Diseño nuestro, sin plantilla de Andrés**, aprobado por dirección el 2026-10-19 tras tres rondas de muestra en el
laboratorio del preview (EX100, ZX200 y 580SN, a 1440 y 390). Sirve a las ~350 páginas de modelo, con el contenido de
WordPress tal cual (decisión del cliente; datos en `docs/repuestos-importacion.md` §13). **Para Andrés:** si hace su
plantilla, esta es la referencia de qué lleva la página.

Componente: `src/components/repuestos/PaginaModeloRepuesto.tsx` (las dos rutas del modelo, también la del tipo
anidado). Lógica pura con pruebas: `src/lib/repuestos/modelo.ts`.

## De arriba abajo

1. **Cabecera** (`HeroMarca` con `bajo` y `tituloLargo`): la foto del tipo de máquina (sin ella, la de la marca) con
   velo, el **logo de la marca** en su placa (en todas las páginas, decisión de dirección), el antetítulo y el **título
   de WordPress como `<h1>`** (WordPress no tenía `<h1>`; decisión de dirección). Migas solo para lectores de pantalla,
   como en marca y tipo.
2. **Presentación en pantalla partida** (`PresentacionModelo`), sobre la franja del color de la marca:
   - la foto del modelo a sangre en el 58 % izquierdo, cortada por una **diagonal limpia y nítida** (máscara SVG de un
     polígono, en el CSS: sin descargas ni desenfoque), del 45 % de la tarjeta arriba al 56 % abajo;
   - el párrafo de WordPress a la derecha, siempre sobre blanco (contraste medido 19:1), con los botones de la ficha V2:
     «Solicitar repuestos» (baja al formulario) y «Habla con un experto» (WhatsApp);
   - en tablet y móvil, la foto arriba cortada por la misma diagonal en horizontal y el texto debajo;
   - **sin foto del modelo:** un panel oscuro con un brillo del color de la marca y su logo en blanco, en grande.
3. **«repuestos disponibles para …»** (`CategoriasMarca` con `todasEnMovil`), en la misma franja: la lista de piezas
   solo donde WordPress la pinta y las categorías del tipo, en su orden y con su enlace. En móvil, todas, dos por fila
   (la página de marca, como ux-9, solo enseña dos).
4. **«ESTAMOS AQUÍ PARA AYUDARLO · Escríbenos · Whatsapp»** (`AyudaWhatsApp`): la foto propia de WordPress (la misma en
   todas, elegida en el panel) con velo y el botón a WhatsApp.
5. **Formulario** (`ContactoMarca` con `modelo`): solicitud de repuesto con el modelo preseleccionado; campos nombre,
   teléfono, correo, **ciudad** y «¿En qué estás interesado?» (el mensaje). Sin n.º de documento (Ley 1581,
   minimización; lo decide el cliente). El pie no pinta la tarjeta roja.

## Desviaciones de WordPress

| WordPress                                       | Aquí                                              | Motivo                                  |
| ----------------------------------------------- | ------------------------------------------------- | --------------------------------------- |
| Sin `<h1>` (h5 + h2)                            | El título como `<h1>`                             | SEO (§3.4), decisión de dirección       |
| Foto junto al texto, en dos versiones           | Pantalla partida con diagonal; una sola versión   | Diseño aprobado                         |
| Categorías como tarjetas con foto y «VER TODOS» | Píldoras con icono y enlace (las de marca y tipo) | El lenguaje de las páginas de repuestos |
| Logo de la marca oculto (salvo 23 páginas)      | Logo en todas, en la cabecera                     | Decisión de dirección                   |
| Botón de WhatsApp verde claro con texto blanco  | Verde oscuro (`#13733a`), 5,9:1                   | Contraste AA                            |
| N.º de documento en el formulario               | No se pide                                        | Ley 1581; pendiente del cliente         |

## Medido (muestra, preview, 1440 y 390)

Un solo `<h1>`; párrafo a 19:1 como mínimo sobre lo que tiene detrás; CLS ≤ 0,0054 a 1440 y 0 a 390; sin desbordamiento
ni errores de consola. Rondas del diseño: caja de foto → borde orgánico difuminado → borde granular → diagonal limpia
(informe `2026-10-19-modelo-repuestos-muestra.md`).
