import { PrismaClient } from "@platform/cdm";

const prisma = new PrismaClient();

async function seed() {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`select set_config('app.current_tenant', ${"dev"}, true)`;
    await tx.ticket.create({
      data: {
        id: "t_001",
        tenantId: "dev",
        source: "jira",
        externalKey: "ABC-123",
        title: "Hello Ticket",
        status: "To Do",
        labels: [],
      },
    });
  });
}

await seed();
await prisma.$disconnect();
console.log("Seeded dev tenant.");
