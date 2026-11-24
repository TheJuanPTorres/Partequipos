import { ContextoWhatsApp } from "@/components/layout/ContextoWhatsApp";
import type { Metadata } from "next";

import { PieSinTarjeta } from "@/components/layout/PieSinTarjeta";
import estilos from "@/components/repuestos/marca.module.css";
import { ZonaAnimada } from "@/components/repuestos/ZonaAnimada";
import { FichaModelo } from "@/components/repuestos/modelo/FichaModelo";
import { OtrosModelosLista } from "@/components/repuestos/modelo/OtrosModelosLista";
import { JsonLd } from "@/components/seo/JsonLd";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import { estiloDeMarca } from "@/lib/marca/colorMarca";
import { getModelosDeTipo } from "@/lib/queries/getModelos";
import { getCategoriasParaMarca } from "@/lib/queries/getRepuestosMarca";
import { getEmpresa } from "@/lib/queries/getSeo";
import { segmentoDeTipo } from "@/lib/repuestos/anidado";
import { logoConAlt } from "@/lib/repuestos/marca";
import { ANIMACIONES_CATEGORIAS } from "@/lib/repuestos/animacionesCategorias";
import { tarjetasDeCategorias } from "@/lib/repuestos/plantillaTipo";
import { tituloFichaModelo, lineaDeTexto, otrosModelosDelTipo } from "@/lib/repuestos/fichaModelo";
import {
  categoriasDelTipo,
  referenciaModelo4086,
  tituloDisponibles4086,
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
 * La PLANTILLA 4086 DE ANDRÉS (2026-10-26), con el contenido de WordPress tal cual (decisión
 * del cliente). El diseño propio del #267, que estaba apagado, se retiró el 2026-11-18
 * (dirección, limpieza del panel); queda en git. Detalle en docs/diseno/decisiones-modelo-repuestos.md.
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

export async function PaginaModeloRepuesto({
  marca,
  tipo,
  modelo,
}: {
  marca: Marca;
  tipo: TiposEquipo;
  modelo: ModelosRepuesto;
}) {
  const [categorias, empresa] = await Promise.all([getCategoriasParaMarca(), getEmpresa()]);
  const seg = segmentoDeTipo(tipo);
  const padre = poblado<TiposEquipo>(tipo.tipoPadre);
  const ruta = rutas.modelo(marca.slug, seg, modelo.slug);

  const logo = logoConAlt(marca);
  // Las categorías elegidas en el tipo, en su orden.
  const delTipo = categoriasDelTipo(tipo, categorias);

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

  const referencia = referenciaModelo4086({ marca, tipo, modelo });
  const whatsappModelo = enlaceWhatsApp(empresa.whatsapp);
  const whatsappConModelo = whatsappModelo
    ? conMensaje(whatsappModelo, `Hola, busco ${referencia}.`)
    : undefined;
  const otros = otrosModelosDelTipo(
    enlacesDeModelos(marca, tipo, await getModelosDeTipo(tipo.id)),
    modelo,
  );
  // Ronda 12 (2026-11-08): SIN FOTOS de máquinas (el cliente vende repuestos). Una ficha a dos
  // columnas (información y formulario corto con el modelo puesto) y, debajo, los otros modelos.
  return (
    <main className={estilos.pagina} style={estiloDeMarca(marca.colorMarca)}>
      <JsonLd data={[productJsonLd, buildBreadcrumbJsonLd(breadcrumbs)]} />
      <ContextoWhatsApp texto={referencia} />
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
          whatsapp={whatsappConModelo?.href}
          formulario={configContactoMarca({
            origen: ruta,
            siteKey: turnstileSiteKey(),
            whatsapp: whatsappConModelo,
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
      {/* Ficha v2 (2026-11-13, Juan Pablo): la lista de piezas de WordPress («- Filtros para …», el campo
          `piezas` del modelo) NO se pinta. */}
      <OtrosModelosLista
        id="otros-modelos"
        titulo={`Otros modelos de ${tipoEnTitulo(tipo.nombre)} ${marca.nombre}`}
        modelos={otros}
        logo={logo}
      />
    </main>
  );
}
