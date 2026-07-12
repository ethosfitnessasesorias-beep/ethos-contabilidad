import { redirect } from "next/navigation";

// La lista de clientes vive ahora en Contabilidad > Clientes
export default function Clientes() {
  redirect("/contabilidad/clientes");
}
