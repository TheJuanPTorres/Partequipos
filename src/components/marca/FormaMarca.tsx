import { Fragment, type ReactNode } from "react";

import { HITACHI_LANDCROS } from "@/lib/marca/hitachiLandcros";

import estilos from "./formaMarca.module.css";

/**
 * Un nombre que el diseño pinta en MAYÚSCULAS («EXCAVADORA HITACHI ZX130-5B»), con «Hitachi
 * LANDCROS» en su forma única (decisión del cliente, 2026-10-26): la marca va en un `<span>` sin
 * `text-transform`. El texto no cambia (lectores de pantalla y buscadores leen lo mismo).
 */
export function conFormaDeMarca(texto: string): ReactNode {
  const partes = texto.split(HITACHI_LANDCROS);
  if (partes.length === 1) return texto;
  return partes.map((p, i) => (
    <Fragment key={i}>
      {i > 0 ? <span className={estilos.forma}>{HITACHI_LANDCROS}</span> : null}
      {p}
    </Fragment>
  ));
}
