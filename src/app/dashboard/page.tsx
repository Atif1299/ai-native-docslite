import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { DashboardClient } from "@/components/DashboardClient";
import {
  ensureSeedUsers,
  listOwnedDocuments,
  listSharedDocuments,
} from "@/lib/store";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  await ensureSeedUsers();
  const [owned, shared] = await Promise.all([
    listOwnedDocuments(user.id),
    listSharedDocuments(user.id),
  ]);

  return (
    <DashboardClient
      userName={user.name}
      userEmail={user.email}
      owned={owned.map((d) => {
        const owner = Array.isArray(d.owner) ? d.owner[0] : d.owner;
        return {
          id: d.id,
          title: d.title,
          updatedAt: String(d.updatedAt),
          owner: owner
            ? { name: owner.name as string, email: owner.email as string }
            : undefined,
        };
      })}
      shared={shared.map((d) => {
        const owner = Array.isArray(d.owner) ? d.owner[0] : d.owner;
        return {
          id: d.id,
          title: d.title,
          updatedAt: String(d.updatedAt),
          owner: owner
            ? { name: owner.name as string, email: owner.email as string }
            : undefined,
          role: d.role as string,
        };
      })}
    />
  );
}
