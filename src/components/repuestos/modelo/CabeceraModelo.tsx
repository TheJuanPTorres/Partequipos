import { IconBarcode, IconBuildingFactory2, IconEngine } from "@tabler/icons-react";
import Image from "next/image";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import marca from "@/components/repuestos/marca.module.css";
import type { BreadcrumbItem } from "@/lib/seo/jsonLd";
import type { ImagenLista } from "@/lib/utils/relations";

import estilos from "./cabeceraModelo.module.css";

/**
 * CABECERA DE LA PÁGINA DE MODELO de repuestos con la plantilla 4086 de Andrés («ficha
 * repuestos», 2026-10-26): una tarjeta blanca de radio 30 partida en dos. A la izquierda (45 %),
 * la foto de fondo; a la derecha (55 %), las migas, el antetítulo rojo «Repuestos para
 * Maquinaria Pesada», el título «{MARCA} {Tipo} {Modelo}» (el `<h1>`), tres datos con icono
 * (código, tipo y marca, en pastillas grises) y, debajo, la foto del modelo y su texto.
 *
 * La foto de fondo lleva la clase `fondo` de las cabeceras de repuestos: con C3
 * (`ANIMACIONES_CATEGORIAS`) se acerca muy despacio, como la del índice de categorías.
 * Sin foto, la mitad izquierda no se pinta y el texto ocupa la tarjeta.
 */
export function CabeceraModelo({
  migas,
  titulo,
  datos,
  fondo,
  foto,
  texto,
}: {
  migas: BreadcrumbItem[];
  titulo: string;
  datos: { codigo: string; tipo: string; marca: string };
  fondo: ImagenLista | null;
  foto: ImagenLista | null;
  texto: string;
}) {
  const filas = [
    { etiqueta: "Código", valor: datos.codigo, Icono: IconBarcode },
    { etiqueta: "Tipo", valor: datos.tipo, Icono: IconEngine },
    { etiqueta: "Marca", valor: datos.marca, Icono: IconBuildingFactory2 },
  ].filter((d) => d.valor);

  return (
    <section className={estilos.cabecera} aria-labelledby="modelo-titulo">
      {fondo ? (
        <div className={estilos.lado}>
          <Image
            src={fondo.url}
            alt=""
            fill
            priority
            sizes="(max-width: 767px) 100vw, 45vw"
            className={`${marca.fondo} ${estilos.ladoFoto}`}
            style={{ objectPosition: fondo.posicion }}
          />
        </div>
      ) : null}
      <div className={estilos.cuerpo}>
        <div className={estilos.migas}>
          <Breadcrumbs items={migas} />
        </div>
        <p className={`${estilos.antetitulo} texto-destacado`}>Repuestos para Maquinaria Pesada</p>
        <h1 id="modelo-titulo" className={`${estilos.titulo} texto-titulo-bloque`}>
          {titulo}
        </h1>
        {filas.length > 0 ? (
          <ul className={`${estilos.datos} texto-etiqueta`}>
            {filas.map(({ etiqueta, valor, Icono }) => (
              <li key={etiqueta} className={estilos.dato}>
                <Icono aria-hidden="true" focusable="false" stroke={1.75} />
                <span>
                  <b>{etiqueta}:</b> {valor}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {foto || texto ? (
          <div className={estilos.presentacion}>
            {foto ? (
              <Image
                src={foto.url}
                alt={foto.alt}
                width={foto.width}
                height={foto.height}
                sizes="(max-width: 767px) 90vw, 375px"
                className={estilos.fotoModelo}
              />
            ) : null}
            {texto ? <p className={`${estilos.texto} texto-cuerpo`}>{texto}</p> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
