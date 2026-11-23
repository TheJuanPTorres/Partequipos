/**
 * VISTA PREVIA DEL BORRADOR (PR 8b, 2026-11-23): las decisiones puras, con pruebas.
 *
 * - `idDePagina`: el id que manda el botón del panel (`/api/borrador/?pagina=12`). Solo un entero
 *   positivo; cualquier otra cosa, nada.
 * - `rutaDeVuelta`: adónde vuelve quien sale de la vista previa. Solo una ruta RELATIVA del propio
 *   sitio (`/nosotros/`); nunca `//otro.sitio`, `https://…` ni `/\otro`: así el formulario de salida
 *   no es una redirección abierta.
 */
export function idDePagina(valor: string | null): number | null {
  if (!valor || !/^[1-9]\d{0,9}$/.test(valor)) return null;
  return Number(valor);
}

export function rutaDeVuelta(valor: unknown): string {
  if (typeof valor !== "string") return "/";
  const v = valor.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\") || /[\u0000-\u001f]/.test(v))
    return "/";
  return v;
}
