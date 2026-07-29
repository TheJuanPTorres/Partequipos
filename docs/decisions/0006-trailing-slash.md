# ADR 0006 — Activar `trailingSlash: true`

- **Estado:** Aceptada e implementada
- **Fecha:** 2026-07-29
- **Decisión tomada por:** Dirección técnica
- **Relacionado:** [[0005-manejo-de-slugs-y-redirects]], `docs/redirects-cobertura.md`

## Contexto

Las **648** URLs vivas del sitio actual terminan en barra (`/ruta/`) — verificado
en el rastreo: 648 de 648. El sitio nuevo servía las rutas **sin** barra, así que
Next emitía un **308** de `/ruta/` a `/ruta` en cada visita a una URL indexada.

El 308 conserva el posicionamiento, de modo que no había pérdida de SEO. El coste
era otro: **un salto extra en cada visita** procedente de buscadores o enlaces
externos, que son justamente las de mayor valor. Y cuanto más tarde se cambiara,
más caro: hoy es una línea de configuración; con el sitio completo construido
sería una migración.

## Decisión

**Activar `trailingSlash: true` en `next.config.ts`.** Las rutas del sitio nuevo
quedan idénticas a las indexadas, el 308 desaparece y el mapa de redirects se
simplifica.

## Medición antes / después

|                                           | **Antes**                       | **Después**                             |
| ----------------------------------------- | ------------------------------- | --------------------------------------- |
| `/repuestos-…-colombia/` (forma indexada) | **308** → versión sin barra     | **200** directo                         |
| `/repuestos-…-colombia` (sin barra)       | 200                             | 308 → versión con barra                 |
| Saltos desde una URL indexada             | **1 extra siempre**             | **0**                                   |
| `canonical` / `og:url`                    | sin barra                       | **con barra** (Next los normaliza solo) |
| JSON-LD (`Product`, `BreadcrumbList`)     | sin barra ❌                    | **con barra** ✅                        |
| Sitemap                                   | 0 de 98 con barra ❌            | **98 de 98** ✅                         |
| Redirect del proxy                        | `301` → **`308`** (doble salto) | **`301` → `200`** (un salto)            |

Las 96 rutas de catálogo (más los 2 índices) responden **200 con barra final**.
`/admin/`, `/robots.txt` y `/sitemap.xml` siguen accesibles.

## Cambios que hubo que hacer además de la línea de configuración

Next normaliza `canonical` y `og:url` por su cuenta, pero **no** toca lo que
generamos nosotros. Hubo que ajustar dos puntos:

1. **`absoluteUrl()`** (`src/lib/seo/config.ts`) ahora emite con barra final.
   Afecta a JSON-LD y al sitemap. Excepción: las rutas que terminan en archivo
   con extensión (`/sitemap.xml`, `/robots.txt`) **no** llevan barra.
2. **El proxy de redirects** emitía el destino en su forma normalizada (sin
   barra), lo que encadenaba un `308` detrás del `301`. Se añadió
   `aRutaCanonica()` para emitir la forma canónica. Ver la nota del ADR 0005.

## Consecuencia conocida: la API de Payload paga un salto

`trailingSlash` es **global**: también aplica a `/api/*` y `/admin`. Medido:

```
POST /api/users/login   → 308 → /api/users/login/ → 200
GET  /api/redirects-map → 308 → /api/redirects-map/ → 200
```

**No rompe nada**: `fetch` y los navegadores siguen los 308 automáticamente, y el
308 preserva método y cuerpo, así que los `POST` del panel funcionan. Verificado:
login correcto, panel accesible, y el proxy lee su propio mapa sin problema.

El coste es un salto extra por llamada a la API. En el panel del CMS —que hace
muchas— es perceptible pero no crítico, y **no afecta al SEO**, que es lo que se
optimiza aquí. Se acepta a cambio de que las URLs públicas sean exactas.

Si algún día ese coste molestara, la salida sería `skipTrailingSlashRedirect: true`
gestionando la barra en el proxy; añade complejidad y hoy no compensa.

## Nota operativa

El comportamiento canónico del sitio es **con barra final**. Cualquier URL que se
construya a mano (enlaces externos, campañas, `hacia` de un redirect) debería
llevarla para no pagar el salto.
