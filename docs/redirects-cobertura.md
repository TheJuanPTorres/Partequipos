# Cobertura de redirects para la migración

Generado: 2026-07-29T03:53:39.710Z

Fuente: `docs/url-map.csv` (rastreo propio del sitio en producción).
Salida: `docs/redirects-map.csv`. Regenerable con `npm run redirects:map`.

> **Nada de esto se ha cargado en Payload.** El mapa se valida primero; la carga es un paso aparte.

## 1. Resumen

| Situación | URLs | % |
| --- | ---: | ---: |
| **Ruta conservada** (no necesita redirect) | 398 | 61.4 % |
| **Con destino propuesto** (necesita redirect) | 2 | 0.3 % |
| **Huérfanas** (sin destino, decisión humana) | 248 | 38.3 % |
| **Total rastreado** | **648** | 100 % |

### Por nivel de confianza

| Confianza | URLs | Significado |
| --- | ---: | --- |
| **alta** | 398 | La ruta es idéntica en el sitio nuevo. Sin redirect. |
| **media** | 2 | Transformación predecible y verificada contra el rastreo. |
| **baja** | 248 | Sin destino evidente. **Requiere decisión humana.** |

## 2. Validaciones automáticas

- **Bucles (A → A):** ninguno ✅
- **Cadenas (A → B → C):** ninguno ✅
- **Destinos que no existen en la estructura nueva:** ninguno ✅
- **Orígenes duplicados (dos reglas para la misma URL):** ninguno ✅
- **URLs de catálogo más profundas que el modelo Marca→Tipo→Modelo:** 4 ⚠️
  - `/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-case-construction/repuestos-para-maquinaria-pesada-cargador-frontal-case-construction/repuestos-para-maquinaria-pesada-excavadora-case-construction/repuestos-excavadora-case-construction-cx210b`
  - `/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-case-construction/repuestos-para-maquinaria-pesada-cargador-frontal-case-construction/repuestos-para-maquinaria-pesada-excavadora-case-construction/repuestos-excavadora-case-construction-cx220c`
  - `/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-case-construction/repuestos-para-maquinaria-pesada-cargador-frontal-case-construction/repuestos-para-maquinaria-pesada-excavadora-case-construction/repuestos-excavadora-case-construction-cx350b`
  - `/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-case-construction/repuestos-para-maquinaria-pesada-cargador-frontal-case-construction/repuestos-para-maquinaria-pesada-excavadora-case-construction/repuestos-excavadora-case-construction-cx350c`

  Tienen **dos niveles de tipo anidados** (`…/cargador-frontal-…/excavadora-…/modelo`), algo que el modelo de datos no contempla. Se comprobó que el tipo interior **no existe** como rama propia en el rastreo, así que **no hay destino demostrable** y quedan como huérfanas. Es una anomalía de catalogación del sitio origen, del mismo tipo que el caso Bobcat del ADR 0004.

## 3. URLs huérfanas por sección

### maquinaria — 122 URLs

**Recomendación:** **Fuera del alcance del MVP.** Decidir con el cliente: si la sección se migra en una fase posterior, mantener las URLs y no redirigir todavía; si no se migra, redirigir al índice de repuestos o a la home. No redirigir a repuestos por defecto: la intención de búsqueda (comprar maquinaria) no es la misma que repuestos.

<details><summary><code>/maquinaria-pesada/maquinaria-pesada-nueva</code> — 109 URLs</summary>

