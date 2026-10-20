import type { ReactNode } from "react";

import { ProveedorContactoCliente } from "@/components/forms/ContextoContacto";
import { getEmpresa } from "@/lib/queries/getSeo";
import { turnstileSiteKey } from "@/lib/turnstile";
import { enlaceWhatsApp } from "@/lib/whatsapp";

/** Datos de la ventana de contacto para los botones editables del panel (servidor). */
export async function ProveedorContacto({ children }: { children: ReactNode }) {
  const empresa = await getEmpresa();
  return (
    <ProveedorContactoCliente
      datos={{
        siteKey: turnstileSiteKey(),
        whatsapp: empresa ? enlaceWhatsApp(empresa.whatsapp) : undefined,
      }}
    >
      {children}
    </ProveedorContactoCliente>
  );
}
