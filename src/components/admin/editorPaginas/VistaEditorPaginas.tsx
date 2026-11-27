import type { AdminViewServerProps } from "payload";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  decisionEditor,
  idDeRutaEditor,
  rutaDeAcceso,
  PREFIJO_EDITOR_PAGINAS,
} from "@/lib/panel/editorPaginas";
import { escrituraContenido } from "@/lib/seguridad/acceso";

import estilos from "./editorPaginas.module.css";

/**
 * EDITOR VISUAL DE PÁGINAS — ESQUELETO (tanda 26, t8, fase 0). Solo el marco a pantalla completa,
 * con la sesión y el acceso del panel. SIN Puck: el lienzo es un hueco que lo espera.
 *
 * La vista decide ella misma quién entra (las vistas propias de Payload 3.89 no pasan por su
 * comprobación de acceso al panel): `decisionEditor`. La página se lee CON el acceso del usuario
 * (`overrideAccess: false`) y en borrador: lo que el editor verá y guardará.
 */
export default async function VistaEditorPaginas({ initPageResult, params }: AdminViewServerProps) {
  const { req } = initPageResult;
  const rutaPanel = req.payload.config.routes.admin;
  const segmentos = params?.segments;
  const id = idDeRutaEditor(Array.isArray(segmentos) ? segmentos : undefined);
  const puedeEscribir = req.user ? Boolean(await escrituraContenido({ req })) : false;
  const decision = decisionEditor({ conSesion: Boolean(req.user), puedeEscribir, id });

  if (decision.tipo === "acceso") {
    redirect(rutaDeAcceso(rutaPanel, `${rutaPanel}${PREFIJO_EDITOR_PAGINAS}${id ?? ""}`));
  }
  if (decision.tipo !== "entrar") {
    return (
      <main className={estilos.aviso}>
        <h1>
          {decision.tipo === "sin-permiso"
            ? "No tienes permiso para editar páginas"
            : "Página no encontrada"}
        </h1>
        <Link href={`${rutaPanel}/collections/paginas`}>Volver a Páginas</Link>
      </main>
    );
  }

  const pagina = await req.payload
    .findByID({
      collection: "paginas",
      id: decision.id,
      draft: true,
      depth: 0,
      overrideAccess: false,
      user: req.user,
    })
    .catch(() => null);
  if (!pagina) {
    return (
      <main className={estilos.aviso}>
        <h1>Página no encontrada</h1>
        <Link href={`${rutaPanel}/collections/paginas`}>Volver a Páginas</Link>
      </main>
    );
  }

  const estado = pagina._status === "draft" ? "Borrador" : "Publicada";
  return (
    <div className={estilos.marco}>
      <header className={estilos.barra}>
        <Link className={estilos.volver} href={`${rutaPanel}/collections/paginas/${pagina.id}`}>
          ← Volver a la página
        </Link>
        <h1 className={estilos.titulo}>
          Editor visual <span className={estilos.separador}>·</span> {pagina.titulo}
        </h1>
        <span className={estilos.estado}>{estado}</span>
        <div className={estilos.acciones}>
          {/* Llegan con el editor (fase 0): guardar como borrador con la API local y validación zod. */}
          <button type="button" className={estilos.boton} disabled>
            Vista previa
          </button>
          <button type="button" className={`${estilos.boton} ${estilos.botonPrincipal}`} disabled>
            Guardar borrador
          </button>
        </div>
      </header>
      <div className={estilos.cuerpo}>
        <aside className={estilos.lateral} aria-label="Componentes">
          <p className={estilos.nota}>
            Aquí irán los componentes: Sección, Columnas, Texto y Botón.
          </p>
        </aside>
        <main className={estilos.lienzo} aria-label="Lienzo de la página">
          <p className={estilos.nota}>
            Esqueleto de la fase 0: el editor visual (Puck) todavía no está instalado. La página «
            {pagina.titulo}» ({pagina.slug}) se pintará aquí.
          </p>
        </main>
        <aside className={estilos.lateral} aria-label="Propiedades">
          <p className={estilos.nota}>Aquí irán las propiedades del componente elegido.</p>
        </aside>
      </div>
    </div>
  );
}
