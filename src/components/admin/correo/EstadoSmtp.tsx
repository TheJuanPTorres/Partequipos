import type { Payload } from "payload";

import { estadoCorreo } from "@/lib/correo/estado";
import { leerSmtpEnVigor } from "@/lib/correo/servidor";

import { Aviso } from "../aviso/Aviso";

const ENTORNO: Record<string, string> = {
  production: "el sitio publicado",
  preview: "este preview",
};

const ORIGEN = {
  panel: "los datos de este panel (abajo)",
  vercel: "las variables de Vercel",
} as const;

/**
 * Estado del correo de salida (SMTP) en «Correo y formularios». Campo `ui` de SERVIDOR: dice
 * cuál está EN VIGOR (el del panel, si está completo; si no, el de las variables de Vercel del
 * despliegue que pinta el panel) y solo enseña lo que devuelve `estadoCorreo` (nunca el usuario
 * ni la contraseña). Refleja lo GUARDADO: tras cambiar los datos del panel, guardar.
 */
export default async function EstadoSmtp({ payload }: { payload: Payload }) {
  const e = estadoCorreo(await leerSmtpEnVigor(payload));
  const publicado = process.env.VERCEL_ENV === "production";
  const entorno = ENTORNO[process.env.VERCEL_ENV ?? ""] ?? "el entorno local";
  const nota = (
    <p>
      Los datos del panel cuentan en cuanto se guardan. Las variables de Vercel solo cuentan después
      de volver a desplegar.
      {publicado
        ? ""
        : " Fuera del sitio publicado, los avisos van solo al buzón de pruebas (SOLICITUDES_EMAIL_TO), no a los destinatarios de abajo."}
    </p>
  );
  const aviso = e.aviso ? (
    <p>
      <strong>Ojo:</strong> {e.aviso}
    </p>
  ) : null;
  return (
    <div className="pq-correo-estado">
      {e.configurado ? (
        <Aviso tono="exito" titulo={`Correo de salida configurado en ${entorno}.`}>
          <dl className="pq-correo-estado__datos">
            <dt>En uso</dt>
            <dd>{ORIGEN[e.origen]}</dd>
            <dt>Remitente</dt>
            <dd>{e.remitente}</dd>
            <dt>Servidor</dt>
            <dd>
              {e.servidor}, puerto {e.puerto}
            </dd>
            <dt>Cifrado</dt>
            <dd>{e.cifrado}</dd>
          </dl>
          {aviso}
          {nota}
        </Aviso>
      ) : (
        <Aviso tono="aviso" titulo={`Correo de salida NO configurado en ${entorno}.`}>
          <p>
            Los formularios se guardan en «Solicitudes», pero no se avisa a nadie por correo.
            Motivo: {e.motivo}. Rellena el SMTP aquí abajo (solo administradores) o ponlo en Vercel.
          </p>
          {aviso}
          {nota}
        </Aviso>
      )}
    </div>
  );
}
