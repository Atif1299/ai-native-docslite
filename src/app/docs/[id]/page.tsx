import { redirect, notFound } from "next/navigation";
import { canAccessDocument, getSessionUser } from "@/lib/auth";
import { DocumentEditor } from "@/components/DocumentEditor";
import { findUserById } from "@/lib/store";

type Props = { params: Promise<{ id: string }> };

export default async function DocPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const { id } = await params;
  const { doc, access } = await canAccessDocument(user.id, id);
  if (!doc || !access) notFound();

  const owner = await findUserById(doc.ownerId);

  return (
    <DocumentEditor
      documentId={doc.id}
      initialTitle={doc.title}
      initialContent={doc.content}
      access={access}
      ownerLabel={owner ? `${owner.name} (${owner.email})` : "Unknown"}
    />
  );
}
