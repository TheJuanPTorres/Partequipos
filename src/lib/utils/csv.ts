/**
 * Lee un CSV con cabecera (comillas dobles, `""` como comilla escapada, saltos
 * de línea LF o CRLF) y devuelve una fila por objeto, con los valores
 * recortados. Las filas vacías se descartan.
 */
export function leerCsv(texto: string): Record<string, string>[] {
  const filas: string[][] = [];
  let campo = "";
  let fila: string[] = [];
  let entreComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charAt(i);
    if (entreComillas) {
      if (c === '"' && texto.charAt(i + 1) === '"') {
        campo += '"';
        i++;
      } else if (c === '"') entreComillas = false;
      else campo += c;
    } else if (c === '"') entreComillas = true;
    else if (c === ",") {
      fila.push(campo);
      campo = "";
    } else if (c === "\n") {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else if (c !== "\r") campo += c;
  }
  if (campo.length > 0 || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }
  const cabecera = filas.shift()?.map((h) => h.trim());
  if (!cabecera) return [];
  return filas
    .filter((f) => f.some((v) => v.trim() !== ""))
    .map((f) => Object.fromEntries(cabecera.map((k, i) => [k, (f[i] ?? "").trim()])));
}
