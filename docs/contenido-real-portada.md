# Contenido real de la home y de Nosotros

> **Decisión de dirección (2026-10-14):** la web se monta con el **contenido
> real de la web original** (partequipos.com y su exportación XML), no con el
> contenido de ejemplo de ux-9. El diseño no cambia; solo lo que lo rellena.
> Con esto queda resuelta, en estas dos páginas, la excepción temporal de
> §10.38 (CLAUDE.md).

## 1. Piezas

| Pieza                                   | Qué hace                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/contenido-real/extraer-xml.py` | Lee del XML lo visible de la home (51812), Nosotros (344), «NUESTRAS sedes» (plantilla 35576, la pinta /contactanos/) y las categorías de repuestos (plantilla 40343), más las meta descripciones y los adjuntos elegidos. Salida fuera del repositorio: `Desktop\partequipos-cierre\contenido-real-wordpress.json`. No lee usuarios ni comentarios |
| `scripts/contenido-real/importar.ts`    | `simular` / `importar` / `retirar`, con manifiesto (`manifiesto-contenido-real-<destino>.json`) y retirada exacta                                                                                                                                                                                                                                   |
| `src/lib/portada/contenidoReal.ts`      | Tipos de la fuente y del manifiesto; nombre de los ficheros (`wp-real-<clave>`); la comprobación de que no queda nada de la copia de demostración                                                                                                                                                                                                   |
| `seccionCompania.imagen` (esquema)      | «Nuestra Compañía» admite una **imagen** cuando no hay vídeo (decisión de dirección)                                                                                                                                                                                                                                                                |

```
python -I scripts/contenido-real/extraer-xml.py <exportacion.xml> <salida.json>
npm run preview:real:simular
npm run preview:real:importar
npm run preview:real:retirar
```

## 2. Qué se sustituye y por qué

Las imágenes son ficheros de la propia web original; la tabla completa, con su
ruta en WordPress, está en `IMAGENES` del extractor. Son **22**, una subida al
Blob cada una (Media no genera tamaños derivados).

| Dónde              | Antes (ux-9)                                     | Ahora (WordPress)                                                                                                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero               | —                                                | **No se toca**: ya son fotos del cliente                                                                                                                                                                                                                                                     |
| Sec. 2, marcas     | Logos y fotos de la maqueta; 3 marcas            | Logo y foto de cada marca de la home de WP; **4 marcas, con Dynapac** (decisión de dirección)                                                                                                                                                                                                |
| Sec. 3, usados     | Brazo de excavadora recortado                    | **El brazo de Andrés, como excepción temporal** (dirección, 2026-10-16, CLAUDE.md §10.38): WP no tiene ningún PNG recortado; se sube por `runbook-brazo-usada.md` hasta que llegue el del cliente. Las fichas de ejemplo las retira la copia; las pestañas se llenan con las unidades reales |
| Sec. 4, logos      | 9 logos                                          | Los **6 de «Nuestras Marcas»** de WP (decisión de dirección)                                                                                                                                                                                                                                 |
| Sec. 5, repuestos  | 4 imágenes de la maqueta                         | Las 4 de la plantilla de categorías de WP, con su título y su enlace a la página de categoría. Corrige la errata «Blades y corte» → «Baldes y herramienta de corte»                                                                                                                          |
| Sec. 6–8, compañía | Vídeo de ux-9 y un YouTube que no es del cliente | **Imagen** de WP (sin vídeo) y el YouTube que pinta Nosotros en WP                                                                                                                                                                                                                           |
| Sec. 9, sedes      | 7 sedes de la maqueta, con foto                  | Las sedes de «NUESTRAS sedes» de WP, agrupadas como su mapa (Antioquia = Caucasia, Guarne y Medellín). **Sin foto**: WP no tiene fotos de sedes                                                                                                                                              |
| Sec. 10 y 11       | Testimonios y preguntas de la maqueta            | **No se tocan**: los reales los gestiona dirección con el cliente. Sin datos, las secciones no se pintan                                                                                                                                                                                     |
| Sec. 11, imagen    | Máquina recortada                                | **Foto del técnico** de la sede de Guarne (la misma que usa Contáctanos), de fondo de la tarjeta del rediseño de Andrés (2026-10-14)                                                                                                                                                         |
| Pie                | Cargador recortado                               | **Sin imagen** decorativa                                                                                                                                                                                                                                                                    |
| Nosotros           | Vídeo, animación, cifras y textos de la maqueta  | Imagen de cabecera, párrafo y mapa de sedes reales, «+26 Años de experiencia», franja «Marcas aliadas» con foto de WP (sin máquina recortada) y tarjetas con la meta descripción de cada sección de WP                                                                                       |
| SEO                | Textos de la siembra                             | Meta descripción de WP en la home y Nosotros                                                                                                                                                                                                                                                 |

**Normalizado al importar** (y anotado para Andrés): los títulos que WordPress
escribe todo en mayúsculas pasan a mayúscula inicial («OFRECEMOS SOLUCIONES…»
→ «Ofrecemos soluciones…»); el diseño pone las mayúsculas por CSS donde las
quiere, y un lector de pantalla puede deletrear un texto en mayúsculas.

**Huecos** (sin equivalente en WP, aceptados «sin imagen» por dirección si la
sección se ve bien): fotos de las sedes, máquina de la cabecera de usados, imagen del
pie, máquina de la franja de Nosotros, vídeo de cabecera de Nosotros,
animación del mapa y 2 de las 3 cifras de Nosotros (en WP son texto, sin
número). Las sedes de Antioquia e Ibagué llevan las coordenadas del centro de
su ciudad: su enlace de mapas en WP no las trae.

**Descripción de cada marca** (tarjeta de la sección 2): la meta descripción
de su página en WP, **solo si nombra la marca**. La de Dynapac en WP es la de
CASE, copiada de plantilla. Para Dynapac va el primer párrafo de su página que
la nombra, el mismo criterio que con las fichas (`docs/fichas-nuevas-importacion.md` §6).
**Para el cliente:** corregir la meta descripción de la página de Dynapac en su web.

**Desde el 2026-10-16** (dirección, Home V2), Dynapac lleva el texto del diseño
V2, fijo en el extractor (`DESCRIPCIONES_V2`), para que las reimportaciones lo
conserven; su foto de tarjeta es `CA25D-CIELO.jpg` y va tercera.

**Orden e icono de las categorías técnicas:** el importador los fija (los de
hoy en el preview), porque la retirada de la copia de demostración los
devuelve a vacío y la sección 5 dejaría de pintarse.

## 3. Orden en el sitio publicado

**Primero la retirada de la copia de demostración y DESPUÉS el contenido
real.** La retirada (`copia-demo.ts retirar`) devuelve las secciones a su
valor de antes de la copia: si lo real ya estuviera, lo pisaría. Por eso
`importar.ts` se niega en el sitio publicado mientras quede algún fichero
`demo-copia-` en Media, Vídeos o Animaciones (`restoDeLaCopia`).

En el preview no hay copia que retirar (el preview es su origen): el
importador sustituye directamente, y su manifiesto guarda el valor anterior.

Para el sitio publicado: `runbook-contenido-real-lanzamiento.md` (fuera del
repositorio, lo ejecuta dirección).

## 4. Probado en el preview (2026-10-14)

- **Simulación:** 22 subidas, 4 marcas, 4 categorías, 8 sedes (1 nueva) y 5 bloques en Nosotros.
- **Importación:** sin errores.
- **Segunda pasada:** 0 subidas.
- **Retirada exacta:** lo devuelve todo y las 22 imágenes dan 404 a los 70 s. Después, reimportado.
- **Pintado a 390, 1010 y 1440:**
  - ninguna imagen de la copia de demostración;
  - sin errores de consola ni peticiones fallidas;
  - «Nuestra Compañía» con su foto;
  - sedes 1/8, y preguntas y pie sin imagen, sin huecos.
- **Igual que antes, no lo trae el contenido real:**
  - la cabecera de Nosotros a 390, con el texto pegado al borde;
  - la cifra pegada al botón.

## 6. Preguntas frecuentes y testimonios reales (2026-10-16)

Vuelven las secciones 10 y 11 de la home, que no se pintaban sin contenido.

**Preguntas frecuentes (6).** Redactadas a partir de la web original (páginas «Nosotros», «Contáctanos», «Servicio técnico» y la política de garantía y devolución) y aprobadas por dirección el 2026-10-16. Sin cifras de garantía: la quinta remite a `/politica-de-garantia-de-repuestos/` y a su ancla `#Devoluciones`. Dynapac se cita como marca de maquinaria nueva, sin «distribuidor oficial».

