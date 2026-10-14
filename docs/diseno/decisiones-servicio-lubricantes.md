# Servicio técnico y Lubricantes ENI — páginas provisionales con el contenido real

Las dos páginas del mapa de alcance que faltaban:

- `/servicio-tecnico/`, con sus anclas;
- `/lubricantes/lubricantes-eni/`.

**PROVISIONALES hasta el diseño de Andrés**, con el lenguaje visual del sitio (el de las páginas de repuestos de D) y el **contenido real** del WordPress actual, sacado de la exportación XML.

**Fuentes:**

- el árbol de Elementor de las seis páginas en el XML (`scripts/servicio-lubricantes/extraer-xml.py`, que salta usuarios y comentarios);
- partequipos.com en vivo;
- el mapa de alcance (`Mapa de Navegación · Partequipos — Alcance de Migración.pdf`, secciones 03 y 04).

Inventario previo y decisiones: `Desktop\partequipos-cierre\propuestas\2026-10-14-servicio-tecnico-lubricantes-inventario.md`.

## 1. Decisiones de dirección (2026-10-14)

1. **Esquema aprobado** para el contenido real completo:
   - productos de lubricante con foto y PDF;
   - ancla en los bloques de página;
   - bloques «Galería» y «Vídeo de YouTube».
2. **Las 4 subpáginas de lubricantes** (auto liviano, auto pesado, engranajes, motos y scooter) pasan a ser **secciones** de la página de la marca, con un **301** de cada URL antigua a su ancla.
3. **Fotos de licencia dudosa: solo en el preview** hasta que confirme el cliente:
   - la galería de siniestros;
   - el banner de Hitachi.
4. **Vídeos:**
   - el de alistamiento, por el de **YouTube del cliente** en lugar del MP4 de 24,6 MB;
   - sin el vídeo de fondo de esa sección (13,5 MB), solo con foto;
   - el de la cabecera (3,1 MB), sí.
5. **Se conserva la cuarta ancla**, `#Siniestros`, además de las tres del mapa.

## 2. Cómo está hecho

| Pieza                                                                                                 | Dónde                                                                                     |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Ancla opcional en **todos** los bloques de página (validada: letra inicial, letras, cifras, «-», «_») | `src/collections/bloques/bloquesPagina.ts`, `src/lib/fields/ancla.ts`                     |
| Bloques nuevos «Galería», «Vídeo de YouTube» y «Formulario de contacto»                               | mismo fichero; componentes en `src/components/bloques/`                                   |
| Productos de lubricante: nombre, grado, grupo, foto y ficha (PDF de `documentos`)                     | `src/collections/CategoriaLubricante.ts`                                                  |
| Imagen de cabecera de la marca de lubricantes                                                         | `src/collections/MarcaLubricante.ts`                                                      |
| Página de la marca: cabecera y tarjetas de D, descripción, una sección por línea y el formulario      | `src/app/(site)/lubricantes/[marca]/page.tsx`, `src/components/lubricantes/`              |
| De los documentos a la vista (agrupar productos seguidos con el mismo grupo)                          | `src/lib/lubricantes/marca.ts` (+ pruebas)                                                |
| El destino de un redirect puede llevar ancla (`/a/b#seccion`)                                         | `normalizarDestino` y `separarAncla` en `src/lib/redirects/normalizar.ts`; `src/proxy.ts` |
| Importación del contenido real (simular, importar, retirar; con manifiesto)                           | `scripts/servicio-lubricantes/extraer-xml.py` e `importar.ts`                             |

**Las categorías de lubricante ya no tienen página:**

- su ruta `[categoria]` se quitó;
- salen del sitemap;
- su «Ver en el sitio» del panel lleva al ancla;
- su bloque SEO avisa de que no tiene página (`seoField({ sinPagina: true })`);
- un cambio en una categoría revalida la página de su marca.

**Servicio técnico se compone con bloques:**

| Bloque                                                              | Ancla          |
| ------------------------------------------------------------------- | -------------- |
| Cabecera con vídeo (el `<h1>`)                                      | —              |
| Presentación con imagen                                             | `taller`       |
| Vídeo de YouTube, con el póster del vídeo de WordPress como portada | `alistamiento` |
| Presentación con imagen                                             | `posventa`     |
| Presentación con imagen, sin foto                                   | `Siniestros`   |
| Galería (solo en el preview)                                        | —              |
| Formulario de contacto                                              | `contacto`     |

Sus «Contenido» y «Secciones con ancla» de demostración se vacían al importar.

## 3. Erratas y desviaciones (para Andrés y el cliente)

| En el sitio actual                                                                                         | Aquí                                                         | Por qué                                                                               |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| «I-RIDE RACING 10W-60» abre la ficha de I-SIGMA PERFORMANCE E7 15W-40                                      | Sin ficha                                                    | Mejor sin ficha que con la de otro producto. **El cliente tiene que mandar la buena** |
| «MULTITECH CT PLUS 10W» abre la ficha de MULTITECH JD/F 10W-30                                             | Sin ficha                                                    | Ídem                                                                                  |
| «I-SINT 10W-40» no tiene ficha                                                                             | Sin ficha                                                    | Ídem                                                                                  |
| Varios productos con la foto de otro (OSO 46 y OSO 100 con la de ALARIA 7, MULTITECH CT con la de I-SIGMA) | Igual                                                        | Es lo que publica el sitio; se anota para el cliente                                  |
| «mOTO & SCOOTER», títulos en mayúsculas escritas a mano                                                    | «Moto & scooter» y títulos con mayúscula inicial             | Erratas; el diseño decide si van en mayúsculas                                        |
| Títulos «¿Tuviste un» + «ACCIDENTE CON TU MAQUINARIA AMARILLA?» en dos encabezados                         | Un solo título                                               | Un encabezado por sección                                                             |
| Subtítulo de la cabecera «Lorem ipsum dolor set amet» y titular animado «Better / Bigger / Faster»         | No se copian                                                 | Texto de relleno del widget                                                           |
| Formulario de lubricantes con «Empresa», «Ciudad» y «¿Qué necesitas?»                                      | El formulario del sitio (nombre, correo, teléfono y mensaje) | Un solo formulario en todo el sitio, con Zod, Turnstile y aviso por SMTP              |
| Servicio técnico sin formulario (solo botones a Contáctanos)                                               | Bloque «Formulario de contacto» al final                     | Lo pide el encargo; su texto es nuestro y se cambia en el panel                       |

**Desviaciones que quedan:**

- **Orden de las líneas:** por nombre (Auto liviano, Auto pesado, Engranajes, Motos & Scooter), porque las categorías no tienen campo de orden. En WordPress, motos va primero.
- **Galería sin visor a pantalla completa:** rejilla 4:3 con el punto focal.
- **Sin vídeos de fondo en alistamiento ni en lubricantes:** decisión 4.

## 4. Fotos de licencia dudosa

Llevan `dudosa: true` en el JSON del extractor e **importar las salta en cualquier destino que no sea el preview**. El bloque o la tarjeta se pinta igual, sin foto.

- Las 7 de la galería de siniestros: miniaturas de YouTube, imágenes de Twitter y una de prensa.
- El banner de Hitachi de posventa.
- **Además, por el mismo criterio:** las fotos de 3 tarjetas de lubricantes. Por su nombre son de banco o de terceros: dos de Freepik y una de DeviantArt.

**Para levantarlo:** el cliente confirma la licencia y se repite la importación en el sitio publicado, que ya no las saltaría si se quitan de `DUDOSAS`.
