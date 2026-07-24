# Sprint 0 — Cimientos · Esqueleto caminante

**Meta del sprint:** una URL en producción que muestre el nombre de una marca
creada desde `/admin`. Poco código, pero elimina de entrada el riesgo de integración.

**Criterio de salida del sprint:** los cuatro criterios de aceptación cumplidos
y verificados en la URL de producción.

> Nota para quien implementa: antes de instalar, **verifica en la documentación
> oficial vigente** el procedimiento actual de Next.js 15 y Payload 3.
> No asumas comandos de memoria: estas herramientas cambian rápido.
> Si el procedimiento real difiere de lo descrito aquí, detente y repórtalo.

---

## Tarea 0.1 — Inicializar el proyecto

**Objetivo**
Crear la base del repositorio con Next.js 15, TypeScript estricto y Tailwind,
con calidad de código configurada desde el primer commit.

**Alcance**
Raíz del repositorio. Archivos de configuración y estructura de carpetas.

**Criterios de aceptación**

- [ ] Next.js 15 con **App Router** (no Pages Router).
- [ ] TypeScript en modo `strict`. Sin `any` permitido.
- [ ] Tailwind CSS configurado y funcionando.
- [ ] ESLint + Prettier configurados y sin errores en `npm run lint`.
- [ ] Estructura de carpetas creada según la sección 4 de `CLAUDE.md`
      (`src/app`, `src/components`, `src/lib`, `src/collections`, `scripts`, `docs`).
- [ ] `.gitignore` incluye `.env*`, `node_modules`, `.next`.
- [ ] `.env.example` con las variables necesarias, **sin valores reales**.
- [ ] `CLAUDE.md` en la raíz y `PLAN-MVP.md` en `docs/`.
- [ ] `npm run build` compila sin errores ni warnings.

**Fuera de alcance**
No instalar Payload todavía. No maquetar. No agregar librerías de UI.

---

## Tarea 0.2 — Integrar Payload y la base de datos

**Objetivo**
Dejar el CMS funcionando dentro del mismo proyecto, conectado a PostgreSQL,
con el panel accesible.

**Alcance**
`payload.config.ts`, `src/collections/`, `src/app/(payload)/`, variables de entorno.

**Criterios de aceptación**

- [ ] Payload 3 integrado en el mismo proyecto Next.js (no como servicio aparte).
- [ ] Adaptador de **PostgreSQL** conectado a Neon.
- [ ] Panel accesible en `/admin` y capaz de crear el primer usuario administrador.
- [ ] Colección `Media` configurada con almacenamiento en Vercel Blob.
- [ ] Colección `Marca` con los campos mínimos:
      `nombre` (texto, obligatorio), `slug` (texto, único, obligatorio),
      `descripcion` (texto largo), `logo` (relación a Media).
- [ ] El `slug` se genera automáticamente desde `nombre` y es editable.
- [ ] Tipos de Payload generados (`payload-types.ts`) y versionados en el repo.
- [ ] Credenciales solo en variables de entorno. Nada de secretos en el código.

**Fuera de alcance**
No crear `TipoEquipo` ni `ModeloRepuesto` — eso es Sprint 1.
No construir páginas públicas todavía.

---

## Tarea 0.3 — Esqueleto caminante

**Objetivo**
Demostrar que el flujo completo funciona: dato creado en el panel → leído en
el servidor → renderizado en HTML.

**Alcance**
`src/app/(site)/`, `src/lib/queries/`.

**Criterios de aceptación**

- [ ] Ruta pública temporal que lista las marcas existentes.
- [ ] Los datos se obtienen con la **API local de Payload** (`payload.find`),
      no por HTTP y no desde el cliente.
- [ ] La consulta vive en `src/lib/queries/`, no dentro del componente.
- [ ] Es un **Server Component**. Sin `"use client"`.
- [ ] El contenido aparece en el HTML inicial
      (verificable con “ver código fuente”, no solo en el inspector).
- [ ] Maneja el caso de lista vacía sin romperse.
- [ ] Sin estilos elaborados: basta legible y ordenado.

**Fuera de alcance**
No es la página final de marcas. Es una prueba de integración desechable.
No implementar SEO, metadata ni ISR todavía.

---

## Tarea 0.4 — Despliegue y observabilidad

**Objetivo**
Dejar el proyecto desplegado y monitoreado, con despliegues automáticos.

**Alcance**
Configuración de Vercel, Sentry y variables de entorno de producción.

**Criterios de aceptación**

- [ ] Proyecto conectado al repositorio en Vercel.
- [ ] `push` a `main` despliega a producción automáticamente.
- [ ] Cada rama genera su despliegue de vista previa.
- [ ] Variables de entorno cargadas en Vercel (nunca en el repositorio).
- [ ] `/admin` accesible y funcional en producción.
- [ ] Sentry capturando errores de servidor y de cliente.
- [ ] `README.md` con: cómo levantar el proyecto en local, variables requeridas
      y cómo se despliega.

**Fuera de alcance**
No configurar dominio propio todavía. No optimizar rendimiento.

---

## Verificación de cierre del sprint

Antes de dar el sprint por terminado, comprobar en la **URL de producción**:

1. `/admin` permite iniciar sesión y crear una marca con logo.
2. La ruta pública muestra esa marca recién creada.
3. El nombre de la marca aparece en el HTML de origen.
4. Un error provocado a propósito llega a Sentry.
5. `npm run build` y `npm run lint` pasan limpios.

Si algo falla, **no se avanza al Sprint 1**. Los cimientos torcidos se pagan
caro en el mes tres.
