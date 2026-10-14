import Link from "next/link";

/**
 * «Ordenar»: un menú plegable de enlaces, sin JavaScript. Enlaces y no un
 * `<select>`: un select dentro del formulario de filtros mandaría siempre el
 * orden, también el de por defecto, y cada envío acabaría en una redirección
 * a la forma canónica.
 */
export function Ordenar({
  opciones,
}: {
  opciones: { valor: string; etiqueta: string; href: string; activa: boolean }[];
}) {
  const actual = opciones.find((o) => o.activa) ?? opciones[0];
  if (!actual) return null;
  return (
    <details className="relative">
      <summary className="inline-flex min-h-11 cursor-pointer items-center rounded border border-gray-300 px-3 text-sm text-gray-900">
        Ordenar: {actual.etiqueta}
      </summary>
      <ul className="absolute right-0 z-10 mt-1 w-56 rounded border border-gray-200 bg-white py-1 shadow-sm">
        {opciones.map((o) => (
          <li key={o.valor}>
            <Link
              href={o.href}
              prefetch={false}
              rel="nofollow"
              aria-current={o.activa ? "true" : undefined}
              className={`flex min-h-11 items-center px-3 text-sm hover:bg-gray-50 ${
                o.activa ? "font-semibold text-gray-900" : "text-gray-800"
              }`}
            >
              {o.etiqueta}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
