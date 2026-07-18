# Conectar el Google Form con el CRM (Apps Script)

Cada respuesta del formulario entra sola como cliente en la app. Se configura **una vez** por formulario.

## Pasos
1. Abre la **hoja de respuestas** del formulario en Google Sheets.
2. Menú **Extensiones → Apps Script**.
3. Borra lo que haya y pega el script de abajo.
4. Cambia `WEBHOOK_URL` por tu enlace de entrada (lo tienes en la app: **CRM → Conectar el Google Form → Copiar**).
5. Arriba, en el desplegable de funciones elige `instalarTrigger` y pulsa **Ejecutar** una vez (autoriza los permisos de tu cuenta).
6. Listo: a partir de ahora, cada respuesta nueva se envía a la app.

> Repite lo mismo en las dos hojas (Valoración inicial y Entrada de datos). En "Entrada de datos" cambia `TIPO` a `"entrada"` (marca la compra y asigna preparador).

## Script — formulario de Valoración inicial

```javascript
const WEBHOOK_URL = "https://TU-DOMINIO/api/intake/TU-TOKEN";
const TIPO = "valoracion"; // en la hoja "Entrada de datos" pon "entrada"

// 1) Instala el disparador (borra duplicados antes). Ejecutar UNA vez.
function instalarTrigger() {
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === "alEnviar") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("alEnviar").forSpreadsheet(SpreadsheetApp.getActive()).onFormSubmit().create();
  Logger.log("Trigger instalado ✔");
}

// 2) PRUEBA rápida: crea un cliente de test en la app sin esperar a nadie.
//    Ejecútala y mira el log (abajo). Debe salir 200 {"ok":true,...}.
function probar() {
  const resp = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    payload: JSON.stringify({ tipo: "valoracion", fecha: "2026-07-18", email: "prueba@ethos.test", nombre: "PRUEBA", apellidos: "Webhook" }),
  });
  Logger.log("RESPUESTA: " + resp.getResponseCode() + " " + resp.getContentText());
}

// 3) Se dispara con cada respuesta del formulario.
function alEnviar(e) {
  const r = e.namedValues || {};
  const get = (...claves) => {
    for (const q in r) {
      if (claves.some((k) => q.toLowerCase().includes(k))) {
        const v = r[q];
        return (Array.isArray(v) ? v.join(", ") : v) || "";
      }
    }
    return "";
  };
  const payload = {
    tipo: TIPO,
    fecha: new Date().toISOString().slice(0, 10),
    email: get("correo electrón", "email de contacto", "email"),
    nombre: get("nombre"),
    apellidos: get("apellidos"),
    nif: get("dni", "nie"),
    telefono: get("teléfono", "telefono"),
    objetivo: get("objetivos a nivel f"),
    servicio: get("servicio est"),
    // Solo se usan en "Entrada de datos":
    tipo_plan: get("tipo de plan"),
    preparador: get("preparador se te ha asignado"),
    fecha_inicio: get("día actual", "dia actual"),
  };
  const resp = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    payload: JSON.stringify(payload),
  });
  Logger.log("COLUMNAS: " + JSON.stringify(Object.keys(r)));
  Logger.log("ENVIADO: " + JSON.stringify(payload));
  Logger.log("RESPUESTA: " + resp.getResponseCode() + " " + resp.getContentText());
}
```

## Por qué el email SÍ coincide (no es el problema)

`get("correo electrón")` busca por **trozo**, no por el texto exacto. Internamente hace:

```
"dirección de correo electrónico".includes("correo electrón")  // → true
```

Como la columna B *contiene* "correo electrón", **coincide**. Ese no es el fallo.

## Diagnóstico paso a paso (si "no funciona")

1. Ejecuta la función **`probar`** y abre **Ejecuciones** (icono ⏱ a la izquierda). Si sale `200 {"ok":true,...}` → el webhook funciona y aparece un cliente **PRUEBA Webhook** en la app. Bórralo luego desde el CRM.
   - Si NO sale 200 → el problema es el `WEBHOOK_URL` o los permisos de red; revisa que la URL esté copiada entera.
2. Si `probar` funciona pero los formularios reales no, el fallo está en el **disparador**. Causas típicas:
   - Las respuestas del formulario **no están enlazadas a ESTA hoja** (Formulario → pestaña Respuestas → icono verde de Sheets → "Vincular a una hoja").
   - Abriste Apps Script desde el sitio equivocado: debe ser **desde la hoja de respuestas** (Extensiones → Apps Script), no desde el propio formulario.
3. Envía una respuesta de prueba real y vuelve a **Ejecuciones**. La línea `COLUMNAS: [...]` te muestra los nombres EXACTOS de las columnas que llegan; si "Dirección de correo electrónico" no está en esa lista, es que Google recoge el email aparte y hay que activarlo como **pregunta** del formulario.

## Notas
- El cliente se identifica por **email**: si ya existe (p. ej. rellenó primero la valoración y luego la entrada), se **actualiza** el mismo, no se duplica.
- La valoración crea un **lead**; la entrada lo pasa a **cliente** con su preparador y fecha de compra.
- El preparador debe llegar como `David`, `Luis`, `Alex E.`… (se normaliza a `david`/`luis`/`alex_esteban`…). Si viene otro texto, se deja el que tuviera.
- Para probar sin esperar a un cliente real: en Apps Script, tras instalar el trigger, envía una respuesta de prueba desde el propio formulario.
