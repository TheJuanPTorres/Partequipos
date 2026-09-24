import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconBrandYoutube,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { Revelado } from "@/components/movimiento/Revelado";
import { enlaceWhatsApp, navegacionLegal } from "@/lib/navegacion";
import { columnasDelPie, hrefTelefono, type ColumnaPie } from "@/lib/pie";
import { getPie } from "@/lib/queries/getPie";
import { imagenDeMedia } from "@/lib/utils/relations";
import { seoConfig } from "@/lib/seo/config";

import estilos from "./pie.module.css";

/**
 * PIE DEL SITIO — ux-9 (export 2696 de Andrés). Server Component: solo el lema
 * que se revela es de cliente. Valores en `pie.module.css`.
 *
 * CONTENIDO: el global `pie` de Payload (lema, texto de la empresa, columnas y
 * texto del botón). Redes y contacto salen de `seoConfig`, fuente única del
 * JSON-LD `Organization`.
 *
 * Lo que se aparta de ux-9 (docs/diseno/decisiones-home-ux9.md §13):
 * - Enlaces SIN destino no se pintan: «Trabaja con nosotros», «Zona de
 *   clientes» y «Financiación» esperan su URL (pendiente del cliente).
 * - Redes: solo las de `seoConfig`, con su nombre real; el export trae
 *   etiquetas cruzadas. Iconos de Tabler.
 * - Franja legal inferior (Ley 1581), con dirección y teléfono.
 * - «Somos una empresa…» es párrafo, no `<h3>`: los títulos de columna son
 *   `<h2>`, el nivel siguiente al `<h1>` de cualquier página.
 * - Sin buscador hasta aprobar su construcción: un cuadro que no busca es un
 *   defecto.
 * - Sin la máquina decorativa `Partequipos3553.png`: foto con la licencia
 *   pendiente (L3), y el repositorio es público.
 */

const REDES = [
  { patron: /facebook\./i, nombre: "Facebook", Icono: IconBrandFacebook },
  { patron: /instagram\./i, nombre: "Instagram", Icono: IconBrandInstagram },
  { patron: /youtube\./i, nombre: "YouTube", Icono: IconBrandYoutube },
] as const;

function Columna({
  columna,
  id,
  children,
}: {
  columna: ColumnaPie;
  id: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={estilos.columna} aria-labelledby={id}>
      <h2 id={id} className={`${estilos.tituloColumna} texto-destacado-negrita`}>
        {columna.titulo}
      </h2>
      <ul className={`${estilos.lista} texto-cuerpo`}>
        {columna.enlaces.map((e) => (
          <li key={`${e.etiqueta}-${e.href}`}>
            {e.interno ? (
              <Link href={e.href} className={estilos.enlace}>
                {e.etiqueta}
              </Link>
            ) : (
              <a href={e.href} className={estilos.enlace}>
                {e.etiqueta}
              </a>
            )}
          </li>
        ))}
      </ul>
      {children}
    </section>
  );
}

export async function Footer() {
  const pie = await getPie();
  const { contact } = seoConfig;
  const telefono = hrefTelefono(contact.phone);
  const columnas = columnasDelPie(pie.columnas, contact.phone);
  // Decorativa: sin nombre accesible (`alt` vacío y `aria-hidden`).
  const decorativa = imagenDeMedia(pie.imagenDecorativa, "");
  // Primero la política de tratamiento de datos (Ley 1581 de 2012).
  const legalesEnOrden = [
    ...navegacionLegal.filter((l) => l.href.includes("tratamiento-de-datos")),
    ...navegacionLegal.filter((l) => !l.href.includes("tratamiento-de-datos")),
  ];
  const redes = seoConfig.sameAs.flatMap((url) => {
    const red = REDES.find((r) => r.patron.test(url));
    return red ? [{ ...red, url }] : [];
  });

  return (
    <footer className={estilos.pie} data-con-imagen={decorativa ? "" : undefined}>
      {/* Sin lema o sin texto del botón (global aún vacío), la tarjeta no se pinta. */}
      {pie.lema && pie.textoBoton ? (
        <div className={estilos.tarjeta}>
          {decorativa ? (
            <Image
              src={decorativa.url}
              alt=""
              aria-hidden="true"
              width={decorativa.width}
              height={decorativa.height}
              sizes="536px"
              loading="lazy"
              className={estilos.decorativa}
            />
          ) : null}
          <Revelado
            como="p"
            texto={pie.lema}
            ritmo="titulo"
            escalon={0.08}
            duracion={0.75}
            className={`${estilos.lema} texto-titulo-bloque`}
          />
          <a
            href={enlaceWhatsApp(contact.phone)}
            className={`${estilos.whatsapp} texto-etiqueta`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandWhatsapp aria-hidden="true" focusable="false" stroke={1.75} />
            {pie.textoBoton}
          </a>
        </div>
      ) : null}

      <div className={estilos.panel}>
        <div className={estilos.empresa}>
          <Image
            src="/logo-partequipos.png"
            alt={seoConfig.siteName}
            width={187}
            height={51}
            className={estilos.logo}
          />
          <div>
            {pie.empresaTitulo ? (
              <p className={`${estilos.textoEmpresa} ${estilos.lemaEmpresa}`}>
                {pie.empresaTitulo}
              </p>
            ) : null}
            {pie.empresaTexto ? <p className={estilos.textoEmpresa}>{pie.empresaTexto}</p> : null}
          </div>
        </div>

        <div className={estilos.columnas}>
          {columnas.map((c, i) => (
            <Columna key={c.titulo} columna={c} id={`pie-columna-${i + 1}`}>
              {/* Las redes van bajo la ÚLTIMA columna, como en ux-9 («Contacto»). */}
              {i === columnas.length - 1 && redes.length > 0 ? (
                <ul className={estilos.redes}>
                  {redes.map(({ url, nombre, Icono }) => (
                    <li key={url}>
                      <a
                        href={url}
                        className={estilos.red}
                        aria-label={`${nombre} de Partequipos`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icono aria-hidden="true" focusable="false" stroke={1.5} />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Columna>
          ))}
        </div>
      </div>

      <div className={estilos.legal}>
        <nav aria-label="Legal">
          <ul>
            {legalesEnOrden.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.etiqueta}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <address>
          {contact.streetAddress}, {contact.addressLocality} ·{" "}
          <a href={telefono}>{contact.phone}</a> · © {new Date().getFullYear()} {seoConfig.siteName}
        </address>
      </div>
    </footer>
  );
}
