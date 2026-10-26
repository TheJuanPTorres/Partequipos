import { IconArrowRight, IconBrandWhatsapp, IconMail } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { BotonFormulario } from "@/components/forms/BotonFormulario";
import { JsonLd } from "@/components/seo/JsonLd";
import { ANIMACIONES_ARTICULO } from "@/lib/blog/animacionesArticulo";
import { autorVisible, postRecientes, sinImagenPrincipal } from "@/lib/blog/articulo";
import { minutosDeLectura } from "@/lib/blog/indice";
import {
  articulosRelacionados,
  categoriaRelacionada,
  entradillaRepiteCuerpo,
  textoEnlaceRelacionada,
  type CandidataRelacion,
} from "@/lib/blog/relacionada";
import { configContactoMarca } from "@/lib/formularios/configFormulario";
import { textoPlanoLexical } from "@/lib/maquinaria/reservaTexto";
import { getIndiceBlog } from "@/lib/queries/getBlog";
import { getCategoriasRepuestos } from "@/lib/queries/getCategoriasRepuestos";
import { rutaDeCategoriaTecnica } from "@/lib/repuestos/subcategorias";
import { getCategoriasUsada } from "@/lib/queries/getMaquinaria";
import { getEmpresa, getLogo } from "@/lib/queries/getSeo";
import { rutas } from "@/lib/routes";
import { absoluteUrl, seoConfig } from "@/lib/seo/config";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { turnstileSiteKey } from "@/lib/turnstile";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import { activasDe } from "@/lib/listado/animaciones";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type {
  Articulo,
  CategoriasBlog,
  CategoriasMaquinaria,
  CategoriasTecnica,
  CategoriasUsada,
} from "@/payload-types";

import { AnimacionesArticulo } from "./AnimacionesArticulo";
import { BarraCompartir } from "./BarraCompartir";
import { CuerpoArticulo } from "./CuerpoArticulo";
import { fechaLarga } from "./fecha";
import { TarjetaArticulo } from "./IndiceBlog";
import estilos from "./articuloPropio.module.css";
import reserva from "./cabeceraArticulo.module.css";
import { PostRecientes } from "./PostRecientes";
import { ProgresoLectura } from "./ProgresoLectura";

const ID_CUERPO = "articulo-cuerpo";
const ID_PAGINA = "articulo-pagina";

/**
 * El artículo del blog con el DISEÑO PROPIO (2026-10-21, dirección): Andrés no
 * tiene plantilla de artículo, así que se compone con sus piezas (tipografía,
 * colores, tarjetas del índice, cabecera baja) detrás del interruptor «Diseño
 * del artículo» de «Páginas índice y contacto» → «Blog». Apagado (provisional),
 * el artículo es `ArticuloCuerpo`, como siempre.
 *
 * - cabecera baja con migas, categoría, `<h1>`, fecha, autor y tiempo de lectura;
 * - imagen destacada grande con esquinas redondeadas y, debajo (como WordPress,
 *   2026-10-26), «Comparte esta nota de interés» y los datos: autor, fecha y
 *   minutos de lectura. La imagen principal no se repite en el contenido
 *   (`sinImagenPrincipal`) y un autor que parece usuario interno firma
 *   «Partequipos» (`autorVisible`);
 * - columna de lectura de 720 px con estilo para títulos, listas, citas, tablas
 *   (con desplazamiento propio) e imágenes con pie, y barra de progreso;
 * - «Post recientes» a la derecha desde 1025 px (debajo en móvil). Sin el índice
 *   «En este artículo» (2026-10-26);
 * - mejoras A1–A3 con su interruptor (`ANIMACIONES_ARTICULO`);
 * - llamada final que abre la ventana emergente del formulario y, si el título
 *   habla de una categoría del sitio, un enlace a ella (`categoriaRelacionada`);
 * - tres artículos relacionados con las tarjetas del índice.
 *
 * SEO igual que antes (URL, canónica, imagen social: `generateMetadata` de la
 * ruta), con JSON-LD `BlogPosting`.
 */
