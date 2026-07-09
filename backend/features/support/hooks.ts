import { Before, After } from "@cucumber/cucumber";
import { prisma } from "../../src/db/client";

Before(async () => {
  await prisma.relationship.deleteMany();
  await prisma.choice.deleteMany();
  await prisma.episode.deleteMany();
  await prisma.islander.deleteMany();
  await prisma.player.deleteMany();
});

After(async () => {
  await prisma.$disconnect();
});
