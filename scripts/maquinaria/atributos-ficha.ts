/**
 * SIEMBRA DE «ATRIBUTOS DE FICHA» Y COPIA DE LOS DATOS DE CADA MÁQUINA NUEVA
 * (2026-11-23, tanda 21 tarea 4). Lo que la ficha enseña HOY junto al título lo elige el código
 * (`datosDeCabecera`, por el texto de la etiqueta de la «Ficha técnica»). Este script lo COPIA tal
 * cual a «Atributos destacados» (etiqueta, nombre uniforme, icono y orden), con un catálogo de
 * «Atributos de ficha» creado a partir de lo que ya hay, para que lo publicado no cambie.
 *
 *   npm run preview:ejecutar -- npx payload run scripts/maquinaria/atributos-ficha.ts simular
 *   npm run preview:ejecutar -- npx payload run scripts/maquinaria/atributos-ficha.ts aplicar
 *   npm run preview:ejecutar -- npx payload run scripts/maquinaria/atributos-ficha.ts reiniciar
 *
 * `reiniciar` (solo para el preview, para repetir la prueba) deja «Atributos destacados» vacío en
 * todas las máquinas y borra el catálogo: así se vuelve a copiar con `aplicar`.
 *
 * - NO borra ni vacía nada: «Ficha técnica» queda como está (los campos viejos se ocultan más
 *   adelante, y el borrado va en otro PR con Juan Pablo).
 * - Solo toca las máquinas que NO tienen «Atributos destacados»: se puede repetir.
 * - Normaliza «3658 mm» → valor 3658, unidad mm (`separarValor`). Lo que no encaja («angulo 20
 *   grds derecha/izquierda», «Cummins 4B3.9») va como TEXTO tal cual, y se lista al final para
 *   Juan Pablo.
 * - Una MISMA magnitud con dos unidades («Potencia neta» en hp y en kW) son dos entradas del
 *   catálogo con el mismo nombre; su título en el panel lleva la unidad.
 * - SOLO contra la base del PREVIEW (la guarda `puedeVaciarSolicitudes`, lista de un elemento):
 *   el sitio publicado, por runbook de dirección.
 */
import { puedeVaciarSolicitudes } from "../../src/lib/db/vaciadoSolicitudes";
import { separarValor } from "../../src/lib/maquinaria/atributosFicha";
import { datosDeCabecera } from "../../src/lib/maquinaria/fichaNueva";

process.env.PAYLOAD_DISABLE_PUSH = "true";
process.env.PAYLOAD_SIN_GENERAR_TIPOS = "true";

const modo =
  process.argv.find((a) => a === "simular" || a === "aplicar" || a === "reiniciar") ?? "simular";
const veredicto = puedeVaciarSolicitudes(process.env.DATABASE_URI);
if (!veredicto.permitido) {
  throw new Error(`[atributos-ficha] Solo contra la base del preview. ${veredicto.motivo}`);
}

const { getPayload } = await import("payload");
const { default: config } = await import("../../src/payload.config");
const payload = await getPayload({ config });

type Clave = string;
const clave = (nombre: string, unidad: string, tipo: string, icono: string): Clave =>
  JSON.stringify([nombre, unidad, tipo, icono]);

if (modo === "reiniciar") {
  const { docs: todos } = await payload.find({
    collection: "equipos-nuevos",
    limit: 0,
    pagination: false,
    depth: 0,
  });
  let vaciadas = 0;
  for (const e of todos) {
    if (!e.atributosDestacados || e.atributosDestacados.length === 0) continue;
    await payload.update({
      collection: "equipos-nuevos",
      id: e.id,
      data: { atributosDestacados: [] },
    });
    vaciadas++;
  }
  const borrados = await payload.delete({
    collection: "atributos-ficha",
    where: { id: { exists: true } },
  });
  process.stdout.write(
    `Reiniciado: ${vaciadas} máquinas vaciadas · ${borrados.docs.length} atributos del catálogo borrados
`,
  );
  process.exit(0);
}

const { docs: existentes } = await payload.find({
  collection: "atributos-ficha",
  limit: 0,
  pagination: false,
  depth: 0,
});
const catalogo = new Map<Clave, number>();
for (const a of existentes) {
  catalogo.set(clave(a.nombre, a.unidad ?? "", a.tipoValor, a.icono), a.id);
}

const { docs: equipos } = await payload.find({
  collection: "equipos-nuevos",
  limit: 0,
  pagination: false,
  depth: 0,
});

const aTexto: { equipo: string; etiqueta: string; valor: string }[] = [];
let tocadas = 0;
let ya = 0;
let sinDatos = 0;
const nuevosAtributos = new Set<Clave>();

for (const e of equipos) {
  if (e.atributosDestacados && e.atributosDestacados.length > 0) {
    ya++;
    continue;
  }
  const datos = datosDeCabecera(e.fichaTecnica);
  if (datos.length === 0) {
    sinDatos++;
    continue;
  }
  const filas: { atributo: number; valor: string }[] = [];
  for (const d of datos) {
    const s = separarValor(d.valor);
    if (s.tipo === "texto") aTexto.push({ equipo: e.nombre, etiqueta: d.etiqueta, valor: d.valor });
    const k = clave(d.etiqueta, s.unidad, s.tipo, d.icono);
    let id = catalogo.get(k);
    if (id === undefined) {
      nuevosAtributos.add(k);
      if (modo === "aplicar") {
        const creado = await payload.create({
          collection: "atributos-ficha",
          data: {
            nombre: d.etiqueta,
            icono: d.icono as never,
            unidad: s.unidad,
            tipoValor: s.tipo,
          },
        });
        id = creado.id;
        catalogo.set(k, id);
      } else {
        id = -1;
      }
    }
    filas.push({ atributo: id, valor: s.valor });
  }
  tocadas++;
  if (modo === "aplicar") {
    await payload.update({
      collection: "equipos-nuevos",
      id: e.id,
      data: { atributosDestacados: filas },
      // Es una copia: no es una edición, no cambia quién la hizo ni revalida cada ficha.
      context: { sinAviso: true },
    });
  }
}

const salida = (t: string) => process.stdout.write(`${t}\n`);
salida(`Modo: ${modo}`);
salida(
  `Máquinas: ${equipos.length} · con atributos copiados: ${tocadas} · ya tenían: ${ya} · sin datos: ${sinDatos}`,
);
salida(
  `Atributos del catálogo (nuevos): ${nuevosAtributos.size} · existentes: ${existentes.length}`,
);
salida(`Valores que van como TEXTO (para Juan Pablo): ${aTexto.length}`);
for (const t of aTexto) salida(`  · ${t.equipo} — ${t.etiqueta}: ${t.valor}`);
