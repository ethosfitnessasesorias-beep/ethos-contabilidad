import { redirect } from "next/navigation";

// La lista de clientes vive ahora en el CRM (única pantalla de clientes)
export default function Clientes() {
  redirect("/crm");
}
