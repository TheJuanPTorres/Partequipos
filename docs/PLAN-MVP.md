# Plan de MVP — Partequipos.com

---

## 1. Criterio del MVP

El MVP **no es "el sitio a medias"**. Es la rebanada vertical más delgada que
atraviesa toda la arquitectura y prueba lo más riesgoso del proyecto.

Lo más riesgoso aquí no es maquetar. Es:

1. Que Next.js + Payload + PostgreSQL desplieguen juntos y estables.
2. Que **una sola plantilla genere cientos de URLs indexables** (repuestos).
3. Que el cliente pueda editar contenido y ver el cambio reflejado (ISR).

Si esas tres cosas funcionan en producción, el resto del proyecto es repetición
de un patrón ya probado. Por eso el MVP ataca justamente esas tres.

**Objetivo del MVP:** una vertical completa de repuestos en producción,
administrable por el cliente y correctamente indexable.

---

## 2. Dentro y fuera del MVP

| Dentro                                          | Fuera (fases posteriores)                 |
| ----------------------------------------------- | ----------------------------------------- |
| Proyecto desplegado en producción               | Blog                                      |
| Payload + base de datos + panel funcional       | Marketplace de usados y aditamentos       |
| Colecciones: Marca, Tipo, Modelo, Media         | Fichas de maquinaria nueva (47)           |
| Índice de repuestos, marca, tipo y modelo       | Páginas corporativas (Nosotros, Contacto) |
| ~332 URLs programáticas de modelos              | Formularios y Turnstile                   |
| SEO base: metadata, canonical, sitemap, JSON-LD | Redirects 301 masivos                     |
| Script de importación CSV                       | Diseño final (llega del tercero)          |
| Diseño provisional sobrio                       | Lubricantes, Servicio Técnico, políticas  |

Nota sobre el diseño: el MVP se construye con una maqueta sobria propia.
Cuando llegue el diseño del tercero se aplica encima; por eso los componentes
deben estar desacoplados del estilo.

---

## 3. Fases

### Sprint 0 — Cimientos (≈ 1 semana · 40 h)

Meta: **esqueleto caminante**. Una página en producción que lee un dato real
de la base de datos.

- Repositorio, Next 15, TypeScript estricto, Tailwind, ESLint/Prettier.
- Payload 3 integrado + Neon conectado.
- Despliegue en Vercel operativo (preview + producción).
- Variables de entorno y secretos.
- Sentry conectado.
- `CLAUDE.md`, `docs/url-map.csv` y `docs/decisions/` creados.

**Criterio de salida:** una URL en producción muestra el nombre de una marca
creada desde `/admin`.

---

### Sprint 1 — Modelo de datos (≈ 1 semana · 40 h)

- Colecciones: `Marca`, `TipoEquipo`, `ModeloRepuesto`, `CategoriaTecnica`, `Media`.
- Relaciones Marca → Tipo → Modelo.
- Campos de SEO por entidad (title, description, imagen social).
- Generación de slug automática y validada como única.
- Roles del panel: administrador y editor.

**Criterio de salida:** se puede crear una marca con dos tipos y cinco modelos
desde el panel, con slugs correctos y sin duplicados.

---

### Sprint 2 — Vertical de repuestos (≈ 2 semanas · 80 h)

El corazón del MVP.

- `/repuestos-maquinaria-pesada-colombia/` — índice.
- `.../repuestos-maquinaria-pesada-marcas/` — índice de marcas.
- `.../[marca]/` — página de marca.
- `.../[marca]/[tipo]/` — página de tipo.
- `.../[marca]/[tipo]/[modelo]/` — ficha de modelo (plantilla única, ~332 URLs).
- `generateStaticParams` en las rutas dinámicas.
- ISR disparado por hooks de Payload al publicar.
- Migas de pan y enlazado interno entre niveles.

**Criterio de salida:** al publicar un modelo nuevo en el panel, su URL existe
en producción en menos de un minuto, sin reconstruir el sitio completo.

---

### Sprint 3 — SEO e importación (≈ 1 semana · 40 h)

- `generateMetadata` en todas las rutas del MVP.
- Canonical correcto (crítico: evitar duplicados entre modelos similares).
- `sitemap.xml` dinámico y `robots.txt`.
- JSON-LD: `Product`, `BreadcrumbList`, `Organization`.
- Script `scripts/import/` : CSV → Payload, idempotente, con reporte de errores.
- Carga real de una marca completa como prueba (sugerido: CASE o Bobcat).

**Criterio de salida:** el sitemap lista todas las URLs cargadas; una página
de modelo pasa validación de datos estructurados sin errores.

---

### Sprint 4 — Endurecimiento y entrega (≈ 1 semana · 40 h)

- Core Web Vitals en verde en las plantillas del MVP.
- Accesibilidad: teclado, contraste, `alt` en imágenes.
- Manejo de estados: 404, error, listas vacías.
- Respaldo automatizado de base de datos + prueba de restauración.
- Documentación de despliegue y guía breve para el editor de contenido.

**Criterio de salida:** MVP en producción, con respaldo probado y el cliente
capaz de cargar contenido sin ayuda.

---

**Total MVP: ≈ 240 h de las 480.** La mitad restante cubre maquinaria,
marketplace, blog, corporativo, formularios y la migración 301 completa.

---

## 4. Bloqueantes a resolver antes del Sprint 2

Estos no son técnicos, son de decisión. Si no se resuelven, el sprint se frena:

1. **Hosting definitivo.** Vercel o infraestructura del cliente. Cambia la
   estrategia de despliegue e ISR. _Responsable: cliente._
2. **Inventario de modelos reconciliado.** Caterpillar 140 vs 130, CASE 38 vs 34.
   Se necesita la hoja maestra validada. _Responsable: cliente._
3. **Mapa de URLs actuales exportado** para construir `docs/url-map.csv`.
   _Responsable: proveedor, con acceso al sitio actual._
4. **Destino de respaldos.** Definir si van a infraestructura del cliente.
   _Responsable: cliente._

---

## 5. Método de trabajo por tarea

Cada tarea que se le entrega a Claude Code debe llevar:

1. **Objetivo** — qué se busca lograr, en una frase.
2. **Alcance** — archivos o rutas que puede tocar.
3. **Criterios de aceptación** — lista verificable.
4. **Fuera de alcance** — lo que explícitamente no debe hacer.

Ejemplo:

> **Objetivo:** implementar la página de marca de repuestos.
> **Alcance:** `src/app/(site)/repuestos.../[marca]/page.tsx`, consultas en `lib/queries/`.
> **Criterios:** obtiene la marca por slug; 404 si no existe; lista sus tipos;
> incluye metadata y JSON-LD `BreadcrumbList`; estática con `generateStaticParams`.
> **Fuera de alcance:** no tocar el esquema de Payload ni la página de tipo.

---

## 6. Ritmo de revisión

- **Al cerrar cada sprint:** revisión contra los criterios de salida. No se avanza
  al siguiente sprint con criterios incumplidos.
- **Al iniciar cada tarea:** confirmar que `CLAUDE.md` cubre la decisión.
  Si no la cubre, se decide y se documenta como ADR antes de escribir código.
- **Ante cualquier cambio de arquitectura:** se detiene la implementación y se
  consulta. La deuda técnica en el mes uno es la que arruina el mes tres.