export async function ArticuloPropio({ articulo }: { articulo: Articulo }) {
  const [logo, empresa, indice, repuestos, usadas] = await Promise.all([
    getLogo(),
    getEmpresa(),
    getIndiceBlog(),
    getCategoriasRepuestos(),
    getCategoriasUsada(),
  ]);

  const categoria = poblado<CategoriasBlog>(articulo.categoria);
  const imagen = imagenDeMedia(articulo.imagenDestacada, articulo.titulo);
  const autor = autorVisible(articulo.autor, seoConfig.siteName);
  const cuerpoTexto = textoPlanoLexical(articulo.contenido);
  const minutos = minutosDeLectura(cuerpoTexto);
  const contenido = sinImagenPrincipal(articulo.contenido, articulo.imagenDestacada);
  const path = rutas.articulo(articulo.slug);
  const url = absoluteUrl(`${path}/`);

  const yo = indice.articulos.find((a) => a.id === articulo.id);
  const relacionados = yo ? articulosRelacionados(yo, indice.articulos, 3) : [];
  const recientes = postRecientes(indice.articulos, articulo.id, 3);
  // A1–A3 encendidas en el código; en un preview, `?anim=` las recorta en el navegador.
  const permitirUrl = process.env.VERCEL_ENV !== "production";
  const animaciones = activasDe(ANIMACIONES_ARTICULO, null, false).join(" ");

  const candidatas: CandidataRelacion[] = [
    // Con su dirección real: una categoría que cuelga de otra (Filtros Donaldson) va bajo ella.
    ...repuestos.flatMap((c) => {
      const ruta = rutaDeCategoriaTecnica(c);
      return ruta ? [{ nombre: c.nombre, href: `${ruta}/`, tipo: "repuestos" as const }] : [];
    }),
    ...usadas.map((c) => ({
      nombre: c.nombre,
      href: `${rutas.categoriaUsada(c.slug)}/`,
      tipo: "usada" as const,
    })),
  ];
  // Primero la categoría elegida en el panel; sin ella, la deducción por el título.
  const elegida = articulo.categoriaRelacionada;
  const valorElegido = elegida && typeof elegida.value === "object" ? elegida.value : null;
  let relacionada: CandidataRelacion | null = null;
  if (elegida && valorElegido && valorElegido.slug) {
    if (elegida.relationTo === "categorias-tecnicas") {
      const c = valorElegido as CategoriasTecnica;
      // La de la lista trae poblada la categoría de la que cuelga.
      const ruta = rutaDeCategoriaTecnica(repuestos.find((r) => r.id === c.id) ?? c);
      relacionada = ruta ? { nombre: c.nombre, href: `${ruta}/`, tipo: "repuestos" } : null;
    } else if (elegida.relationTo === "categorias-usada") {
      const c = valorElegido as CategoriasUsada;
      relacionada = { nombre: c.nombre, href: `${rutas.categoriaUsada(c.slug)}/`, tipo: "usada" };
    } else {
      const c = valorElegido as CategoriasMaquinaria;
      relacionada = { nombre: c.nombre, href: `${rutas.categoriaNueva(c.slug)}/`, tipo: "nueva" };
    }
  }
  relacionada ??= categoriaRelacionada(articulo.titulo, candidatas);
  const primerosBloques = cuerpoTexto.split("\n\n").slice(0, 2);
  const mostrarEntradilla =
    !!articulo.entradilla &&
    !primerosBloques.some((p) => entradillaRepiteCuerpo(articulo.entradilla ?? "", p));

  const whatsapp = enlaceWhatsApp(
    empresa.whatsapp,
    `Hola, leí el artículo «${articulo.titulo}» y necesito asesoría.`,
  );

  const formulario = configContactoMarca({
    origen: `${path}/`,
    siteKey: turnstileSiteKey(),
    whatsapp,
    boton: "Enviar",
    marca: "",
    formulario: { titulo: "Contáctanos", conCiudad: true, etiquetaMensaje: "¿Qué necesitas?" },
  });

  const nombreCategoria = categoria && categoria.nombre !== "Noticias" ? categoria.nombre : null;
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Noticias", path: rutas.blog() },
    ...(nombreCategoria && categoria
      ? [{ nombre: nombreCategoria, path: rutas.categoriaBlog(categoria.slug) }]
      : []),
    { nombre: articulo.titulo, path },
  ];

  const fecha = fechaLarga(articulo.fechaPublicacion);
  const lectura = `${minutos} min de lectura`;
  const meta = [fecha, lectura, `Por ${autor}`].join(" · ");

  return (
    <main id={ID_PAGINA} className={estilos.pagina} data-anim={animaciones}>
      <JsonLd
        data={[
          buildArticleJsonLd({
            tipo: "BlogPosting",
            titulo: articulo.titulo,
            path,
            descripcion: articulo.entradilla,
            fechaPublicacion: articulo.fechaPublicacion,
            fechaModificacion: articulo.updatedAt,
            autor: articulo.autor,
            imagenUrl: imagen?.url,
            logoUrl: logo.buscadores,
            seccion: categoria?.nombre,
            palabras: cuerpoTexto.split(/\s+/).filter(Boolean).length,
          }),
          buildBreadcrumbJsonLd(breadcrumbs),
        ]}
      />
      <ProgresoLectura idCuerpo={ID_CUERPO} />
      <AnimacionesArticulo permitirUrl={permitirUrl} idRaiz={ID_PAGINA} />

      <article>
        <header className={estilos.cabecera}>
          <div className={estilos.cabeceraInterior}>
            <div className={estilos.migas}>
              <Breadcrumbs items={breadcrumbs.slice(0, -1)} />
            </div>
            {categoria ? (
              <Link href={`${rutas.categoriaBlog(categoria.slug)}/`} className={estilos.etiqueta}>
                {categoria.nombre}
              </Link>
            ) : null}
            <h1 className={`${reserva.reserva} ${estilos.titulo}`} data-reserva={articulo.titulo}>
              <span>{articulo.titulo}</span>
            </h1>
            <p className={`${reserva.reserva} ${estilos.meta}`} data-reserva={meta}>
              <span>
                <time dateTime={articulo.fechaPublicacion}>{fecha}</time>
                {" · "}
                {lectura}
                {" · "}Por {autor}
              </span>
            </p>
          </div>
        </header>

        {imagen ? (
          <div className={estilos.destacada}>
            <Image
              src={imagen.url}
              alt={imagen.alt}
              width={imagen.width}
              height={imagen.height}
              sizes="(min-width: 1240px) 1200px, calc(100vw - 32px)"
              className={estilos.destacadaImg}
              style={{ objectPosition: imagen.posicion }}
              preload
            />
          </div>
        ) : null}

        <div className={estilos.lectura}>
          <div className={estilos.columna}>
            <BarraCompartir url={url} titulo={articulo.titulo} />
            <ul className={estilos.datos} aria-label="Datos del artículo">
              <li>
                <span className={estilos.datoEtiqueta}>Autor</span> {autor}
              </li>
              <li>
                <span className={estilos.datoEtiqueta}>Fecha</span>{" "}
                <time dateTime={articulo.fechaPublicacion}>{fecha}</time>
              </li>
              <li>
                <span className={estilos.datoEtiqueta}>Lectura</span> {lectura}
              </li>
            </ul>

            <div className={estilos.contenidoArticulo}>
              {mostrarEntradilla && articulo.entradilla ? (
                <p
                  className={`${reserva.reserva} ${estilos.entradilla}`}
                  data-reserva={articulo.entradilla}
                >
                  <span>{articulo.entradilla}</span>
                </p>
              ) : null}

              <div id={ID_CUERPO}>
                <CuerpoArticulo data={contenido} />
              </div>
            </div>
          </div>

          <aside className={estilos.lateral}>
            <PostRecientes articulos={recientes} />
          </aside>
        </div>
      </article>

      {/* Llamada final: abre la ventana emergente del formulario. */}
      <section className={estilos.llamada} aria-labelledby="blog-llamada">
        <div className={estilos.llamadaInterior}>
          <h2 id="blog-llamada">¿Necesitas repuestos o asesoría para tu maquinaria?</h2>
          <p>Cuéntanos qué necesitas y un asesor de Partequipos te responde.</p>
          <div className={estilos.acciones}>
            <BotonFormulario
              href="/contactanos/"
              className={estilos.botonLlamada}
              formulario={formulario}
            >
              <IconMail aria-hidden="true" size={20} stroke={1.8} />
              Contáctanos
            </BotonFormulario>
            <a
              href={whatsapp?.href}
              className={`${estilos.botonLlamada} ${estilos.botonClaro}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandWhatsapp aria-hidden="true" size={20} stroke={1.8} />
              WhatsApp<span className="sr-only"> (abre WhatsApp)</span>
            </a>
          </div>
          {relacionada ? (
            <p className={estilos.categoriaRelacionada}>
              <Link href={relacionada.href}>
                {textoEnlaceRelacionada(relacionada)}
                <IconArrowRight aria-hidden="true" size={18} stroke={2.4} />
              </Link>
            </p>
          ) : null}
        </div>
      </section>

      {relacionados.length ? (
        <section className={estilos.relacionados} aria-labelledby="blog-relacionados">
          <h2 id="blog-relacionados">Artículos relacionados</h2>
          <ul className={estilos.rejillaRelacionados}>
            {relacionados.map((a) => (
              <TarjetaArticulo key={a.id} articulo={a} nivel="h3" />
            ))}
          </ul>
          <p className={estilos.verTodos}>
            <Link href={`${rutas.blog()}/`}>Ver todo el blog</Link>
          </p>
        </section>
      ) : null}
    </main>
  );
}
