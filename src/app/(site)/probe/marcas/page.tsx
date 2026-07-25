import Image from "next/image";

import { getMarcas } from "@/lib/queries/getMarcas";

// Ruta de PRUEBA (esqueleto caminante). Fuerza render dinámico para que los
// datos vengan frescos de Payload en cada request y aparezcan en el HTML de
// origen. No es la página definitiva: sin metadata/JSON-LD/ISR todavía.
export const dynamic = "force-dynamic";

export default async function ProbeMarcasPage() {
  const marcas = await getMarcas();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Probe · Marcas</h1>
      <p className="mb-6 text-sm text-gray-500">
        {marcas.length} marca(s) leídas con la API local de Payload.
      </p>

      {marcas.length === 0 ? (
        <p className="rounded border border-dashed border-gray-300 p-6 text-center text-gray-500">
          No hay marcas todavía.
        </p>
      ) : (
        <ul className="grid gap-3">
          {marcas.map((marca) => {
            const logo = marca.logo && typeof marca.logo === "object" ? marca.logo : null;
            const hasImage = Boolean(logo?.url && logo.width && logo.height);

            return (
              <li
                key={marca.id}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
              >
                {hasImage && logo ? (
                  <Image
                    src={logo.url as string}
                    alt={logo.alt}
                    width={logo.width as number}
                    height={logo.height as number}
                    className="h-12 w-auto object-contain"
                  />
                ) : (
                  <span className="flex h-12 w-20 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                    sin logo
                  </span>
                )}

                <div>
                  <h2 className="text-lg font-medium">{marca.nombre}</h2>
                  <p className="text-sm text-gray-500">/{marca.slug}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
