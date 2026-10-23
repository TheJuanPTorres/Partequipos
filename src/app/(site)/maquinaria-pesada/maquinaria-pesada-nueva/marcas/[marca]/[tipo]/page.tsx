import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { Revelado } from "@/components/movimiento/Revelado";
import { TarjetaEquipo } from "@/components/nueva/TarjetaEquipo";
import estilosTarjetas from "@/components/nueva/marcaNueva.module.css";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { colorDeMarca, estiloDeMarca, tintaSobre } from "@/lib/marca/colorMarca";
import { tarjetasDeEquipos, tituloFranja, vistaEncabezadoTipoNueva } from "@/lib/nueva/paginaTipo";
import type { TarjetaEquipo as DatosTarjeta } from "@/lib/nueva/paginaMarcaAndres";
import { gruposDeSubtipos, subtiposDe } from "@/lib/nueva/subtipos";
import {
  getEquiposDeTipo,
  getEquiposDeTipos,
  getMarcaMaquinariaPorSlug,
  getTipoMaquinariaPorSlug,
  getTiposMaquinaria,
} from "@/lib/queries/getMaquinaria";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { turnstileSiteKey } from "@/lib/turnstile";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import { metadataSinIndexar } from "@/lib/filtros/seo";
import { rutas } from "@/lib/routes";
import { indexacionPermitida } from "@/lib/seo/config";
import { metadataDe } from "@/lib/seo/metadata";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { poblado } from "@/lib/utils/relations";
import type { MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";
import { METADATA_404 } from "@/lib/seo/noEncontrada";

type Params = { marca: string; tipo: string };

/** Ancla de la franja de equipos: a ella baja el icono de ratón del encabezado. */
const ANCLA_MODELOS = "modelos-nueva";
const ANCLA_CONTACTO = "contacto-tipo-nueva";

export async function generateStaticParams(): Promise<Params[]> {
  const tipos = await getTiposMaquinaria();
  return tipos.flatMap((tipo) => {
    const marca = poblado<MarcasMaquinaria>(tipo.marca);
    return marca ? [{ marca: marca.slug, tipo: tipo.slug }] : [];
  });
}

/** Resuelve marca + tipo validando que el tipo pertenezca REALMENTE a la marca. */
async function resolver(params: Params) {
  const marca = await getMarcaMaquinariaPorSlug(params.marca);
  if (!marca) return null;

  const tipo = await getTipoMaquinariaPorSlug(marca.id, params.tipo);
  if (!tipo) return null;

  return { marca, tipo };
}

/**
 * Los equipos que lista la página: los del tipo o, si es un tipo «paraguas»
 * (con `subtipos`, auditoría de estructura del 2026-10-17), los de sus
 * subtipos, por grupos.
 */
async function equiposDePagina(tipo: TiposMaquinaria) {
  const subtipos = subtiposDe(tipo);
  if (subtipos.length === 0) return { grupos: null, equipos: await getEquiposDeTipo(tipo.id) };
  const equipos = await getEquiposDeTipos(subtipos.map((s) => s.id));
  return { grupos: gruposDeSubtipos(subtipos, equipos), equipos };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await resolver(await params);
  if (!data) return METADATA_404;

  const { marca, tipo } = data;
  const base = await metadataDe({
    nombre: tituloPorDefecto.tipoMaquinaria(tipo.nombre, marca.nombre),
    path: rutas.tipoMaquinaria(marca.slug, tipo.slug),
    descripcion: tipo.descripcion,
    seo: tipo.seo,
  });
  // D4 (dirección, 2026-10-14): sin equipos, no se indexa; vuelve sola con el
  // primero, que revalida esta página. La URL sigue en 200 con su estado vacío.
  const { equipos } = await equiposDePagina(tipo);
  return equipos.length > 0 ? base : metadataSinIndexar(base, indexacionPermitida());
}

export default async function TipoMaquinariaPage({ params }: { params: Promise<Params> }) {
  const data = await resolver(await params);
  if (!data) notFound();

  const { marca, tipo } = data;
  const { grupos, equipos } = await equiposDePagina(tipo);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nuevaTipos() },
    { nombre: "Marcas", path: rutas.marcasMaquinaria() },
    { nombre: marca.nombre, path: rutas.marcaMaquinaria(marca.slug) },
    { nombre: tipo.nombre, path: rutas.tipoMaquinaria(marca.slug, tipo.slug) },
  ];

  const [global, empresa] = await Promise.all([getRepuestosMarca(), getEmpresa()]);
  const nombre = marca.nombre.trim();
  const origen = `${rutas.tipoMaquinaria(marca.slug, tipo.slug)}/`;
  const texto = (v: string | null | undefined) => v?.trim() ?? "";
  // La ficha cuelga del tipo del equipo (en un paraguas, su subtipo). Las tarjetas son las de la marca.
  const bloques: { clave: string; titulo: string | null; tarjetas: DatosTarjeta[] }[] = grupos
    ? grupos.map((g) => ({
        clave: g.tipo.slug,
        titulo: g.tipo.nombre,
        tarjetas: tarjetasDeEquipos(marca, g.tipo.slug, g.equipos),
      }))
    : [{ clave: tipo.slug, titulo: null, tarjetas: tarjetasDeEquipos(marca, tipo.slug, equipos) }];
  const hayTarjetas = bloques.some((b) => b.tarjetas.length > 0);
  const color = colorDeMarca(marca.colorMarca);
  const acento = color
    ? ({ "--acento": color, "--acento-tinta": tintaSobre(color) } as CSSProperties)
    : undefined;

  return (
    <main className={estilos.pagina} style={{ ...estiloDeMarca(marca.colorMarca), ...acento }}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca
        vista={vistaEncabezadoTipoNueva(marca, tipo, equipos)}
        anclaSiguiente={ANCLA_MODELOS}
        bajaSinFoto
      />

      <section
        id={ANCLA_MODELOS}
        className={estilosTarjetas.seccionTipo}
        aria-labelledby="modelos-nueva-t"
      >
        <Revelado
          como="h2"
          id="modelos-nueva-t"
          ritmo="titulo"
          texto={tituloFranja(marca, tipo)}
          className={estilosTarjetas.tituloTipo}
        />
        {hayTarjetas ? (
          bloques.map((b, i) => (
            <div key={b.clave} id={b.titulo ? `subtipo-${b.clave}` : undefined}>
              {b.titulo ? <h3 className={estilosTarjetas.tituloTipo}>{b.titulo}</h3> : null}
              <ul className={estilosTarjetas.rejilla}>
                {b.tarjetas.map((e, j) => (
                  <TarjetaEquipo
                    key={e.id}
                    equipo={e}
                    anclaContacto={ANCLA_CONTACTO}
                    prioridad={i === 0 && j < 3}
                  />
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p>{`Todavía no hay equipos publicados para ${tituloPorDefecto.tipoMaquinaria(tipo.nombre, marca.nombre)}.`}</p>
        )}
      </section>

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
    </main>
  );
}
