import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { IsleWorld } from "../support/world";
import { prisma } from "../../src/db/client";
import { applyChoice, getOrCreateRelationship, coupleUp } from "../../src/domain/relationships";

Given("an islander named {string} with bio {string}", async function (this: IsleWorld, name: string, bio: string) {
  const islander = await prisma.islander.create({ data: { name, bio } });
  this.islanders.set(name, islander);
});

Given("a player named {string}", async function (this: IsleWorld, name: string) {
  const player = await prisma.player.create({ data: { displayName: name } });
  this.players.set(name, player);
});

Given(
  "an episode 1 choice {string} with an islander named {string} worth {int} compatibility",
  async function (this: IsleWorld, prompt: string, islanderName: string, delta: number) {
    if (!this.episode) {
      this.episode = await prisma.episode.create({ data: { number: 1, title: "Episode 1" } });
    }
    const islander = this.islanders.get(islanderName);
    assert.ok(islander, `unknown islander ${islanderName}`);

    const choice = await prisma.choice.create({
      data: {
        episodeId: this.episode.id,
        islanderId: islander.id,
        prompt,
        compatibilityDelta: delta,
      },
    });
    this.choices.set(prompt, choice);
  },
);

Given(
  "{string}'s compatibility with {string} is already {int}",
  async function (this: IsleWorld, playerName: string, islanderName: string, compatibility: number) {
    const player = this.players.get(playerName);
    const islander = this.islanders.get(islanderName);
    assert.ok(player && islander, "player or islander not set up");

    const relationship = await getOrCreateRelationship(player.id, islander.id);
    await prisma.relationship.update({ where: { id: relationship.id }, data: { compatibility } });
  },
);

When("{string} applies the choice {string}", async function (this: IsleWorld, playerName: string, prompt: string) {
  const player = this.players.get(playerName);
  const choice = this.choices.get(prompt);
  assert.ok(player && choice, "player or choice not set up");

  await applyChoice(player.id, choice.id);
});

Then("{string}'s compatibility with {string} should be {int}", async function (
  this: IsleWorld,
  playerName: string,
  islanderName: string,
  expected: number,
) {
  const player = this.players.get(playerName);
  const islander = this.islanders.get(islanderName);
  assert.ok(player && islander, "player or islander not set up");

  const relationship = await prisma.relationship.findUniqueOrThrow({
    where: { playerId_islanderId: { playerId: player.id, islanderId: islander.id } },
  });
  assert.equal(relationship.compatibility, expected);
});

When("{string} tries to couple up with {string}", async function (this: IsleWorld, playerName: string, islanderName: string) {
  const player = this.players.get(playerName);
  const islander = this.islanders.get(islanderName);
  assert.ok(player && islander, "player or islander not set up");

  this.lastError = undefined;
  try {
    await coupleUp(player.id, islander.id);
  } catch (err) {
    this.lastError = err as Error;
  }
});

Then("the coupling should succeed", function (this: IsleWorld) {
  assert.equal(this.lastError, undefined);
});

Then("the coupling should fail with error {string}", function (this: IsleWorld, message: string) {
  assert.ok(this.lastError, "expected an error but coupling succeeded");
  assert.equal(this.lastError.message, message);
});

Then("{string} and {string} should be coupled up", async function (this: IsleWorld, playerName: string, islanderName: string) {
  const player = this.players.get(playerName);
  const islander = this.islanders.get(islanderName);
  assert.ok(player && islander, "player or islander not set up");

  const relationship = await prisma.relationship.findUniqueOrThrow({
    where: { playerId_islanderId: { playerId: player.id, islanderId: islander.id } },
  });
  assert.equal(relationship.coupledUp, true);
});
