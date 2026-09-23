# ADR 0009 — El hero de la portada: diapositivas dentro de la página, no colección aparte

- **Fecha:** 2026-09-22 · **revisada el 2026-09-23**
- **Estado:** aprobada por dirección técnica. **Sin implementar**: hoy existe
  solo como prototipo en la rama `proto/hero-andres`, con datos de prueba.

## Revisión del 2026-09-23 — N diapositivas

La primera versión modelaba **un** hero, porque el diseño no tiene carrusel
(abajo). Dirección decidió que **las flechas funcionen**: el carrusel admite
**N diapositivas desde Payload**, y **con una sola las flechas no se muestran**.
Es la desviación D4 de `docs/diseno/decisiones-home-ux9.md`.

Lo que cambia es la forma del grupo, no el sitio donde vive: sigue en `Paginas`,
condicionado a `inicio`, y **sigue sin ser una colección aparte**.

## Contexto

El primer bloque del diseño de Andrés es un hero «Potencia Hitachi» con un
título grande, una imagen de máquina, un bloque de texto en vidrio y **dos
flechas**. Había que decidir el modelo antes de llevarlo a Payload.

Medido en su página (`https://partequipos.uxdesign.website/ux-9/`), dentro de la
tarjeta del hero: **0** enlaces, **0** botones, **0** contenedores de slider y
**ningún** nombre accesible en las flechas ni en el «+». Las flechas son `div`
decorativos: **el diseño no tiene carrusel, tiene el dibujo de uno.** Replicarlo
tal cual serían dos controles inertes; de ahí la revisión.

## Decisión

**Grupo `hero` en la colección `Paginas`, condicionado al slug `inicio`, con un
array `diapositivas`.**

| Campo de cada diapositiva | Tipo                             | Notas                                                       |
| ------------------------- | -------------------------------- | ----------------------------------------------------------- |
| `titulo`                  | texto, obligatorio               | Va en `<h2>`: el `<h1>` de la portada es el logo (D1)       |
| `parrafo`                 | área de texto                    | El del vidrio. Oculto en móvil, como en el diseño           |
| `imagenFondo`             | relación a `Media`, obligatoria  | Decorativa (`alt` vacío): el título ya dice qué es          |
| `imagenFrontal`           | relación a `Media`, **opcional** | La máquina recortada. El hueco mide lo mismo con o sin ella |
| `enlace`                  | destino y nombre accesible       | El «+» del vidrio                                           |

**`minRows: 1`.** Sin `maxRows` fijado en el esquema; si el rendimiento lo pide
(cada diapositiva añade su foto al HTML inicial, aunque solo la primera se
precarga), se fija entonces con la medida delante.

La condición por slug es necesaria porque `Paginas` sirve además a las **9
páginas institucionales** (ruta comodín): sin condición, el grupo aparecería en
todas y sería un campo huérfano invitando a rellenarse.

## Alternativas descartadas

1. **Colección `HeroSlides`.** Incluso con N diapositivas, lo que se edita es
   **la portada**: separar sus diapositivas en otra colección obliga a ir a dos
   sitios del panel, añade un grupo, un control de acceso y su guardarraíl
   (§10.25), y una diapositiva suelta no tiene sentido fuera de la portada.
   Un array conserva el **orden** sin campo extra, que en una colección habría
   que modelar a mano.
2. **Global `Portada`.** Separaría el hero del resto del contenido de la portada,
   que ya vive en `Paginas` con slug `inicio`.

## Consecuencias

- El componente **ya está preparado**: recibe `slides` con `fondo` y `frontal`
  opcional por props, y **con una sola diapositiva no pinta las flechas ni
  responde al teclado**, conservando el alto de la fila para que la tarjeta no
  cambie (prototipo `bcb4890`). Sustituir los datos de prueba por una consulta
  no le cambia la lógica.
- **Sin autoavance.** El carrusel solo se mueve cuando el usuario pulsa: así no
  necesita botón de pausa (D2) ni roba el foco de lectura.
- **Si una diapositiva tiene un título más largo** que «POTENCIA HITACHI», el
  componente lo encoge para que quepa en una línea (el diseño solo contemplaba
  uno corto). Uno que cabe conserva los 120 px exactos del diseño.
- El favicon, el logo del sitio y las diferencias con el sistema de diseño
  (fuente, rojo, radio, vidrio) **no dependen de esto**: ver
  `docs/design-tokens.md` §11.
