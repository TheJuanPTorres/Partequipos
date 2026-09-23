# Exportación de Elementor de la home aprobada (ux-9)

Fuente de verdad de los **valores visuales** de la home: lo que Andrés aprobó
con el cliente. Se lee, no se ejecuta. Análisis en `../analisis-home-ux9.md`;
decisiones en `../decisiones-home-ux9.md`.

| Fichero              | Origen                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| `1717.json`          | `home-page.zip` → `content/page/1717.json` (el kit de Andrés)          |
| `site-settings.json` | `home-page.zip` → `site-settings.json`: colores y tipografías globales |

**Único cambio respecto al original:** el token de Mapbox del globo de sedes
(sección 9) está sustituido por `__MAPBOX_TOKEN__`. Era de la cuenta personal de
Andrés; el sitio usará una cuenta del cliente (ver decisiones, licencia L5).

**Qué NO se copió, y por qué:** los XML de `wp-content/` y el `manifest.json`
del kit (llevan correo, usuario y nombre del autor de WordPress), el resto de
ficheros de la exportación, las imágenes (ver el inventario en las decisiones)
y cualquier fichero de otros clientes.

Los ficheros **no pasan por Prettier** (`.prettierignore`), para poder
compararlos con la exportación original.
