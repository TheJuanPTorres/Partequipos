# Importación del catálogo de repuestos de WordPress

Las marcas, los tipos de equipo y los **modelos de repuestos** del WordPress
actual, con la foto de cada modelo, a `marcas`, `tipos-equipo`,
`modelos-repuesto` y `Media`. Estudio previo y decisiones de dirección:
`Desktop\partequipos-cierre\informes\2026-10-13-repuestos-wordpress-estudio.md`.

> **HOY SOLO HAY SIMULACIÓN (dirección, 2026-10-13).** Los almacenes del Blob
> están bloqueados por el límite de operaciones del plan Hobby: el consumo es
> de 2.240 operaciones avanzadas de 2.000, casi todo de la importación de
> usados del 8 de octubre. El script **no escribe en la base ni en el Blob**.
> La importación real (modos `importar` y `retirar`, por tandas, con
> manifiesto, como los usados) se añade cuando dirección confirme el plan Pro y
> el almacén desbloqueado.

```
npm run preview:repuestos:simular            # lee la base del preview y cuenta
npm run preview:repuestos:simular -- fotos   # además, comprueba las fotos en WordPress
```

## 1. Fuente: páginas de Elementor, extraídas del XML

En WordPress el catálogo **no es un tipo de contenido**: son 435 páginas de
Elementor bajo `/repuestos-maquinaria-pesada-colombia/`. Ninguna tiene campos
ACF, imagen destacada ni taxonomías, así que cada dato sale del árbol de
widgets.

| Paso | Qué                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| 1    | `python -I scripts/repuestos/extraer-xml.py <exportacion.xml> <salida.json>`                                  |
| 2    | La salida va a `Desktop\partequipos-cierre\repuestos-wordpress.json`. **Nunca al repositorio ni a `public/`** |

El extractor **no lee** autores, usuarios ni comentarios (la exportación los
tiene, con correo e IP). De cada página saca solo la **sección principal
visible en escritorio**: la primera sección de primer nivel que no está oculta
en escritorio y lleva un título. Así quedan fuera:

- la copia para móvil (oculta en escritorio);
- lo oculto en los tres tamaños (logo de la marca y una foto de 2024 de fondo);
- los bloques comunes: lista «Repuestos disponibles para…», plantillas
  incrustadas y llamada a WhatsApp.

## 2. Cómo se convierte cada dato

| WordPress                                          | Nuestro campo                   | Regla                                                                                                                                                                                        |
| -------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ruta                                               | marca, tipo, modelo             | Por profundidad bajo `repuestos-maquinaria-pesada-marcas/`. Los slugs, **tal cual** (§3.3)                                                                                                   |
| Nombre de la marca                                 | `marcas.nombre`                 | El de `docs/inventario-repuestos.csv` («Case Construction», no «CASE CONSTRUCTION»)                                                                                                          |
| Título de la página de tipo                        | `tipos-equipo.nombre`           | Sin «Repuestos para maquinaria pesada» ni la marca del final: «Miniexcavadora»                                                                                                               |
| Título de la página de modelo                      | `modelos-repuesto.nombre`       | Sin «Repuestos (para)», con la escritura del cliente: «Excavadora CATERPILLAR 320B». Así el título por defecto del sitio nuevo, «Repuestos {nombre}», es el título de la página en WordPress |
| Lo que sigue a la marca en el nombre               | `codigo`                        | «320B». Con la marca entera o su primera palabra («CASE»). Si no aparece, del slug                                                                                                           |
| Texto de la sección principal                      | `descripcion`                   | **Tal cual** (dirección): texto plano, un párrafo por línea en blanco. Es de plantilla, 43 variantes para 347 modelos                                                                        |
| `<title>` que hoy publica el sitio (`url-map.csv`) | `seo.metaTitle` (tipo y modelo) | Sin el sufijo «- Partequipos» (el sitio nuevo añade « \| Partequipos»). **Vacío si coincide con el título por defecto**                                                                      |
| Meta descripción que hoy publica el sitio          | `seo.metaDescription`           | Tal cual. Es de plantilla, pero lleva el nombre de cada página y es la que ve Google                                                                                                         |
| Imagen de la sección principal                     | `imagenes` (una)                | La primera que no sea genérica. **AVIF → WebP** al importar (dirección), con `sharp`                                                                                                         |
| Texto alternativo del adjunto                      | `alt`                           | Sin restos de numeración («(1)», «-01»). Si queda flojo para `Media` (`motivoAltFlojo`), el nombre del modelo                                                                                |
| Lista «Repuestos disponibles para…»                | —                               | **No es un dato** (dirección): es la misma en todos; la pinta la plantilla                                                                                                                   |
| Fotos de marcas y tipos                            | —                               | No se importan: casi ninguna página las tiene en la sección principal (ninguna de las 13 marcas, 4 de los 32 tipos) y los logos de las marcas del preview se conservan                       |

