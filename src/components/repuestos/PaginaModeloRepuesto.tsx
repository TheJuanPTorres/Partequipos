import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { PieSinTarjeta } from "@/components/layout/PieSinTarjeta";
import { CategoriasMarca } from "@/components/repuestos/CategoriasMarca";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import estilos from "@/components/repuestos/marca.module.css";
import { AyudaWhatsApp } from "@/components/repuestos/modelo/AyudaWhatsApp";
import { PresentacionModelo } from "@/components/repuestos/modelo/PresentacionModelo";
import estilosModelo from "@/components/repuestos/modelo/modelo.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { estiloDeMarca } from "@/lib/marca/colorMarca";
import { getCategoriasParaMarca, getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { segmentoDeTipo } from "@/lib/repuestos/anidado";
import { categoriasDeMarca } from "@/lib/repuestos/marca";
import { categoriasDelTipo, vistaModelo } from "@/lib/repuestos/modelo";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/jsonLd";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { Marca, ModelosRepuesto, TiposEquipo } from "@/payload-types";

/*
 * La PÁGINA DE MODELO de repuestos, común a sus dos rutas: `[marca]/[tipo]/[modelo]`
 * y, para los modelos de un tipo anidado (la «Excavadora» de CASE,
 * `src/lib/repuestos/anidado.ts`), un nivel más.
 *
 * Diseño propio aprobado por dirección el 2026-10-19 (Andrés no tiene
 * plantilla), con los componentes de las páginas de marca y tipo y el
 * contenido de WordPress tal cual (decisión del cliente). Detalle en
 * docs/diseno/decisiones-modelo-repuestos.md.
 */

/** Metadatos de la ficha de un modelo de repuestos. */
export async function metadataModeloRepuesto(
  marca: Marca,
  tipo: TiposEquipo,
  modelo: ModelosRepuesto,
): Promise<Metadata> {
  const imagenes = Array.isArray(modelo.imagenes) ? modelo.imagenes : [];
  const portada = imagenDeMedia(imagenes[0], modelo.nombre);

  return metadataDe({
    nombre: tituloPorDefecto.modeloRepuesto(modelo.nombre),
    path: rutas.modelo(marca.slug, segmentoDeTipo(tipo), modelo.slug),
    descripcion: modelo.descripcion,
    seo: modelo.seo,
    imageUrl: portada?.url,
  });
}

/** Ancla del formulario: «Solicitar repuestos» baja aquí. */
const ANCLA_CONTACTO = "modelo-contacto";
/** Ancla de las categorías: a ellas baja el icono del ratón de la cabecera. */
const ANCLA_CATEGORIAS = "modelo-categorias";

export async function PaginaModeloRepuesto({
  marca,
  tipo,
  modelo,
}: {
  marca: Marca;
  tipo: TiposEquipo;
  modelo: ModelosRepuesto;
}) {
  const [global, categorias, empresa] = await Promise.all([
    getRepuestosMarca(),
    getCategoriasParaMarca(),
    getEmpresa(),
  ]);
  const seg = segmentoDeTipo(tipo);
  const padre = poblado<TiposEquipo>(tipo.tipoPadre);
  const ruta = rutas.modelo(marca.slug, seg, modelo.slug);
  const vista = vistaModelo(modelo);
  const texto = (v: string | null | undefined) => v?.trim() ?? "";

  const imagenes = (Array.isArray(modelo.imagenes) ? modelo.imagenes : [])
    .map((img) => imagenDeMedia(img, modelo.nombre))
    .filter((img): img is NonNullable<typeof img> => img !== null);
  const logo = imagenDeMedia(marca.logo, `Logo de ${marca.nombre.trim()}`);
  const whatsapp = enlaceWhatsApp(
    empresa.whatsapp,
    `Hola, busco repuestos para ${modelo.nombre}.`,
  )?.href;
  // Las categorías elegidas en el tipo, en su orden, con su enlace (las de la marca).
  const delTipo = categoriasDelTipo(tipo, categorias);
  const conEnlace = categoriasDeMarca(delTipo);
  const enOrden = delTipo.flatMap((c) => conEnlace.filter((d) => d.id === c.id));

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
    { nombre: "Marcas", path: rutas.marcas() },
    { nombre: marca.nombre, path: rutas.marca(marca.slug) },
    ...(padre && tipo.slugPadre
      ? [{ nombre: padre.nombre, path: rutas.tipo(marca.slug, tipo.slugPadre) }]
      : []),
    { nombre: tipo.nombre, path: rutas.tipo(marca.slug, seg) },
    { nombre: modelo.nombre, path: ruta },
  ];

  const productJsonLd = buildProductJsonLd({
    nombre: modelo.nombre,
    path: ruta,
    descripcion: modelo.descripcion,
    marca: marca.nombre,
    codigo: modelo.codigo,
    imagenes: imagenes.map((img) => img.url),
  });

  return (
    <main className={estilos.pagina} style={estiloDeMarca(marca.colorMarca)}>
      <JsonLd data={[productJsonLd, buildBreadcrumbJsonLd(breadcrumbs)]} />
      {/* La página ya tiene su formulario: el pie no pinta la tarjeta roja. */}
      <PieSinTarjeta />
      {/* Migas solo para lectores de pantalla, como en las páginas de marca y tipo. */}
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca
        vista={{
          antetitulo: vista.antetitulo,
          linea1: vista.titulo,
          linea2: "",
          descripcion: "",
          fondo: imagenDeMedia(tipo.imagen, "") ?? imagenDeMedia(marca.fondoHero, ""),
          logo,
          logoOscuro: Boolean(marca.logoOscuroEnMenu),
        }}
        anclaSiguiente={ANCLA_CATEGORIAS}
        bajo
        tituloLargo
      />

      <PresentacionModelo
        texto={texto(modelo.descripcion)}
        foto={imagenes[0] ?? null}
        logo={logo}
        solicitarHref={`#${ANCLA_CONTACTO}`}
        whatsapp={whatsapp ?? null}
      />

      <CategoriasMarca
        id={ANCLA_CATEGORIAS}
        titulo={vista.disponibles}
        categorias={enOrden}
        todasEnMovil
      >
        {vista.piezas.length > 0 ? (
          <ul className={estilosModelo.piezas}>
            {vista.piezas.map((p, i) => (
              <li key={`${i}-${p}`}>{p}</li>
            ))}
          </ul>
        ) : null}
      </CategoriasMarca>

      <AyudaWhatsApp
        titulo={texto(global.modeloAyudaTitulo)}
        texto={texto(global.modeloAyudaTexto)}
        boton={texto(global.modeloAyudaBoton) || "WhatsApp"}
        href={whatsapp ?? null}
        fondo={imagenDeMedia(global.modeloAyudaFoto, "")}
      />

      <ContactoMarca
        id={ANCLA_CONTACTO}
        titulo={texto(global.contactoTitulo)}
        subtitulo={texto(global.modeloContactoTitulo) || texto(global.contactoSubtitulo)}
        boton={texto(global.contactoBoton) || "Enviar solicitud"}
        origen={ruta}
        siteKey={turnstileSiteKey()}
        whatsapp={enlaceWhatsApp(empresa.whatsapp)}
        marca={modelo.nombre}
        modelo={{ id: modelo.id, nombre: modelo.nombre }}
      />
    </main>
  );
}
