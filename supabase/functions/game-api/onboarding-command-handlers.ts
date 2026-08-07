import { generateAuthoritativeNovice } from "./novice-authority.ts";
import { TownCommandError, type TownCommandHandler } from "./command-handler.ts";

export const offerOnboarding: TownCommandHandler<"onboarding.offer"> = (context, command) => {
  const cityName = command.cityName.trim();
  if (!cityName || cityName.length > 48) throw new TownCommandError("INVALID_COMMAND", "city name is invalid");
  if (context.town.cityName || context.town.heroes.length > 0) {
    throw new TownCommandError("ALREADY_STARTED", "onboarding is already complete");
  }
  const onboardingCandidates = Array.from({ length: 5 }, (_, index) =>
    generateAuthoritativeNovice(
      context.nextSeedKey(`onboarding:${index + 1}`),
      `candidate-${command.commandId ?? "onboarding"}-${index + 1}`,
    )
  );
  return context.withRng({
    state: { ...context.town, onboardingCandidates, pendingOnboardingCityName: cityName },
    events: [{ type: "onboarding.offer_created", heroIds: onboardingCandidates.map((hero) => hero.id) }],
  });
};

export const startOnboarding: TownCommandHandler<"onboarding.start"> = (context, command) => {
  const town = context.town;
  const cityName = command.cityName.trim();
  if (!cityName || cityName.length > 48) throw new TownCommandError("INVALID_COMMAND", "city name is invalid");
  if (town.cityName || town.heroes.length > 0) {
    throw new TownCommandError("ALREADY_STARTED", "onboarding is already complete");
  }
  if (!Array.isArray(command.starterHeroes) || command.starterHeroes.length !== 2) {
    throw new TownCommandError("INVALID_COMMAND", "exactly two starter heroes are required");
  }
  if (town.pendingOnboardingCityName !== cityName) {
    throw new TownCommandError("INVALID_COMMAND", "onboarding city does not match the offer");
  }
  const candidates = town.onboardingCandidates ?? [];
  const selectedIds = new Set(command.starterHeroes.map((selection) => String(selection.id ?? "")));
  if (selectedIds.size !== 2) throw new TownCommandError("INVALID_COMMAND", "starter hero ids must be unique");
  const starterHeroes = command.starterHeroes.map((selection, index) => {
    const candidate = candidates.find((entry) => entry.id === selection.id);
    if (!candidate) throw new TownCommandError("INVALID_COMMAND", "starter hero was not offered");
    const name = String(selection.name ?? "").trim();
    if (!name || name.length > 40) throw new TownCommandError("INVALID_COMMAND", "starter hero identity is invalid");
    return {
      ...candidate,
      id: `hero-${command.commandId ?? "onboarding"}-${index + 1}`,
      name,
      isActive: false,
      status: "idle" as const,
    };
  });
  return {
    state: {
      ...town,
      cityName,
      resources: { gold: 125, food: 75, wood: 40, stone: 0, ore: 0 },
      heroes: starterHeroes,
      onboardingCandidates: [],
      pendingOnboardingCityName: "",
    },
    events: [{ type: "onboarding.started", cityName, heroIds: starterHeroes.map((hero) => hero.id) }],
  };
};
