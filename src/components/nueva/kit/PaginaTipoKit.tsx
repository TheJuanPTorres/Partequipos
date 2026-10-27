import type { CSSProperties } from "react";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import estilosMarca from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { COLOR_SIN_MARCA } from "@/lib/marca/colorMarca";
import { conAlt, logoDeMarca } from "@/lib/marca/logoMarca";
import { acentoDeMarca, mediosDeKit, rendersDeTipos } from "@/lib/nueva/paginaKit";
import { categoriaDeTipo, seccionesKitDeTipo } from "@/lib/nueva/paginaTipo";
import type { GrupoDeSubtipo } from "@/lib/nueva/subtipos";
import { getLogosMarca } from "@/lib/queries/getLogosMarca";
import { getListadoNueva } from "@/lib/queries/getMaquinaria";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { rutas } from "@/lib/routes";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { tipoEnTitulo, tituloPorDefecto } from "@/lib/seo/porDefecto";
import { turnstileSiteKey } from "@/lib/turnstile";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

import { CabeceraKit } from "./CabeceraKit";
import { EmblemaKit } from "./EmblemaKit";
import estilos from "./kit.module.css";
import { SeccionTipoKit } from "./SeccionTipoKit";

const ANCLA_MODELOS = "modelos-nueva";
const ANCLA_CONTACTO = "contacto-tipo-nueva";
const ID_TITULO = "tipo-kit-titulo";

/**
 * PÁGINA DE MARCA + TIPO de maquinaria nueva con el «Kit de marca» de su padre (ronda 8,
 * 2026-10-26): solo cuando la MARCA tiene elegido «Kit de marca»; si no, la plantilla de siempre.
 * Las mismas piezas que la página de la marca (`PaginaMarcaKit`), sin píldora ni cinta (hay un
 * solo tipo):
 *
 * 1. La cabecera del kit de la marca (banda con su color, placa con el logo, su foto de fondo) con
 *    el `<h1>` de siempre, «{Tipo} {Marca}», y la descripción del tipo.
 * 2. El emblema de fondo, si la marca lo tiene activado.
 * 3. Una sección del kit para el tipo (franja diagonal y render en gris) con TODOS sus modelos en
 *    el orden del campo «Orden»; un tipo «paraguas», una por subtipo.
 * 4. El formulario final de siempre. Migas, SEO y URL no cambian (los pone la ruta).
 */
export async function PaginaTipoKit({
  marca,
  tipo,
  bloques,
  breadcrumbs,
}: {
  marca: MarcasMaquinaria;
  tipo: TiposMaquinaria;
  /** Los equipos por tipo: el propio, o uno por subtipo en un paraguas. */
  bloques: GrupoDeSubtipo[];
  breadcrumbs: { nombre: string; path: string }[];
}) {
  const [global, empresa, logos, listado] = await Promise.all([
    getRepuestosMarca(),
    getEmpresa(),
    getLogosMarca(),
    getListadoNueva(),
  ]);

  const nombre = marca.nombre.trim();
  const origen = `${rutas.tipoMaquinaria(marca.slug, tipo.slug)}/`;
  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  // La página general: la del tipo o, en un paraguas, la del primer subtipo que tenga una.
  const hrefCategoria =
    [tipo.id, ...bloques.map((b) => b.tipo.id)]
      .map((id) => categoriaDeTipo(id, listado.categorias))
      .find(Boolean) ?? null;
  const secciones = seccionesKitDeTipo({
    marca,
    bloques,
    renders: rendersDeTipos(
      bloques.map((b) => b.tipo),
      bloques.flatMap((b) => b.equipos),
    ),
    hrefCategoria,
  });
  const { fondo, emblema } = mediosDeKit(marca);
  const logo = conAlt(logoDeMarca(marca, logos), nombre);
  const { acento, tinta } = acentoDeMarca(marca, COLOR_SIN_MARCA);
  // El `<h1>` de siempre, «{Tipo} {Marca}», con el nombre del tipo como está en el panel (en
  // singular desde el 2026-10-23, cliente) y la primera letra en mayúscula (`tipoEnTitulo`).
  const titulo = tituloPorDefecto.tipoMaquinaria(tipoEnTitulo(tipo.nombre), marca.nombre);

  return (
    <main
      className={estilos.pagina}
      style={{ "--acento": acento, "--tinta": tinta } as CSSProperties}
    >
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <CabeceraKit
        id={ID_TITULO}
        titulo={titulo}
        texto={texto(tipo.descripcion)}
        fondo={fondo}
        logo={logo}
        destino={`#${ANCLA_MODELOS}`}
      />
      <EmblemaKit emblema={emblema}>
        <div id={ANCLA_MODELOS} className={estilos.tipos} tabIndex={-1}>
          {secciones.length > 0 ? (
            secciones.map((s, i) => (
              <SeccionTipoKit
                key={s.clave}
                seccion={s}
                marca={nombre}
                origen={origen}
                anclaContacto={ANCLA_CONTACTO}
                primera={i === 0}
              />
            ))
          ) : (
            <p className={estilos.seccion}>{`Todavía no hay equipos publicados para ${titulo}.`}</p>
          )}
        </div>
      </EmblemaKit>

      <div className={estilosMarca.pagina}>
        <ContactoMarca
          id={ANCLA_CONTACTO}
          titulo={texto(global.contactoTitulo)}
          subtitulo={texto(global.contactoSubtitulo)}
          boton={texto(global.contactoBoton)}
          origen={origen}
          siteKey={turnstileSiteKey()}
          whatsapp={empresa ? enlaceWhatsApp(empresa.whatsapp) : undefined}
          marca={nombre}
          formulario={{
            titulo: `Contacto sobre maquinaria ${nombre}`,
            conCiudad: true,
            etiquetaMensaje: "¿En qué estás interesado?",
          }}
        />
      </div>
    </main>
  );
}
