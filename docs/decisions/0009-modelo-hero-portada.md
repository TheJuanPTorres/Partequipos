# ADR 0009 — El hero de la portada es un campo de la página, no una colección de slides

- **Fecha:** 2026-09-22
- **Estado:** aprobada por dirección técnica. **Sin implementar**: hoy existe
  solo como prototipo en la rama `proto/hero-andres`, con datos de prueba.

## Contexto

El primer bloque del diseño de Andrés es un hero «Potencia Hitachi» con un
título grande, una imagen de máquina, un bloque de texto en vidrio y **dos
flechas**. Las flechas sugieren un carrusel, así que había que decidir el modelo
antes de llevar el bloque a Payload: **campo de la portada** o **colección de
slides**.

## Lo que decidió la cuestión: no hay carrusel

Medido en su página (`https://partequipos.uxdesign.website/ux-9/`), dentro de la
tarjeta del hero:

| Qué se buscó                             | Resultado   |
| ---------------------------------------- | ----------- |
| Enlaces (`a`)                            | **0**       |
| Botones (`button`)                       | **0**       |
| Contenedores de slider (`.swiper`, …)    | **0**       |
| Nombre accesible en las flechas y el «+» | **ninguno** |

Las flechas y el «+» son `div` decorativos: no navegan a ninguna parte y no hay
nada que rotar. **El diseño no tiene carrusel, tiene el dibujo de uno.**

## Decisión

**Grupo `hero` en la colección `Paginas`, condicionado al slug `inicio`.**

Campos previstos: `titulo` (texto), `parrafo` (área de texto), `imagenFondo` y
`imagenFrontal` (relaciones a `Media`) y `enlace` (destino y nombre accesible).

La condición por slug es necesaria porque `Paginas` sirve además a las **9
páginas institucionales** (ruta comodín): sin condición, el grupo aparecería en
todas y sería un campo huérfano invitando a rellenarse.

## Alternativas descartadas

1. **Colección `HeroSlides`.** Modelaría una rotación que el diseño no tiene.
   Añade una colección al menú del panel, su grupo, su control de acceso y su
   guardarraíl de grupos (CLAUDE.md §10.25) para un contenido que hoy es **uno**.
2. **Global `Portada`.** Separaría el hero del resto del contenido de la portada,
   que ya vive en `Paginas` con slug `inicio`. Dos sitios para editar una misma
   página es peor para quien edita.

## Consecuencias

- El componente **ya está preparado**: recibe `slides`, `fondo` y `frontal` por
  props, así que sustituir los datos de prueba por una consulta no le cambia una
  línea (`src/components/hero/`).
- **Si algún día se quiere carrusel de verdad**, esta decisión no se tira: se
  añade la colección y la portada referencia N slides. Lo que no se hace es
  construirla por adelantado.
- **Las flechas del prototipo mueven tres slides de prueba.** Es deliberado: un
  `button` que no hace nada es un defecto de accesibilidad. Si el modelo final
  es de un solo hero, **las flechas se quitan**, no se dejan inertes.
- El favicon, el logo del sitio y las diferencias con el sistema de diseño
  (fuente, rojo, radio, vidrio) **no dependen de esto**: ver
  `docs/design-tokens.md` §11.
