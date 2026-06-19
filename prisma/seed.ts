import bcrypt from "bcryptjs";
import { PrismaClient, Role, SubscriptionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const org = await prisma.organization.upsert({
    where: { slug: "acme" },
    update: {},
    create: {
      name: "Acme Inc.",
      slug: "acme",
      subscription: { create: { plan: "pro", status: SubscriptionStatus.ACTIVE } },
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@acme.test" },
    update: {},
    create: { name: "Olivia Owner", email: "owner@acme.test", passwordHash },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: owner.id, organizationId: org.id } },
    update: {},
    create: { userId: owner.id, organizationId: org.id, role: Role.OWNER },
  });

  for (const name of ["Website redesign", "Mobile app", "Q3 marketing"]) {
    await prisma.project.create({
      data: { name, organizationId: org.id, createdById: owner.id },
    });
  }

  console.log("✅ Seeded. Login: owner@acme.test / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
