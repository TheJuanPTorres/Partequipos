/**
 * EL TELÉFONO DE LA EMPRESA DENTRO DE LA DESCRIPCIÓN DE UNA UNIDAD USADA (ficha de usado,
 * ronda 19, t7, 2026-11-17). Las descripciones importadas de WordPress terminan muchas veces con
 * «📞 317 670 7071 — Cotiza ya tu excavadora usada». La ficha destaca ahora el teléfono en su
 * bloque de acciones (el del global de la empresa), así que en el texto se quita para no
 * repetirlo. Solo el número de la empresa: otro número del texto se deja como está. El dato del
 * panel no cambia: es solo lo que se pinta.
 */

/** Los dígitos del número sin el prefijo de Colombia (57): «+57 317 670 7071» → «3176707071». */
function digitosLocales(telefono: string): string {
  const d = telefono.replace(/\D/g, "");
  return d.length > 10 && d.startsWith("57") ? d.slice(2) : d;
}

/**
 * Quita de cada párrafo el teléfono de la empresa, con lo que lo acompaña (el icono 📞 o ☎, el
 * prefijo +57 y un guion o raya de separación), y los párrafos que se quedan vacíos.
 * `estaba` dice si el texto lo traía.
 */
export function sinTelefonoDeEmpresa(
  parrafos: string[],
  telefono: string | null | undefined,
): { parrafos: string[]; estaba: boolean } {
  const d = telefono ? digitosLocales(telefono) : "";
  if (d.length < 7) return { parrafos, estaba: false };
  // Cada dígito, admitiendo espacios, puntos o guiones entre ellos; delante, prefijo e icono.
  const numero = d.split("").join("[\\s.-]*");
  const patron = new RegExp(
    `\\s*(?:📞|☎️?|Tel(?:éfono)?\\.?:?)?\\s*(?:\\(?\\+?57\\)?[\\s.-]*)?${numero}(?!\\d)\\s*(?:[—–-]\\s*)?`,
    "giu",
  );
  let estaba = false;
  const limpios = parrafos
    .map((p) => {
      const nuevo = p.replace(patron, (m, offset: number) => {
        estaba = true;
        // Entre dos trozos de frase, un espacio; al principio o al final, nada.
        return offset === 0 || offset + m.length >= p.length ? "" : " ";
      });
      return nuevo.trim();
    })
    .filter((p) => p.length > 0);
  return { parrafos: limpios, estaba };
}
