# Importación de las páginas de texto desde el WordPress actual

**Estado (2026-10-07): importadas en el PREVIEW, sin fusionar.** Rama `feat/paginas-wordpress`. Producción, con runbook cuando dirección lo decida.

## Qué se importa

Las **páginas de texto** de `url-map.csv` (secciones `corporativo` y `otro`). Comando: `npm run preview:paginas:simular | importar | retirar`. Es el modo `paginas` de `scripts/blog/importar-wordpress.ts`, con las mismas garantías que el blog:

- simulación;
- idempotencia;
- manifiesto (`Desktop\partequipos-cierre\manifiesto-paginas-<destino>.json`) y retirada exacta;
- destino validado antes de cargar Payload.

**Cómo se distingue una página de texto** (`clasificarPaginaWp`): en el WordPress del cliente casi todo está editado con Elementor (597 de las 599 páginas publicadas tienen `_elementor_data`), así que ese dato no sirve para separarlas. Se clasifican por los **widgets** que usan:

- **de texto**: solo títulos, editor de texto, espaciadores y separadores, fuera de la plantilla de lienzo (`elementor_canvas`, la de las landings);
- **con Elementor**: cualquier otro widget (formularios, carruseles, botones, mapas…) o la plantilla de lienzo.

## Resultado en el preview

| Página                                             | Qué lleva                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `codigo-de-etica-partequipos`                      | Solo el PDF (en WordPress, un visor de PDF Poster sin texto)                 |
| `politica-de-garantia-de-repuestos`                | 2 PDF y el texto, en las secciones **#GARANTIA** y **#Devoluciones**         |
| `terminos-y-condiciones-campana-bonos-de-recompra` | El PDF de los términos y el texto de autorización de datos (ver «Hallazgos») |
| `tratamiento-de-datos`                             | El PDF y el texto de autorización de datos                                   |

Las 4 existían ya en el preview con textos de relleno (`tipoPagina: legal`): se **actualizan** y el manifiesto guarda lo que tenían.

- **Visores de PDF → enlace de descarga.** dFlip (3) y PDF Poster (2) se sustituyen por «Descargar en PDF: <título>», con el PDF copiado a `documentos`. Son 5 ficheros de 60 a 263 kB, y el título es el encabezado que precede al visor.
- **Anclas indexadas, conservadas exactas.** `#GARANTIA` y `#Devoluciones` pasan a ser **Secciones con ancla**, y la plantilla ya las pinta con su `id` y un índice. **Ojo:** en WordPress `#GARANTIA` está en el bloque del título «Política de **devolución**…», una posición más abajo de lo que dice su nombre. Aquí cada sección se arma por su NOMBRE (`SECCIONES_PAGINAS`): `#GARANTIA` lleva la política de garantía (su PDF y su texto) y `#Devoluciones` la de devolución. Anclas de WordPress sin sección: ninguna. La única que no pasa es `_com_1`, un resto de un comentario de Word.
- **Limpieza, la del blog más:**
  - fuera los comentarios condicionales de Word (`[if !supportLists]`, 14);
  - fuera el texto de carga de los visores («Loading Viewer…»);
  - un `<a>` sin dirección pasa a texto;
  - 4 encabezados sin contenido quitados (títulos sueltos copiados de otra plantilla);
  - dentro de una sección, los títulos empiezan en h3, porque el h2 es el de la sección.
- **Tablas:** 8, en la página de garantías, pasan a párrafos «celda · celda», como en el blog.
- **Texto conservado:** 100 % en tres páginas y 99,4 % en la de garantías. Lo que falta son el encabezado suelto y el texto de carga.
- **Entradilla:** vacía. Las páginas de WordPress no tienen extracto propio; el de la API es el principio del texto.
- **SEO de Yoast:** los 4 títulos, que son únicos. Las descripciones no: van repetidas por parejas (código de ética = garantías; términos = tratamiento).

**Comprobado:**

- Las 4 responden 200 con un solo `<h1>`, los 5 PDF dan 200 desde el Blob del preview y no queda ningún resto de WordPress en el HTML.
- La segunda pasada no duplica: reutiliza los 5 PDF.
- **Ciclo de retirada:** retirar devuelve las 4 páginas a su valor anterior (4 de 4, idénticas al manifiesto) y los 5 PDF dan 404. Al volver a importar, el estado es idéntico al de antes, salvo el sufijo aleatorio que el Blob añade a cada PDF.
- El blog no cambia: su simulación da las mismas cifras que antes de este cambio.

## Las 36 que NO se importan (Elementor o sin página)

| URL                                                                                                 | Por qué                                                    |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `/`, `/inicio2025/`                                                                                 | Portada (carruseles, botones, logos)                       |
| `/nosotros/`                                                                                        | Ya rehecha con los bloques de ux-9                         |
| `/nosotros/trabaja-con-nosotros/`, `/contactanos/`                                                  | Formularios                                                |
| `/servicio-tecnico/`                                                                                | Vídeo, galería, botones (anclas `taller`, `alistamiento`…) |
| `/repuestos-para-maquinaria-pesada/`                                                                | Landing de repuestos (formulario, testimonios, carruseles) |
| `/repuestos-para-maquinaria-pesada-2/`                                                              | Vacía                                                      |
| `/excavadoras/`, `/elementor-48399/`                                                                | Listados con filtros (FacetWP, loop grid)                  |
| `/lubricantes-eni/` y `/lubricantes/lubricantes-eni/` con sus 4 hijas                               | Formularios e imágenes de producto (ya tienen plantilla)   |
| `/noticias/`, `/blog-partequipos/`                                                                  | Listados del blog                                          |
| `/pe-partsshop/`                                                                                    | Imágenes                                                   |
| `/landing-dynapac/`, `/lanzamiento_excavadoras/`, `/openhouse/`, `/participa-openhouse/`            | Landings (plantilla de lienzo)                             |
| `/premios-open-house/`, `/referenciacion-openhouse-2025/`, `/congreso-de-alcaldes/`                 | Landings (plantilla de lienzo)                             |
| `/competencia_nacional_de_operadores/`                                                              | Landing (plantilla de lienzo)                              |
| `/gracias/`, `/gracias-a-ti/`, `/gracias-dynapac/`, `/gracias-hitachi/`, `/gracias-por-participar/` | Páginas de «gracias» de formularios (plantilla de lienzo)  |
| `/gracias-por-tu-confianza/`, `/gracias_por_tu_confianza/`, `/gracias-por-tu-registro/`             | Páginas de «gracias» de formularios (plantilla de lienzo)  |
| `/category/noticias/`                                                                               | No es una página: es el archivo de la categoría            |

