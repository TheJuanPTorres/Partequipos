import { cache } from "react";
import config from "@payload-config";
import { getPayload } from "payload";

import type { Pie } from "@/payload-types";

/** El global `pie`, con la API local (CLAUDE.md §3.2). Memoizado por petición. */
export const getPie = cache(async (): Promise<Pie> => {
  const payload = await getPayload({ config });
  return payload.findGlobal({ slug: "pie", depth: 0 });
});