- `/maquinaria-pesada/maquinaria-pesada-nueva`
- `/maquinaria-pesada/maquinaria-pesada-nueva/cargadores`
- `/maquinaria-pesada/maquinaria-pesada-nueva/compactadores`
- `/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras`
- `/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras-propuesta2025`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/aditamentos`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/excavadoras`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/minicargadores`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/bulldozer`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/bulldozer/bulldozer-case-construction-1150l`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/bulldozer/bulldozer-case-construction-1150m`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/bulldozer/bulldozer-case-construction-1150m-tier4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/bulldozer/bulldozer-case-construction-1650l`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/bulldozer/bulldozer-case-construction-1650m`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/bulldozer/bulldozer-case-construction-1650m-tier4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/bulldozer/bulldozer-case-construction-2050m`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/bulldozer/bulldozer-case-construction-2050m-tier4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/excavadoras`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/excavadoras/excavadora-case-construction-cx-130d-tier4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/excavadoras/excavadora-case-construction-cx-210d-tier4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/excavadoras/excavadora-case-construction-cx-350d-tier4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/excavadoras/excavadora-case-construction-cx130c`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/excavadoras/excavadora-case-construction-cx220c`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/excavadoras/excavadora-case-construction-cx350c`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/minicargadores-case`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/minicargadores-case/minicargador-case-construction-sr175b`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/minicargadores-case/minicargador-case-construction-sr175b-tier4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/minicargadores-case/minicargador-case-construction-sr200b`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/minicargadores-case/minicargador-case-construction-sr210b-tier4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/minicargadores-case/minicargador-case-construction-sr220b`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/minicargadores-case/minicargador-case-construction-sr240b-tier4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/minicargadores-case/minicargador-case-construction-sr250b`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/minicargadores-case/minicargador-case-construction-sr270b-tier4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/motoniveladoras-case`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/motoniveladoras-case/motoniveladora-case-construction-836d`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/motoniveladoras-case/motoniveladora-case-construction-845b`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/motoniveladoras-case/motoniveladora-case-construction-845c-tier-4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/motoniveladoras-case/motoniveladora-case-construction-865b`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/motoniveladoras-case/motoniveladora-case-construction-865c-tier-4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/retrocargadora-case-construction-570st`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/retrocargadora-case-construction-575sv`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/retrocargadora-case-construction-580n`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/retrocargadora-case-construction-580n-tier4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/retrocargadora-case-construction-580sn`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/retrocargadora-case-construction-580sv-tier4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/retrocargadora-case-construction-590sn`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/retrocargadoras/retrocargadora-case-construction-851-fx-tier4`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/case-construction/vibrocompactador-case-sv208`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-de-llantas-dynapac`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-de-llantas-dynapac/compactador-de-llantas-dynapac-cp1200`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-de-llantas-dynapac/compactador-de-llantas-dynapac-cp2100`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-de-llantas-dynapac/compactador-de-llantas-dynapac-cp28`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-de-suelo-dynapac`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-de-suelo-dynapac/compactador-de-suelo-dynapac-ca1300d`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-de-suelo-dynapac/compactador-de-suelo-dynapac-ca1500d`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-de-suelo-dynapac/compactador-de-suelo-dynapac-ca15d`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-de-suelo-dynapac/compactador-de-suelo-dynapac-ca25d`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-de-suelo-dynapac/compactador-de-suelo-dynapac-ca35d`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-doble-rodillo-dynapac`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-doble-rodillo-dynapac/compactador-doble-rodillo-dynapac-cc1200-vi`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-doble-rodillo-dynapac/compactador-doble-rodillo-dynapac-cc1300-vi`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-doble-rodillo-dynapac/compactador-doble-rodillo-dynapac-cc1400-vi`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-doble-rodillo-dynapac/compactador-doble-rodillo-dynapac-cc2200-vi`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-doble-rodillo-dynapac/compactador-doble-rodillo-dynapac-cc3200-vi`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-doble-rodillo-dynapac/compactador-doble-rodillo-dynapac-cc4000-vi`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactador-doble-rodillo-dynapac/compactador-doble-rodillo-dynapac-cc900`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/compactadores`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/pavimentadoras`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/pavimentadoras-dynapac`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/pavimentadoras-dynapac/pavimentadora-dynapac-f1800c`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/pavimentadoras-dynapac/pavimentadora-dynapac-f80w`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/pavimentadoras-dynapac/pavimentadora-dynapac-sd2500c`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/reglas-dynapac`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/reglas-dynapac/regla-dynapac-v3500-vte`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/reglas-dynapac/regla-dynapac-v5100-vte`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac/reglas-dynapac/regla-dynapac-v6000-vte`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/excavadora-hitachi-zx130-5b`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/excavadora-hitachi-zx130-5g`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/excavadora-hitachi-zx200lc-5g`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/excavadora-hitachi-zx210lc-5b`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/excavadora-hitachi-zx350lc-5b`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/excavadora-hitachi-zx490-7g`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/excavadora-hitachi-zx690lc-6`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/excavadora-hitachi-zx690lc-7h`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/excavadora-hitachi-zx75us-5n`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/excavadora-hitachi-zx75us-7`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/excavadora-hitachi-zx85usb-5n`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/excavadora-hitachi-zx890lc-6`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/excavadora-hitachi-zx890lc-7h`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/miniexcavadora-hitachi-zx17u-5n`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/miniexcavadora-hitachi-zx30u-5n`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/miniexcavadora-hitachi-zx35u-5n`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/miniexcavadora-hitachi-zx50u-5n`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/hitachi/excavadoras-hitachi/miniexcavadora-hitachi-zx60usb-5n`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/yanmar`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/yanmar/miniexcavadoras`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/yanmar/miniexcavadoras/miniexcavadora-yanmar-vio17`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/yanmar/miniexcavadoras/miniexcavadora-yanmar-vio35-7`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/yanmar/miniexcavadoras/miniexcavadora-yanmar-vio50-6`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/yanmar/miniexcavadoras/miniexcavadora-yanmar-vio50-6a`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/yanmar/miniexcavadoras/miniexcavadora-yanmar-vio55-6`
- `/maquinaria-pesada/maquinaria-pesada-nueva/marcas/yanmar/miniexcavadoras/miniexcavadora-yanmar-vio80-1`

