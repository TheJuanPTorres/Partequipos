# Ruta de desarrollo — trabajo sin dependencias externas

**Contexto:** el proyecto está bloqueado en dos frentes ajenos a nosotros — el
acceso al WordPress actual (migración de contenido) y la entrega del diseño.
Este documento ordena todo lo que sí se puede ejecutar mientras tanto.

**Estado al inicio de esta ruta:** infraestructura completa y desplegada,
repuestos y maquinaria construidos y poblados con datos de demostración,
corporativo construido, SEO íntegro, CI en verde.

---

## Bloque A — Formularios y captación de leads

**Por qué primero:** es el único rubro cotizado que es funcionalidad nueva, y
hoy el sitio no tiene forma de captar un lead — que es el objetivo comercial
del proyecto. No depende de diseño ni de contenido.

**Cotizado:** 15 h (Formularios + Cloudflare Turnstile)

- Formulario de contacto general
- Solicitud de cotización desde ficha de equipo y de modelo
- Protección con Cloudflare Turnstile
- Validación en servidor con Zod
- Estados post-envío en la propia página (sustituyen las 8 URLs de "gracias")
- Persistencia de solicitudes en Payload, consultables por el cliente
- Notificación por correo al recibir una solicitud

**Cierra además:** el grupo D de URLs huérfanas del mapa de redirects.

---

## Bloque B — Lubricantes

**Por qué:** corto, estructura ya conocida por el crawl, cierra una sección
completa del sitio.

- Índice de lubricantes + 4 subsecciones (auto liviano, auto pesado,
  engranajes, motos/scooter)
- Modelo de datos, plantillas, SEO y entrada en el sitemap
- Datos de demostración

**Nota de alcance:** el documento del cliente indicaba 1 página; el crawl
encontró 5. Es la cuarta discrepancia medida.

---

## Bloque C — Redirects 301 en producción

**Por qué:** es el mayor riesgo del lanzamiento y no depende de nadie. El
mecanismo y el mapa ya existen; falta poblarlo y verificarlo.

- Cargar el mapa de redirects generado en la colección Redirects
- Verificar que las URLs antiguas responden 301 hacia su destino
- Resolver las URLs huérfanas que ya tengan destino claro
- Dejar documentada la lista de decisiones pendientes del cliente

---

## Bloque D — Plantillas de blog (sin contenido)

**Por qué:** el molde se puede construir ahora; solo la migración de los 51
artículos depende del acceso a WordPress.

**Cotizado:** 45 h (blog completo, incluido dentro de las 480)

- Colección de artículos con categorías y campos SEO
- Plantilla de listado con paginación
- Plantilla de artículo individual
- JSON-LD tipo Article
- Entrada en el sitemap
- Datos de demostración

**Queda pendiente del acceso:** la migración real de los 51 artículos.

---

## Bloque E — Respaldos automatizados

**Por qué:** está comprometido en el documento de Gestión de Incidencias
entregado al cliente. No depende de nadie.

- Volcado automatizado de base de datos con retención definida
- Sincronización de archivos del Blob
- Prueba de restauración documentada
- Bitácora de respaldos

---

## Bloque F — QA, accesibilidad y rendimiento

**Por qué:** se puede ejecutar sobre lo ya construido. Parte habrá que repetir
cuando llegue el diseño, pero los problemas estructurales se detectan ahora.

**Cotizado:** 45 h

- Auditoría de accesibilidad: contraste, navegación por teclado, orden de
  encabezados, etiquetas y roles
- Medición de Core Web Vitals sobre las plantillas existentes
- Verificación automatizada de las URLs construidas (estado, H1 único,
  canonical, datos estructurados, enlaces internos)
- Revisión de estados de error y vacíos

---

## Bloque G — Acuerdo de diseño (no es código)

**Por qué:** es lo que más tiempo ahorra cuando llegue la entrega del tercero.

- Acordar con el diseñador: paleta, escala tipográfica, escala de espaciado
- Catálogo de componentes que entregará: tarjeta de producto, listado,
  migas de pan, cabecera de categoría, formulario, cabecera y pie
- Confirmar que entregará archivos exportables y editables
- Acordar restricciones de peso y dimensiones de imagen (necesario para
  sostener los umbrales de rendimiento discutidos con el cliente)

---

## Fuera de esta ruta — bloqueado por terceros

| Pendiente                                | Depende de                 |
| ---------------------------------------- | -------------------------- |
| Migración de las ~55 páginas editoriales | Acceso a WordPress         |
| Migración de los 51 artículos de blog    | Acceso a WordPress         |
| Carga de 351 modelos de repuestos reales | CSV del cliente            |
| Carga de 80 fichas de maquinaria reales  | CSV e imágenes del cliente |
| Aplicación del diseño definitivo         | Entrega del diseñador      |
| Textos legales definitivos               | Área jurídica del cliente  |
| Razón social, NIT y URLs de portales     | Definición del cliente     |
| Base de datos en infraestructura propia  | Provisión del cliente      |

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
