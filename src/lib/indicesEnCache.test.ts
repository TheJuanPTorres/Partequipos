import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

/*
 * GUARDARRAÍL DEL SITEMAP Y EL BUSCADOR EN CACHÉ (2026-10-15).
 *
 * Los dos leen todo el catálogo. Antes consultaban la base en cada petición;
 * ahora van cacheados y se regeneran por `revalidarIndices`. Lo que se
 * vigila:
 *
 * - que el sitemap no vuelva a `force-dynamic` (15 consultas por rastreador)
 *   y conserve su vigencia de red;
 * - que el buscador siga en la caché de datos, con su etiqueta y su vigencia;
 * - que las vías por las que pasan los ganchos del catálogo los invaliden.
 *
 * Se lee el código fuente: la cadena real (gancho de Payload →
 * `revalidatePath`/`revalidateTag`) solo existe dentro de Next.
 */
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const leer = (rel: string) => readFileSync(path.join(raiz, rel), "utf8");

const cuerpoDe = (fuente: string, firma: string) => {
  const inicio = fuente.indexOf(firma);
  assert.ok(inicio >= 0, `no se encuentra ${firma}`);
  const siguiente = fuente.indexOf("\nexport ", inicio + firma.length);
  return fuente.slice(inicio, siguiente < 0 ? undefined : siguiente);
};

describe("sitemap cacheado", () => {
  const s = leer("src/app/(site)/sitemap.ts");

  it("no es force-dynamic y tiene vigencia de 1 h como mucho", () => {
    assert.doesNotMatch(s, /export const dynamic\s*=/, "el sitemap vuelve a ser dinámico");
    const m = s.match(/export const revalidate = (\d+);/);
    assert.ok(m, "sin `revalidate`: no se regeneraría nunca por tiempo");
    assert.ok(Number(m[1]) > 0 && Number(m[1]) <= 3600, `revalidate ${m[1]}`);
  });
});

describe("buscador cacheado", () => {
  const s = leer("src/lib/queries/getBusqueda.ts");

  it("en la caché de datos, con etiqueta, vigencia e id del despliegue", () => {
    assert.match(s, /unstable_cache\(buscarEnLaBase/);
    assert.match(s, /tags: \[ETIQUETAS_DATOS\.busqueda\]/);
    assert.match(s, /revalidate: VIGENCIA_BUSQUEDA/);
    assert.match(s, /CLAVE_DESPLIEGUE/);
  });

  it("la clave va en minúsculas (el ILIKE da lo mismo)", () => {
    assert.match(cuerpoDe(s, "export function buscar("), /toLocaleLowerCase\(/);
  });
});

describe("y los ganchos del catálogo los invalidan", () => {
  const datos = leer("src/lib/cacheDatos.ts");
  const revalidacion = leer("src/lib/revalidation.ts");

  it("revalidarIndices invalida el buscador y el sitemap", () => {
    const cuerpo = cuerpoDe(datos, "export function revalidarIndices(");
    assert.match(cuerpo, /revalidateTag\(ETIQUETAS_DATOS\.busqueda/);
    assert.match(cuerpo, /revalidatePath\("\/sitemap\.xml"\)/);
  });

  it("la llaman revalidarRutas, las categorías de repuestos y usados y nueva", () => {
    assert.match(cuerpoDe(revalidacion, "export function revalidarRutas("), /revalidarIndices\(/);
    assert.match(
      cuerpoDe(revalidacion, "export function revalidarCategoriasDeRepuestos("),
      /revalidarIndices\(/,
    );
    const cuerpo = cuerpoDe(datos, "export function revalidarDatos(");
    assert.match(cuerpo, /ETIQUETAS_DATOS\.usados/);
    assert.match(cuerpo, /ETIQUETAS_DATOS\.nueva/);
    assert.match(cuerpo, /revalidarIndices\(/);
  });
});
