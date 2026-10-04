import type { Metadata } from "next";

import { getLogo } from "../queries/getSeo";
import { buildMetadata, type BuildMetadataInput } from "./buildMetadata";

/**
 * `buildMetadata` con la imagen social por defecto del panel: la «Imagen al
 * compartir por defecto» del global `seo`, si no el logo, y si no la de
 * siempre de `config.ts` (§10.8). Es lo que usan las páginas; `buildMetadata`
 * se queda puro para sus pruebas.
 */
export async function metadataDe(input: BuildMetadataInput): Promise<Metadata> {
  const logo = await getLogo();
  return buildMetadata({ ...input, imagenPorDefecto: logo.social });
}