</details>

<details><summary><code>/maquinaria-pesada/maquinaria-pesada-usada</code> — 10 URLs</summary>

- `/maquinaria-pesada/maquinaria-pesada-usada`
- `/maquinaria-pesada/maquinaria-pesada-usada/bulldozer`
- `/maquinaria-pesada/maquinaria-pesada-usada/cargadores`
- `/maquinaria-pesada/maquinaria-pesada-usada/compactadores`
- `/maquinaria-pesada/maquinaria-pesada-usada/excavadoras`
- `/maquinaria-pesada/maquinaria-pesada-usada/excavadoras4`
- `/maquinaria-pesada/maquinaria-pesada-usada/minicargadores`
- `/maquinaria-pesada/maquinaria-pesada-usada/motoniveladoras`
- `/maquinaria-pesada/maquinaria-pesada-usada/retrocargadoras`
- `/maquinaria-pesada/maquinaria-pesada-usada/vibrocompactadores`

</details>

<details><summary><code>/maquinaria-pesada</code> — 1 URLs</summary>

- `/maquinaria-pesada`

</details>

<details><summary><code>/maquinaria-pesada/maquinaria-pesada-usada-otros</code> — 1 URLs</summary>

- `/maquinaria-pesada/maquinaria-pesada-usada-otros`

</details>

<details><summary><code>/maquinaria-pesada/test</code> — 1 URLs</summary>

- `/maquinaria-pesada/test`

</details>

### blog — 51 URLs

**Recomendación:** **Requiere migración de contenido**, no solo de URLs (hallazgo del crawl: 51 artículos vivos). Cada artículo necesita su equivalente 1:1. Redirigir todo el blog a un índice destruiría el posicionamiento de long tail, que suele ser su mayor aporte.

<details><summary><code>/beneficios-operativos-de-los-motores-tier-4-en-maquinaria-pesada</code> — 1 URLs</summary>

- `/beneficios-operativos-de-los-motores-tier-4-en-maquinaria-pesada`

</details>

<details><summary><code>/bombas-de-alta-presion-para-que-sirven-donde-se-usan-y-que-opciones-encuentras-en-partequipos</code> — 1 URLs</summary>

- `/bombas-de-alta-presion-para-que-sirven-donde-se-usan-y-que-opciones-encuentras-en-partequipos`

</details>

<details><summary><code>/case-construction-en-colombia-tecnologia-de-clase-mundial</code> — 1 URLs</summary>

- `/case-construction-en-colombia-tecnologia-de-clase-mundial`

</details>

