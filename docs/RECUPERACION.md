# Cómo recuperar la contabilidad desde una copia de seguridad

Las copias existen en dos formatos, con el mismo contenido (un CSV por tabla):

- **Email mensual**: el día 1 de cada mes llega a `ethosfitness.asesorias@gmail.com` un correo
  «📦 Copia de seguridad Ethos» con todos los CSV adjuntos. **No borres estos correos**
  (búscalos en Gmail: `from:avisos@ethosfitnessasesorias.es asunto:copia`).
- **ZIP manual**: Contabilidad → Ajustes → Copia de seguridad → «Descargar copia completa».

## Opción A (recomendada): que lo haga Claude

Abre Claude Code en este repositorio y dile:

> Restaura la base de datos de Ethos con esta copia de seguridad: [adjunta el ZIP o los CSV]

Con el repositorio (estructura en `/supabase/*.sql`) y los CSV, Claude recrea el proyecto y
carga los datos. Necesitará un token de Supabase (Account → Access Tokens) que puedes
revocar al terminar.

## Opción B: a mano (sin Claude)

1. **Crear el proyecto**: [supabase.com](https://supabase.com) → New project (región EU).
2. **Estructura**: en SQL Editor, ejecutar los archivos de `/supabase` del repositorio
   (empezando por los más antiguos según la fecha del commit; ante la duda, todos:
   son idempotentes en su mayoría).
3. **Datos**: en Table Editor → cada tabla → Insert → Import data from CSV, **en este orden**
   (por las claves foráneas):
   1. `categorias`, `cuentas`, `personas`, `embudos`, `config`, `config_texto`
   2. `pipeline_columnas`, `cuotas`, `clientes`
   3. `facturas`, `factura_lineas`, `cobros`, `gastos`, `traspasos`
   4. `remesas`, `remesa_lineas`, `deals`, `reparto_pagos`, `pagos_cobros_filas`, `arqueos`
4. **Reconectar la app**: en Vercel → ethos-contabilidad → Settings → Environment Variables,
   poner `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` del proyecto nuevo
   (Supabase → Settings → API) y redeploy.
5. **Secretos que la copia NO incluye** (a propósito): la API key de Resend (`resend_key`
   en `config_texto`; se crea una nueva en resend.com) y el `cron_token` (cualquier cadena
   aleatoria; debe coincidir con el de las URLs de `vercel.json`).
6. **Storage**: los archivos de Compras (bucket `compras`) no viajan en los CSV. Sus PDF
   originales siguen en el correo/carpesano; el bucket se recrea con
   `supabase/reestructura_v3.sql`.

## Comprobación tras restaurar

Dashboard → los saldos deben coincidir con el último arqueo/extracto conocidos.
Contabilidad → Reparto → 🔍 Auditar el último mes y comparar con el último email del lunes.