El detalle (widgets de cada una) está en el informe de la importación, fuera del repositorio: `Desktop\partequipos-diseno\wordpress\paginas\informe-<modo>-preview.json`.

## La exportación XML del cliente (fuente adicional)

`Desktop\partequipos-diseno\wordpress-cliente\` (dirección, 2026-10-07). **Contiene datos personales:**

- nunca entra en el repositorio ni en `public/`;
- no se copian, imprimen ni migran usuarios ni comentarios;
- se leyó con un resumen que solo extrae el tipo, el estado, el slug, el título, el SEO y los NOMBRES de los meta (nunca sus valores).

**El importador no la usa:** el SEO sale de la API pública, que da lo mismo. Comprobado en los 53 artículos: las descripciones son idénticas palabra por palabra. Los títulos también; el XML los trae sin resolver las variables de Yoast (`%%title%% %%sep%% %%sitename%%`).

- **SEO de los artículos:** **no aporta nada nuevo.** Los repetidos lo están en el propio WordPress (5 artículos comparten «Beneficios de usar filtros Donaldson…», 12 la misma descripción de Hitachi…) y se dejan fuera a propósito.
- **Borradores y privadas** (NO se importan): no hay ninguna privada. Hay 19 borradores de página, 1 de entrada («Entrada de prueba») y 1 página en la papelera. Entre ellos:
  - antiguos de las políticas: «Política de Garantías de Repuestos - VIEJO», `datos_personales`, `tratamiento-de-datos-personales`;
  - una línea Link Belt sin publicar (`excavadoras-link-belt` y 6 modelos X3E);
  - `miniexcavadoras`, `dispel`, `lubricantes`, `componentes-completos`, `inicio-old`, `maquinaria-pesada-colombia`, `repuestos-bulldozer-caterpillar-d6k-2` y una copia de la motoniveladora Case 865B.

### Lo que trae y aún no aprovechamos

| Contenido                                          | Qué es                                                                                                                                                                                                                                                                  | Para qué serviría                                                                                               |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Tipo `maquinaria`** (128 publicadas, 1 borrador) | Fichas con campos ACF (`referencia`, `peso`, `horas`, `serial`, `potencia_neta`, `peso_operativo`, `motor`, alcance máximo, profundidad de excavación, `ficha_tecnica`, `descripcionequipo`) y taxonomías `marcas` (5), `categorias` (11), `ano` (13) y `tonelada` (10) | Por las horas y el serial, parece el **catálogo de maquinaria usada**. Lo que hoy espera de los CSV del cliente |
| **Textos alternativos de la mediateca**            | 17.782 de 20.161 adjuntos con `alt`                                                                                                                                                                                                                                     | Rellenar el alt de las imágenes que se migren (como hizo la API en el blog)                                     |
| **Menús**                                          | 8 menús, 534 elementos (con megamenú)                                                                                                                                                                                                                                   | Contrastar la navegación nueva con la de hoy (rutas que la gente encuentra por el menú)                         |
| **Registros de PDF**                               | 10 de PDF Poster y 5 de dFlip                                                                                                                                                                                                                                           | Inventario de documentos descargables del sitio                                                                 |
| **Plantillas de Elementor**                        | 97 (secciones, popups, formularios)                                                                                                                                                                                                                                     | Referencia de diseño; los campos de los formularios                                                             |
| **Formularios**                                    | Definidos dentro de las páginas (widgets `form`); los envíos NO vienen en la exportación                                                                                                                                                                                | Contrastar los campos con los nuestros                                                                          |
| **Redirecciones**                                  | **No vienen:** ningún plugin de redirecciones guarda sus datos como contenido exportable                                                                                                                                                                                | Habría que pedirlas aparte (p. ej. un CSV del plugin) si existen                                                |

## Hallazgos para dirección

1. **`terminos-y-condiciones-campana-bonos-de-recompra` lleva el texto de tratamiento de datos**, el mismo de `tratamiento-de-datos` (9.576 caracteres idénticos). Los términos de la campaña solo están en su PDF. Se migra tal cual. ¿Se quita ese texto de la página de términos?
2. **`#GARANTIA` cambia de sitio dentro de la página:** ahora lleva a la política de garantía, que es lo que dice su nombre, y no al título de la de devolución como en WordPress. Quien llegue por un enlace indexado ve lo que buscaba.
3. **El título de `tratamiento-de-datos` es «TRATAMIENTO DE DATOS»** y su primer encabezado, «TRATAMIENTO DE DATOS PERSONALES», que queda como h2. Los títulos en mayúsculas vienen así de WordPress.

## Límites

- Solo la API pública de WordPress. La exportación XML se usó para contrastar, no la lee el importador.
- Los PDF se copian tal cual: no se revisa su contenido.
