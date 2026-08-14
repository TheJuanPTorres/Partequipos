# Ruta de desarrollo — trabajo sin dependencias externas

**Contexto:** el proyecto está bloqueado en dos frentes ajenos a nosotros — el
acceso al WordPress actual (migración de contenido) y la entrega del diseño.
Este documento ordenó todo lo que sí se podía ejecutar mientras tanto.

**CIERRE DE FASE (2026-08-14): los seis bloques de código están COMPLETOS.**
Lo único que queda de esta ruta es el bloque G, que no es código.

---

## Estado

| Bloque                                 | Estado       | Cotizado | Cierra                               |
| -------------------------------------- | ------------ | -------- | ------------------------------------ |
| **A** — Formularios y captación        | ✅ completo  | 15 h     | Grupo D de URLs huérfanas            |
| **B** — Lubricantes                    | ✅ completo  | —        | Sección completa (5 URLs)            |
| **C** — Redirects 301                  | ✅ completo  | —        | El mayor riesgo del lanzamiento      |
| **D** — Plantillas de blog             | ✅ completo  | 45 h     | Molde; falta el contenido real       |
| **E** — Respaldos automatizados        | ✅ completo  | —        | Compromiso de Gestión de Incidencias |
| **F** — QA, accesibilidad, rendimiento | ✅ completo  | 45 h     | Línea base para los umbrales         |
| **G** — Acuerdo de diseño              | ⬜ pendiente | —        | No es código: es una conversación    |

---

## Bloque A — Formularios y captación de leads ✅

Tres formularios (contacto, cotización de equipo, solicitud de repuesto) con
Server Actions, validación con Zod en el servidor, Turnstile verificado en el
servidor y confirmación **en la misma página**, que sustituye a las 8 URLs de
«gracias».

Colección `Solicitud`, la única con datos personales: control de acceso privado
verificado (`GET` y `POST` a `/api/solicitudes/` devuelven 403).

Adaptador de correo Resend, con **degradación controlada**: sin clave la
solicitud se guarda igual y solo se registra que no se pudo avisar.

**Pendiente:** claves reales de Turnstile y Resend en producción → §10.11 de
`CLAUDE.md`. Hoy los formularios corren con las claves de prueba de Cloudflare,
que aceptan cualquier token.

## Bloque B — Lubricantes ✅

Modelo de **dos niveles** (marca → categoría de aplicación), no los tres de
repuestos. `/lubricantes/` no existe como página y se replica así.

El documento del cliente indicaba 1 página; el rastreo encontró 5. Cuarta
discrepancia medida.

## Bloque C — Redirects 301 ✅

El mapa de julio quedó obsoleto y **sobreestimaba el trabajo**: 618 URLs
conservan ruta idéntica, no 398. Cargados **10** redirects (8 de «gracias» y 2
duplicados `-copy`), verificados en el proxy: 301 en un salto, sin cadenas ni
bucles.

Se añadió la validación que faltaba: `npm run redirects:check` comprueba que el
destino de cada redirect **resuelva**, con advertencia visible en el panel.

**Pendiente:** 14 decisiones del cliente + 4 URLs de maquinaria vivas
clasificadas como basura.

## Bloque D — Plantillas de blog ✅

Los 51 artículos viven en la **raíz** (`/{slug}/`), el mismo espacio de nombres
que las páginas institucionales. La ruta `[...slug]` resuelve ambas con
precedencia documentada, y un **guardarraíl bidireccional** impide que una tape
a la otra — verificado contra la base en las dos direcciones.

**Pendiente:** migración de los 51 artículos → acceso a WordPress.

## Bloque E — Respaldos automatizados ✅

No usa `pg_dump` (exige binario de versión ≥ servidor; hay PostgreSQL 18.4 y
ningún cliente instalado). Usa el cliente `pg` del proyecto: funciona contra
cualquier PostgreSQL.

**Prueba de restauración real:** base limpia → 7 migraciones → restauración →
verificación. 35 de 35 tablas idénticas, misma huella MD5, secuencias correctas.

**Pendiente:** destino de los volcados, cifrado en reposo, programación
periódica y sincronización de binarios → §10.3 puntos 9–12 de `CLAUDE.md`.

## Bloque F — QA, accesibilidad y rendimiento ✅

`npm run qa` recorre todas las URLs del sitemap: **0 errores** en local (198) y
en producción (112).

Corregido lo estructural en accesibilidad, incluido un **fallo crítico de modo
oscuro** heredado del andamiaje inicial (§10.14).

Línea base de Core Web Vitals medida en navegador real sobre producción:
LCP 384–800 ms, **CLS 0**, cero tareas largas.

**Pendiente:** clave de PageSpeed Insights para cifras contractuales, y repetir
la medición cuando llegue el diseño.

## Bloque G — Acuerdo de diseño ⬜ (no es código)

Lo único de esta ruta que sigue abierto. Es lo que más tiempo ahorra cuando
llegue la entrega del tercero.

- Acordar paleta, escala tipográfica y escala de espaciado.
- Catálogo de componentes: tarjeta de producto, listado, migas, cabecera de
  categoría, formulario, cabecera y pie.
- Confirmar entrega de archivos exportables y editables.
- **Acordar restricciones de peso y dimensiones de imagen.** Es lo que
  sostendrá los umbrales de rendimiento: hoy el LCP es texto y con el diseño
  pasará a ser una imagen destacada.

---

## Fuera de esta ruta — bloqueado por terceros

| Pendiente                                | Depende de                  |
| ---------------------------------------- | --------------------------- |
| Migración de las ~55 páginas editoriales | Acceso a WordPress          |
| Migración de los 51 artículos de blog    | Acceso a WordPress          |
| Carga de 351 modelos de repuestos reales | CSV del cliente             |
| Carga de 80 fichas de maquinaria reales  | CSV e imágenes del cliente  |
| Aplicación del diseño definitivo         | Entrega del diseñador       |
| Textos legales definitivos               | Área jurídica del cliente   |
| Razón social, NIT y URLs de portales     | Definición del cliente      |
| Base de datos en infraestructura propia  | Provisión del cliente       |
| Claves de Turnstile y Resend             | Cuentas del cliente         |
| Destino y cifrado de los respaldos       | Infraestructura del cliente |

---

## Recordatorios de dirección

- **Producción contiene datos de demostración.** Debe vaciarse antes de
  cargar contenido real.
- **El bloqueo de indexación está activo.** Se levanta cambiando una
  variable de entorno el día del lanzamiento.
- **El repositorio está público de forma temporal**, autorizado por el
  cliente. Al volver a privado hará falta Vercel Pro.
- **El pooler de conexiones es requisito duro** para la infraestructura del
  cliente: el build emite ~3.600 consultas en paralelo por publicación.
- **Los formularios no tienen protección anti-spam real en producción** hasta
  que lleguen las claves de Turnstile.
