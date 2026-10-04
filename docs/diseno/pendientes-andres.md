# Pendientes con Andrés (ux-9)

> Todo lo que tenemos pendiente con Andrés, en un solo sitio y escrito para el
> diseñador. Reúne lo que estaba repartido en `decisiones-home-ux9.md`,
> `decisiones-nosotros.md`, `analisis-home-ux9.md`, CLAUDE.md §10 y los informes
> de trabajo. Fecha: 2026-10-04.
>
> **Cada asunto aparece una sola vez.** Si algo encaja en dos grupos (por
> ejemplo, una desviación que además necesita su decisión), está en el grupo 1
> y el grupo 2 solo lo remite.

## Cómo leerlo

- **[BLOQUEA]**: sin respuesta, la web no se puede lanzar (o abrir a buscadores).
- **[No bloquea]**: el sitio funciona; es para validar o mejorar.
- «Escritorio», «tablet» y «móvil» son 1440, 1010 y 390 px de ancho, los tres
  tamaños en los que comparamos con su página publicada.
- **Lo único que bloquea el lanzamiento son las licencias (grupo 4.2).** Ninguna
  desviación ni decisión de diseño lo bloquea.

### Dónde están las capturas

Las capturas **no están en el repositorio** (es público y algunas llevan fotos
sin licencia). Las tiene dirección, para mandárselas:

