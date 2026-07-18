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

function instalarTrigger() {
  ScriptApp.newTrigger("alEnviar")
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onFormSubmit()
    .create();
}

function alEnviar(e) {
  const r = e.namedValues || {};
  const get = (...claves) => {
    for (const q in r) {
      const qn = q.toLowerCase();
      if (claves.some((k) => qn.includes(k))) {
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
    objetivo: get("objetivos a nivel físico", "objetivos a nivel fisico"),
    servicio: get("servicio estás interesad", "servicio estas interesad"),
    // Solo se usan en "Entrada de datos":
    tipo_plan: get("qué tipo de plan", "que tipo de plan"),
    preparador: get("preparador se te ha asignado"),
    fecha_inicio: get("día actual", "dia actual"),
  };
  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify(payload),
  });
}
```

## Notas
- El cliente se identifica por **email**: si ya existe (p. ej. rellenó primero la valoración y luego la entrada), se **actualiza** el mismo, no se duplica.
- La valoración crea un **lead**; la entrada lo pasa a **cliente** con su preparador y fecha de compra.
- El preparador debe llegar como `David`, `Luis`, `Alex E.`… (se normaliza a `david`/`luis`/`alex_esteban`…). Si viene otro texto, se deja el que tuviera.
- Para probar sin esperar a un cliente real: en Apps Script, tras instalar el trigger, envía una respuesta de prueba desde el propio formulario.
