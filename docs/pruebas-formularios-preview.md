# Pruebas de los formularios y de carga en un preview (2026-11-26)

Para pruebas de rendimiento (el cliente) sin escribir a nadie real y sin que el límite antispam
corte la prueba. **Nada de esto afecta al sitio publicado**: allí no se lee y hay pruebas que lo
garantizan.

## 1. El buzón de pruebas

Fuera del sitio publicado, la base de un preview es un clon de la de producción (con correos
reales), así que NUNCA se escribe al visitante ni a los destinatarios reales: el aviso al equipo, la
respuesta automática («Hemos recibido tu mensaje», con el asunto `[PRUEBA: respuesta automática a …]`)
y el aviso de las hojas de vida van **solo al buzón de pruebas**.

- **Dónde se pone:** panel → Configuración → «Correo y formularios» → «Destinatarios» → **«Buzón
  de pruebas»** (solo administradores). Para las pruebas del cliente: `sistemas6@partequipos.com`.
- **Si está vacío:** se usa la variable de Vercel `SOLICITUDES_EMAIL_TO` y, sin ninguna, **no se
  envía nada** (queda un aviso en el registro del servidor).
- **En el sitio publicado no se usa:** allí mandan «Correo para solicitudes» / «Correo para hojas
  de vida» y la respuesta va al visitante, como siempre.
- **Ojo con el preview:** su base es una copia. El valor se pone en el panel DE ESE PREVIEW (o en el
  de producción, que se copia al refrescar la base: no tiene efecto allí). Hace falta además SMTP
  en el preview (el del panel o las variables `SMTP_*` de Vercel); el panel dice cuál está en vigor.

## 2. El límite por IP del antispam (#529)

Por defecto: 5 envíos cada 10 minutos por IP (por instancia). Para una prueba de carga, en un
**preview** (o en local) se sube o se desactiva con la variable de entorno:

| `ANTISPAM_MAX_ENVIOS` | Efecto                                 |
| --------------------- | -------------------------------------- |
| (sin poner)           | 5 por IP cada 10 min (el de siempre)   |
| `500`                 | hasta 500 por IP cada 10 min           |
| `0` u `off`           | sin límite (no se cuenta ni se guarda) |
| cualquier otra cosa   | se ignora: 5 por IP cada 10 min        |

- **Cómo se pone:** Vercel → proyecto → Settings → Environment Variables → **solo Preview** →
  después, volver a desplegar el preview (se lee al arrancar cada instancia). Nunca en Production.
- **EN PRODUCCIÓN NO SE LEE, aunque alguien la ponga:** `VERCEL_ENV=production`, o `NODE_ENV=production`
  sin `VERCEL_ENV`, mandan siempre los 5 de siempre (`maxEnviosDelEntorno`, con pruebas en
  `src/lib/formularios/antiSpam.test.ts`, que además comprueba que la variable solo se lee en ese fichero).
- **No cambia:** el campo trampa, el tiempo mínimo (3 s entre mostrar el formulario y enviarlo) y
  Turnstile siguen activos. Una herramienta de carga que envíe el POST directamente debe esperar 3 s
  desde que pidió el formulario o no mandar el campo `tiempo_inicio`.
- Las solicitudes de prueba se escriben con `QA-` en el nombre y se borran del panel al acabar.
