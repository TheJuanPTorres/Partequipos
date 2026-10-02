import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaginaConBloques } from "@/components/bloques/PaginaConBloques";

import { BLOQUES_NOSOTROS } from "./fixture";

/**
 * BANCO DE PRUEBAS DE LOS BLOQUES DE PÁGINA — Nosotros de ux-9.
 *
 * Pinta los cinco bloques con datos fijos (`fixture.ts`) para verificarlos
 * contra la referencia ANTES de la migración. Es un instrumento, no una página
 * del sitio: se BORRA antes de fusionar (docs/diseno/decisiones-nosotros.md).
 *
 * 404 EN PRODUCCIÓN (`VERCEL_ENV`), `noindex`, fuera del sitemap por decisión
 * escrita (`RUTAS_FUERA_DEL_SITEMAP`) y sin enlaces desde ninguna página.
 */
export const metadata: Metadata = {
  title: "Laboratorio de bloques: Nosotros",
  robots: { index: false, follow: false },
};

export default function LaboratorioNosotros() {
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <PaginaConBloques
      titulo="Nosotros"
      migas={[
        { nombre: "Inicio", path: "/" },
        { nombre: "Nosotros", path: "/laboratorio/nosotros" },
      ]}
      bloques={BLOQUES_NOSOTROS}
    />
  );
}