- La respuesta sigue siendo texto plano (alimenta el JSON-LD `FAQPage`) y admite enlaces con `[texto](/ruta/)` o `[texto](https://…)` (`src/lib/portada/respuestaFaq.ts`). Solo valen los destinos de `validarEnlace`: ni `javascript:` ni `//otro.com`. El JSON-LD lleva el texto sin la sintaxis.

**Testimonios (4 vídeos del canal @partequipos_sas).** Son los de «Testimonios reales» de la web original (sus miniaturas son las de esa web; tres se comprobaron por huella exacta contra la miniatura de YouTube). Se muestran con el vídeo y el nombre de la empresa que sale en él. **No se inventa ninguna frase.**

- Campo nuevo `videoDelCliente` («Vídeo ya publicado por el cliente en su canal de YouTube»). Con la casilla **y** un enlace de YouTube válido, la frase y la autorización de uso son opcionales y el testimonio se puede publicar (`exentoDeAutorizacion`, `reglasPortada.ts`). Sin la casilla, todo sigue como antes.
- `cita` deja de ser obligatoria en la base (migración `20261016_193118_testimonios_video_cliente`); la obligación pasa a una validación que la exime solo en ese caso.
- Cuando el cliente mande la frase y la autorización, se añaden en el panel; el testimonio las usa sin más cambios.
- El quinto vídeo del widget original («Potenciamos el desarrollo de infraestructura en Colombia») es institucional, sin cliente, y no entra.

**Importador:** `scripts/contenido-real/testimonios-faq.ts` (`npm run preview:testimonios-faq:{simular,importar,retirar}`). Fuente fuera del repositorio (`Desktop/partequipos-cierre/testimonios-faq-fuente.json`: lleva nombres de empresas clientes, §9). Idempotente (las preguntas por su texto, los testimonios por su vídeo), no pisa lo editado en el panel, manifiesto y retirada exacta. Solo en el preview, `despublicar` oculta las preguntas de ejemplo de ux-9 (la retirada las devuelve). Para el sitio publicado: `runbook-testimonios-faq-lanzamiento.md`.
