# Cobertura de redirects para la migración

**Recalculado: 2026-08-13**, contra la estructura **construida**, no contra la
proyectada.

Fuente del inventario: `docs/url-map.csv` (rastreo propio, 648 URLs vivas).
Mapa bruto: `docs/redirects-map.csv` (`npm run redirects:map`).
Lo que se carga: `scripts/import/data/redirects.csv` (`npm run import`).

> **El mapa bruto quedó obsoleto y sobreestimaba el trabajo.** Se generó el
> 2026-07-29, **antes** de que existieran maquinaria, lubricantes y blog, así que
> marcaba como «huérfanas» 248 URLs de las cuales la mayoría hoy tienen ruta
> **idéntica** y no necesitan nada. Este documento recalcula desde cero; donde
> los dos discrepen, manda este.

---

## 1. Estado real

| Situación                                            | URLs    |      % |
| ---------------------------------------------------- | ------: | -----: |
| **Ruta conservada** — idéntica, no necesita redirect  | **618** | 95,4 % |
| **Cargados en `Redirects`**                           |  **10** |  1,5 % |
| **Pendientes de decisión del cliente**                |  **14** |  2,2 % |
| **Basura** — no se migra ni se redirige               |   **6** |  0,9 % |
| **Total rastreado**                                   | **648** |  100 % |

Comparado con el mapa bruto del 2026-07-29: las «huérfanas» pasan de **248 a
20** (14 pendientes + 6 basura). La diferencia no es trabajo hecho a mano: son
URLs que **ya tienen ruta** desde que se construyeron maquinaria (118),
lubricantes (5) y blog (51 artículos + 2 índices).

---

## 2. Los 10 cargados

Solo se carga lo que **cambia de destino**. Emitir un redirect de `/x/` a `/x/`
sería un bucle, así que las 618 conservadas no se tocan.

### Grupo D — URLs de «gracias» (8)

Las dejó obsoletas el Bloque A: los formularios confirman **en la misma página**,
sin navegar a ninguna URL de agradecimiento.

| Desde                        | Hacia          |
| ---------------------------- | -------------- |
| `/gracias/`                  | `/contactanos/` |
| `/gracias-a-ti/`             | `/contactanos/` |
| `/gracias-dynapac/`          | `/contactanos/` |
| `/gracias-hitachi/`          | `/contactanos/` |
| `/gracias-por-participar/`   | `/contactanos/` |
| `/gracias-por-tu-confianza/` | `/contactanos/` |
| `/gracias-por-tu-registro/`  | `/contactanos/` |
| `/gracias_por_tu_confianza/` | `/contactanos/` |

Nota: `/gracias-por-tu-confianza/` y `/gracias_por_tu_confianza/` son **dos URLs
distintas** (guion frente a guion bajo), ambas vivas. Las dos se redirigen.

### Duplicados `-copy` (2)

Borradores publicados por error (ADR 0004). Su gemelo canónico existe y es único
en el rastreo, así que el destino es **demostrable**, no supuesto.

| Desde                                        | Hacia                                    |
| -------------------------------------------- | ---------------------------------------- |
| `…/cargador-frontal-case-construction/repuestos-bulldozer-case-construction-650l-copy/` | `…/bulldozer-case-construction/repuestos-bulldozer-case-construction-650l/` |
| `…/motoniveladora-komatsu/repuestos-motoniveladora-komatsu-gd555-5-copy/`                | `…/motoniveladora-komatsu/repuestos-motoniveladora-komatsu-gd555-5/`        |

---

## 3. Pendientes de decisión del cliente (14)

**No se cargan.** Ninguna tiene destino deducible sin conocer la intención de
negocio, y un redirect mal puesto es peor que un 404: se procesa, transfiere
autoridad al sitio equivocado y cuesta revertirlo.

| URL                                    | Qué parece ser                                     |
| -------------------------------------- | -------------------------------------------------- |
| `/blog-partequipos/`                   | Tercera puerta del blog (ADR 0008)                  |
| `/lubricantes-eni/`                    | Duplicado de `/lubricantes/lubricantes-eni/`        |
| `/pe-partsshop/`                       | Tienda en línea externa                             |
| `/openhouse/`                          | Landing de campaña                                  |
| `/participa-openhouse/`                | Landing de campaña                                  |
| `/premios-open-house/`                 | Landing de campaña                                  |
| `/referenciacion-openhouse-2025/`      | Landing de campaña                                  |
| `/landing-dynapac/`                    | Landing de campaña                                  |
| `/congreso-de-alcaldes/`               | Landing de evento                                   |
| `/competencia_nacional_de_operadores/` | Landing de evento                                   |
| `/lanzamiento_excavadoras/`            | Landing de evento                                   |
| `/excavadoras/`                        | Corporativa de nivel 1, sin encaje claro            |
| `/repuestos-para-maquinaria-pesada/`   | ¿Antecesora del índice de repuestos?                |
| `/repuestos-para-maquinaria-pesada-2/` | Duplicado de la anterior                            |

