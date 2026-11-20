import { idGa4 } from "@/lib/analitica/config";
import { RUTA_POLITICA_DATOS } from "@/lib/hojaDeVida/constantes";

import { AvisoCookies } from "./AvisoCookies";

/**
 * Analítica del sitio público (no del panel: vive en el layout de `(site)`). Sin
 * `NEXT_PUBLIC_GA4_ID` no pinta ni carga nada.
 */
export function Analitica() {
  const id = idGa4();
  return id ? <AvisoCookies id={id} politica={RUTA_POLITICA_DATOS} /> : null;
}
