import { redirect } from "next/navigation";
import { STUDIO_HREF } from "@/lib/dashboard/nav";

export default function DashboardPage() {
  redirect(STUDIO_HREF);
}
