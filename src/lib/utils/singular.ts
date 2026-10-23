/**
 * Singular APROXIMADO de un nombre de máquina, para COMPARAR nombres, no para pintarlos:
 * minúsculas, sin tildes y cada palabra sin su «-s»/«-es» de plural («Cargadores Frontales»
 * → «cargador frontal», «Excavadoras» → «excavadora», «Bulldozers» → «bulldozer»). Así
 * «Cargador Frontal» y «Cargadores Frontales» son el mismo mientras los nombres del panel
 * pasan a singular (cliente, 2026-10-23).
 */
export function singularAproximado(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => (/[rlndz]es$/.test(p) ? p.slice(0, -2) : p.endsWith("s") ? p.slice(0, -1) : p))
    .join(" ");
}
