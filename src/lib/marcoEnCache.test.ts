import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

/*
 * GUARDARRAÍL DEL MARCO EN CACHÉ (2026-10-15).
 *
 * La cabecera, el pie, el global `seo` y el megamenú van en la caché de datos
 * con la etiqueta `datos:marco`, sin vigencia por tiempo. El olvido que esto
 * atrapa es el silencioso: un global o una colección del menú que cambia en
 * el panel y NO invalida la etiqueta. El sitio seguiría pintando la cabecera
 * vieja en todas las páginas hasta el siguiente despliegue, sin ningún error.
 *
 * Se lee el código fuente porque la cadena real (gancho de Payload →
 * `revalidarTodoElSitio` → `revalidateTag`) solo existe dentro de Next.
 */
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const leer = (rel: string) => readFileSync(path.join(raiz, rel), "utf8");

describe("el marco va en la caché de datos con su etiqueta", () => {
  for (const fichero of [
    "src/lib/queries/getCabecera.ts",
    "src/lib/queries/getPie.ts",
    "src/lib/queries/getSeo.ts",
    "src/lib/queries/getMegamenu.ts",
  ]) {
    it(fichero, () => {
      const s = leer(fichero);
      assert.match(s, /unstable_cache\(/, "sin unstable_cache");
      assert.match(s, /tags: \[ETIQUETAS_DATOS\.marco\]/, "sin la etiqueta del marco");
      assert.match(s, /CLAVE_DESPLIEGUE/, "sin el id del despliegue en la clave");
    });
  }
});

describe("y todo lo que pinta el marco la invalida", () => {
  it("revalidarTodoElSitio invalida `datos:marco` ANTES de las rutas", () => {
    const s = leer("src/lib/revalidation.ts");
    const cuerpo = s.slice(s.indexOf("export function revalidarTodoElSitio"));
    const etiqueta = cuerpo.indexOf("revalidarDatos(ETIQUETAS_DATOS.marco");
    const rutas = cuerpo.indexOf('revalidatePath("/", "layout")');
    assert.ok(etiqueta >= 0, "no invalida la etiqueta del marco");
    assert.ok(rutas > etiqueta, "invalida las rutas antes que la caché del marco");
  });

  it("los tres globales del marco llaman a revalidarTodoElSitio", () => {
    for (const g of ["Cabecera", "Pie", "Seo"]) {
      assert.match(leer(`src/globals/${g}.ts`), /revalidarTodoElSitio\(/, `${g} no invalida`);
    }
  });

  it("las 6 colecciones del megamenú llevan sus ganchos", () => {
    const colecciones: Record<string, string> = {
      "categorias-maquinaria": "CategoriaMaquinaria",
      "categorias-usada": "CategoriaUsada",
      marcas: "Marca",
      "marcas-maquinaria": "MarcaMaquinaria",
      "tipos-equipo": "TipoEquipo",
      "tipos-maquinaria": "TipoMaquinaria",
    };
    // Las mismas que consulta el megamenú.
    const consultadas = [
      ...leer("src/lib/queries/getMegamenu.ts").matchAll(/collection: "([a-z-]+)"/g),
    ].map((m) => m[1]);
    assert.deepEqual([...consultadas].sort(), Object.keys(colecciones).sort());
    for (const [slug, fichero] of Object.entries(colecciones)) {
      const s = leer(`src/collections/${fichero}.ts`);
      assert.match(s, new RegExp(`revalidarMegamenu\\("${slug}"\\)`), `${slug} sin ganchos`);
      assert.match(s, /menu\.afterChange/, `${slug}: el gancho no está en afterChange`);
      assert.match(s, /menu\.afterDelete/, `${slug}: el gancho no está en afterDelete`);
    }
  });
});
