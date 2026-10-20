import type { CSSProperties } from "react";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { Revelado } from "@/components/movimiento/Revelado";
import { SeccionTestimonios } from "@/components/portada/diferidos";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import estilosMarca from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { colorDeMarca, tintaSobre } from "@/lib/marca/colorMarca";
import { conAlt, logoDeMarca } from "@/lib/marca/logoMarca";
import { enlacesDeTipos, seccionesDeTipos, textosMarcaNueva } from "@/lib/nueva/paginaMarcaAndres";
import { equiposPorTipo } from "@/lib/nueva/paginaMarca";
import { tarjetasDeTestimonios } from "@/lib/portada/seccionesH";
import { getLogosMarca } from "@/lib/queries/getLogosMarca";
import { getEquiposDeTipos, getTiposDeMarcaMaquinaria } from "@/lib/queries/getMaquinaria";
import { getTestimoniosDePortada } from "@/lib/queries/getPortadaH";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { rutas } from "@/lib/routes";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { MarcasMaquinaria } from "@/payload-types";

import { FranjaTipos } from "./FranjaTipos";
import estilos from "./marcaNueva.module.css";
import { TarjetaEquipo } from "./TarjetaEquipo";
import { VerTodosEquipos } from "./VerTodosEquipos";

const ANCLA_LINEA = "linea-de-equipos";
const ANCLA_CONTACTO = "contacto-marca-nueva";

/**
 * PÁGINA DE MARCA de maquinaria nueva con la plantilla de Andrés («Maquinaria
 * Nueva Marca», elementor 4023, 2026-10-20). Sustituye a la «Plantilla 1» en
 * Hitachi, CASE, Dynapac y Yanmar; Aditamentos sigue con la suya.
 *
 * 1. Cabecera con el logo de la marca, `Maquinaria <marca>`, su texto de
 *    presentación y el icono del ratón.
 * 2. «Nuestra línea de equipos <marca> incluye:», la franja en movimiento con
 *    sus tipos (enlazados) y la frase de cierre (editable en la marca).
 * 3. Una sección por tipo con las tarjetas de sus equipos (6 como mucho;
 *    con más, «Ver todos»), con la regla de colocación del #281.
 * 4. Contacto y testimonios en vídeo (los de la portada).
 *
 * Marcas, tipos y equipos ocultos o vacíos no salen: las consultas ya los filtran.
 */
export async function PaginaMarcaNueva({ marca }: { marca: MarcasMaquinaria }) {
  const [tipos, global, empresa, testimonios, logos] = await Promise.all([
    getTiposDeMarcaMaquinaria(marca.id),
    getRepuestosMarca(),
    getEmpresa(),
    getTestimoniosDePortada(),
    getLogosMarca(),
  ]);
  // Los equipos de todos los tipos y de sus subtipos (un «paraguas» cuenta por los suyos).
  const ids = new Set(tipos.map((t) => t.id));
  for (const t of tipos)
    for (const s of t.subtipos ?? []) ids.add(typeof s === "number" ? s : s.id);
  const equipos = await getEquiposDeTipos([...ids]);

  const t = textosMarcaNueva(marca);
  const nombre = marca.nombre.trim();
  const origen = rutas.marcaMaquinaria(marca.slug);
  const enlaces = enlacesDeTipos(marca, tipos, equiposPorTipo(equipos, tipos));
  const secciones = seccionesDeTipos(marca, tipos, equipos);
  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nueva() },
    { nombre: "Marcas", path: rutas.marcasMaquinaria() },
    { nombre, path: origen },
  ];
  // El color de la marca solo da el acento de los botones; sin él, el rojo del sitio.
  const color = colorDeMarca(marca.colorMarca);
  const acento = color
    ? ({ "--acento": color, "--acento-tinta": tintaSobre(color) } as CSSProperties)
    : undefined;

  return (
    <main className={estilosMarca.pagina} style={acento}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilosMarca.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca
        vista={{
          linea1: `Maquinaria ${nombre}`,
          linea2: "",
          descripcion: texto(marca.descripcion),
          fondo: imagenDeMedia(marca.imagenTarjeta, ""),
          logo: conAlt(logoDeMarca(marca, logos), nombre),
        }}
        anclaSiguiente={ANCLA_LINEA}
        franja={false}
        indice
        etiquetaRaton="Ir a la línea de equipos"
      />

      <section id={ANCLA_LINEA} className={estilos.linea} aria-label={t.intro}>
        <p className={estilos.intro}>{t.intro}</p>
        <FranjaTipos tipos={enlaces} />
        {t.cierre ? <p className={estilos.cierre}>{t.cierre}</p> : null}
      </section>

      <div className={estilos.tipos}>
        {secciones.map((s, i) => (
          <section key={s.clave} className={estilos.seccionTipo} aria-labelledby={`${s.clave}-t`}>
            <Revelado
              como="h2"
              id={`${s.clave}-t`}
              ritmo="titulo"
              texto={s.titulo}
              className={estilos.tituloTipo}
            />
            <ul className={estilos.rejilla}>
              {s.tarjetas.map((e, j) => (
                <TarjetaEquipo
                  key={e.id}
                  equipo={e}
                  anclaContacto={ANCLA_CONTACTO}
                  prioridad={i === 0 && j < 3}
                />
              ))}
            </ul>
            {s.hayMas ? (
              <div className={estilos.verTodos}>
                <VerTodosEquipos
                  titulo={s.titulo}
                  href={s.href}
                  total={s.total}
                  equipos={s.todas}
                  className={estilos.botonFicha}
                />
              </div>
            ) : null}
          </section>
        ))}
      </div>

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
    </main>
  );
}
