import { Fragment, type ReactNode } from "react";

/**
 * Un texto con los códigos de modelo enteros: cada palabra con guion («ZX130-5B», «CC1200»…) va en
 * un `<span>` con `white-space: nowrap` (`clase`), para que no se parta por el guion en el teléfono,
 * como el h1 de la página de modelo de repuestos. El texto no cambia.
 */
export function sinCortarCodigos(texto: string, clase: string | undefined): ReactNode {
  if (!texto.includes("-")) return texto;
  return texto.split(" ").map((palabra, i) => (
    <Fragment key={i}>
      {i > 0 ? " " : null}
      {palabra.includes("-") ? <span className={clase}>{palabra}</span> : palabra}
    </Fragment>
  ));
}
