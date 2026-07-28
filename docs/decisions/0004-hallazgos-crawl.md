# ADR 0004 — Hallazgos del rastreo de partequipos.com y decisiones de dirección

- **Estado:** Aceptada
- **Fecha:** 2026-07-27
- **Decisión tomada por:** Dirección técnica
- **Relacionado:** rastreo `scripts/crawl/crawl.ts`; salidas `docs/url-map.csv`,
  `docs/inventario-repuestos.csv`, `docs/crawl-reporte.md`

## Contexto

El rastreo del sitio en producción (648 URLs, fuente = sitemaps de RankMath,
respetando robots.txt) produjo el inventario real de la jerarquía de repuestos y
sacó a la luz tres hallazgos que requieren una decisión de dirección explícita
antes de la migración. Este ADR los registra.

El inventario medido reconcilia además las inconsistencias que había en los
documentos del cliente (ver tabla en `docs/crawl-reporte.md`): p. ej. Caterpillar
**141** modelos reales (los documentos decían 140 en el detalle y 130 en el
resumen) y Case Construction **39** (documentos: 38 vs 34). El sitio vivo es la
fuente de verdad.

## Decisión

### a) Bobcat: modelos con slug `minicargador-*` bajo el tipo `miniexcavadora`

Varios modelos Bobcat (p. ej. `repuestos-minicargador-bobcat-331`) están
archivados bajo el tipo `repuestos-para-maquinaria-pesada-miniexcavadora-bobcat`,
es decir, el slug del modelo dice "minicargador" pero el tipo padre es
"miniexcavadora".

**Decisión: NO se corrige.** El tipo forma parte de la ruta indexada; reclasificar
el modelo cambiaría URLs que ya están posicionadas, justo el riesgo que la
migración debe evitar (CLAUDE.md §3.3: la jerarquía de URLs es intocable). Se
**replica la jerarquía tal cual está en producción**. Queda como **pregunta
abierta para el cliente** (¿es un error de catalogación que quieran depurar en el
futuro con su redirect 301 correspondiente?), **no como acción** de este proyecto.

### b) 521 páginas sin `<h1>`

El catálogo actual no emite `<h1>` en la mayoría de sus páginas (verificado en la
fuente: la página de un modelo tiene 0 `<h1>`; la home tiene 1). Es deuda SEO real
del sitio existente.

**Decisión:** el sitio nuevo **SÍ llevará un `<h1>` en todas las páginas**
(CLAUDE.md §3.4: un solo `<h1>` por página, obligatorio). Se registra como
**mejora medible de la migración**: pasar de 521 páginas sin `<h1>` a 0.

### c) Inferencia de `/maquinaria-pesada/.../marcas/aditamentos/` como "marca"

El rastreador infiere el tipo por posición en la ruta. En la sección
`maquinaria`, el segmento bajo `marcas/` no siempre es una marca real (p. ej.
`aditamentos`), por lo que `tipo_inferido` la marca incorrectamente como "marca".

**Decisión:** es una **limitación conocida de la inferencia posicional**. **No
afecta el inventario de repuestos** (`inventario-repuestos.csv`), que se construye
exclusivamente desde la rama `repuestos/.../repuestos-maquinaria-pesada-marcas/`.
Se **anota y se sigue**; si en el futuro se modela la sección de maquinaria, se
revisará la heurística.

## Consecuencia

- La jerarquía de repuestos se migra **idéntica a producción**, incluida la
  catalogación de Bobcat (a); no se introducen cambios de URL por depuración de
  datos sin aprobación del cliente.
- La ausencia de `<h1>` queda como objetivo de mejora verificable (b).
- El inventario de repuestos es fiable pese a la limitación (c), que sólo toca a
  la clasificación de la sección `maquinaria`, fuera del alcance actual.
