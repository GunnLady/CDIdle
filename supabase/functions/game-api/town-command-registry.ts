import type { TownCommandHandlerRegistry } from "./command-handler.ts";
import { allocateCitizens } from "./citizen-command-handlers.ts";
import {
  advanceDungeonAutomation,
  exploreDungeon,
  resolveDungeon,
  retreatDungeon,
  selectDungeonFloor,
  setDungeonAutoExplore,
} from "./dungeon-command-handlers.ts";
import { cancelForge, finalizeForge, recycleInventory, startForge } from "./forge-command-handlers.ts";
import {
  cancelRecruitOffer,
  changeHeroActivity,
  chooseHeroVocation,
  confirmRecruit,
  createRecruitOffer,
  dismissHero,
  recruitHero,
} from "./hero-command-handlers.ts";
import { equipHero, unequipHero } from "./inventory-command-handlers.ts";
import { offerOnboarding, startOnboarding } from "./onboarding-command-handlers.ts";
import {
  grantCheatResources,
  rejectDistrictUnlock,
  setCheatHighestFloor,
  upgradeBuilding,
} from "./town-command-handlers.ts";

export const TOWN_COMMAND_HANDLERS = {
  "onboarding.offer": offerOnboarding,
  "onboarding.start": startOnboarding,
  "building.upgrade": upgradeBuilding,
  "citizens.allocate": allocateCitizens,
  "district.unlock": rejectDistrictUnlock,
  "hero.recruit": recruitHero,
  "hero.recruit_offer": createRecruitOffer,
  "hero.recruit_confirm": confirmRecruit,
  "hero.recruit_cancel": cancelRecruitOffer,
  "hero.dismiss": dismissHero,
  "hero.activity": changeHeroActivity,
  "hero.choose_vocation": chooseHeroVocation,
  "hero.equip": equipHero,
  "hero.unequip": unequipHero,
  "inventory.recycle": recycleInventory,
  "forge.start": startForge,
  "forge.finalize": finalizeForge,
  "forge.cancel": cancelForge,
  "cheat.grant_resources": grantCheatResources,
  "cheat.set_highest_floor": setCheatHighestFloor,
  "dungeon.explore": exploreDungeon,
  "dungeon.auto_advance": advanceDungeonAutomation,
  "dungeon.select_floor": selectDungeonFloor,
  "dungeon.resolve": resolveDungeon,
  "dungeon.auto_explore": setDungeonAutoExplore,
  "dungeon.retreat": retreatDungeon,
} satisfies TownCommandHandlerRegistry;
