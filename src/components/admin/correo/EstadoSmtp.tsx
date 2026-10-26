import { estadoCorreo } from "@/lib/correo/estado";

import { Aviso } from "../aviso/Aviso";

const ENTORNO: Record<string, string> = {
  production: "el sitio publicado",
  preview: "este preview",
};

/**
 * Estado del correo de salida (SMTP) en «Correo y formularios». Campo `ui` de SERVIDOR: lee las
 * variables del despliegue que pinta el panel, y solo enseña lo que devuelve `estadoCorreo`
 * (nunca el usuario ni la contraseña).
 */
export default function EstadoSmtp() {
  const e = estadoCorreo();
  const publicado = process.env.VERCEL_ENV === "production";
  const entorno = ENTORNO[process.env.VERCEL_ENV ?? ""] ?? "el entorno local";
  const nota = (
    <p>
      Las variables se ponen en Vercel (Settings → Environment Variables) y solo cuentan después de
      volver a desplegar.
      {publicado
        ? ""
        : " Fuera del sitio publicado, los avisos van solo al buzón de pruebas (SOLICITUDES_EMAIL_TO), no a los destinatarios de abajo."}
    </p>
  );
  return (
    <div className="pq-correo-estado">
      {e.configurado ? (
        <Aviso tono="exito" titulo={`Correo de salida configurado en ${entorno}.`}>
          <dl className="pq-correo-estado__datos">
            <dt>Remitente</dt>
            <dd>{e.remitente}</dd>
            <dt>Servidor</dt>
            <dd>
              {e.servidor}, puerto {e.puerto}
            </dd>
            <dt>Cifrado</dt>
            <dd>{e.cifrado}</dd>
          </dl>
          {nota}
        </Aviso>
      ) : (
        <Aviso tono="aviso" titulo={`Correo de salida NO configurado en ${entorno}.`}>
          <p>
            Los formularios se guardan en «Solicitudes», pero no se avisa a nadie por correo.
            Motivo: {e.motivo}.
          </p>
          {nota}
        </Aviso>
      )}
    </div>
  );
}
