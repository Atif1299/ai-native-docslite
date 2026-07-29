import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@ajaia.demo" },
    update: {},
    create: {
      email: "alice@ajaia.demo",
      name: "Alice Owner",
      passwordHash,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@ajaia.demo" },
    update: {},
    create: {
      email: "bob@ajaia.demo",
      name: "Bob Collaborator",
      passwordHash,
    },
  });

  const existing = await prisma.document.findFirst({
    where: { ownerId: alice.id, title: "Welcome to DocsLite" },
  });

  if (!existing) {
    const doc = await prisma.document.create({
      data: {
        title: "Welcome to DocsLite",
        content:
          "<h1>Welcome</h1><p>This is a seeded document. Try <strong>bold</strong>, <em>italic</em>, and lists.</p><ul><li>Create documents</li><li>Share with Bob</li><li>Import .txt or .md</li></ul>",
        ownerId: alice.id,
      },
    });

    await prisma.documentShare.create({
      data: {
        documentId: doc.id,
        userId: bob.id,
        role: "editor",
      },
    });
  }

  console.log("Seeded users:");
  console.log("  alice@ajaia.demo / password123");
  console.log("  bob@ajaia.demo / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
