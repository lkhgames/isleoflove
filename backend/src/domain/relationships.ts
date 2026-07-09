import { prisma } from "../db/client";

const MIN_COMPATIBILITY = 0;
const MAX_COMPATIBILITY = 100;
const COUPLING_THRESHOLD = 50;

export function clampCompatibility(value: number): number {
  return Math.min(MAX_COMPATIBILITY, Math.max(MIN_COMPATIBILITY, value));
}

export async function getOrCreateRelationship(playerId: string, islanderId: string) {
  return prisma.relationship.upsert({
    where: { playerId_islanderId: { playerId, islanderId } },
    update: {},
    create: { playerId, islanderId, compatibility: 0 },
  });
}

export async function applyChoice(playerId: string, choiceId: string) {
  const choice = await prisma.choice.findUniqueOrThrow({ where: { id: choiceId } });
  if (!choice.islanderId) {
    return null;
  }

  const relationship = await getOrCreateRelationship(playerId, choice.islanderId);
  const compatibility = clampCompatibility(relationship.compatibility + choice.compatibilityDelta);

  return prisma.relationship.update({
    where: { id: relationship.id },
    data: { compatibility },
  });
}

export function isEligibleForCoupling(compatibility: number): boolean {
  return compatibility >= COUPLING_THRESHOLD;
}

export async function coupleUp(playerId: string, islanderId: string) {
  const relationship = await getOrCreateRelationship(playerId, islanderId);
  if (!isEligibleForCoupling(relationship.compatibility)) {
    throw new Error("Compatibility too low to couple up");
  }

  return prisma.relationship.update({
    where: { id: relationship.id },
    data: { coupledUp: true },
  });
}
