# Conectar el Google Form con el CRM (Apps Script)

Cada respuesta del formulario entra sola como cliente en la app. Se configura **una vez** por formulario.

> **Importante:** el script va **enganchado al FORMULARIO**, no a la hoja de respuestas. Así se dispara solo con cada envío (no hace falta que las respuestas estén en una hoja) y lee el email con `getRespondentEmail()`, que funciona aunque Google lo recoja automáticamente.

## Pasos
1. Abre el **formulario** en modo edición (el de "Valoración inicial").
2. Arriba a la derecha, el icono de **⋮ (tres puntos)** → **Editor de secuencias de comandos** (Apps Script).
3. Borra lo que haya y pega el script de abajo.
4. Cambia `WEBHOOK_URL` por tu enlace de entrada (lo tienes en la app: **CRM → Conectar el Google Form → Copiar**).
5. Arriba, en el desplegable de funciones elige **`instalarTrigger`** y pulsa **Ejecutar** una vez (autoriza los permisos).
6. Para comprobar que la app recibe: elige **`probar`**, pulsa **Ejecutar** y mira el registro (debe salir `200 {"ok":true,...}`).
7. Listo: cada respuesta nueva se envía a la app.

> Requisito: en el formulario, **Configuración → Respuestas → Recopilar direcciones de correo electrónico** debe estar activado (por eso ves la columna "Dirección de correo electrónico").

## Script — formulario de Valoración inicial

```javascript
const WEBHOOK_URL = "https://TU-DOMINIO/api/intake/TU-TOKEN";
const TIPO = "valoracion"; // en el formulario de "Entrada de datos" pon "entrada"

// 1) Instala el disparador en el formulario (borra duplicados antes). Ejecutar UNA vez.
function instalarTrigger() {
  const form = FormApp.getActiveForm();
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === "alEnviar") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("alEnviar").forForm(form).onFormSubmit().create();
  Logger.log("Trigger instalado en el formulario ✔");
}

// 2) PRUEBA rápida: crea un cliente de test en la app sin esperar a nadie.
//    Ejecútala y mira el registro. Debe salir 200 {"ok":true,...}.
function probar() {
  const resp = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    payload: JSON.stringify({ tipo: "valoracion", fecha: "2026-07-18", email: "prueba@ethos.test", nombre: "PRUEBA", apellidos: "Webhook" }),
  });
  Logger.log("RESPUESTA: " + resp.getResponseCode() + " " + resp.getContentText());
}

// 3) Se dispara con cada respuesta del formulario.
function alEnviar(e) {
  const resp = e.response;
  const items = resp.getItemResponses();

  // email automático de Google (recogida de correos)
  let email = "";
  try { email = resp.getRespondentEmail() || ""; } catch (err) {}

  // busca la respuesta cuyo título de pregunta contenga alguna de las claves
  const get = (...claves) => {
    for (const it of items) {
      const t = it.getItem().getTitle().toLowerCase();
      if (claves.some((k) => t.includes(k))) {
        const v = it.getResponse();
        return Array.isArray(v) ? v.join(", ") : (v || "");
      }
    }
    return "";
  };
  if (!email) email = get("correo electrón", "email de contacto", "email", "correo");

  const payload = {
    tipo: TIPO,
    fecha: new Date().toISOString().slice(0, 10),
    email: email,
    nombre: get("nombre"),
    apellidos: get("apellidos"),
    nif: get("dni", "nie"),
    telefono: get("teléfono", "telefono", "móvil", "movil"),
    objetivo: get("objetivos a nivel f"),
    servicio: get("servicio est"),
    // Solo se usan en "Entrada de datos":
    tipo_plan: get("tipo de plan"),
    preparador: get("preparador se te ha asignado"),
    fecha_inicio: get("día actual", "dia actual"),
  };
  const r = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    payload: JSON.stringify(payload),
  });
  Logger.log("EMAIL: " + email);
  Logger.log("ENVIADO: " + JSON.stringify(payload));
  Logger.log("RESPUESTA: " + r.getResponseCode() + " " + r.getContentText());
}
```

## El servidor está verificado

El webhook responde `200 {"ok":true,"cliente_id":...}` y crea el lead. Si `probar` da 200 pero los formularios reales no, revisa **Ejecuciones** (icono ⏱): la línea `RESPUESTA` y `EMAIL` te dicen qué llegó. Si `EMAIL` sale vacío, activa la recogida de correos en el formulario.

## Notas
- El cliente se identifica por **email**: si ya existe (rellenó valoración y luego entrada), se **actualiza** el mismo, no se duplica.
- La valoración crea un **lead**; la entrada lo pasa a **cliente** con su preparador y fecha de compra.
- El preparador debe llegar como `David`, `Luis`, `Alex E.`… (se normaliza a `david`/`luis`/`alex_esteban`…). Si viene otro texto, se deja el que tuviera.
- Este script **no escribe en tu Excel ni en ninguna hoja**: lee el envío del formulario y lo manda directo a la app. Tu Excel de CRM es aparte.
