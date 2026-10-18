# Tarjetas sueltas del catálogo de WordPress, migradas tal cual (2026-10-18)

**Decisión del cliente (2026-10-18):** se migra todo tal como está en WordPress,
aunque parezca un error. Lo pidió dirección tras la auditoría de estructura
(`Desktop\partequipos-cierre\informes\2026-10-17-auditoria-estructura-listados.md`,
puntos 12, 13 y 18). Lo que parece un error va en una lista para el cliente
(`…\informes\2026-10-18-erratas-wordpress-para-el-cliente.md`).

## Qué se importa

Son modelos que en WordPress solo existen como **tarjeta dentro de una página**,
sin ficha propia.

| Página de WordPress                                                                       | Tarjetas                                                   | Destino                                                                                                                              |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `…/nueva/cargadores/` (674)                                                               | CASE W20F, 621E y 821E                                     | `equipos-nuevos`, tipo NUEVO «Cargadores» de Case (`…/marcas/case-construction/cargadores/`), que entra en la categoría «Cargadores» |
| `…/nueva/compactadores/` (825)                                                            | Ammann ARW 65, ARX 26, ARX 45-2, ASC 70, ASC 100 y ARS 122 | Marca NUEVA «Ammann» (`…/marcas/ammann/`), tipo «Vibrocompactadores», que entra en la categoría «Compactadores»                      |
| `…/usada/bulldozer/` (1054)                                                               | Caterpillar D3C y Komatsu D39PX-21                         | `equipos-usados`, categoría «Bulldozer»                                                                                              |
| `…/marcas/aditamentos/excavadoras/` y `…/minicargadores/` (1462 y 1483, catálogo de 2022) | Solo las que no están en el de 2025: el **ahoyador**       | Tipo «minicargadores» de la marca aditamentos                                                                                        |

**Datos:** los de la tarjeta, sin tocar.

- **Ficha técnica:** cada línea «Etiqueta: valor» es una fila.
- **Peso operativo numérico:** se calcula con `pesoOperativoKg`. Corregido: «0.717 TON» son 717 kg, no 717 t.
- **Botón «FICHA TÉCNICA»:** su PDF va a `documentos`.
- **Fotos:** las del carrusel, sin repetidas por huella visual.
- **Nombres:**
  - nuevos: tipo en singular, marca y modelo («Cargador Case Construction W20F»);
  - usados: como los demás («Bulldozer Caterpillar D3C 1996»).
- **Serial:** nunca sale del extractor.

**Aditamentos de 2022 frente a 2025** (`ADITAMENTOS_2022_EN_2025`, en `src/lib/catalogoWp/tarjetas.ts`). El mismo aditamento con otro nombre cuenta como el mismo:

- «Tablero porta horquilla» es el porta pallet;
- «Cadena de metal», las cadenas de llanta;
- «Barredor cucharón», la barredora.

Solo el ahoyador no tiene equivalente. Una tarjeta nueva de 2022 que no esté en la tabla **para el importador**: mejor parar que adivinar.

## Cómo

```
python -I scripts/catalogo-wp/extraer-xml.py <exportacion.xml> Desktop\partequipos-cierre\catalogo-wp-tal-cual.json
npm run preview:catalogo-wp:simular
npm run preview:catalogo-wp:importar
npm run preview:catalogo-wp:retirar    # deshace EXACTAMENTE lo del manifiesto
```

Mismo método que los aditamentos:

- **Manifiesto** fuera del repositorio (`manifiesto-catalogo-wp-<destino>.json`).
- **Idempotente:** volver a importar no duplica nada.
- **Retirada exacta:** devuelve las categorías a sus tipos de antes, borra lo creado y comprueba que los ficheros dan 404.

**Preview:** importado el 2026-10-18:

- 10 nuevos y 2 usados;
- 96 fotos y 9 PDF;
- la marca Ammann y los tipos «Cargadores» (Case) y «Vibrocompactadores» (Ammann).

**Sitio publicado:** con `runbook-catalogo-wp-tal-cual.md` (dirección).
