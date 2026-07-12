import { redirect } from "next/navigation";

// Las métricas viven ahora en Contabilidad > Finanzas
export default function Panel() {
  redirect("/contabilidad/finanzas");
}