**Las tres preguntas que hay que llevar al cliente:**

1. Las **7 landings de campaña y evento**: ¿se conservan como páginas, se
   redirigen al índice que corresponda, o caducan?
2. `/repuestos-para-maquinaria-pesada/` y su `-2`: ¿son antecesoras del índice
   actual? Si lo son, el 301 hacia
   `/repuestos-maquinaria-pesada-colombia/` es obvio — pero hay que confirmarlo.
3. `/pe-partsshop/`: ¿apunta a la tienda externa? Entonces no es un 301 interno.

---

## 4. Basura — no se migra ni se redirige (6)

| URL                                                             | Motivo                              |
| --------------------------------------------------------------- | ----------------------------------- |
| `/maquinaria-pesada/test/`                                        | Página de prueba (ADR 0007)          |
| `/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras-propuesta2025/` | Duplicado de `…/nueva/excavadoras/`   |
| `/maquinaria-pesada/maquinaria-pesada-usada/excavadoras4/`        | Duplicado de `…/usada/excavadoras/`   |
| `/maquinaria-pesada/maquinaria-pesada-usada-otros/`               | Sin hijos, título duplicado          |
| `/elementor-48399/`                                               | Artefacto del maquetador             |
| `/inicio2025/`                                                    | Portada antigua                      |

> **AVISO.** Las 4 de maquinaria **están vivas e indexadas hoy**. Si se lanza sin
> decidir nada, pasan a **404**. Dos de ellas (`excavadoras-propuesta2025` y
> `excavadoras4`) tienen un canónico evidente documentado en el ADR 0007, así que
> el 301 sería trivial. **No se cargan porque la dirección las clasificó como
> basura**, pero conviene decidirlo antes del lanzamiento y no después.

---

## 5. Verificación en ejecución (development, 2026-08-13)

Probado contra el proxy con el servidor de producción local:

| Caso                        | Resultado                          |
| --------------------------- | ---------------------------------- |
| `/gracias/`                 | **301** → `/contactanos/` → 200 ✅ |
| `/gracias-hitachi/`         | **301** → `/contactanos/` → 200 ✅ |
| `/gracias_por_tu_confianza/`| **301** → `/contactanos/` → 200 ✅ |
| `-copy` Case                | **301** en un salto ✅ · destino 404 ⚠️ |
| `-copy` Komatsu             | **301** en un salto ✅ · destino 404 ⚠️ |
| Conservadas (4 de muestra)  | **200**, cero saltos ✅            |

**Cadenas: ninguna. Bucles: ninguno.** Todos los redirects resuelven en **un
solo salto**.

### El 404 de los `-copy` NO es un fallo del redirect

El 301 es correcto. El destino da 404 porque `development` solo tiene **81 de los
351 modelos** reales, y esos dos canónicos no están entre los de demostración.
Comprobado: los dos existen en el rastreo (1 aparición cada uno) y **no** en
`modelos.csv`.

> **PENDIENTE ANTES DE PRODUCCIÓN — validar que cada destino resuelve.**
> Un redirect hacia un 404 es peor que el 404 original: consume presupuesto de
> rastreo y no transfiere nada. Hoy **nada comprueba** que el destino exista.
> Con los datos reales cargados hay que verificar los 10 destinos, o añadir esa
> comprobación al guardián de despliegue.

---

## 6. Lo que falta para lanzar

1. Resolver los **14 pendientes** con el cliente (§3).
2. Decidir las **4 de maquinaria** clasificadas como basura pero vivas (§4).
3. **Validar que los 10 destinos resuelven** con los datos reales (§5).
4. Cargar en producción: `DATABASE_URI="<pooled prod>" npm run import` y
   **redesplegar** (§10.6 de `CLAUDE.md`: sembrar por script no refresca las
   rutas ya cacheadas).
