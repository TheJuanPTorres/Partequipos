# Color de la marca (2026-10-18, petición del cliente)

La franja de color de las páginas de marca y de tipo de repuestos —y de las de tipo de
maquinaria nueva, que la reutilizan— era siempre el amarillo de Caterpillar. Ahora es el
**«Color de la marca»** (campo con selector, en `marcas` y `marcas-maquinaria`). Vacío:
el amarillo de siempre (`#f2bc2e`).

- **Texto y foco** sobre la franja: negro o blanco, el que más contraste da con ese color
  (`tintaSobre`, `src/lib/marca/colorMarca.ts`). Con cualquier color llega a 4,58:1 como
  mínimo (probado con un barrido del cubo RGB). El aspecto de una píldora al pasar el ratón
  es la tinta sobre el color, nunca el color sobre sí mismo.
- **Placa del logo** de la cabecera: clara (los logos ya son en color). Un logo blanco o muy
  claro con la casilla «Pintar el logo en oscuro» se pinta en una sola tinta oscura.
- **Datos:** la migración `20261019_042312_color_marca` siembra los colores de abajo (SQL
  explícito). El cliente los cambia desde el panel.

## Colores sembrados y su fuente

**Casi ningún fabricante publica un hex oficial.** Los valores son los mejores que se
encontraron y se marcan según su certeza:

| Marca                       | Color     | Certeza y fuente                                                                                                                                                   |
| --------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Caterpillar                 | `#ffcd00` | Blog de marca (brainbound.blog) y brandpalettes.com; el amarillo de la marca desde 1979. Otra fuente da `#ffc300`. **No es de Caterpillar directamente.**          |
| Hitachi (repuestos y nueva) | `#fc661c` | El naranja del grupo (logotyp.us, Hitachi Transport System). Es de otra empresa del grupo; el naranja de la maquinaria de construcción **no tiene hex publicado**. |
| CASE (repuestos y nueva)    | `#f2a900` | **ESTIMADO, sin fuente.** La maquinaria de construcción es ámbar/naranja dorado (Equipment World); no hay hex.                                                     |
| Komatsu                     | `#283d99` | Azul del logo (logotyp.us), tercero. Un `#140a9a` circula pero no se pudo confirmar.                                                                               |
| Hyundai                     | `#154fa3` | Azul del logo (whatthelogo.com), tercero.                                                                                                                          |
| LiuGong                     | `#0c4da2` | Logo (whatthelogo.com), tercero. Otra fuente da `#11316e`.                                                                                                         |
| Doosan                      | `#062f86` | Agregador (brandcolorcode.com), con la advertencia de que no es oficial. Su maquinaria es naranja «Kairos», sin hex.                                               |
| Link-Belt                   | `#ce1922` | **Oficial**: guía de marca de Link-Belt (guidelines.lbxco.com), «Link-Belt Red», PANTONE 1797C.                                                                    |
| Kobelco                     | `#0b4ea2` | **ESTIMADO, sin fuente.**                                                                                                                                          |
| Bobcat                      | `#e31837` | **ESTIMADO, sin fuente.**                                                                                                                                          |
| Yanmar (repuestos y nueva)  | `#ed1c24` | Rojo corporativo de Yanmar (yanmar.com lo declara); el hex es de un agregador.                                                                                     |
| Volvo                       | `#003057` | **ESTIMADO, sin fuente.**                                                                                                                                          |
| Dynapac                     | `#bf2e1a` | Rojo de su identidad de 2017 (whatthelogo.com), tercero. Ya no es amarillo.                                                                                        |
| Ammann                      | `#e30613` | **ESTIMADO, sin fuente.**                                                                                                                                          |
| Okada                       | —         | **Sin color**: no se encontró nada; sigue el amarillo.                                                                                                             |

Antes de lanzar, conviene que el cliente confirme o corrija los marcados como estimados.
