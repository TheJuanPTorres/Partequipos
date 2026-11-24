import { securityTxt } from "@/lib/seguridad/securityTxt";

/**
 * `/.well-known/security.txt` (tanda 22, punto 35). Ruta ESTÁTICA que se
 * regenera cada 30 días: así su `Expires` (a un año) se renueva sola aunque no
 * haya despliegues. El contenido, en `src/lib/seguridad/securityTxt.ts`.
 */
export const dynamic = "force-static";
export const revalidate = 2592000;

export function GET() {
  return new Response(securityTxt(new Date()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
