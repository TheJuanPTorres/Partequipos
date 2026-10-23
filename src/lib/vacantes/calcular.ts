import { resultadoGuardado, tocaLeer, type Guardado } from "./estado";
import type { ResultadoVacantes, Vacante } from "./tipos";

export type Dependencias = {
  ahora: () => number;
  leerGuardado: () => Promise<Guardado>;
  guardar: (datos: Partial<Omit<Guardado, "leer">>) => Promise<void>;
  leer: () => Promise<Vacante[]>;
};

/**
 * La decisión completa, con sus dependencias inyectadas para probarla sin red
 * ni base (`calcular.test.ts`). No lanza nunca: un fallo de la base o de Buk
 * acaba en la copia o en el estado vacío, y en `console.error`.
 */
export async function calcularVacantes(dep: Dependencias): Promise<ResultadoVacantes> {
  let guardado: Guardado;
  try {
    guardado = await dep.leerGuardado();
  } catch (error) {
    console.error("[vacantes] no se pudo leer el global «Vacantes de Buk»:", error);
    return { origen: "sinDatos", vacantes: [], leidoEl: null };
  }
  const ahora = dep.ahora();
  if (!tocaLeer(guardado, ahora)) return resultadoGuardado(guardado);

  const fecha = new Date(ahora).toISOString();
  try {
    const vacantes = await dep.leer();
    await dep
      .guardar({ vacantes, copiaEl: fecha, ultimoIntento: fecha, ultimoError: "" })
      .catch((error: unknown) =>
        console.error("[vacantes] lectura buena, pero no se pudo guardar la copia:", error),
      );
    return { origen: "vivo", vacantes, leidoEl: fecha };
  } catch (error) {
    const motivo = error instanceof Error ? error.message : String(error);
    console.error(
      `[vacantes] falló la lectura del portal de Buk; se pinta la última copia buena (${guardado.copiaEl ?? "ninguna"}): ${motivo}`,
    );
    await dep
      .guardar({ ultimoIntento: fecha, ultimoError: motivo.slice(0, 300) })
      .catch((e: unknown) => console.error("[vacantes] no se pudo anotar el fallo:", e));
    return resultadoGuardado({ ...guardado, ultimoError: motivo });
  }
}
