import type {
  CanonicalHero as Hero,
  CanonicalStoredItemInstance as StoredItemInstance,
} from "../../../shared/contracts/authoritative.ts";
import { applyClassTransition } from "../../../shared/domain/class-transition.ts";
import type { CanonicalHeroClass as ClassType } from "../../../shared/domain/hero-classes.ts";
import { generateAuthoritativeNovice } from "./novice-authority.ts";
import { TownCommandError, type TownCommandHandler } from "./command-handler.ts";

export const chooseHeroVocation: TownCommandHandler<"hero.choose_vocation"> = (context, command) => {
  const town = context.town;
  const heroes = town.heroes ?? [];
  const pending = town.pendingClassTransitions.find((entry) => entry.heroId === command.heroId);
  if (!pending) throw new TownCommandError("VOCATION_NOT_PENDING", "hero has no pending vocation");
  if (!pending.candidates.some((candidate) => candidate.classType === command.classType)) {
    throw new TownCommandError("INVALID_VOCATION", "chosen vocation was not offered");
  }
  const heroIndex = heroes.findIndex((entry) => entry.id === command.heroId);
  if (heroIndex < 0) throw new TownCommandError("HERO_NOT_FOUND", "hero not found");
  const hero = heroes[heroIndex] as unknown as Hero;
  if (hero.classType !== pending.fromClass || hero.level < pending.originLevel) {
    throw new TownCommandError("INVALID_VOCATION_STATE", "hero no longer matches the pending vocation");
  }
  const activeOthers = heroes.filter((entry) => entry.id !== hero.id && entry.isActive).length;
  const restoreActive = pending.wasActive && activeOthers < 4 && hero.currentHp > 0;
  const transition = {
    fromClass: pending.fromClass,
    toClass: command.classType as ClassType,
    fromTier: pending.fromTier,
    toTier: pending.toTier,
    reason: pending.reason,
  };
  const applied = applyClassTransition(
    { ...hero, isActive: restoreActive, status: restoreActive ? pending.previousStatus : "resting" },
    transition,
    context.forkRng(),
    (town.storedItems ?? []) as unknown as StoredItemInstance[],
  );
  const nextHeroes = [...heroes];
  nextHeroes[heroIndex] = applied.hero;
  return context.withRng({
    state: {
      ...town,
      heroes: nextHeroes,
      storedItems: applied.storedItems,
      pendingClassTransitions: town.pendingClassTransitions.filter((entry) => entry.heroId !== command.heroId),
    },
    events: [{
      type: "hero.vocation_chosen",
      heroId: command.heroId,
      previousClass: pending.fromClass,
      classType: command.classType,
      previousTier: pending.fromTier,
      classTier: pending.toTier,
      equipmentReward: applied.equipmentReward,
    }],
  });
};

export const createRecruitOffer: TownCommandHandler<"hero.recruit_offer"> = (context, command) => {
  const town = context.town;
  const heroes = town.heroes ?? [];
  if (town.pendingRecruit) throw new TownCommandError("RECRUIT_PENDING", "a recruit offer is already pending");
  const guildLevel = town.buildings.guilde ?? 0;
  if (guildLevel < 1) throw new TownCommandError("GUILD_REQUIRED", "guild building is required");
  if (heroes.length >= Math.max(0, guildLevel) + 2) throw new TownCommandError("CAPACITY_REACHED", "hero capacity reached");
  const candidate = generateAuthoritativeNovice(
    context.nextSeedKey("recruit"),
    `candidate-${command.commandId ?? "offer"}`,
    "Humain",
  );
  return context.withRng({
    state: { ...town, pendingRecruit: candidate },
    events: [{ type: "hero.recruit_offer_created", heroId: candidate.id }],
  });
};

export const cancelRecruitOffer: TownCommandHandler<"hero.recruit_cancel"> = (context) => {
  if (!context.town.pendingRecruit) throw new TownCommandError("RECRUIT_NOT_FOUND", "recruit offer not found");
  return { state: { ...context.town, pendingRecruit: null }, events: [{ type: "hero.recruit_offer_cancelled" }] };
};

