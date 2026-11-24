/**
 * UNA MEDIDA POR CLAVE Y PROCESO (logos, 2026-11-24). En el build, cada página que pinta un logo
 * pedía su fichero al almacén por su cuenta: cientos de descargas del mismo puñado de logos en
 * unos segundos, y el almacén respondía 403 a parte de ellas (102 avisos «[logos] … HTTP 403» en
 * un build). Con esto, las llamadas simultáneas con la misma clave esperan la MISMA medida (con sus
 * reintentos) y un acierto se queda en memoria: cada proceso pide cada fichero una vez.
 *
 * Un fallo NO se guarda: devuelve `null` y la siguiente llamada vuelve a intentarlo.
 */
export function medidaCompartida<T>({
  medir,
  intentos = 3,
  espera,
  alFallar,
}: {
  medir: (clave: string) => Promise<T>;
  intentos?: number;
  /** Milisegundos antes del intento siguiente (`intento` empieza en 1). */
  espera: (intento: number) => number;
  /** Una vez por tanda de intentos fallida, no una por página que esperaba. */
  alFallar?: (clave: string, error: unknown) => void;
}): (clave: string) => Promise<T | null> {
  const medidas = new Map<string, Promise<T | null>>();

  async function conReintentos(clave: string): Promise<T | null> {
    for (let intento = 1; ; intento++) {
      try {
        return await medir(clave);
      } catch (error) {
        if (intento >= intentos) {
          alFallar?.(clave, error);
          return null;
        }
        await new Promise((listo) => setTimeout(listo, espera(intento)));
      }
    }
  }

  return (clave) => {
    const enMemoria = medidas.get(clave);
    if (enMemoria) return enMemoria;
    const medida = conReintentos(clave).then((valor) => {
      if (valor === null) medidas.delete(clave);
      return valor;
    });
    medidas.set(clave, medida);
    return medida;
  };
}
