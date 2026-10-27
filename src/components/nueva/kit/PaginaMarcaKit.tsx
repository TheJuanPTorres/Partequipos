import type { CSSProperties } from "react";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { SeccionTestimonios } from "@/components/portada/diferidos";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import estilosMarca from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { COLOR_SIN_MARCA } from "@/lib/marca/colorMarca";
import { conAlt, logoDeMarca } from "@/lib/marca/logoMarca";
import { acentoDeMarca, mediosDeKit, rendersDeTipos, seccionesKit } from "@/lib/nueva/paginaKit";
import { seccionesDeTipos, textosMarcaNueva } from "@/lib/nueva/paginaMarcaAndres";
import { tarjetasDeTestimonios } from "@/lib/portada/seccionesH";
import { getLogosMarca } from "@/lib/queries/getLogosMarca";
import { getEquiposDeTipos, getTiposDeMarcaMaquinaria } from "@/lib/queries/getMaquinaria";
import { getTestimoniosDePortada } from "@/lib/queries/getPortadaH";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { rutas } from "@/lib/routes";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { turnstileSiteKey } from "@/lib/turnstile";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { MarcasMaquinaria } from "@/payload-types";

import { CabeceraKit } from "./CabeceraKit";
import { CintaKit } from "./CintaKit";
import { EmblemaKit } from "./EmblemaKit";
import estilos from "./kit.module.css";
import { PildoraKit } from "./PildoraKit";
import { SeccionTipoKit } from "./SeccionTipoKit";

const ANCLA_LINEA = "linea-de-equipos";
const ANCLA_CONTACTO = "contacto-marca-nueva";
const ID_TITULO = "marca-kit-titulo";

/**
 * PÁGINA DE MARCA de maquinaria nueva con el diseño «KIT DE MARCA» (2026-10-25, prototipo del
 * cliente portado; hoy, Case en el preview). Cada marca muestra SUS tipos, modelos, color, logo,
 * foto de fondo y emblema, todo del panel:
 *
 * 1. Cabecera partida con la foto propia de la marca, la placa del logo, el `<h1>` y el texto.
 * 2. Píldora de navegación que aparece al salir de la cabecera.
 * 3. «Nuestra línea de equipos {marca} incluye:» con la cinta continua de tipos.
 * 4. Una sección por tipo (hasta 6 modelos; «Ver toda la categoría» lleva a su página).
 * 5. El emblema de la marca, de fondo, si lo tiene y está activado.
 * 6. Se mantienen el contacto y los testimonios del final de la página.
 *
 * SEO, títulos y URL son los de siempre (metadatos de la página de la marca): el kit del cliente
 * traía `noindex` y se ignora. «Ver ficha» va a las fichas actuales; «Cotizar», a nuestra ventana.
 */
export async function PaginaMarcaKit({ marca }: { marca: MarcasMaquinaria }) {
  const [tipos, global, empresa, testimonios, logos] = await Promise.all([
    getTiposDeMarcaMaquinaria(marca.id),
    getRepuestosMarca(),
    getEmpresa(),
    getTestimoniosDePortada(),
    getLogosMarca(),
  ]);
  const ids = new Set(tipos.map((t) => t.id));
  for (const t of tipos)
    for (const s of t.subtipos ?? []) ids.add(typeof s === "number" ? s : s.id);
  const equipos = await getEquiposDeTipos([...ids]);

  const t = textosMarcaNueva(marca);
  const nombre = marca.nombre.trim();
  const origen = rutas.marcaMaquinaria(marca.slug);
  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  const secciones = seccionesKit(
    seccionesDeTipos(marca, tipos, equipos),
    tipos,
    rendersDeTipos(tipos, equipos),
  );
  const { fondo, emblema } = mediosDeKit(marca);
  const logo = conAlt(logoDeMarca(marca, logos), nombre);
  const { acento, tinta } = acentoDeMarca(marca, COLOR_SIN_MARCA);
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nuevaTipos() },
    { nombre: "Marcas", path: rutas.marcasMaquinaria() },
    { nombre, path: origen },
  ];

  const contenido = (
    <>
      <CintaKit
        id={ANCLA_LINEA}
        titulo={t.intro}
        nombre={nombre}
        tipos={secciones}
        cierre={t.cierre}
      />
      <div className={estilos.tipos}>
        {secciones.map((s, i) => (
          <SeccionTipoKit
            key={s.clave}
            seccion={s}
            marca={nombre}
            origen={origen}
            anclaContacto={ANCLA_CONTACTO}
            primera={i === 0}
          />
        ))}
      </div>
    </>
  );

  return (
    <main
      className={estilos.pagina}
      style={{ "--acento": acento, "--tinta": tinta } as CSSProperties}
    >
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <PildoraKit
        nombre={nombre}
        logo={logo}
        tipos={secciones.map((s) => ({
          clave: s.clave,
          nombre: s.titulo,
          imagen: s.render?.imagen ?? null,
          recortado: s.render?.recortado ?? false,
        }))}
        idCabecera={ID_TITULO}
      />
      <CabeceraKit
        id={ID_TITULO}
        titulo={`Maquinaria ${nombre}`}
        texto={texto(marca.descripcion)}
        fondo={fondo}
        logo={logo}
        destino={`#${ANCLA_LINEA}`}
      />
      <EmblemaKit emblema={emblema}>{contenido}</EmblemaKit>

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

        <SeccionTestimonios
          tarjetas={tarjetasDeTestimonios(testimonios)}
          textos={{
            titulo: texto(global.testimoniosTitulo),
            verVideoTexto: texto(global.verVideoTexto),
          }}
        />
      </div>
    </main>
  );
}
