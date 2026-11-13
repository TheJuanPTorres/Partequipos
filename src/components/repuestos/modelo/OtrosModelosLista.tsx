import { RejillaModelos } from "@/components/repuestos/ModelosTexto";
import type { LogoMarca } from "@/lib/marca/logoMarca";
import type { ModeloEnlace } from "@/lib/repuestos/tipo";

import estilos from "./fichaModelo.module.css";

/**
 * «OTROS MODELOS DE {TIPO} {MARCA}» bajo la ficha: los demás modelos del tipo con las MISMAS
 * tarjetas de la lista de la página de tipo (franja del color de la marca, modelo, serie y flecha;
 * Juan Pablo, #433), sin fotos. Sin otros modelos con página, no se pinta.
 */
export function OtrosModelosLista({
  id,
  titulo,
  modelos,
  logo = null,
}: {
  id: string;
  titulo: string;
  modelos: ModeloEnlace[];
  logo?: LogoMarca | null;
}) {
  const conPagina = modelos.filter((m) => m.href);
  if (conPagina.length === 0) return null;
  const idTitulo = `${id}-titulo`;
  return (
    <section id={id} className={estilos.otros} aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className={estilos.otrosTitulo}>
        {titulo}
      </h2>
      <RejillaModelos modelos={conPagina} logo={logo} />
    </section>
  );
}
