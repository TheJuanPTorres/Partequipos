import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { tieneCabecera, type VistaBloque } from "@/lib/bloques/vista";
import { buildBreadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/jsonLd";

import { BloqueCabeceraVideo } from "./BloqueCabeceraVideo";
import { BloqueCifras } from "./BloqueCifras";
import { BloqueFranjaMarquee } from "./BloqueFranjaMarquee";
import { BloquePresentacionImagen } from "./BloquePresentacionImagen";
import { BloqueTarjetasExpandibles } from "./BloqueTarjetasExpandibles";
import estilos from "./paginaConBloques.module.css";

type Props = {
  /** El título de la página: es el `<h1>` si ningún bloque de cabecera lo pone. */
  titulo: string;
  migas: BreadcrumbItem[];
  bloques: VistaBloque[];
};

/**
 * UNA PÁGINA COMPUESTA CON BLOQUES: migas, JSON-LD de las migas y los bloques,
 * en un solo `<main>`. El texto enriquecido y las «secciones» de la página NO
 * se pintan (decisión de dirección; el panel lo avisa).
 *
 * UN SOLO `<h1>`: el del bloque de cabecera; si la página no tiene cabecera,
 * el título de la página.
 */
export function PaginaConBloques({ titulo, migas, bloques }: Props) {
  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(migas)} />
      {/* Migas solo para lectores de pantalla: ux-9 no las pinta (decisión de dirección). */}
      <div className="sr-only">
        <Breadcrumbs items={migas} />
      </div>
      {tieneCabecera(bloques) ? null : <h1 className={estilos.titulo}>{titulo}</h1>}
      {bloques.map((b, i) => {
        const clave = b.id ?? `${b.blockType}-${i}`;
        switch (b.blockType) {
          case "cabeceraVideo":
            return <BloqueCabeceraVideo key={clave} {...b} />;
          case "presentacionImagen":
            return <BloquePresentacionImagen key={clave} {...b} />;
          case "cifras":
            return <BloqueCifras key={clave} {...b} />;
          case "franjaMarquee":
            return <BloqueFranjaMarquee key={clave} {...b} />;
          case "tarjetasExpandibles":
            return <BloqueTarjetasExpandibles key={clave} {...b} />;
        }
      })}
    </main>
  );
}