| Abreviatura | Carpeta                                                         |
| ----------- | --------------------------------------------------------------- |
| **CA**      | `Desktop\partequipos-diseno\capturas-andres\`                   |
| **CI**      | `Desktop\partequipos-cierre\` (capturas de cierre de cada fase) |

La forma más rápida de revisar la home: **`CA\home-ux9v2\cmp\`**, con su página a
la izquierda y la nuestra a la derecha, del 2026-10-02. El nombre es
`<ancho>-<nº>.jpg`:

| Nº  | Sección   | Nº  | Sección    |
| --- | --------- | --- | ---------- |
| 00  | Hero      | 06  | Sección 8  |
| 01  | Sección 2 | 07  | Sección 9  |
| 02  | Sección 3 | 08  | Sección 10 |
| 03  | Sección 4 | 09  | Sección 11 |
| 04  | Sección 5 | 10  | Pie        |
| 05  | Sección 7 |     |            |

Para Nosotros: su página en `CA\nosotros\ux9\pagina-{390,1010,1440}.png` y la
nuestra en `CA\nosotros\nuestra-{390,1010,1440}.png`.

---

## 1. Desviaciones de su diseño ya aplicadas, para que las valide

Todas están en el sitio. **Ninguna bloquea.** Si alguna no le convence, se
revierte; donde volver atrás tenga un coste o un riesgo, se dice.

### 1.1 Hero

| #   | Qué cambia                                                                                                                                                                                                                                                                                                            | Por qué                                                                                                                                                                                | Antes (su diseño)                  | Después (el nuestro)                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| D15 | **Título siempre en el mismo sitio:** centrado en la tarjeta, algo por encima del centro, igual en todas las diapositivas. La máquina recortada se adapta al texto, en su propia caja, con 16 px de aire respecto al título, al vidrio y a los controles. En su diseño el título va pegado arriba, a 13 px del borde. | Lo pidió dirección: en un carrusel el texto no puede saltar de sitio. De paso, la tilde de «PRECISIÓN» deja de salirse de la tarjeta (ver 2.4).                                        | `CA\home-fase2\hero-ux9-*.png`     | `CI\capturas-titulo-fijo\cajas-*.png`                                                                             |
| D13 | **Carrusel en el hero.** Su hero no lo tiene. Usamos el de su sección 2 con fundido de 1,2 s, acercamiento lento de la foto, 7 s por diapositiva y una línea de progreso.                                                                                                                                             | Lo pidió dirección, para enseñar varias máquinas.                                                                                                                                      | `CA\home-fase2\hero-ux9-*.png`     | `CI\capturas-premium\premium-*.png`, `transicion-*.png`                                                           |
| D4  | **Las flechas funcionan.** En su diseño son solo dibujo. Con una sola diapositiva no salen.                                                                                                                                                                                                                           | Un control que no hace nada confunde.                                                                                                                                                  | igual que D13                      | igual que D13                                                                                                     |
| D2  | **Botón de pausa** con el aspecto de las flechas, y puntos que se pueden pulsar. Si el visitante tiene activado «reducir movimiento», no avanza solo.                                                                                                                                                                 | Norma de accesibilidad: todo lo que se mueve solo tiene que poder pararse.                                                                                                             | —                                  | `CI\capturas-premium\premium-1440-1.png`                                                                          |
| D14 | **Velo oscuro sobre la foto** (más intenso en la franja del texto) y **vidrio en negro al 28 %** en vez de blanco al 12 %.                                                                                                                                                                                            | Con los cielos claros de las fotos del cliente, el título blanco daba 1,0–1,4:1 de contraste (ilegible). Con el velo, 3,6–4,0:1 o más. Es la misma técnica que él usa en la sección 2. | `CA\home-fase2\hero-ux9-1440.png`  | `CA\home-slider\velo-*.png`; prueba de intensidades en `CA\home-capturas\velo-*-1440.png`                         |
| D3  | **En tablet el vidrio no se sale de la tarjeta.**                                                                                                                                                                                                                                                                     | Fuera de la tarjeta, el texto blanco caía sobre fondo blanco (1,05:1).                                                                                                                 | `CA\home-capturas\andres-1010.png` | `CA\home-capturas\tablet-dentro-900-d1.png`; lado a lado en `CA\home-entrega\3-vidrio-1010-andres-vs-nuestro.jpg` |
| —   | **Colores tomados de sus colores globales:** el rojo de las flechas, el texto del vidrio, la línea de progreso y los puntos. El negro del velo es su global «text» (#100F0F), porque el kit no tiene negro.                                                                                                           | Si cambia un global, cambia en todo el sitio.                                                                                                                                          | —                                  | —                                                                                                                 |
| —   | **Icono «+» de 10 px en vez de 12**, por la proporción de los iconos que usamos (Tabler, ver D6).                                                                                                                                                                                                                     | Sustituye a Flaticon mientras no haya licencia (4.2, L2).                                                                                                                              | —                                  | —                                                                                                                 |
| D1  | **El logo de la cabecera hace de título principal de la portada** para Google y los lectores de pantalla. No cambia nada visible.                                                                                                                                                                                     | Su página no tiene ningún título principal, y Google lo necesita.                                                                                                                      | —                                  | —                                                                                                                 |

### 1.2 Cabecera

| Qué cambia                                                                                                                                                                                               | Por qué                                                                                    | Capturas                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **Mismo comportamiento que su cabecera** (se esconde al bajar en escritorio, no fija en tablet y móvil), con dos diferencias: al encogerse no mueve la página, y con «reducir movimiento» no se esconde. | Su cabecera desplaza la página al encogerse; y su versión no respeta «reducir movimiento». | Suya: `CA\home-ux9v2\cmp\cab-ux-*.png` · nuestra: `cab-nu-*.png` · las dos: `cab-todo.png` |
| **Botón «Contáctanos» entre 1025 y ~1250 px:** se queda dentro de su columna, pegado a la derecha.                                                                                                       | En su diseño se sale de la columna, y a 1025 px hasta 5 px fuera de la página.             | —                                                                                          |
| **Menú móvil provisional** (abre, cierra con Escape y se puede usar con teclado). La pregunta de diseño está en 2.10.                                                                                    | En su página la hamburguesa no hace nada.                                                  | Suya: `CA\home-fase2\menu-ux9-390.png` · nuestra: `menu-preview-390.png`                   |
| **Logo:** su `Logo-1.png`, al mismo tamaño. En móvil mide 1 px menos de alto.                                                                                                                            | Solo para que lo sepa.                                                                     | —                                                                                          |

### 1.3 Secciones de la portada

| #        | Sección                  | Qué cambia                                                                                                                                                                | Por qué                                                                   | Capturas (suya · nuestra)                                                                                                                            |
| -------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| D7, D8   | 2                        | **Carrusel de marcas sin vuelta infinita;** si caben todas las tarjetas, sin flechas. Los puntos indican la posición pero no se pulsan.                                   | Con pocas marcas, el bucle repetía tarjetas a la vista.                   | `CA\home-faseD\ux9\ux9-s2-*.png` · `CA\home-faseD\local\local-s2-*.png`                                                                              |
| D9       | 2                        | Cada tarjeta de marca **enlaza a su marca.** No se ve.                                                                                                                    | Que la tarjeta lleve a algún sitio.                                       | —                                                                                                                                                    |
| D5       | 3                        | **En móvil, la tarjeta del equipo se apila:** imagen arriba, texto debajo.                                                                                                | En su diseño el texto se salía de la pantalla.                            | `CA\home-faseD\ux9\ux9-s3-390.png` · `CA\home-faseD\local\local-s3-390.png`                                                                          |
| D10      | 3                        | **En móvil siguen siendo pestañas** arriba, no acordeón.                                                                                                                  | Mismo patrón en todos los tamaños.                                        | igual que D5                                                                                                                                         |
| D12      | 3                        | **El botón «Ver todo» queda por encima de la máquina.**                                                                                                                   | En su diseño la imagen tapaba el botón y no se podía pulsar.              | igual que D5                                                                                                                                         |
| —        | 3                        | **«Ver producto» en blanco en las 6 tarjetas.**                                                                                                                           | En su diseño 4 de 6 lo llevan gris (#56545A) sobre rojo: 2,3:1, ilegible. | `CA\home-ux9v2\cmp\1440-02.jpg`                                                                                                                      |
| —        | 3                        | Pesos con **coma decimal** («8,4 t»), y «Ver producto» lleva a la categoría.                                                                                              | Convención de Colombia; la ficha individual aún no existe.                | —                                                                                                                                                    |
| D6       | 3, 5, 7, 8, 10, 11 y pie | **Iconos de Flaticon y Font Awesome cambiados por Tabler** (gratuitos y sin atribución).                                                                                  | Los de Flaticon exigen atribución visible o licencia de pago (4.2, L2).   | `CA\home-faseD\ux9\ux9-s3-1440.png` · `CA\home-faseD\local\local-s3-1440.png`; `CA\home-faseF\ux9-s5-1440.png` · `CA\home-faseE\nuestro-s5-1440.png` |
| D2       | 4, 7 y 10                | **Botón de pausa visible** en el carrusel de logos, en el vídeo y en el texto en movimiento. Con «reducir movimiento», todo quieto.                                       | Norma de accesibilidad (igual que en el hero).                            | S4: `CA\home-faseE\ux9-s4-*.png` · `nuestro-s4-*.png`; S7: `CA\home-faseF\ux9-s7-*.png` · `nuestro-1440-0.png`                                       |
| D18, D19 | 4 y 5                    | Cambios internos: el lector de pantalla lee los logos una sola vez; la escala de las tarjetas se hace sin la librería de animación. No se ve.                             | Accesibilidad y peso de la página.                                        | —                                                                                                                                                    |
| D17      | 5                        | **«Ver más» solo si la categoría tiene página;** sin foto, la tarjeta pinta solo el texto.                                                                                | En su diseño todos van a «#» (a ninguna parte).                           | `CA\home-faseF\ux9-s5-*.png` · `CA\home-faseE\nuestro-s5-*.png`; sin foto: `CA\home-faseE\sinfoto-*.png`                                             |
| D22      | 8                        | **Sin vídeo, en móvil la sección no se monta sobre la tarjeta oscura.**                                                                                                   | El título oscuro sobre la tarjeta oscura daba 1,0:1.                      | `CA\home-faseH\ux9-s8-390.png` · `CA\home-faseF\sinvideo-390.png`                                                                                    |
| D20, D21 | 7 y 11                   | Con teclado: la ventana del vídeo devuelve el foco al cerrarse, y el texto en movimiento no recibe foco. No se ve.                                                        | Accesibilidad.                                                            | —                                                                                                                                                    |
| D23      | 10                       | **Las tarjetas de testimonios son botones** («Ver el vídeo de EMT SAS»). Con ratón se ve igual.                                                                           | Accesibilidad.                                                            | —                                                                                                                                                    |
| D24      | 10                       | **En móvil, la transición dura 450 ms** en vez de 700.                                                                                                                    | Con 700 ms la página se desplazaba durante el cambio.                     | `CA\home-faseH\ux9b-s10-390.png` · `nuestro-s10-390.png`                                                                                             |
| —        | 10                       | El efecto al pasar el ratón se hace de otra forma, **sin mover la página.** Se ve igual.                                                                                  | Su versión desplazaba el contenido.                                       | `CA\home-ux9v2\cmp\*-08.jpg`                                                                                                                         |
| —        | Varias                   | **Títulos animados alineados como en su página publicada** (a la izquierda desde 768 px; en móvil, centrados salvo dos), no como dice el export. La pregunta está en 2.5. | Manda lo que se ve publicado.                                             | `CA\home-ux9v2\cmp\*.jpg`; probablemente antes y después del ajuste en `cmp\ant\` y `cmp\nu\` (mismo día, sin confirmar)                             |
| —        | 2, 4, 11                 | **Medidas de móvil igualadas a su página publicada:** caja de logos de 110 px, catálogo en 4 líneas, preguntas frecuentes y sección 2 centradas.                          | Ídem.                                                                     | `CA\home-ux9v2\cmp\390-01.jpg`, `390-03.jpg`, `390-06.jpg`, `390-09.jpg`                                                                             |

### 1.4 Sedes (sección 9)

| #         | Qué cambia                                                                                                                                                            | Por qué                                                  | Capturas (suya · nuestra)                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| G3        | **Sin token de Mapbox se ve la lista de sedes en rejilla.** Es lo que hay hoy en todos los entornos (ver grupo 5).                                                    | El globo necesita la cuenta de Mapbox del cliente.       | `CA\home-faseG\ux9-*.png` · `CA\home-faseG\nuestro-*.png`, `CA\home-verif\preview-sedes-*.png` |
| G2        | **El logo y la atribución de Mapbox se ven.**                                                                                                                         | Los exigen los términos de Mapbox; su diseño los oculta. | — (sin token no hay globo)                                                                     |
| G1, G4–G6 | Título «Nuestras sedes» solo para lectores de pantalla; fichas, vuelos del globo y pines usables con teclado; vuelos instantáneos con «reducir movimiento». No se ve. | Accesibilidad.                                           | —                                                                                              |

### 1.5 Pie

| #      | Qué cambia                                                                                                                                                      | Por qué                                                                                                                             | Capturas (suya · nuestra)                                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| P3     | **Franja legal abajo:** tratamiento de datos, páginas legales, dirección y teléfono. En móvil, el pie queda 83 px más alto.                                     | La exige la ley colombiana de datos personales (Ley 1581).                                                                          | `CA\home-ux9v2\pie-ux9-1440.png` · `CA\home-fase6\pie-legal-*.png`                                                        |
| —      | **El correo va en esa franja legal.**                                                                                                                           | Al quitar el bloque de contacto anterior, era su sitio natural. ¿Lo acepta? (2.11)                                                  | `CA\home-ux9v2\pie-ux9-1440.png` · `CA\home-fase6\pie-legal-1440.png`                                                     |
| P2     | **Redes con su nombre e icono reales** (Facebook, Instagram, YouTube).                                                                                          | Las de su diseño estaban cruzadas (errata, grupo 3).                                                                                | `CA\home-ux9v2\cmp\redes-zoom.png`                                                                                        |
| P4     | **Texto de la empresa en Inter**, no en HelveticaNeue.                                                                                                          | Falta la licencia web de HelveticaNeue (4.2, L1).                                                                                   | —                                                                                                                         |
| P6     | «Somos una empresa…» es un párrafo en negrita, no un título. No se ve.                                                                                          | Orden de títulos para Google.                                                                                                       | —                                                                                                                         |
| P1, P7 | **No se pintan** «Trabaja con nosotros», «Zona de clientes», «Financiación» ni el buscador (queda su hueco).                                                    | Faltan las direcciones (del cliente); el buscador está fuera de alcance.                                                            | —                                                                                                                         |
| —      | **Imagen decorativa del pie:** no provoca desplazamiento horizontal, y entre 1025 y 1279 px, si hay imagen, se dejan 170 px libres encima del pie en vez de 70. | Su versión genera 23 px de desplazamiento lateral a 1440 y 331 px a 390; y a 1025 px la imagen tapaba contenido en 9 de 21 páginas. | `CA\home-faseD\tapa\antes-nosotros-*.png` · `despues-nosotros-*.png`; `CA\home-ux9v2\pie-ux9-*.png` · `pie-nuestro-*.png` |

### 1.6 Página Nosotros

Comparativa general en `CA\nosotros\` (ver «Dónde están las capturas»).

| #      | Qué cambia                                                                                                                  | Por qué                                                              | Capturas (suya · nuestra)                                                                        |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| N1     | **Mapa animado sobre una imagen fija,** que es la que se ve con «reducir movimiento» o si la animación no carga.            | Su página anima siempre.                                             | `CA\nosotros\an-ux9-*.png` · `an-nuestra-*.png`; `verif-ux9-1440.png` · `verif-nuestra-1440.png` |
| N9     | **Botón de pausa del mapa**, solo mientras se mueve (la animación dura 6 s).                                                | Norma de accesibilidad.                                              | —                                                                                                |
| N10    | El mapa **se carga una pantalla antes de llegar**.                                                                          | Que no pese en la carga inicial.                                     | —                                                                                                |
| N2     | **En móvil el mapa no se sale de la pantalla.**                                                                             | En su página mide 455 px y provoca desplazamiento lateral.           | `CA\nosotros\an-ux9-390.png` · `an-nuestra-390.png`                                              |
| D2     | **Pausa en el vídeo, el texto en movimiento y la rotación de tarjetas;** con «reducir movimiento», todo quieto y sin vídeo. | Norma de accesibilidad.                                              | —                                                                                                |
| N6     | **Texto de las tarjetas en Inter 300.**                                                                                     | En su página va en Roboto, que no se carga en el sitio.              | —                                                                                                |
| N7     | **Sin la entrada con desenfoque** de las tarjetas.                                                                          | Rendimiento.                                                         | —                                                                                                |
| N8     | **La pausa de las tarjetas va a la derecha de «Ver todo».**                                                                 | Encima de la tarjeta plegada tapaba su zona de clic.                 | —                                                                                                |
| N3     | **Migas de pan solo para lectores de pantalla** (aparecen al llegar con el teclado).                                        | Su diseño no las pinta, pero Google las usa.                         | —                                                                                                |
| N4, N5 | El texto en movimiento no lleva ocho enlaces vacíos; la tarjeta plegada se abre con teclado. No se ve.                      | Accesibilidad.                                                       | —                                                                                                |
| D1     | Antetítulos y etiquetas como párrafo, no como título. No se ve.                                                             | Orden de títulos para Google.                                        | —                                                                                                |
| —      | **En móvil, el texto de la cabecera queda pegado al borde izquierdo**, como en su página (su relleno en móvil es 0).        | Replicado tal cual; solo para que lo sepa por si no era intencional. | `CA\nosotros\lado390.png`                                                                        |

---

## 2. Decisiones que necesitamos de él

Ninguna bloquea el lanzamiento, salvo donde se indica.

1. **Contraste del antetítulo rojo sobre gris** (secciones 3 y 5). El rojo
   #E5242D sobre #F0F0F0 da **3,98:1**, por debajo del 4,5:1 mínimo. Es lo único
   que baja la nota de accesibilidad (97 de 100). ¿Oscurecemos el rojo en ese
   uso, aclaramos el fondo o lo deja como está? **[No bloquea]**
2. **Otros contrastes de su diseño que no llegan al mínimo** y no hemos tocado:
   - teléfono rojo sobre #EBEBEB en la ficha del globo: 3,81:1;
   - texto blanco sobre el vídeo de la sección 7 con velo al 21 %: de 1,6 a
     5,6:1 según el fotograma;
   - título oscuro de la sección 8 sobre el final del vídeo, en móvil.

   **[No bloquea]**

3. **Validar el velo y el vidrio oscuro del hero (D14) y el título centrado
   (D15)**, del grupo 1.1. Son las dos desviaciones más visibles. **[No bloquea]**
4. **Tilde de «PRECISIÓN».** Con el título centrado (D15) ya queda dentro de la
   tarjeta. Si rechaza D15 y volvemos al título pegado arriba, vuelve a salirse a
   partir de 1025 px y habría que decidir si se baja el título o se acepta.
   **[No bloquea; solo si rechaza D15]**
5. **Alineación de los títulos animados.** El export dice «Centro» y «Derecha»,
   pero su página publicada los pinta a la izquierda (su widget no aplica el
   valor), en la home y en Nosotros. Hemos copiado lo publicado. ¿Qué quería él?
   Volver al export es un cambio pequeño. **[No bloquea]**
6. **Separador de miles en Nosotros.** Su página pinta «10,000+». En Colombia lo
   habitual es «10.000+». Hoy respetamos lo pintado; cambiarlo es inmediato.
   **[No bloquea]**
7. **«Cobertura nacional 100 %\*».** Ese dato no está en el export (el contador
   cae a su valor por defecto y la página pinta 100 %). ¿Es el dato real? ¿A qué
   remite el asterisco? **[No bloquea]**
8. **Calidad 60 en las fotos de fondo del hero.** Haría la portada algo más
   rápida en móvil (unos 0,1–0,3 s) a cambio de algo de nitidez. Necesitamos
   su visto bueno visual antes de aplicarla. **[No bloquea; opcional]**
9. **Cabecera no fija en móvil y tablet.** Copiamos su comportamiento, pero
   dirección quiere confirmar que es intencional. **[No bloquea]**
10. **Diseño del menú móvil.** El de ahora es provisional, porque en su página la
    hamburguesa no hace nada. **[No bloquea]**
11. **Correo en la franja legal del pie** (grupo 1.5). ¿Le parece bien ahí?
    **[No bloquea]**
12. **Composición del hero con máquina delantera.** Con la foto de prueba, la
    máquina recortada quedaba encima de la misma máquina del fondo y se veía
    recargado. Lo revisamos con él cuando llegue el material definitivo (4.1);
    hasta entonces no tocamos los encuadres. **[Bloquea solo el encuadre final
    del hero]**
13. **Espacios vacíos de la sección 3** (unos 190 px en móvil y la mitad derecha
    vacía en tablet). Son de su maqueta y los mantenemos; solo si él quiere
    cambiarlos. **[No bloquea; sin acción si no dice nada]**
14. **Piezas que el sistema de diseño todavía no tiene:**
    - **icono cuadrado para el favicon** (SVG, o PNG de 512 × 512): es lo primero
      que se ve en la pestaña del navegador, y el logo horizontal no sirve;
    - logo para fondos oscuros (SVG, o PNG transparente de al menos 520 × 102
      con letras claras);
    - límites de peso y medidas de las imágenes que se suban;
    - si el sitio tendrá modo oscuro;
    - catálogo de componentes para el resto de páginas.

    **[No bloquea]**

**Ya no hace falta preguntarle** (estaban en listas anteriores): las flechas
del hero (resuelto con D4), los títulos de la portada (D1), los originales del
kit (recibidos), las cuatro diferencias del «ajuste fino» (resueltas), la
pestaña «Aditamentos» de la sección 3 (ya se pinta), el contraste de los iconos
móviles sobre el hero (7,28:1, cumple) y el recorte de 1.570 kB (ya
recomprimido).

---

## 3. Erratas de su diseño que ya corregimos

Para que actualice su maqueta. **Ninguna bloquea.**

| Dónde                    | En su diseño                                                        | En el sitio                                         |
| ------------------------ | ------------------------------------------------------------------- | --------------------------------------------------- |
| Home, sección 8, botón   | «Ver Catálgo»                                                       | «Ver Catálogo»                                      |
| Home, sección 5, botón   | «Ver todas los repuestos»                                           | «Ver todos los repuestos»                           |
| Pie, texto de la empresa | «Ayudamos sectores…»                                                | «Ayudamos **a** sectores…»                          |
| Pie, redes sociales      | «Google Plus» con el icono de LinkedIn y «Tiktok» con el de YouTube | Facebook, Instagram y YouTube, cada una con el suyo |
| Nosotros, cabecera       | «Quienes somos»                                                     | «Quiénes somos»                                     |
| Nosotros, cifras         | «Respuestos disponibles»                                            | «Repuestos disponibles»                             |

Y tres detalles del kit, solo para que los sepa:

- En la sección 11 un elemento apunta a un color global que no existe; Elementor
  lo deja transparente y lo hemos dejado igual.
- En 6 elementos el color escrito a mano contradice su color global; hemos usado
  el global.
- Las tarjetas expandibles de la sección 2 están ocultas en los tres tamaños, así
  que no las hemos construido.

---

## 4. Material que necesitamos

### 4.1 Medidas del hero

Lo que el sitio usa hoy, para que prepare el material definitivo. **[Bloquea la
composición final del hero, no el lanzamiento]**

| Pieza                                    | Formato y medida                                                                                                                                                                                           | Notas                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tarjeta**                              | 86 % del alto de la pantalla (85 % en móvil). En la práctica, unos 717 px de alto en móvil y 774 en tablet y escritorio.                                                                                   | La foto cubre la tarjeta entera y se recorta según su **punto de interés**, que se marca en el panel.                                                                                                                                                 |
| **Fondo de escritorio**                  | Horizontal, **2560 px de ancho** (por ejemplo 2560 × 1708, 3:2), JPG de calidad alta. El sitio sirve como máximo 1920 px y lo convierte a AVIF o WebP.                                                     | Una foto vertical se ve mal: la de Dynapac (1916 × 2560) solo enseña el 42 % de su alto en escritorio.                                                                                                                                                |
| **Recorte vertical para móvil**          | **9:16, 1080 × 1920**, JPG. El sitio lo sirve a unos 828 px de ancho.                                                                                                                                      | No vale recortar el de escritorio: las máquinas de Hitachi, LiuGong y Yanmar quedan cortadas por los lados. Hace falta una composición pensada en vertical. (La ayuda del panel dice «1080 × 1620»; la medida buena es esta y la ayuda se corregirá.) |
| **Imagen delantera** (máquina recortada) | **PNG transparente**, proporción de referencia 1476 × 1057 (la de su `Hero-1.png`). Se pinta a unos 809 px de ancho en escritorio, 631 en tablet y 257 en móvil; mejor entregarla a unos 1600 px de ancho. | Desde D15 va en su propia caja, apoyada abajo, a la izquierda del vidrio y con 16 px de aire respecto al título y a los controles.                                                                                                                    |

### 4.2 Procedencia y licencia de cada pieza

Para cada imagen, vídeo, icono y fuente necesitamos **de dónde sale y con qué
licencia**. En las generadas por IA, además, **qué herramienta y si permite uso
comercial**.

**Hoy todo esto está en producción con un permiso temporal de demostración
(«excepción §10.38»), con la web cerrada a buscadores.** Para lanzar hay que
confirmar las licencias o retirar esas piezas.

| Código | Pieza                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Qué necesitamos                                                                                                          | Estado                                            |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| **L3** | **Fotos e imágenes de la home:** `Fondo.jpg` y `Hero-1.png` (ya retiradas de producción); `hitachi.jpg`, `345345.jpg`, `double-drum-rollers-homepage.jpg`; recortes de la sección 3 (`excavadora-amarilla-aislada-…`, `potentes-excavadoras-…`, `014_Cut01…`); textura `21134998_red_and_white_grunge…`; sección 5: `235553.jpg` y tres `hf_20260914_*` (IA); máquina de las preguntas frecuentes `P1415_6500-2_red_211111.png` (parece foto de prensa de un fabricante); imagen decorativa del pie `Partequipos3553.png`. | Procedencia y licencia de cada una.                                                                                      | **[BLOQUEA]**                                     |
| **L3** | **Vídeo de la sección 7** `hf_20260903_212148` (IA) y su póster `2151307778.jpg` (banco).                                                                                                                                                                                                                                                                                                                                                                                                                                  | Licencia. El vídeo ya lo hemos reexportado nosotros (8 bits, 3,7 MB); solo si quiere, que valide la calidad.             | **[BLOQUEA]**                                     |
| **L3** | **Nosotros:** `Hero.jpg`; vídeo `hf_20260903_205214…-1.mp4` (IA); fondo de la franja `hf_20260930_142515…jpg` (IA); `Dynapac-1-1.png`; tarjetas `double-drum-rollers-homepage.jpg`, `getty-images-_N1fVUqFGWI-unsplash.jpeg` (Unsplash/Getty) y `hf_20260914_202250…jpg` (IA).                                                                                                                                                                                                                                             | Procedencia y licencia de cada una.                                                                                      | **[BLOQUEA]**                                     |
| —      | **Mapa animado de Nosotros** (`mapa-sedes-2025-negro-rojo.json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Quién lo hizo y si podemos usarlo.                                                                                       | **[BLOQUEA]**                                     |
| —      | **Fotos de ciudad de las sedes** (7: `Bogota.jpg`, `Cali.jpeg`…).                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Procedencia y licencia. (Los datos de cada sede se confirman con el cliente.)                                            | **[BLOQUEA]**                                     |
| —      | **Logos de marca de la sección 2**, que en el kit son capturas de pantalla (`Captura-de-pantalla-…`, `2344.jpeg`).                                                                                                                                                                                                                                                                                                                                                                                                         | Los logos de verdad, en SVG o PNG transparente.                                                                          | **[BLOQUEA]**                                     |
| —      | **Logos de fabricantes de la sección 4:** Hitachi, CASE, Yanmar, Dynapac, Donaldson, Volvo, Caterpillar, Hyundai y Komatsu (y LiuGong en la sección 2).                                                                                                                                                                                                                                                                                                                                                                    | Que el cliente confirme que puede usarlos como distribuidor; de Andrés, de dónde salen los ficheros.                     | **[BLOQUEA]** (hoy, permiso temporal del cliente) |
| **L4** | **Fotos de los testimonios** (`Video-Testimonio.jpg`, `Testimono-24.jpg`, `345345.jpg`, `Case.jpg`): son personas reales.                                                                                                                                                                                                                                                                                                                                                                                                  | De dónde salen las fotos. (La autorización de cada persona la gestiona el cliente; 3 de los 4 textos son de relleno.)    | **[BLOQUEA]**                                     |
| —      | **Vídeos de YouTube** `lcIx96OBAWU` (sección 7), `hBeMsx5WEko` y `hV33sXph6sU` (testimonios).                                                                                                                                                                                                                                                                                                                                                                                                                              | De quién son los canales.                                                                                                | **[BLOQUEA]**                                     |
| **L1** | **Fuente HelveticaNeue** (texto del pie).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Licencia web a nombre del cliente, o aceptar Inter.                                                                      | [No bloquea] — el sitio sale con Inter            |
| **L2** | **Iconos de Flaticon** (`engine_11747032`, `debt_14644382`, `meter-bolt_12400707`…).                                                                                                                                                                                                                                                                                                                                                                                                                                       | Decidir: atribución visible, licencia de pago o quedarse con los de Tabler. Si nos da los suyos licenciados, se cambian. | [No bloquea] — hoy van los de Tabler              |
| —      | `Logo-1.png` e isotipo `Icon.png`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Nada: son del cliente.                                                                                                   | Resuelto                                          |