<details><summary><code>/case-construction-mas-de-40-anos-construyendo-obras-en-colombia</code> — 1 URLs</summary>

- `/case-construction-mas-de-40-anos-construyendo-obras-en-colombia`

</details>

<details><summary><code>/como-identificar-la-talla-de-mi-diente-o-punta</code> — 1 URLs</summary>

- `/como-identificar-la-talla-de-mi-diente-o-punta`

</details>

<details><summary><code>/como-medir-y-sustituir-las-orugas-de-caucho</code> — 1 URLs</summary>

- `/como-medir-y-sustituir-las-orugas-de-caucho`

</details>

<details><summary><code>/como-prepararse-para-la-transicion-a-motores-tier-4-en-colombia</code> — 1 URLs</summary>

- `/como-prepararse-para-la-transicion-a-motores-tier-4-en-colombia`

</details>

<details><summary><code>/consecuencias-de-ignorar-el-mantenimiento-en-sistemas-hidraulicos-de-maquinaria-pesada-en-colombia</code> — 1 URLs</summary>

- `/consecuencias-de-ignorar-el-mantenimiento-en-sistemas-hidraulicos-de-maquinaria-pesada-en-colombia`

</details>

<details><summary><code>/consejos-esenciales-para-la-compra-maquinaria-pesada-en-colombia</code> — 1 URLs</summary>

- `/consejos-esenciales-para-la-compra-maquinaria-pesada-en-colombia`

</details>

<details><summary><code>/control-de-valvulas-la-maestria-en-operaciones-precisas-de-maquinaria-pesada-en-colombia</code> — 1 URLs</summary>

- `/control-de-valvulas-la-maestria-en-operaciones-precisas-de-maquinaria-pesada-en-colombia`

</details>

<details><summary><code>/cuidado-del-motor-en-la-maquinaria-pesada-en-colombia</code> — 1 URLs</summary>

- `/cuidado-del-motor-en-la-maquinaria-pesada-en-colombia`

</details>

<details><summary><code>/cuidado-del-tren-de-rodaje-en-excavadoras-y-bulldozer-guia-practica-para-reducir-costos-operativos</code> — 1 URLs</summary>

- `/cuidado-del-tren-de-rodaje-en-excavadoras-y-bulldozer-guia-practica-para-reducir-costos-operativos`

</details>

<details><summary><code>/descubre-los-beneficios-de-usar-filtros-donaldson-en-tu-maquinaria-pesada</code> — 1 URLs</summary>

- `/descubre-los-beneficios-de-usar-filtros-donaldson-en-tu-maquinaria-pesada`

</details>

<details><summary><code>/dientes-cuchillas-y-esquineras-pilares-de-rendimiento-en-maquinaria-pesada-colombiana</code> — 1 URLs</summary>

- `/dientes-cuchillas-y-esquineras-pilares-de-rendimiento-en-maquinaria-pesada-colombiana`

</details>

<details><summary><code>/dynapac-partequipos-maquinaria-de-compactacion-y-pavimentacion</code> — 1 URLs</summary>

- `/dynapac-partequipos-maquinaria-de-compactacion-y-pavimentacion`

</details>

<details><summary><code>/el-corazon-hidraulico-importancia-vital-de-las-bombas-en-maquinaria-pesada-en-colombia</code> — 1 URLs</summary>

- `/el-corazon-hidraulico-importancia-vital-de-las-bombas-en-maquinaria-pesada-en-colombia`

</details>

<details><summary><code>/el-origen-de-hitachi-construction-machinery</code> — 1 URLs</summary>

- `/el-origen-de-hitachi-construction-machinery`

</details>

<details><summary><code>/excavadoras-funciones-partes-marcas</code> — 1 URLs</summary>

- `/excavadoras-funciones-partes-marcas`

</details>

<details><summary><code>/excavadoras-hitachi-en-colombia-evolucion-potencia-y-confianza-total-con-partequipos</code> — 1 URLs</summary>

- `/excavadoras-hitachi-en-colombia-evolucion-potencia-y-confianza-total-con-partequipos`

</details>

<details><summary><code>/excavadoras-repuestos-rendimiento-sinigual</code> — 1 URLs</summary>

