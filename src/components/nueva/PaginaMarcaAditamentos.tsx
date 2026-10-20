import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { PorQueElegirnos } from "@/components/repuestos/PorQueElegirnos";
import { SedesCompactas } from "@/components/repuestos/SedesCompactas";
import { TarjetasMarca } from "@/components/repuestos/TarjetasMarca";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import { seccionesAditamentos, TEXTOS_ADITAMENTOS } from "@/lib/nueva/paginaAditamentos";
import { sedesDePortada } from "@/lib/portada/sedes";
import { getEquiposDeTipos, getTiposDeMarcaMaquinaria } from "@/lib/queries/getMaquinaria";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getSedesDePortada } from "@/lib/queries/getSedes";
import { getEmpresa } from "@/lib/queries/getSeo";
import { rutas } from "@/lib/routes";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { MarcasMaquinaria } from "@/payload-types";

import { FranjaServicios } from "./FranjaServicios";

const ANCLA_PRODUCTOS = "aditamentos-por-tipo";
const ANCLA_CONTACTO = "contacto-aditamentos";

/**
 * PÁGINA DE MARCA «ADITAMENTOS» con la plantilla de Andrés (elementor 4020,
 * 2026-10-20). Solo para esta marca; las demás siguen con la «Plantilla 1».
 *
 * - Cabecera de la «Plantilla 1» (70 % de la ventana, título revelado e icono
 *   del ratón) con «Aditamentos para maquinaria pesada» como `<h1>`.
 * - Un bloque por tipo, uno debajo del otro (en el export, a dos columnas), con
 *   sus productos como tarjetas de la «Plantilla 1» y la regla de colocación del #281.
 * - Contacto, la franja de servicios, «Nuestro compromiso…» (sin foto, solo el
 *   texto) y las sedes: los componentes de repuestos.
 */
export async function PaginaMarcaAditamentos({ marca }: { marca: MarcasMaquinaria }) {
  const [tipos, global, empresa, sedes] = await Promise.all([
    getTiposDeMarcaMaquinaria(marca.id),
    getRepuestosMarca(),
    getEmpresa(),
    getSedesDePortada(),
  ]);
  const equipos = await getEquiposDeTipos(tipos.map((t) => t.id));
  const secciones = seccionesAditamentos(marca, tipos, equipos);

  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  const origen = rutas.marcaMaquinaria(marca.slug);
  const whatsapp = empresa ? enlaceWhatsApp(empresa.whatsapp) : undefined;
  const verTodo = texto(global.verTodoTexto) || "Ver todo";
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nueva() },
    { nombre: "Marcas", path: rutas.marcasMaquinaria() },
    { nombre: marca.nombre, path: origen },
  ];

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca
        vista={{
          antetitulo: TEXTOS_ADITAMENTOS.antetitulo,
          linea1: TEXTOS_ADITAMENTOS.titulo,
          linea2: "",
          descripcion: "",
          fondo: imagenDeMedia(marca.imagenTarjeta, ""),
          logo: null,
        }}
        anclaSiguiente={secciones.length > 0 ? ANCLA_PRODUCTOS : ANCLA_CONTACTO}
        franja={false}
        indice
        etiquetaRaton="Ir a los aditamentos"
      />

      <div id={ANCLA_PRODUCTOS}>
        {secciones.map((s) => (
          <TarjetasMarca
            key={s.clave}
            id={`aditamentos-${s.clave}`}
            titulo={s.titulo}
            verTodo={verTodo}
            tarjetas={s.tarjetas}
            indice
          />
        ))}
      </div>

      <ContactoMarca
        id={ANCLA_CONTACTO}
        titulo={texto(global.contactoTitulo)}
        subtitulo={texto(global.contactoSubtitulo)}
        boton={texto(global.contactoBoton)}
        origen={origen}
        siteKey={turnstileSiteKey()}
        whatsapp={whatsapp}
        marca={marca.nombre}
      />

      <FranjaServicios textos={TEXTOS_ADITAMENTOS.franja} />

      <PorQueElegirnos
        id="nuestro-compromiso"
        vista={{
          titulo: TEXTOS_ADITAMENTOS.compromisoTitulo,
          imagen: null,
          entradilla: TEXTOS_ADITAMENTOS.compromisoEntradilla,
          texto: TEXTOS_ADITAMENTOS.compromisoTexto,
          puntos: [],
          cierre: "",
          boton: TEXTOS_ADITAMENTOS.compromisoBoton,
        }}
        anclaContacto={ANCLA_CONTACTO}
        formulario={configContactoMarca({
          origen,
          siteKey: turnstileSiteKey(),
          whatsapp,
          boton: texto(global.contactoBoton),
          marca: marca.nombre,
        })}
      />

      <SedesCompactas id="sedes-aditamentos" sedes={sedesDePortada(sedes)} />
    </main>
  );
}
