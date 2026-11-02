import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin-dashboard";
import { pageUser } from "@/lib/auth/http";
import { AccessError } from "@/lib/auth/service";

export default async function AdminPage() {
  try { await pageUser("questions:write"); }
  catch (error) {
    if (error instanceof AccessError) redirect(error.status === 401 ? "/login?next=/admin" : "/dashboard");
    throw error;
  }
  return <AdminDashboard />;
}
