import Image from "next/image";
import { redirect } from "next/navigation";
import type { AdminViewServerProps } from "payload";
import { formatAdminURL, getSafeRedirect } from "payload/shared";

import { MicrosoftLogo } from "@/components/ui/microsoft-logo";
import { PartequiposWordmark } from "@/components/ui/partequipos-wordmark";
import { minutosDeBloqueo, urlMicrosoft, VARIABLE_MICROSOFT } from "@/lib/panel/acceso";
import { getImagenAcceso } from "@/lib/queries/getImagenAcceso";

import FormularioAcceso from "./FormularioAcceso";

/**
 * Pantalla de acceso al panel con el diseño de `login-screen` del sistema del
 * cliente (variante principal: panel visual a la izquierda y formulario a la
 * derecha). Sustituye la vista `login` de Payload (`admin.components.views.login`).
 *
 * LO QUE SE CONSERVA DE PAYLOAD, replicando su `LoginView` (3.89):
 * - si ya hay sesión, redirige sin pintar nada;
 * - la redirección después de entrar pasa por `getSafeRedirect` (solo rutas
 *   del propio sitio);
 * - la autenticación es la suya: `POST /api/users/login`, cookie de sesión y el
 *   bloqueo por intentos de `Users.auth` (`maxLoginAttempts`, `lockTime`);
 * - «¿Olvidaste tu contraseña?» lleva a su vista `forgot`.
 *
 * NO usa los componentes `button`, `input` ni `spinner` del registro: traen
 * Base UI, cva, clsx y tailwind-merge (cuatro dependencias). Se replican con
 * elementos nativos y el SCSS del panel (`custom.scss`, «Pantalla de acceso»).
 * Detalle en `docs/diseno/decisiones-panel.md` §17.
 */
export default async function Acceso({ initPageResult, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult;
  const config = req.payload.config;
  const adminRoute = config.routes.admin;

  const redireccion = getSafeRedirect({
    fallbackTo: adminRoute,
    redirectTo: searchParams?.redirect ?? "",
  });
  if (req.user) redirect(redireccion);

  const auth = req.payload.collections.users?.config.auth;
  const bloqueo = {
    intentos: auth?.maxLoginAttempts || 5,
    minutos: minutosDeBloqueo(auth?.lockTime),
  };

  const microsoft = urlMicrosoft(process.env[VARIABLE_MICROSOFT]);
  const imagen = await getImagenAcceso();

  return (
    <div className="pq-acceso">
      <aside className="pq-acceso__visual">
        {imagen ? (
          <Image
            alt=""
            className="pq-acceso__imagen"
            height={imagen.height}
            sizes="(min-width: 1024px) 36vw, 1px"
            src={imagen.url}
            width={imagen.width}
          />
        ) : null}
        <div className="pq-acceso__visual-contenido">
          <span aria-label="Partequipos" className="pq-acceso__marca" role="img">
            {/*
             * Sobre la imagen, en blanco; el ojal de las letras con un negro
             * translúcido, como en el registro: así sigue leyendo como hueco.
             */}
            <PartequiposWordmark holeColor="rgba(0,0,0,0.3)" pColor="white" textColor="white" />
          </span>
          <div className="pq-acceso__lema">
            <p className="pq-acceso__lema-titulo">
              Acceso único a las herramientas de Partequipos.
            </p>
            <p className="pq-acceso__lema-texto">Una sola cuenta.</p>
          </div>
        </div>
      </aside>

      <main className="pq-acceso__principal">
        <div className="pq-acceso__caja">
          <span aria-label="Partequipos" className="pq-acceso__marca-movil" role="img">
            <PartequiposWordmark
              holeColor="var(--pq-background)"
              textColor="var(--pq-foreground)"
            />
          </span>

          <div className="pq-acceso__cabecera">
            <h1 className="pq-acceso__titulo">Iniciar sesión</h1>
            <p className="pq-acceso__descripcion">
              Accede con tu cuenta corporativa de Partequipos para continuar.
            </p>
          </div>

          {microsoft ? (
            <a className="pq-acceso__boton pq-acceso__boton--secundario" href={microsoft}>
              <MicrosoftLogo className="pq-acceso__logo-ms" />
              Continuar con Microsoft
            </a>
          ) : (
            /*
             * DESACTIVADO mientras no exista el inicio de sesión con Microsoft
             * (Auth Central, §10.29). Se activa solo con la variable
             * PANEL_ACCESO_MICROSOFT_URL; este código no llama a Auth Central.
             */
            <button
              className="pq-acceso__boton pq-acceso__boton--secundario"
              disabled
              type="button"
            >
              <MicrosoftLogo className="pq-acceso__logo-ms" />
              Continuar con Microsoft
              <span className="pq-acceso__pronto">Próximamente</span>
            </button>
          )}

          <div className="pq-acceso__separador">
            <span aria-hidden="true" className="pq-acceso__riel" />
            <span>o con correo y contraseña</span>
            <span aria-hidden="true" className="pq-acceso__riel" />
          </div>

          <FormularioAcceso
            accion={formatAdminURL({
              apiRoute: config.routes.api,
              path: `/${config.admin.user}/login`,
            })}
            bloqueo={bloqueo}
            olvido={formatAdminURL({ adminRoute, path: config.admin.routes.forgot })}
            redireccion={redireccion}
          />
        </div>
      </main>
    </div>
  );
}
