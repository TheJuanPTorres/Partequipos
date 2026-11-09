import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { PieSinTarjeta } from "@/components/layout/PieSinTarjeta";
import { CategoriasMarca } from "@/components/repuestos/CategoriasMarca";
import { ContactoMarca } from "@/components/repuestos/ContactoMarca";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import estilos from "@/components/repuestos/marca.module.css";
import { AyudaWhatsApp } from "@/components/repuestos/modelo/AyudaWhatsApp";
import { ZonaAnimada } from "@/components/repuestos/ZonaAnimada";
import { FichaModelo } from "@/components/repuestos/modelo/FichaModelo";
import { OtrosModelosLista } from "@/components/repuestos/modelo/OtrosModelosLista";
import { PresentacionModelo } from "@/components/repuestos/modelo/PresentacionModelo";
import estilosModelo from "@/components/repuestos/modelo/modelo.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import { estiloDeMarca } from "@/lib/marca/colorMarca";
import { getModelosDeTipo } from "@/lib/queries/getModelos";
import { getCategoriasParaMarca, getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { segmentoDeTipo } from "@/lib/repuestos/anidado";
import { categoriasDeMarca, logoConAlt } from "@/lib/repuestos/marca";
import { ANIMACIONES_CATEGORIAS } from "@/lib/repuestos/animacionesCategorias";
import { tarjetasDeCategorias } from "@/lib/repuestos/plantillaTipo";
import { tituloFichaModelo, lineaDeTexto, otrosModelosDelTipo } from "@/lib/repuestos/fichaModelo";
import {
  categoriasDelTipo,
  referenciaModelo4086,
  tituloDisponibles4086,
  usaDisenoPropio,
  vistaModelo,
} from "@/lib/repuestos/modelo";
import { enlacesDeModelos } from "@/lib/repuestos/tipo";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { tipoEnTitulo, tituloPorDefecto } from "@/lib/seo/porDefecto";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/jsonLd";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import { conMensaje, enlaceWhatsApp } from "@/lib/whatsapp";
import type { Marca, ModelosRepuesto, TiposEquipo } from "@/payload-types";

/*
 * La PÁGINA DE MODELO de repuestos, común a sus dos rutas: `[marca]/[tipo]/[modelo]`
 * y, para los modelos de un tipo anidado (la «Excavadora» de CASE,
 * `src/lib/repuestos/anidado.ts`), un nivel más.
 *
 * Dos diseños, elegidos en el global «Páginas de marca de repuestos»
 * (`disenoModelo`): la PLANTILLA 4086 DE ANDRÉS, por defecto (2026-10-26; sustituye a la
 * versión provisional sencilla, con el mismo valor `provisional`), y el diseño propio del
 * #267, APAGADO (dirección, 2026-10-19: en el sitio publicado solo van diseños de Andrés). Los dos con el contenido de WordPress tal cual
 * (decisión del cliente). Detalle en docs/diseno/decisiones-modelo-repuestos.md.
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
  const logo = logoConAlt(marca);
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
    // Sin imagen: la página ya no muestra fotos de máquinas (Ronda 12) y el JSON-LD no declara lo que no se ve.
  });

  if (!usaDisenoPropio(global)) {
    const referencia = referenciaModelo4086({ marca, tipo, modelo });
    const whatsappModelo = enlaceWhatsApp(empresa.whatsapp);
    const otros = otrosModelosDelTipo(
      enlacesDeModelos(marca, tipo, await getModelosDeTipo(tipo.id)),
      modelo,
    );
    // Ronda 12 (2026-11-08): SIN FOTOS de máquinas (el cliente vende repuestos). Una ficha a dos
    // columnas (información y formulario corto con el modelo puesto) y, debajo, los otros modelos.
    return (
      <main className={estilos.pagina} style={estiloDeMarca(marca.colorMarca)}>
        <JsonLd data={[productJsonLd, buildBreadcrumbJsonLd(breadcrumbs)]} />
        {/* La página ya tiene su formulario: el pie no pinta la tarjeta roja. */}
        <PieSinTarjeta />
        <ZonaAnimada
          interruptores={ANIMACIONES_CATEGORIAS}
          permitirUrl={process.env.VERCEL_ENV !== "production"}
          entrada="C1"
        >
          <FichaModelo
            categorias={tarjetasDeCategorias(delTipo)}
            tituloCategorias={tituloDisponibles4086({ marca, tipo, modelo })}
            migas={breadcrumbs}
            titulo={tituloFichaModelo({ tipo, modelo })}
            logo={logo}
            linea={lineaDeTexto(modelo.descripcion)}
            datos={[]}
            formulario={configContactoMarca({
              origen: ruta,
              siteKey: turnstileSiteKey(),
              whatsapp: whatsappModelo
                ? conMensaje(whatsappModelo, `Hola, busco ${referencia}.`)
                : undefined,
              boton: "Pedir cotización",
              marca: modelo.nombre,
              modelo: { id: modelo.id, nombre: modelo.nombre },
              formulario: {
                titulo: "Pedir cotización",
                conCiudad: true,
                etiquetaMensaje: "¿En qué estás interesado?",
              },
              // El «Consulta sobre» ya lo dice el formulario: el mensaje solo invita a seguir.
              mensajeInicial: `Necesito cotizar ${referencia.charAt(0).toLowerCase()}${referencia.slice(1)}: `,
            })}
          />
        </ZonaAnimada>
        {vista.piezas.length > 0 ? (
          <ul className={estilosModelo.piezas}>
            {vista.piezas.map((p, i) => (
              <li key={`${i}-${p}`}>{p}</li>
            ))}
          </ul>
        ) : null}
        <OtrosModelosLista
          id="otros-modelos"
          titulo={`Otros modelos de ${tipoEnTitulo(tipo.nombre)} ${marca.nombre}`}
          modelos={otros}
        />
      </main>
    );
  }

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
        formulario={configContactoMarca({
          origen: ruta,
          siteKey: turnstileSiteKey(),
          whatsapp: enlaceWhatsApp(empresa.whatsapp),
          boton: texto(global.contactoBoton) || "Enviar solicitud",
          marca: modelo.nombre,
          modelo: { id: modelo.id, nombre: modelo.nombre },
        })}
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
