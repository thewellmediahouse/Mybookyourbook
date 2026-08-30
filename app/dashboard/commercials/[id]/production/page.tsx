import { redirect } from "next/navigation";

export default async function ProductionStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect("/dashboard/create");
}
