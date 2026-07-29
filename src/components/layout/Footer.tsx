import Link from "next/link";

import { enlaceWhatsApp, navegacionLegal, navegacionPrincipal } from "@/lib/navegacion";
import { seoConfig } from "@/lib/seo/config";

/** Etiqueta legible para cada perfil social, deducida del dominio. */
function nombreDeRed(url: string): string {
  if (/facebook\./i.test(url)) return "Facebook";
  if (/instagram\./i.test(url)) return "Instagram";
  if (/youtube\./i.test(url)) return "YouTube";
  if (/linkedin\./i.test(url)) return "LinkedIn";
  return "Perfil";
}

/**
 * Pie del sitio. Todos los datos salen de `seoConfig` (CLAUDE.md §5: nada
 * quemado). Los portales externos cuyo URL aún no está confirmado **no se
 * renderizan**: mejor omitir el enlace que apuntar a un destino inventado.
 */
export function Footer() {
  const { contact, portales } = seoConfig;

  const portalesDisponibles = [
    { etiqueta: "Zona clientes — Repuestos", href: portales.sapRepuestos },
    { etiqueta: "Zona clientes — Maquinaria", href: portales.sapMaquinaria },
    { etiqueta: "Tienda en línea", href: portales.tienda },
    { etiqueta: "Trabaja con nosotros (portal)", href: portales.empleo },
  ].filter((p) => p.href.length > 0);

  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <section aria-labelledby="pie-contacto">
          <h2 id="pie-contacto" className="text-sm font-semibold text-gray-900">
            Contacto
          </h2>
          <address className="mt-3 space-y-1 text-sm not-italic text-gray-600">
            <p>
              <a href={`mailto:${contact.email}`} className="hover:underline">
                {contact.email}
              </a>
            </p>
            <p>
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:underline">
                {contact.phone}
              </a>
            </p>
            <p>{contact.streetAddress}</p>
            <p>{contact.addressLocality}</p>
          </address>
          <p className="mt-3 text-sm text-gray-600">{contact.openingHours}</p>
          <p className="mt-3 text-sm">
            <a
              href={enlaceWhatsApp(contact.phone)}
              className="text-gray-900 underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Escríbenos por WhatsApp
            </a>
          </p>
        </section>

        <section aria-labelledby="pie-secciones">
          <h2 id="pie-secciones" className="text-sm font-semibold text-gray-900">
            Secciones
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            {navegacionPrincipal.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:underline">
                  {item.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="pie-legal">
          <h2 id="pie-legal" className="text-sm font-semibold text-gray-900">
            Legal
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            {navegacionLegal.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:underline">
                  {item.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="pie-enlaces">
          <h2 id="pie-enlaces" className="text-sm font-semibold text-gray-900">
            Enlaces
          </h2>
          {portalesDisponibles.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-gray-600">
              {portalesDisponibles.map((p) => (
                <li key={p.etiqueta}>
                  <a
                    href={p.href}
                    className="hover:underline"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {p.etiqueta}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {seoConfig.sameAs.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              {seoConfig.sameAs.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    className="hover:underline"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {nombreDeRed(url)}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>

      <div className="border-t border-gray-200">
        <p className="mx-auto max-w-5xl px-4 py-4 text-xs text-gray-500">
          © {new Date().getFullYear()} {seoConfig.siteName}
        </p>
      </div>
    </footer>
  );
}
