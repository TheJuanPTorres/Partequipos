# ADR 0007 — Modelo de datos de la sección maquinaria

- **Estado:** Aceptada
- **Fecha:** 2026-08-09
- **Decisión tomada por:** Dirección técnica
- **Relacionado:** [[0004-hallazgos-crawl]] (criterio de replicar la realidad medida)

## Contexto

La sección `maquinaria` tiene **122 URLs vivas** medidas en el rastreo. Su
estructura es **Marca → Tipo → Modelo**, la misma forma que repuestos, con dos
ramas hermanas bajo `/maquinaria-pesada/`:

```
maquinaria-pesada-nueva   109 URLs   (5 marcas · 18 tipos · 80 fichas · 4 categorías)
maquinaria-pesada-usada    10 URLs   (9 categorías, sin fichas propias)
```

El rastreo **contradice el documento de alcance del cliente en tres puntos**, y
como en los casos anteriores (inventario de repuestos, blog) **manda el dato
medido**:

|                          | Documento                                        | Medido                                                    |
| ------------------------ | ------------------------------------------------ | --------------------------------------------------------- |
| Fichas de la línea nueva | 47                                               | **80** (+70 %)                                            |
| Aditamentos              | categoría del marketplace de usada               | **marca de la línea nueva**, con 3 tipos hijos y 0 fichas |
| Línea usada              | "marketplace programático, no páginas estáticas" | **9 categorías ya indexadas**                             |

## Decisiones

### 1. Colecciones separadas de las de repuestos

Un equipo completo y una página de repuestos son entidades distintas: distinta
URL, distinto contenido y distinto propósito comercial. Reutilizar
`Marca`/`TipoEquipo`/`ModeloRepuesto` obligaría a discriminar por sección en cada
consulta y rompería la unicidad compuesta actual (`marca+slug`, `tipo+slug`), que
hoy es un constraint real en PostgreSQL.

### 2. Las categorías sueltas de la línea nueva se preservan como rutas

`excavadoras`, `cargadores`, `compactadores` están indexadas. Son **vistas
transversales por tipo cruzando marcas**, así que se modelan con su propia
colección y una relación explícita a los tipos que agregan — no se deducen del
nombre, que sería frágil.

### 3. La línea usada conserva sus 9 categorías como rutas reales

El documento dice "marketplace programático, no páginas estáticas". Eso describe
**cómo se genera el contenido**, no que las URLs desaparezcan. Están indexadas y
eliminarlas costaría posicionamiento. Se construyen como rutas alimentadas por
datos: las categorías son las URLs; las unidades de inventario **no** tienen
página propia (el rastreo no muestra ninguna).

### 4. Aditamentos se modela como está en producción

Una marca más dentro de la línea nueva, con sus 3 tipos hijos y sin fichas.
Modelarlo como categoría del marketplace, según dice el documento, **rompería 4
URLs indexadas**. Mismo criterio que el caso Bobcat del ADR 0004: se replica la
realidad y la anomalía de catalogación queda como **pregunta para el cliente**,
no como decisión nuestra.

### 5. Basura que no se migra

Se suma a la lista de limpieza sugerida al cliente, junto a los `-copy` del
ADR 0004:

- `/maquinaria-pesada/test/` — página de prueba.
- `/…/nueva/excavadoras-propuesta2025/` — duplicado de `/…/nueva/excavadoras/`
  (mismo `<title>`).
- `/…/usada/excavadoras4/` — duplicado de `/…/usada/excavadoras/`.
- `/maquinaria-pesada/maquinaria-pesada-usada-otros/` — sin hijos y con título
  duplicado.

## Modelo resultante

| Colección             | Slug                    | Unicidad          | Para qué                                       |
| --------------------- | ----------------------- | ----------------- | ---------------------------------------------- |
| `MarcaMaquinaria`     | `marcas-maquinaria`     | slug global       | 5 marcas de la línea nueva                     |
| `TipoMaquinaria`      | `tipos-maquinaria`      | **(marca, slug)** | 18 tipos                                       |
| `EquipoNuevo`         | `equipos-nuevos`        | **(tipo, slug)**  | 80 fichas de venta                             |
| `CategoriaMaquinaria` | `categorias-maquinaria` | slug global       | vistas transversales de nueva                  |
| `CategoriaUsada`      | `categorias-usada`      | slug global       | las 9 rutas de usada                           |
| `EquipoUsado`         | `equipos-usados`        | —                 | inventario del marketplace, **sin URL propia** |

La unicidad compuesta replica lo validado en repuestos: `excavadoras` puede
existir bajo Case y bajo Hitachi sin chocar, porque la URL las distingue.

## Consecuencia

- El esfuerzo de la línea nueva es **80 fichas, no 47**: hay que replanificar.
- Ninguna de las 122 URLs medidas queda sin sitio en el modelo, salvo las 4
  marcadas como basura.
- Aditamentos y las anomalías del sitio origen se replican tal cual; se
  documentan como preguntas, no se "arreglan" por cuenta propia.