**Nombre del fichero en `Media`:** `wp-repuesto-<id del adjunto>-<nombre>.<ext>`.
El id del adjunto lo hace único y estable: una foto compartida por dos modelos
se sube una vez, y una segunda ejecución no la vuelve a subir.

**La conversión de AVIF es en la máquina que importa, no en el lambda.**
`Media` sigue sin admitir AVIF (§10.28). El fallo de `libheif` de aquel aviso
afecta a 1.22.0–1.23.1; el `sharp` 0.35.4 del proyecto lleva libheif 1.23.2,
la versión corregida.

## 3. Lo que no se importa

| Qué                                                                                                                                               | Cuántas | Por qué                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Borradores `-copy`                                                                                                                                | 2       | ADR 0004                                                                                                                                         |
| Ammann (marca y su tipo) y PES Parts Equipment Solutions                                                                                          | 3 URL   | Sin modelos. **301 al índice de marcas de repuestos** (dirección, pendiente de confirmar con el cliente). Son 3 filas en `Redirects`, sin código |
| Modelos CASE con un nivel de más (`…/cargador-frontal-case-construction/repuestos-para-maquinaria-pesada-excavadora-case-construction/<modelo>/`) | 4       | No tienen ruta en el sitio nuevo (tres niveles); `docs/redirects-map.csv` las marca huérfanas. Pendiente de decidir                              |
| La imagen de relleno que repiten 23 páginas de modelo                                                                                             | 1       | No es foto del equipo: los 21 modelos que solo tienen esa van sin foto                                                                           |
| Las 32 páginas de categoría técnica                                                                                                               | 32      | Necesitan plantilla y ruta nuevas (fuera de esta tarea; hoy dan 404)                                                                             |

**La página CASE «Excavadora» colocada como modelo** (bajo «Cargador
frontal»): es una página de tipo en el nivel de modelo. Va como modelo
«Excavadora CASE CONSTRUCTION», sin código, para que su URL siga viva; la
simulación lo avisa.

## 4. Lo que da la simulación (preview, 2026-10-13)

| Colección          | En WordPress | Nuevos | Actualizados (ya en el preview, por slug) |
| ------------------ | ------------ | ------ | ----------------------------------------- |
| `marcas`           | 13           | 8      | 5                                         |
| `tipos-equipo`     | 32           | 24     | 8                                         |
| `modelos-repuesto` | 347          | 291    | 56                                        |

- **Modelos:** 325 con foto, 22 sin foto (21 solo con la de relleno, 1 sin
  ninguna); 347 con texto; código sacado del nombre en 346.
- **SEO:** 311 modelos y 18 tipos guardarían su título actual porque difiere
  del título por defecto (p. ej. el título de WordPress dice «Minexcavadora» y
  el `<title>` publicado, «Miniexcavador»). Meta descripción en los 347.
- **En el preview sin equivalente en WordPress:** 4 modelos de la demo. La
  importación no los toca; en producción la demo se vacía antes (§10.6).

### Operaciones del Blob

El adaptador (`@payloadcms/storage-vercel-blob` 3.89.0, `uploadFile.js`) hace
**un `put` por fichero**. `Media` no tiene tamaños derivados y el `put` no va
por partes, así que **cada foto es una operación de subida**.

| Qué                        | Operaciones |
| -------------------------- | ----------- |
| Fotos únicas a subir       | **324**     |
| — de ellas, AVIF a WebP    | 30          |
| Borrados, listados, copias | 0           |

**Con `fotos`:** las 324 responden en WordPress (0 fallos), y las 30 AVIF se
convierten a WebP en memoria sin error: 7,8 MB en AVIF pasan a 4,3 MB en WebP
(calidad 82, mismas medidas). No se guarda nada.

Las lecturas de las fotos al visitar el sitio son operaciones aparte (simples),
no de esta cuenta. Una retirada costaría 324 borrados más.

## 5. Antes de la importación real

1. Dirección confirma el plan Pro y el almacén desbloqueado.
2. Se añaden `importar` (por tandas, con manifiesto) y `retirar`, con el método
   de `scripts/usados/importar-usados.ts`. La simulación se vuelve a ejecutar
   antes de la primera tanda.
3. Verificación: las 394 URL importables en 200 en el preview, ruta a ruta
   (la raíz, el índice de marcas, 13 marcas, 32 tipos y 347 modelos), y las 3
   redirecciones en 301; el sitemap; pintado
   de un modelo con foto, uno sin foto y uno con AVIF a 390 y 1440; el
   verificador.
4. Runbook para la carga definitiva, sin ejecutar.