- `/excavadoras-repuestos-rendimiento-sinigual`

</details>

<details><summary><code>/explorando-la-importancia-del-tren-de-rodaje-en-excavadoras-y-bulldozer-maquinaria-pesada</code> — 1 URLs</summary>

- `/explorando-la-importancia-del-tren-de-rodaje-en-excavadoras-y-bulldozer-maquinaria-pesada`

</details>

<details><summary><code>/filtros-maquinaria-amarilla-protege-tu-maquina</code> — 1 URLs</summary>

- `/filtros-maquinaria-amarilla-protege-tu-maquina`

</details>

<details><summary><code>/fuga-de-aceite-en-maquinaria-pesada-sintomas-causas-y-repuestos-hidraulicos</code> — 1 URLs</summary>

- `/fuga-de-aceite-en-maquinaria-pesada-sintomas-causas-y-repuestos-hidraulicos`

</details>

<details><summary><code>/herramientas-de-corte-y-proteccion-del-balde-estrategias-para-la-eficiencia-y-durabilidad</code> — 1 URLs</summary>

- `/herramientas-de-corte-y-proteccion-del-balde-estrategias-para-la-eficiencia-y-durabilidad`

</details>

<details><summary><code>/hitachi-yanmar-y-case-la-trilogia-representada-por-partequipos</code> — 1 URLs</summary>

- `/hitachi-yanmar-y-case-la-trilogia-representada-por-partequipos`

</details>

<details><summary><code>/la-importancia-de-las-arandelas-bujes-y-pasadores-en-la-maquinaria-pesada-en-colombia</code> — 1 URLs</summary>

- `/la-importancia-de-las-arandelas-bujes-y-pasadores-en-la-maquinaria-pesada-en-colombia`

</details>

<details><summary><code>/lubricantes-calidad-especificaciones-y-caracteristicas-de-productos</code> — 1 URLs</summary>

- `/lubricantes-calidad-especificaciones-y-caracteristicas-de-productos`

</details>

<details><summary><code>/mantenimiento-esencial-sistemas-hidraulicos-en-maquinaria-pesada-en-colombia</code> — 1 URLs</summary>

- `/mantenimiento-esencial-sistemas-hidraulicos-en-maquinaria-pesada-en-colombia`

</details>

<details><summary><code>/mantenimiento-preventivo-de-excavadoras</code> — 1 URLs</summary>

- `/mantenimiento-preventivo-de-excavadoras`

</details>

<details><summary><code>/martillos-hidraulicos-recomendaciones-de-uso</code> — 1 URLs</summary>

- `/martillos-hidraulicos-recomendaciones-de-uso`

</details>

<details><summary><code>/mineria-construccion-infraestructura</code> — 1 URLs</summary>

- `/mineria-construccion-infraestructura`

</details>

<details><summary><code>/minicargadores-pequenos-gigantes-de-la-construccion</code> — 1 URLs</summary>

- `/minicargadores-pequenos-gigantes-de-la-construccion`

</details>

<details><summary><code>/miniexcavadoras-yanmar-compactas-pero-poderosas</code> — 1 URLs</summary>

- `/miniexcavadoras-yanmar-compactas-pero-poderosas`

</details>

<details><summary><code>/miniexcavadoras-yanmar-en-colombia-tecnologia-100-japonesa-con-representacion-oficial-de-partequipos-s-a-s</code> — 1 URLs</summary>

- `/miniexcavadoras-yanmar-en-colombia-tecnologia-100-japonesa-con-representacion-oficial-de-partequipos-s-a-s`

</details>

<details><summary><code>/moto-reductor-de-traslacion-de-excavadora-sintomas-de-falla-y-cuando-revisarlo</code> — 1 URLs</summary>

- `/moto-reductor-de-traslacion-de-excavadora-sintomas-de-falla-y-cuando-revisarlo`

</details>

<details><summary><code>/motores-diesel-en-maquinaria-pesada-en-colombia-potencia-y-eficiencia-unidas</code> — 1 URLs</summary>

- `/motores-diesel-en-maquinaria-pesada-en-colombia-potencia-y-eficiencia-unidas`

