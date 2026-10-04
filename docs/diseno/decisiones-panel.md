# Decisiones del panel de Payload

Registro de las decisiones del trabajo sobre el panel (agente C). Auditoría de
partida: `Desktop\partequipos-cierre\informes\2026-10-02-auditoria-panel.md`.

## 1. Orden 1 de la auditoría (2026-10-02, rama `feat/panel-orden-1`)

Aprobado por dirección: cuatro mejoras sin cambio de esquema.

### 1.1 Marca y tipo coherentes

- **Problema:** modelos de repuesto y equipos nuevos guardan `marca` y `tipo`,
  y el tipo ya pertenece a una marca. El desplegable de tipos solo se filtra si
  la marca se elige antes; cambiarla después dejaba el tipo viejo, sin error.
  La ficha salía con las migas y el JSON-LD de una marca y la URL de otra.
- **Decisión:** se rechaza al guardar, con el mensaje junto a «Tipo de
  equipo»: gancho `marcaDelTipoCoincide`
  (`src/collections/hooks/marcaDelTipo.ts`), en `beforeValidate`. Corre en el
  panel, la API y la API local de los scripts.
- **Descartado:** derivar la marca del tipo y ocultarla. Ahorra un paso, pero
  cambia cómo trabaja el editor y lo aprobado era comprobar.
- **Datos existentes:** 0 filas incoherentes en `development`, `preview` y
  `production` (81 modelos y 38 equipos nuevos en cada una, SQL de solo
  lectura), así que nada ya guardado queda bloqueado.
- **Verificado por efecto** (§10.15) con `npm run qa:marca-tipo` contra
  `development`: crear con tipo de otra marca, y cambiar solo el tipo o solo la
  marca, se rechazan y la base no cambia; crear coherente se guarda. Deja la
  base como estaba.

### 1.2 Ayudas en lenguaje llano

Sin «URL indexada», «redirect 301», «ADR», «JSON-LD», «breadcrumbs» ni «OG» en
lo que lee el editor:

| Dónde                              | Antes                                         | Ahora                                                                                   |
| ---------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| Slug (todas las colecciones)       | «Slug» y la URL indexada, el 301 y el ADR     | «Slug (dirección web)», qué es y a quién pedir el cambio                                |
| Marca en modelos y equipos nuevos  | «Desnormalizada para consultas y breadcrumbs» | Tiene que ser la del tipo; si cambia, volver a elegir el tipo                           |
| Grupo SEO                          | «SEO», «Meta título», «Imagen social (OG)»    | «Buscadores y redes sociales», «Título para buscadores», «Imagen al compartir en redes» |
| Artículos                          | `/{slug}/`, «archivo», «JSON-LD»              | La dirección real, «listado del blog», «la fecha que ven los buscadores»                |
| Permiso de editar slugs            | «redirect 301», «ADR 0005»                    | Qué permite y qué pasa con la dirección antigua                                         |
| Estado del destino (redirecciones) | «`npm run redirects:check`»                   | «el equipo técnico»                                                                     |
| Choque de slug artículo/página     | «espacio de URLs raíz»                        | Las dos viven en `partequipos.com/<slug>/`                                              |

Solo cambian etiquetas y descripciones: ni columnas ni migración (comprobado
con `npm run db:deriva`).

`PaginaInstitucional.ts` (terreno del agente B) quedó fuera; sus textos van
en §3.

### 1.3 Imágenes (`media`)

- Etiqueta «Imagen» / «Imágenes» en vez de «Media»: la colección solo admite
  JPEG, PNG y WebP.
- Columnas: fichero, texto alternativo y fecha, para ver de un vistazo los
  `alt` flojos. Búsqueda por fichero y texto alternativo.
- Descripción con los formatos y para qué sirve el texto alternativo.

### 1.4 Búsqueda por código

`listSearchableFields`: modelos por nombre y código («320D»), equipos nuevos
por nombre y código, equipos usados por nombre, marca y modelo.

## 2. Guía breve del editor (2026-10-02, rama `feat/panel-guia-editor`)

Entregable cotizado del Sprint 4 (`docs/PLAN-MVP.md`): `docs/guia-editor.md`.
Escrita contra el panel después del orden 1 (etiquetas nuevas) y con los
mensajes de error copiados del código. Dice claro lo que hoy no hay:
borradores, historial, recuperación de contraseña por correo y edición del
teléfono y las redes desde el panel.

## 3. Textos de Páginas (2026-10-03, rama `feat/panel-textos-paginas`)

Aprobado por dirección como ayuda del panel. Antes se comprobó que ninguna
rama abierta del agente B toca `PaginaInstitucional.ts` (la única que lo
tocaba, `feat/pagina-nosotros`, ya está fusionada y es idéntica a `main`).

| Dónde          | Antes                                                          | Ahora                                                         |
| -------------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| Colección      | «El slug es la ruta completa… son URLs indexadas»              | Qué páginas hay y por qué no cambiar la ruta de una publicada |
| Campo de ruta  | «Ruta (slug)», «Ej: 'nosotros'…»                               | «Ruta (dirección web)», con los ejemplos entre comillas «»    |
| Tipo de página | «Las legales no deberían despublicarse» (no existe esa acción) | Para qué es «Legal / cumplimiento» y que no se borran         |

**Hallazgo anotado, sin tocar:** a diferencia del resto de colecciones, la
ruta de las páginas **no se bloquea** tras crearlas (es un campo de texto
propio, no `slugField`). **Corregido el 2026-10-03:** este párrafo decía
además que nada creaba el 301; era falso: `revalidarPagina` ya lo crea al
cambiar la ruta. El bloqueo se hizo en §4.

## 4. Ruta de las páginas bloqueada tras crearlas (2026-10-03, rama `feat/panel-slug-paginas`)

Aprobado por dirección. Sin esquema.

- El acceso del slug sale de `slugField` a `slugEditable`
  (`src/lib/fields/slugField.ts`) y se aplica también a la ruta de
  `PaginaInstitucional`: se escribe al crear y, después, solo con el permiso
  «Puede editar slugs ya publicados». El 301 desde la ruta anterior lo crea
  `revalidarPagina`, como antes.
- **Pruebas:** `slugField.test.ts` cubre la regla y que el bloqueo esté
  puesto en `slugField` y en la ruta de las páginas. Quitando el bloqueo, la
  prueba falla.
- **Por efecto** (§10.15), con `npm run qa:slug-paginas` contra
  `development`:
  - Un editor sin el permiso no cambia la ruta: Payload lo descarta en
    silencio y la base no cambia.
  - Con el permiso, sí la cambia, y se crea la redirección.
  - No quedan restos.
  - Quitando el bloqueo, la comprobación sale en rojo.
- `src/payload-types.ts` regenerado: solo cambian comentarios, que recogen
  las descripciones de los PR #46, #48 y de este.
