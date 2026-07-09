import { setWorldConstructor, World, IWorldOptions } from "@cucumber/cucumber";
import type { Islander, Player, Episode, Choice } from "@prisma/client";

export class IsleWorld extends World {
  islanders = new Map<string, Islander>();
  players = new Map<string, Player>();
  episode?: Episode;
  choices = new Map<string, Choice>();
  lastError?: Error;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(IsleWorld);