---

## 5. El token de Mapbox de su export

**[No bloquea el lanzamiento; sin token, la sección de sedes se ve como lista]**

- **Dónde está:** en su export de la home (`elementor-2516-2026-09-23.json` y
  `wordpress\elementor-2516-2026-10-02.json`, en `Desktop\partequipos-diseno\`,
  y en `home-page.zip` → `content/page/1717.json`), dentro del widget HTML del
  globo (`initInteractiveGlobeMapbox()`, como `mapboxToken`).
- **Qué es:** un token **público** de Mapbox (empieza por `pk.eyJ1I`), de **su
  cuenta personal** (`andres199207`). Usa el estilo `light-v11` con el globo.
  **No está en el repositorio ni lo vamos a poner**: en el código ese hueco lleva
  un marcador.
- **Recomendación para Andrés:** que **restrinja ese token a sus dominios o lo
  cambie**. Está publicado en su página y, sin restricción, cualquiera puede
  gastar su cuota.
- **Lo que necesitamos para activar el globo** (no es de Andrés, es del
  cliente; código L5): una **cuenta de Mapbox del cliente**, con el token
  restringido a los dominios del sitio y sus condiciones de uso aceptadas. Con
  ese token, dirección lo carga en Vercel y verificamos el globo contra su
  diseño en los tres tamaños. **El globo no se ha podido probar todavía.**