</details>

<details><summary><code>/motores-diesel-la-esencia-inquebrantable-de-la-maquinaria-pesada-en-colombia</code> — 1 URLs</summary>

- `/motores-diesel-la-esencia-inquebrantable-de-la-maquinaria-pesada-en-colombia`

</details>

<details><summary><code>/motorreductores-de-translacion-y-giro-la-danza-perfecta-para-la-movilidad-en-la-maquinaria-pesada-en-colombia</code> — 1 URLs</summary>

- `/motorreductores-de-translacion-y-giro-la-danza-perfecta-para-la-movilidad-en-la-maquinaria-pesada-en-colombia`

</details>

<details><summary><code>/nok-sellos-especiales-para-maquinaria-pesada-y-sistemas-hidraulicos</code> — 1 URLs</summary>

- `/nok-sellos-especiales-para-maquinaria-pesada-y-sistemas-hidraulicos`

</details>

<details><summary><code>/nueva-regulacion-tier-4-en-colombia-lo-que-debes-saber</code> — 1 URLs</summary>

- `/nueva-regulacion-tier-4-en-colombia-lo-que-debes-saber`

</details>

<details><summary><code>/nuevo-motor-estacionario-dongfeng-cummins-6ct8-3-240hp</code> — 1 URLs</summary>

- `/nuevo-motor-estacionario-dongfeng-cummins-6ct8-3-240hp`

</details>

<details><summary><code>/partequipos-distribuidor-oficial-de-handok-hydraulic-en-colombia</code> — 1 URLs</summary>

- `/partequipos-distribuidor-oficial-de-handok-hydraulic-en-colombia`

</details>

<details><summary><code>/por-que-tu-maquinaria-tier-4-necesita-urea-automotriz-def</code> — 1 URLs</summary>

- `/por-que-tu-maquinaria-tier-4-necesita-urea-automotriz-def`

</details>

<details><summary><code>/radiadores-y-enfriadores-el-equilibrio-termico-en-la-maquinaria-pesada-colombiana</code> — 1 URLs</summary>

- `/radiadores-y-enfriadores-el-equilibrio-termico-en-la-maquinaria-pesada-colombiana`

</details>

<details><summary><code>/radiadores-y-enfriadores-en-la-maquinaria-pesada-en-colombia</code> — 1 URLs</summary>

- `/radiadores-y-enfriadores-en-la-maquinaria-pesada-en-colombia`

</details>

<details><summary><code>/retroexcavadoras-la-maquina-todoterreno-por-excelencia</code> — 1 URLs</summary>

- `/retroexcavadoras-la-maquina-todoterreno-por-excelencia`

</details>

<details><summary><code>/tier-4-en-colombia-que-es-y-como-impacta-la-maquinaria-pesada</code> — 1 URLs</summary>

- `/tier-4-en-colombia-que-es-y-como-impacta-la-maquinaria-pesada`

</details>

<details><summary><code>/tipos-de-cucharones-de-servicio-para-excavadora</code> — 1 URLs</summary>

- `/tipos-de-cucharones-de-servicio-para-excavadora`

</details>

<details><summary><code>/tornamesa-de-excavadora-sintomas-de-falla-y-cuando-cambiarla</code> — 1 URLs</summary>

- `/tornamesa-de-excavadora-sintomas-de-falla-y-cuando-cambiarla`

</details>

<details><summary><code>/usas-la-grasa-correcta</code> — 1 URLs</summary>

- `/usas-la-grasa-correcta`

</details>

<details><summary><code>/variables-que-afectan-la-vida-util-del-tren-de-rodaje-en-excavadoras-y-bulldozer-en-la-maquinaria-pesada-en-colombia</code> — 1 URLs</summary>

- `/variables-que-afectan-la-vida-util-del-tren-de-rodaje-en-excavadoras-y-bulldozer-en-la-maquinaria-pesada-en-colombia`

</details>

### repuestos — 36 URLs

**Recomendación:** **Construir las páginas de categorías técnicas.** La colección `CategoriaTecnica` ya está modelada (Sprint 1) pero no tiene rutas públicas. Son URLs del núcleo del negocio y con tráfico: redirigirlas al índice sería perder su posicionamiento específico. Si finalmente no se construyen, redirigir al índice de repuestos.

