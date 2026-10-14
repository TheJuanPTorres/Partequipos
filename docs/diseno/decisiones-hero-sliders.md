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

## 2. Maquetación

- **El título va ARRIBA.** Antes iba centrado (D15). Sigue en el mismo sitio en todas las diapositivas, que era el objetivo de D15: en un carrusel el texto no salta.
- **La máquina va debajo, en el mismo flujo.** Ocupa lo que queda hasta los controles, así un título de varias líneas no se le monta encima.
- **Con «sobre»**, en escritorio sube y cruza el título, a 38 px bajo su borde de arriba, medido a 1440.
- **El vidrio se ve también en móvil**, como en el diseño; el de ux-9 lo ocultaba. Va encima de la fila de controles, para no taparlos.
- **Vidrio ancho:** con un párrafo largo (más de 130 letras), el vidrio de escritorio mide 500 px en vez de 400, como la diapositiva 2. Es uno para todas las diapositivas: así no cambia de tamaño al pasar.

## 3. Desviaciones (para Andrés)

| #   | Diseño                                                                              | Aquí                                                 | Por qué                                                              |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| S1  | El título de la diapositiva 2 empieza más arriba que el de la 1                     | Las dos a la misma altura (la de la 1)               | D15: el texto no salta entre diapositivas                            |
| S2  | El «+» no enlaza a nada                                                             | Enlaza a la página de la marca, con nombre accesible | Un control que no hace nada confunde. Sin enlace, el «+» no se pinta |
| S3  | En la diapositiva 2, «EXPERIENCIA.» queda por encima del vidrio                     | Igual                                                | Se respeta. Se comprobó pintado que se lee                           |
| S4  | En tablet, la máquina de la diapositiva 2 se monta sobre el título de cuatro líneas | La máquina va debajo y algo más pequeña              | El título no se tapa                                                 |
| S5  | Velos distintos por diapositiva (gris en multiplicar / degradado negro)             | El velo de siempre (D14)                             | Contraste medido del título blanco con las fotos del cliente         |
| S6  | Los títulos en mayúsculas en el HTML                                                | Mayúsculas solo por CSS                              | El lector de pantalla no deletrea                                    |

## 4. Imágenes

Las cuatro (dos fondos y dos máquinas recortadas) son del diseño de Andrés:

- **Licencia para el sitio publicado: sin confirmar.** Están solo en el preview (`npm run preview:hero-sliders -- sembrar`).
- **Retirada:** `npm run preview:hero-sliders -- retirar` las quita y devuelve el hero de antes.

## 5. Medidas

_(Se completan al pintar contra la referencia.)_
