import { redirect } from "next/navigation";

// Las métricas viven ahora en Tesorería > Cuentas
export default function Panel() {
  redirect("/tesoreria/cuentas");
}