<details><summary><code>/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada</code> — 32 URLs</summary>

- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/aditamentos-para-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/baldes-y-protectores`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/baldes-y-protectores/baldes-para-excavadoras`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/baldes-y-protectores/motores-nuevo`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/componentes-electricos`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/componentes-hidraulicos-para-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/componentes-mayores-para-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/componentes-para-motores-diesel`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/elementos-de-ajuste`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/empaquetaduras`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtracion-para-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtracion-para-maquinaria-pesada/filtros-donaldson-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtros-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtros-maquinaria-pesada/filtros-fleetguard`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/herramienta-de-corte-gets-para-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/herramientas-de-corte`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/llantas`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/llantas-y-rines-para-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/llantas/llantas-otr`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/lubricantes-para-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/mangueras-para-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/miscelaneos-para-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/motor-diesel-para-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/motores-diesel-completos`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/productos`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/servicio-tecnico-para-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/transmision-para-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/tren-de-rodaje`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/tren-de-rodaje-para-maquinaria-pesada`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/tren-de-rodaje/tren-de-rodaje-cf`
- `/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/tren-de-rodaje/tren-de-rodaje-itr`

</details>

<details><summary><code>/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas</code> — 4 URLs</summary>

- `/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-case-construction/repuestos-para-maquinaria-pesada-cargador-frontal-case-construction/repuestos-para-maquinaria-pesada-excavadora-case-construction/repuestos-excavadora-case-construction-cx210b`
- `/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-case-construction/repuestos-para-maquinaria-pesada-cargador-frontal-case-construction/repuestos-para-maquinaria-pesada-excavadora-case-construction/repuestos-excavadora-case-construction-cx220c`
- `/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-case-construction/repuestos-para-maquinaria-pesada-cargador-frontal-case-construction/repuestos-para-maquinaria-pesada-excavadora-case-construction/repuestos-excavadora-case-construction-cx350b`
- `/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/repuestos-para-maquinaria-pesada-case-construction/repuestos-para-maquinaria-pesada-cargador-frontal-case-construction/repuestos-para-maquinaria-pesada-excavadora-case-construction/repuestos-excavadora-case-construction-cx350c`

</details>

### corporativo — 33 URLs

**Recomendación:** **Páginas institucionales** (nosotros, contacto, políticas, etc.). Son pocas y de destino evidente una vez construidas: mapear 1:1 cuando existan. Varias son de cumplimiento legal (tratamiento de datos, garantías) y no deberían quedar en 404.

<details><summary><code>/blog-partequipos</code> — 1 URLs</summary>

- `/blog-partequipos`

</details>

<details><summary><code>/codigo-de-etica-partequipos</code> — 1 URLs</summary>

- `/codigo-de-etica-partequipos`

</details>

<details><summary><code>/competencia_nacional_de_operadores</code> — 1 URLs</summary>

- `/competencia_nacional_de_operadores`

</details>

<details><summary><code>/congreso-de-alcaldes</code> — 1 URLs</summary>

- `/congreso-de-alcaldes`

</details>

<details><summary><code>/contactanos</code> — 1 URLs</summary>

- `/contactanos`

</details>

<details><summary><code>/elementor-48399</code> — 1 URLs</summary>

- `/elementor-48399`

</details>

<details><summary><code>/excavadoras</code> — 1 URLs</summary>

- `/excavadoras`

</details>

<details><summary><code>/gracias_por_tu_confianza</code> — 1 URLs</summary>

- `/gracias_por_tu_confianza`

</details>

<details><summary><code>/gracias-a-ti</code> — 1 URLs</summary>

- `/gracias-a-ti`

</details>

<details><summary><code>/gracias-dynapac</code> — 1 URLs</summary>

- `/gracias-dynapac`

</details>

<details><summary><code>/gracias-hitachi</code> — 1 URLs</summary>

- `/gracias-hitachi`

</details>

<details><summary><code>/gracias-por-participar</code> — 1 URLs</summary>

