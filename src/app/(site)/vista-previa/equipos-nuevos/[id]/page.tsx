import { METADATA_VISTA_PREVIA, PaginaVistaPreviaServidor } from "../../paginaServidor";

/*
 * Vista previa en vivo de «equipos-nuevos» (tanda 21, tarea 3, fase 2, punto 5). Solo con sesión del
 * personal, noindex y fuera del sitemap: lo hace `PaginaVistaPreviaServidor`.
 */

export const dynamic = "force-dynamic";

export const metadata = METADATA_VISTA_PREVIA;

export default async function VistaPreviaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PaginaVistaPreviaServidor coleccion="equipos-nuevos" id={id} />;
}
