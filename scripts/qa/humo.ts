/**
 * Prueba de humo contra la aplicación DESPLEGADA. Ver CLAUDE.md §10.20.
 *
 * Uso:
 *   HUMO_URL=https://partequipos.vercel.app HUMO_ENTORNO=production npm run humo
 *   HUMO_URL=<url del preview> HUMO_ENTORNO=preview \
 *     HUMO_BYPASS=<token> npm run humo
 *
 * La DECISIÓN vive en `src/lib/qa/humo.ts` y tiene pruebas que comprueban que
 * **falla** con un 500, con un 3xx y con la red caída. Aquí queda la red.
 *
 * EL TOKEN NO SE IMPRIME NUNCA. Va en la cabecera
 * `x-vercel-protection-bypass` —no en la URL, que acabaría en los registros— y
 * de este script solo sale si está presente o no.
 */
import {
  debeReintentar,
  esperaMs,
  rutasPara,
  veredicto,
  type Entorno,
  type Resultado,
  type Ruta,
} from "../../src/lib/qa/humo";

const base = process.env.HUMO_URL?.trim().replace(/\/$/, "");
const entorno = (process.env.HUMO_ENTORNO?.trim() || "preview") as Entorno;
const bypass = process.env.HUMO_BYPASS?.trim();

if (!base) {
  console.error("✗ Falta HUMO_URL: la URL del despliegue que se va a comprobar.");
  process.exit(1);
}

if (entorno !== "preview" && entorno !== "production") {
  console.error(`✗ HUMO_ENTORNO debe ser "preview" o "production", no "${entorno}".`);
  process.exit(1);
}

/*
 * En preview la protección de despliegue responde 302 a cualquiera sin token,
 * así que sin él la prueba fallaría entera y el mensaje no diría por qué. Se
 * corta antes, con el motivo.
 */
if (entorno === "preview" && !bypass) {
  console.error("✗ Falta HUMO_BYPASS. Un preview está protegido: sin token todo daría 302.");
  console.error("  Se genera en Vercel (Project → Settings → Deployment Protection →");
  console.error("  Protection Bypass for Automation) y se carga como secreto de GitHub.");
  process.exit(1);
}

const dormir = (ms: number) => new Promise((listo) => setTimeout(listo, ms));

async function comprobar(ruta: Ruta): Promise<Resultado> {
  let intentos = 0;
  let resultado: Resultado = { intentos: 0, ruta: ruta.ruta };

  while (intentos < 99) {
    intentos += 1;
    const cabeceras: Record<string, string> = { ...(ruta.cabeceras ?? {}) };
    if (bypass) {
      cabeceras["x-vercel-protection-bypass"] = bypass;
    }

    try {
      const respuesta = await fetch(`${base}${ruta.ruta}`, {
        headers: cabeceras,
        // `manual`: seguir un 3xx escondería que la protección no se derivó.
        redirect: "manual",
      });
      resultado = { estado: respuesta.status, intentos, ruta: ruta.ruta };
    } catch (error) {
      resultado = { error: (error as Error).message, intentos, ruta: ruta.ruta };
    }

    if (!debeReintentar(resultado)) {
      return resultado;
    }
    await dormir(esperaMs(intentos));
  }

  return resultado;
}

const host = new URL(base).hostname;
console.log(`PRUEBA DE HUMO · ${entorno} · ${host}`);
console.log(`Token de derivación: ${bypass ? "presente" : "no hace falta"}\n`);

const rutas = rutasPara(entorno);
const resultados: Resultado[] = [];
for (const ruta of rutas) {
  resultados.push(await comprobar(ruta));
}

const v = veredicto(resultados);
v.lineas.forEach((l) => console.log(l));

if (v.codigo === 0) {
  console.log(`\n✓ Las ${v.total} rutas responden 200.`);
  process.exit(0);
}

console.error(`\n✗ FALLÓ la prueba de humo: ${v.fallos.length} de ${v.total} rutas.`);
for (const fallo of v.fallos) {
  const ruta = rutas.find((r) => r.ruta === fallo.ruta);
  const detalle =
    fallo.error !== undefined ? `error de red (${fallo.error})` : `HTTP ${fallo.estado}`;
  console.error(`  · ${fallo.ruta} → ${detalle} tras ${fallo.intentos} intento(s)`);
  console.error(`    Está en la lista porque ${ruta?.motivo}`);
}
console.error("\n  Un 500 aquí es el modo de fallo de CLAUDE.md §10.18: el build pasa en");
console.error("  verde y el lambda cae en tiempo de petición. NO promocionar este");
console.error("  despliegue; si ya está en producción, revertir el alias primero:");
console.error("    vercel promote <url del último despliegue bueno>");
process.exit(1);
