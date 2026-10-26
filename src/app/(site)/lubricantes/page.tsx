import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { BloqueLubricantes } from "@/components/lubricantes/BloqueLubricantes";
import { BotonCatalogo } from "@/components/lubricantes/BotonCatalogo";
import catalogo from "@/components/lubricantes/botonCatalogo.module.css";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { vistaLubricantes } from "@/lib/lubricantes/general";
import { getMarcasLubricante } from "@/lib/queries/getLubricantes";
import { getPaginasIndice } from "@/lib/queries/getPaginasIndice";
import { getEmpresa } from "@/lib/queries/getSeo";
import { rutas } from "@/lib/routes";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { metadataDe } from "@/lib/seo/metadata";
import { turnstileSiteKey } from "@/lib/turnstile";
import { enlaceWhatsApp } from "@/lib/whatsapp";

const TITULO = "Lubricantes para maquinaria pesada";
const DESCRIPCION =
  "Lubricantes de alta calidad para motores, sistemas hidráulicos y componentes de maquinaria pesada. Solicita información y conoce el catálogo de lubricantes ENI.";

export async function generateMetadata(): Promise<Metadata> {
  return metadataDe({ nombre: TITULO, path: rutas.lubricantes(), descripcion: DESCRIPCION });
}

const ANCLA = "lubricantes-solicitud";

/**
 * PÁGINA GENERAL DE LUBRICANTES (`/lubricantes/`, plantilla de Andrés 809451,
 * 2026-10-20): el encabezado de las páginas índice («Plantilla 1»: antetítulo,
 * título revelado por palabras e icono del ratón) y el bloque con el formulario
 * de solicitud y la marca destacada. Por debajo, cada marca (ENI) y sus
 * categorías. Los textos, en el grupo «Lubricantes» de «Páginas índice y
 * contacto». URL NUEVA: antes no existía (404).
 */
export default async function LubricantesPage() {
  const [indice, marcas, empresa] = await Promise.all([
    getPaginasIndice(),
    getMarcasLubricante(),
    getEmpresa(),
  ]);
  const vista = vistaLubricantes(indice.lubricantes, marcas);
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Lubricantes", path: rutas.lubricantes() },
  ];

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca
        vista={vista.encabezado}
        anclaSiguiente={ANCLA}
        franja={false}
        indice
        accion={
          // «Ver catálogo» visible al entrar (petición del cliente, 2026-10-26).
          vista.bloque.marca?.href ? (
            <BotonCatalogo
              href={vista.bloque.marca.href}
              texto={vista.bloque.textoBoton}
              className={catalogo.sobreFoto}
            />
          ) : null
        }
      />

      <BloqueLubricantes
        id={ANCLA}
        bloque={vista.bloque}
        origen={`${rutas.lubricantes()}/`}
        siteKey={turnstileSiteKey()}
        whatsapp={empresa ? enlaceWhatsApp(empresa.whatsapp) : undefined}
      />
    </main>
  );
}
