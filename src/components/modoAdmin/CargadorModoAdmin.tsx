"use client";

import { useEffect, useState, type ComponentType } from "react";

import { hayPista } from "@/lib/modoAdmin/pista";

/**
 * MODO ADMINISTRACIÓN SOBRE LA WEB (tanda 23, PROTOTIPO): el CARGADOR. Es lo único del modo
 * administración que descarga un visitante, y por eso no hace casi nada:
 *
 * - No pinta nada en el servidor: el HTML de las páginas es el mismo para todos y sigue en caché.
 * - Sin la pista del panel en el navegador (`pista.ts`), no hace NADA: ni peticiones ni descargas.
 * - Con la pista, descarga el módulo con un import dinámico. La pista no autoriza: el módulo
 *   pregunta al servidor por la sesión antes de pintar.
 *
 * «use client»: lee `localStorage` y carga código en el navegador.
 */
export function CargadorModoAdmin() {
  const [Modulo, setModulo] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!hayPista()) return;
    let vivo = true;
    import("./ModoAdmin")
      .then((m) => {
        if (vivo) setModulo(() => m.ModoAdmin);
      })
      .catch(() => {
        // Sin el módulo, la web sigue igual: el modo administración es un extra.
      });
    return () => {
      vivo = false;
    };
  }, []);

  return Modulo ? <Modulo /> : null;
}
