# Partequipos.com — Contexto del proyecto

> Este archivo es la fuente de verdad para cualquier sesión de trabajo.
> Léelo completo antes de escribir código. Si una decisión contradice este archivo,
> detente y consúltalo antes de continuar.

---

## 1. Qué es este proyecto

Migración completa de **partequipos.com**: sitio de catálogo de maquinaria pesada,
repuestos y servicios para el mercado colombiano.

**El objetivo del negocio es el tráfico orgánico.** Todo lo demás es secundario.
Cualquier decisión técnica que comprometa el SEO es una decisión incorrecta.

Volumen: ~470 URLs públicas, generadas desde ~22 componentes de ruta.

---

## 2. Stack (no cambiar sin aprobación)

| Capa          | Tecnología                                                          |
| ------------- | ------------------------------------------------------------------- |
| Framework     | Next.js 16 · App Router · React 19                                  |
| Lenguaje      | TypeScript (modo estricto)                                          |
| CMS           | Payload 3 (integrado en el mismo proyecto, no como servicio aparte) |
| Base de datos | PostgreSQL (Neon)                                                   |
| Estilos       | Tailwind CSS + shadcn/ui                                            |
| Hosting       | Vercel                                                              |
| Archivos      | Vercel Blob (o Cloudflare R2)                                       |
| Errores       | Sentry                                                              |

**Prohibido sin aprobación previa:** agregar dependencias pesadas, cambiar de ORM,
introducir otro gestor de estado, o mover contenido fuera de Payload.

---

## 3. Reglas de arquitectura

### 3.1 Renderizado

- **Todo es Server Component por defecto.** `"use client"` solo cuando hay estado,
  eventos o APIs del navegador. Justificar en el PR cuando se use.
- Páginas de catálogo: estáticas con `generateStaticParams`.
- Contenido que cambia: **ISR** vía `revalidateTag` / `revalidatePath` disparado
  por hooks de Payload. Nunca reconstruir todo el sitio para un cambio puntual.
- **Nunca** hacer fetch de datos de catálogo desde el cliente. Rompe el SEO.

### 3.2 Acceso a datos

- Usar la **API local de Payload** (`payload.find`) en Server Components y en build.
  No llamar la API REST/HTTP del propio proyecto.
- Toda consulta va en `src/lib/queries/` — no consultas sueltas dentro de componentes.
- Tipos generados por Payload (`payload-types.ts`). No escribir tipos a mano
  para entidades del CMS.

### 3.3 URLs

- **La jerarquía de URLs existente es intocable.** Está documentada en
  `docs/url-map.csv`. Cambiar un slug requiere aprobación explícita.
- Todo cambio de URL exige su redirect 301 correspondiente en el mismo PR.
- Slugs en minúscula, sin tildes, separados por guiones.

### 3.4 SEO (obligatorio en cada página)

Ninguna ruta se considera terminada sin:

- `generateMetadata` con title, description y canonical.
- Open Graph e imagen social.
- JSON-LD correspondiente (`Product`, `BreadcrumbList`, `Organization`, `Article`).
- Entrada en el sitemap dinámico.
- Un solo `<h1>` por página.

---

## 4. Estructura de carpetas

```
src/
  app/
    (site)/            # sitio público
    (payload)/admin/   # panel del CMS
    api/
  collections/         # colecciones de Payload
  components/
    ui/                # shadcn
    layout/
    catalog/
  lib/
    queries/           # acceso a datos
    seo/               # metadata y JSON-LD
    utils/
scripts/
  import/              # importación masiva CSV → Payload
docs/
  url-map.csv          # mapa de URLs (fuente de verdad)
  decisions/           # ADR: una decisión por archivo
```

---

## 5. Convenciones de código

- Componentes en `PascalCase`; funciones y variables en `camelCase`;
  archivos de rutas según convención de Next.
- Nada de `any`. Si el tipo es difícil, `unknown` + validación.
- Textos de interfaz en **español**; nombres de código en **inglés**.
- Formularios: Server Actions + validación con Zod en el servidor.
  Validar en cliente es cortesía, no seguridad.
- Imágenes siempre con `next/image` y dimensiones explícitas.
- Sin `console.log` en el código entregado. Errores a Sentry.

---

## 6. Git

- Ramas: `feat/…`, `fix/…`, `chore/…`
- Commits en formato convencional: `feat(catalogo): agrega ficha de modelo`
- PRs pequeños y enfocados. Un PR que toca 30 archivos no se revisa bien.
- `main` siempre desplegable.

---

## 7. Definición de "terminado"

Una tarea no está terminada hasta que cumple **todo** esto:

1. Compila sin errores ni warnings de TypeScript.
2. Lint y formato pasan.
3. Renderiza correctamente en móvil y escritorio.
4. Cumple el bloque de SEO de la sección 3.4.
5. Sin datos quemados: todo viene de Payload.
6. Accesible: navegable por teclado, contraste suficiente, imágenes con `alt`.
7. Desplegada en preview y verificada.

---

## 8. Seguridad

- Secretos solo en variables de entorno. Nunca en el repositorio.
- El panel `/admin` protegido por la autenticación de Payload; sin usuarios de prueba en producción.
- Formularios públicos con Cloudflare Turnstile.
- Validar y sanear toda entrada del usuario en el servidor.
- No exponer IDs internos ni trazas de error al usuario final.

---

## 9. Cómo trabajamos

- **Dirección técnica:** define alcance, prioridad, criterios de aceptación y revisa.
- **Claude Code:** implementa dentro de los límites de este archivo.
- Ante ambigüedad o una decisión de arquitectura no cubierta aquí:
  **detenerse y preguntar**, no improvisar.
- Toda decisión relevante se documenta como ADR en `docs/decisions/`.

---

## 10. Estado actual

- **Fase:** MVP · Sprint 0
- **Plan vigente:** `docs/PLAN-MVP.md`
- **Base del repo:** inicializada con Next.js 16.2.11 (App Router, TS strict,
  Tailwind v4, ESLint + Prettier). Ver ADR `docs/decisions/0001-version-nextjs.md`.
- **Decisión pendiente y bloqueante:** hosting definitivo (Vercel vs. infraestructura
  del cliente). Ver `docs/decisions/`.
- **Riesgo abierto:** inconsistencia en el inventario de modelos
  (Caterpillar 140 vs 130 · CASE 38 vs 34). Debe resolverse antes de la carga masiva.