export const confirmRecruit: TownCommandHandler<"hero.recruit_confirm"> = (context, command) => {
  const town = context.town;
  const heroes = town.heroes ?? [];
  const pending = town.pendingRecruit;
  if (!pending) throw new TownCommandError("RECRUIT_NOT_FOUND", "recruit offer not found");
  const guildLevel = town.buildings.guilde ?? 0;
  const cost = 100 + heroes.length * 150;
  if (heroes.length >= Math.max(0, guildLevel) + 2) throw new TownCommandError("CAPACITY_REACHED", "hero capacity reached");
  if (town.resources.gold < cost) throw new TownCommandError("INSUFFICIENT_RESOURCES", "insufficient gold");
  const name = command.name?.trim();
  const hero = { ...pending, ...(name ? { name: name.slice(0, 40) } : {}), id: String(pending.id).replace("candidate-", "hero-") };
  return {
    state: {
      ...town,
      resources: { ...town.resources, gold: town.resources.gold - cost },
      heroes: [...heroes, hero],
      pendingRecruit: null,
    },
    events: [{ type: "hero.recruited", heroId: hero.id, cost }],
  };
};

export const recruitHero: TownCommandHandler<"hero.recruit"> = (context, command) => {
  const town = context.town;
  const heroes = town.heroes ?? [];
  const guildLevel = town.buildings.guilde ?? 0;
  const cost = 100 + heroes.length * 150;
  const capacity = Math.max(0, guildLevel) + 2;
  if (guildLevel < 1) throw new TownCommandError("GUILD_REQUIRED", "guild building is required");
  if (heroes.length >= capacity) throw new TownCommandError("CAPACITY_REACHED", "hero capacity reached");
  if (town.resources.gold < cost) throw new TownCommandError("INSUFFICIENT_RESOURCES", "insufficient gold");
  const id = `hero-${command.commandId ?? `slot-${heroes.length}`}`;
  const hero = generateAuthoritativeNovice(context.nextSeedKey("recruit"), id);
  return context.withRng({
    state: { ...town, resources: { ...town.resources, gold: town.resources.gold - cost }, heroes: [...heroes, hero] },
    events: [{ type: "hero.recruited", heroId: id, cost }],
  });
};

export const dismissHero: TownCommandHandler<"hero.dismiss"> = (context, command) => {
  const town = context.town;
  const dismissed = town.heroes.find((hero) => hero.id === command.heroId);
  if (!dismissed) throw new TownCommandError("HERO_NOT_FOUND", "hero not found");
  const returnedItems = Object.values(dismissed.equipment ?? {})
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  return {
    state: {
      ...town,
      heroes: town.heroes.filter((hero) => hero.id !== command.heroId),
      storedItems: [...town.storedItems, ...returnedItems],
      pendingClassTransitions: town.pendingClassTransitions.filter((entry) => entry.heroId !== command.heroId),
    },
    events: [{
      type: "hero.dismissed",
      heroId: command.heroId,
      returnedInstanceIds: returnedItems.map((item) => item.instanceId),
    }],
  };
};

export const changeHeroActivity: TownCommandHandler<"hero.activity"> = (context, command) => {
  const town = context.town;
  const hero = town.heroes.find((entry) => entry.id === command.heroId);
  if (!hero) throw new TownCommandError("HERO_NOT_FOUND", "hero not found");
  if (command.active && Number(hero.currentHp ?? 0) <= 0) throw new TownCommandError("INVALID_HEALTH", "hero has no health");
  const occupiedSlots = town.heroes.filter((entry) => entry.isActive).length;
  if (command.active && occupiedSlots >= 4) throw new TownCommandError("ACTIVE_LIMIT", "active hero limit reached");
  return {
    state: {
      ...town,
      heroes: town.heroes.map((entry) => entry.id === command.heroId
        ? { ...entry, isActive: command.active, status: command.active ? "idle" : "resting" }
        : entry),
    },
    events: [{ type: "hero.activity_changed", heroId: command.heroId, active: command.active }],
  };
};
