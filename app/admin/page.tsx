import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin-dashboard";
import { pageUser } from "@/lib/auth/http";
import { permissionsFor } from "@/lib/auth/policy";
import { AccessError } from "@/lib/auth/service";

export default async function AdminPage() {
  let user;
  try { user = await pageUser("students:view"); }
  catch (error) {
    if (error instanceof AccessError) redirect(error.status === 401 ? "/login?next=/admin" : "/dashboard");
    throw error;
  }
  return <AdminDashboard user={{ id: user.id, name: user.name, role: user.role, permissions: permissionsFor(user.role) }} />;
}
