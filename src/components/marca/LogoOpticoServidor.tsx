import { recorteVisible } from "@/lib/marca/recorteLogo";

import { LogoOptico } from "./LogoOptico";

/**
 * `LogoOptico` en un componente de servidor: mide aquí la parte visible del logo
 * (`recorteVisible`, en caché por URL y despliegue), así que cualquier logo que se suba en el
 * panel sale con el mismo tamaño a la vista sin hacer nada más.
 */
export async function LogoOpticoServidor(props: Parameters<typeof LogoOptico>[0]) {
  const recorte = props.logo.recorte ?? (await recorteVisible(props.logo.url));
  return <LogoOptico {...props} logo={{ ...props.logo, recorte }} />;
}
