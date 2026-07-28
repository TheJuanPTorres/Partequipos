# ADR 0005 — Guardarraíl de slugs y colección de Redirects

- **Estado:** Aceptada e implementada
- **Fecha:** 2026-07-28
- **Decisión tomada por:** Dirección técnica
- **Relacionado:** [[0004-hallazgos-crawl]] (mapa de 648 URLs), ISR (tarea 2.5)

## Contexto

Medido en la tarea 2.5: al cambiar el slug de una entidad, la URL anterior pasa a
**404 sin redirección**. Para un proyecto cuyo objetivo es el tráfico orgánico
(CLAUDE.md §1) esto es el riesgo más caro: una URL indexada que muere pierde su
posicionamiento. CLAUDE.md §3.3 ya exige un 301 por cada cambio de URL.

Se plantearon tres opciones: (A) colección de Redirects, (B) bloquear el cambio
de slug, (C) historial de slugs en la propia entidad.

## Decisión

**Se implementan B y A, en ese orden.**

Razón: la colección de Redirects es **la misma infraestructura** que hace falta
para el mapa de 301 de la migración (las 648 URLs del sitio actual inventariadas
en `docs/url-map.csv`). No es trabajo extra: es trabajo del plan, adelantado,
que cubre dos necesidades con un solo mecanismo.

- **B (guardarraíl)** evita el problema en origen: el slug no se edita por
  accidente.
- **A (redirects)** resuelve el caso legítimo (erratas reales) y sirve de base
  para la migración.

Se descarta **C** (historial de slugs): resolvería solo el caso de las entidades
del catálogo, no las 648 URLs heredadas, y complicaría `generateStaticParams`.

## Parte B — Guardarraíl de slugs

El campo `slug` de `Marca`, `TipoEquipo` y `ModeloRepuesto` se vuelve **de solo
lectura en el panel una vez creado el registro**. Se implementa con **control de
acceso a nivel de campo** (`access.update`), no con `admin.readOnly`, porque:

1. Payload deshabilita automáticamente el campo en la interfaz cuando el usuario
   no tiene permiso de actualización — se obtiene el efecto visual gratis.
2. Es una restricción **real**, aplicada también sobre la API REST, no solo
   cosmética en el panel.
3. **La importación por script no se ve afectada**: la API local de Payload
   ejecuta con `overrideAccess: true` por defecto, así que
   `scripts/import/import.ts` sigue pudiendo actualizar slugs, que es su trabajo.

La excepción para erratas reales es el campo `puedeEditarSlugs` en `Users`: quien
lo tenga marcado puede editar el slug, y el campo muestra una **advertencia
visible** de que la URL indexada se romperá si no queda un redirect.

## Parte A — Colección `Redirects`

Campos: `desde` (único, indexado), `hacia`, `tipo` (301 por defecto / 302),
`origen` (`manual` | `cambio-de-slug` | `migracion`) y `notas`.

### Estrategia de caché del proxy — y su justificación

`middleware.ts` está **deprecado en Next 16** y renombrado a **`proxy.ts`**
(el proxy corre en runtime Node por defecto). La documentación advierte que el
proxy "puede desplegarse al CDN" y que **no conviene depender de módulos
compartidos ni de estado global**.

Consultar la base de datos en cada petición del sitio es inaceptable: añadiría
una consulta a Neon a **todas** las visitas, incluidas las que no son redirects
(la inmensa mayoría). La estrategia elegida tiene tres capas:

1. **El proxy no importa Payload.** Importar el CMS entero en el proxy dispararía
   el tamaño del bundle y el arranque en frío. El proxy solo hace `fetch` a una
   ruta interna ligera, `/api/redirects-map`, que devuelve el mapa completo como
   JSON.
2. **Caché en memoria del proceso con TTL corto (60 s).** Mientras el módulo del
   proxy siga vivo, las peticiones se resuelven **sin ninguna E/S**. En el peor
   caso —arranque en frío o TTL vencido— se hace **una** petición interna, no una
   por visita. El TTL de 60 s coincide con el SLA del sprint ("visible en menos
   de un minuto").
3. **Tolerancia a fallos:** si el mapa no se puede cargar, el proxy deja pasar la
   petición (`NextResponse.next()`). Un fallo del sistema de redirects nunca
   puede tumbar el sitio.

Como el proxy no puede _asumir_ que el global sobrevive, el diseño es correcto en
ambos escenarios: si sobrevive, coste ~0; si no, una petición interna cacheada.

Volumen: el mapa completo (~648 redirects de la migración) es JSON de decenas de
KB, perfectamente manejable. Si algún día creciera a decenas de miles, la
evolución natural es consultar por clave en vez de traer el mapa entero.

### Protección contra cadenas y bucles

- **`desde === hacia` → se rechaza** (bucle inmediato).
- **Cadena A→B y luego B→C:** se **aplana automáticamente**, dejando A→C y B→C.
  Google no sigue cadenas largas y cada salto diluye la señal.
- **Bucle A→B con B→A → se rechaza.**
- `desde` es único: no puede haber dos destinos para la misma URL.

## Consecuencias

- El editor no puede romper una URL indexada por accidente; si lo hace a
  propósito (con permiso), el redirect se crea **solo**, con
  `origen: "cambio-de-slug"`.
- Queda montada la infraestructura para cargar el mapa de 301 de la migración
  (`origen: "migracion"`), pendiente de los datos reales.
- El proxy corre en todas las rutas públicas; se excluyen `/api`, `/admin`,
  `/_next` y los archivos estáticos vía `matcher`.