- `/gracias-por-participar`

</details>

<details><summary><code>/gracias-por-tu-confianza</code> — 1 URLs</summary>

- `/gracias-por-tu-confianza`

</details>

<details><summary><code>/gracias-por-tu-registro</code> — 1 URLs</summary>

- `/gracias-por-tu-registro`

</details>

<details><summary><code>/gracias</code> — 1 URLs</summary>

- `/gracias`

</details>

<details><summary><code>/inicio2025</code> — 1 URLs</summary>

- `/inicio2025`

</details>

<details><summary><code>/landing-dynapac</code> — 1 URLs</summary>

- `/landing-dynapac`

</details>

<details><summary><code>/lanzamiento_excavadoras</code> — 1 URLs</summary>

- `/lanzamiento_excavadoras`

</details>

<details><summary><code>/lubricantes-eni</code> — 1 URLs</summary>

- `/lubricantes-eni`

</details>

<details><summary><code>/nosotros</code> — 1 URLs</summary>

- `/nosotros`

</details>

<details><summary><code>/nosotros/trabaja-con-nosotros</code> — 1 URLs</summary>

- `/nosotros/trabaja-con-nosotros`

</details>

<details><summary><code>/noticias</code> — 1 URLs</summary>

- `/noticias`

</details>

<details><summary><code>/openhouse</code> — 1 URLs</summary>

- `/openhouse`

</details>

<details><summary><code>/participa-openhouse</code> — 1 URLs</summary>

- `/participa-openhouse`

</details>

<details><summary><code>/pe-partsshop</code> — 1 URLs</summary>

- `/pe-partsshop`

</details>

<details><summary><code>/politica-de-garantia-de-repuestos</code> — 1 URLs</summary>

- `/politica-de-garantia-de-repuestos`

</details>

<details><summary><code>/premios-open-house</code> — 1 URLs</summary>

- `/premios-open-house`

</details>

<details><summary><code>/referenciacion-openhouse-2025</code> — 1 URLs</summary>

- `/referenciacion-openhouse-2025`

</details>

<details><summary><code>/repuestos-para-maquinaria-pesada-2</code> — 1 URLs</summary>

- `/repuestos-para-maquinaria-pesada-2`

</details>

<details><summary><code>/repuestos-para-maquinaria-pesada</code> — 1 URLs</summary>

- `/repuestos-para-maquinaria-pesada`

</details>

<details><summary><code>/servicio-tecnico</code> — 1 URLs</summary>

- `/servicio-tecnico`

</details>

<details><summary><code>/terminos-y-condiciones-campana-bonos-de-recompra</code> — 1 URLs</summary>

- `/terminos-y-condiciones-campana-bonos-de-recompra`

</details>

<details><summary><code>/tratamiento-de-datos</code> — 1 URLs</summary>

- `/tratamiento-de-datos`

</details>

### otro — 6 URLs

**Recomendación:** **Revisar caso por caso.** Incluye taxonomías de WordPress y la subsección de lubricantes ENI, que tienen estructura propia.

<details><summary><code>/lubricantes/lubricantes-eni</code> — 5 URLs</summary>

- `/lubricantes/lubricantes-eni`
- `/lubricantes/lubricantes-eni/auto-liviano`
- `/lubricantes/lubricantes-eni/auto-pesado`
- `/lubricantes/lubricantes-eni/engranajes`
- `/lubricantes/lubricantes-eni/motos-scooter`

</details>

<details><summary><code>/category/noticias</code> — 1 URLs</summary>

- `/category/noticias`

</details>

## 4. Barra final — RESUELTO

Las **648** URLs del sitio actual terminan en `/`. Se activó **`trailingSlash: true`** (ADR 0006), así que el sitio nuevo sirve esas mismas rutas **con barra**: son **byte a byte idénticas** a las indexadas y ya no hay ningún 308 intermedio.

Esto no cambia la clasificación de este informe —el mapeo siempre comparó rutas normalizadas—, pero sí su significado: las URLs marcadas como *ruta conservada* ahora se sirven **directamente con 200**, sin el salto extra que se pagaba antes en cada visita.

