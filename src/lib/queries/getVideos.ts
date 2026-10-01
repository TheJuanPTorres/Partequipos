import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { Video } from "@/payload-types";

/**
 * Un vídeo por id, con su póster poblado (`depth: 1`). La portada se lee con
 * `depth: 1`, que deja el póster del vídeo sin poblar; subirlo para todas las
 * páginas costaría consultas en cada una (CLAUDE.md §10.10).
 */
export const getVideoPorId = cache(async (id: number): Promise<Video | null> => {
  const payload = await getPayload({ config });
  try {
    return await payload.findByID({ collection: "videos", id, depth: 1 });
  } catch {
    return null;
  }
});
