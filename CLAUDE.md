# Ethos Contabilidad

App interna de contabilidad y gestión financiera para Ethos Fitness
(Carrer Catalunya 16, Viladecans).

---

## 1. Contexto de negocio

- Gimnasio boutique + servicios de entrenamiento y nutrición online.
- **Dos socios**, ambos autónomos dados de alta (cuota bonificada compartida):
  - **Luis** — entrenador, lleva su cartera de clientes.
  - **David** — entrenador/dietista, lleva su cartera de clientes.
- **Dos colaboradores** externos que generan ingresos atribuibles:
  - **Alex Esteban** — fisioterapeuta.
  - **Alex Guerrero** — entrenador.
- Ingresos de la casa (grupales, merch, socios, patrocinios) se atribuyen a **Ethos**.
- **Migración a SL prevista** a medio plazo. El modelo de datos debe soportarla
  desde el día uno: sin cuentas personales, sin efectivo circulando por bolsillos.

Volumen actual: ~100-150 movimientos/mes. 2 usuarios. Facturación ~45k€/semestre.

---

## 2. Reglas de negocio INNEGOCIABLES

Estas reglas no se negocian ni se "simplifican" para que el código quede más corto.
Si una petición del usuario entra en conflicto con una de estas reglas, **avisar antes
de implementar**.

### 2.1 Factura ≠ Cobro
Son **dos tablas separadas**. Un cobro SIEMPRE apunta a una factura (N:1).

- Una factura puede tener 0, 1 o N cobros (pagos fraccionados).
- La deuda de un cliente es **derivada**: `factura.total − SUM(cobros de esa factura)`.
- **NUNCA** existe un campo "deuda", "pendiente" o "estado_pago" que alguien rellena a mano.
- Facturación y Cash Collected son **dos queries distintas sobre las mismas tablas**,
  no dos bloques de datos paralelos que hay que cuadrar.

### 2.2 Categorías: catálogo cerrado
- Toda categoría de gasto viene de la tabla `categorias`. **Dropdown obligatorio.**
- **No existe campo de texto libre para categorizar.**
- Un gasto es **Inversión** solo si es un activo que dura **más de 1 año**
  (maquinaria, obra, mobiliario). Papel higiénico, aguas, bayetas y software mensual
  son **gasto corriente**. Esto ya se hizo mal en el Excel anterior y contaminó el reparto.

### 2.3 IVA
- El IVA depende del **servicio prestado**, nunca del método de pago.
- Está prohibido que el IVA se derive de si el cobro fue en efectivo o por transferencia.
- El tipo por defecto de cada servicio vive en la tabla `servicios`.

### 2.4 Reparto de beneficios
- **80% entrenador / 20% hucha de empresa**, sobre el balance individual.
- Los porcentajes viven en la tabla `config`. **NUNCA hardcodeados en el código.**
- Balance individual = Cash Collected propio − gastos imputados (sin inversión).
- Las **inversiones salen de la hucha**, no del beneficio repartible.
- La hucha se reparte 50/50 entre socios cada trimestre (o se reinvierte, decisión manual).

### 2.5 Toda cifra derivada es una QUERY
Dashboard, reparto, morosos, caja, KPIs: **todo se calcula**.
Nunca hay un campo que un humano rellena y que luego "hay que cuadrar".
Si algo no cuadra, el bug está en la query o en un asiento, jamás en "se me olvidó actualizar".

### 2.6 Traspasos no son negocio
Mover dinero entre cuentas propias (caja → banco, Stripe → banco) es un `traspaso`.
- No suma a facturación.
- No suma a gastos.
- Solo mueve saldo entre cuentas.

---

## 3. Cuentas (estructura post-SL)

Solo existen **4 cuentas**:

| Cuenta | Uso |
|---|---|
| `banco` | Cuenta bancaria del negocio. Todo acaba aquí. |
| `caja` | Fondo fijo de caja chica (300 €). Efectivo. |
| `tpv` | Cobros por datáfono, en tránsito hasta liquidación al banco. |
| `stripe` | Cobros web, en tránsito hasta liquidación al banco. |

**NO existen** "Cuenta Luis", "Efectivo Luis", "Cuenta David", "Efectivo David".
Si aparece esa necesidad, es señal de un problema de proceso, no de un campo que falta.

---

## 4. Métricas obligatorias del dashboard

Solo estas. No añadir gráficos decorativos.

1. **Caja libre** = Caja total − IVA pendiente − IRPF pendiente − Hucha comprometida
2. **Runway** = Caja libre / Gasto fijo mensual  *(alarma si < 3 meses)*
3. **Cobertura de fijos por MRR** = Domiciliaciones del mes / Gasto fijo mensual
4. **% de ingresos en efectivo** *(debe tender a 0)*
5. **Hucha real** (acumulada, tras descontar inversiones)

---

## 5. Stack técnico

- **Next.js** (App Router) + TypeScript
- **Supabase** (Postgres) — DB + Auth
- **Tailwind CSS**
- **Vercel** — hosting
- **PWA** — instalable en móvil, sin App Store

**Mobile-first, siempre.** El formulario de entrada rápida debe poder completarse
en <15 segundos, con una mano, de pie en el gimnasio. Ese es el cuello de botella real
del negocio, no el análisis.

---

## 6. Orden de construcción

- [ ] **Fase 1** — Esquema SQL + script de importación del Excel histórico
      (con informe de filas no mapeables)
- [ ] **Fase 2** — Formulario de entrada rápida móvil ← *máxima prioridad*
- [ ] **Fase 3** — Dashboard, Reparto, Flujo de caja, Morosos (todo queries)
- [ ] **Fase 4** — Export trimestral para el gestor (Xavi)
- [ ] **Fase 5** — Foto de ticket → asiento propuesto (API Claude)

**No construir la Fase 5 antes que la Fase 2.**

---

## 7. Reglas para Claude Code

- Escribe **tests** para: cálculo de reparto, caja libre, deuda por cliente.
  Si el reparto se calcula mal, nos pagamos de menos y no nos enteramos.
- Cualquier constante de negocio (%, tipos de IVA, importe del fondo de caja)
  va a `config`, no al código.
- Prefiere **vistas SQL** a lógica en el frontend para todo lo que sea agregación.
- No añadas features no pedidas. No hace falta CRM, ni notificaciones, ni gamificación.
- Commit tras cada fase que funcione.
