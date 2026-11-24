/**
 * NORMALIZAR LOS VALORES DE LOS ATRIBUTOS YA COPIADOS (2026-11-24, tanda 22, punto 9). Lógica pura,
 * con pruebas. Los datos de WordPress traen el número y la unidad pegados («8,65m», «168HP»),
 * con la coma o el punto según quien los escribió («9.75m», «5,800kg») y ceros de más
 * («20,4000kg»). Aquí se propone el valor limpio: número y unidad por separado, un espacio al
 * pintar, coma decimal y punto de miles (como el resto del sitio).
 *
 * Solo toca lo que es UN número y UNA unidad conocida. Lo demás («168 hp (125 kW)», «Tier 3»,
 * «24/30/36 in») se deja como está. Lo dudoso (unidades que se convierten, miles escritos con
 * coma, ceros de más) se marca para que lo revise Juan Pablo.
 */

export type Normalizado = {
  /** El número limpio, sin la unidad. */
  valor: string;
  unidad: string;
  /** Cómo se pinta: «8,65 m». */
  despues: string;
  /** Hay que revisarlo a ojo antes de aplicar. */
  dudoso: boolean;
  motivo: string;
};

/** Unidad escrita → unidad del sitio. `dudosa`: la conversión depende de lo que quiso decir quien escribió. */
const UNIDADES: Record<string, { unidad: string; dudosa?: boolean }> = {
  hp: { unidad: "hp" },
  kw: { unidad: "kW" },
  kg: { unidad: "kg" },
  mm: { unidad: "mm" },
  cm: { unidad: "cm" },
  m: { unidad: "m" },
  t: { unidad: "t" },
  l: { unidad: "L" },
  rpm: { unidad: "rpm" },
  m3: { unidad: "m³" },
  "m³": { unidad: "m³" },
  ton: { unidad: "t", dudosa: true },
  tons: { unidad: "t", dudosa: true },
  tonelada: { unidad: "t", dudosa: true },
  toneladas: { unidad: "t", dudosa: true },
};

const MILES_COMA = /^\d{1,3}(,\d{3})+$/;
const MILES_PUNTO = /^\d{1,3}(\.\d{3})+$/;

/** Propone el valor limpio, o `null` si no hay nada que cambiar o no se sabe qué quiere decir. */
export function normalizarValor(texto: string): Normalizado | null {
  const t = texto.replace(/^[\s:]+/, "").trim();
  const m = /^(\d[\d.,]*)\s*([A-Za-zµ]+[23²³]?)$/.exec(t);
  if (!m) return null;
  const u = UNIDADES[m[2]!.toLowerCase()];
  if (!u) return null;
  const num = m[1]!;
  if (num.includes(",") && num.includes(".")) return null;

  let valor = num;
  let dudoso = Boolean(u.dudosa);
  const motivos: string[] = [];
  if (u.dudosa) motivos.push(`«${m[2]}» pasa a «${u.unidad}»`);

  if (num.includes(",")) {
    if (MILES_COMA.test(num)) {
      // «5,800kg»: coma de miles (a la inglesa). Con kg y un peso de máquina es casi seguro.
      valor = num.replace(/,/g, ".");
      if (u.unidad !== "kg") {
        dudoso = true;
        motivos.push("coma de miles o decimal");
      }
    } else if (/^\d+,\d{4,}$/.test(num)) {
      // «20,4000»: ceros o cifras de más. Se lee como 20,400.
      const [ent, dec] = num.split(",") as [string, string];
      valor = `${ent}.${dec.slice(0, 3)}`;
      dudoso = true;
      motivos.push(`«${num}» tiene cifras de más: se lee ${valor}`);
    } else {
      valor = num.replace(/,0+$/, ""); // «6,0» → «6»
    }
  } else if (num.includes(".") && !MILES_PUNTO.test(num)) {
    valor = num.replace(".", ",").replace(/,0+$/, ""); // «9.75» → «9,75»
  }

  const unidad = u.unidad;
  const despues = `${valor} ${unidad}`;
  if (despues === t) return null;
  return { valor, unidad, despues, dudoso, motivo: motivos.join("; ") };
}
