// Manual scenario policy. Prices, prerequisites, recruitment, allocation and
// production effects come from the injected authoritative domain, not copies.
export function createLootTownPolicy(lib, seed) {
  const ledger = { goldSpent: 0, recruitmentGold: 0, buildingGold: 0, purchases: [], blocked: {}, rosterFourExploration: null };
  const roles = [['farmers', 'food', 'ferme'], ['woodcutters', 'wood', 'scierie'], ['quarrymen', 'stone', 'carriere'], ['miners', 'ore', 'mine']];
  let serial = 0;
  const apply = (state, command) => lib.applyTownCommand(state, command).state;
  const affordable = (state, cost) => Object.entries(cost).every(([key, value]) => state.resources[key] >= value);
  function prepare() {
    let state = lib.initialTownState(seed);
    state = apply(state, { type: 'onboarding.offer', cityName: 'Loot calibration', commandId: `loot-city-${seed}` });
    state = apply(state, { type: 'onboarding.start', cityName: 'Loot calibration', commandId: `loot-city-${seed}`, starterHeroes: state.onboardingCandidates.slice(0, 2).map((hero, index) => ({ id: hero.id, name: `Hero ${index + 1}` })) });
    for (const hero of state.heroes) state = apply(state, { type: 'hero.activity', heroId: hero.id, active: true });
    return { ...state, autoExplore: true };
  }
  function nextPurchase(state) {
    const building = (id, target) => (state.buildings[id] ?? 0) < target
      ? { command: { type: 'building.upgrade', buildingId: id }, cost: lib.getBuildingUpgradeCost(id, state.buildings[id] ?? 0) } : null;
    for (const id of ['ferme', 'scierie', 'carriere', 'mine', 'guilde']) {
      const next = building(id, 1);
      if (next) return next;
    }
    // Reserve for the first forge before expanding the roster. Its real
    // upgrade is executed by the existing forge driver, not charged here.
    if (state.buildings.forge === 0) return null;
    if (state.heroes.length < 4) {
      const next = building('guilde', Math.max(1, state.heroes.length - 1));
      if (next) return next;
      return { command: { type: 'hero.recruit', commandId: `loot-city-recruit-${seed}-${state.heroes.length}` }, cost: { gold: lib.recruitmentCost(state.heroes.length) } };
    }
    // These are explicit spending-policy assumptions, not game unlock rules.
    const band = Math.min(8, Math.floor((Math.min(...state.heroes.map((hero) => hero.level)) - 1) / 5) + 1);
    for (const id of ['temple', 'caserne', 'academie', 'lair', 'poste_chasse', 'cercle']) {
      const next = building(id, 1);
      if (next) return next;
    }
    for (const [id, target] of [['habitation', Math.min(10, band + 1)], ['ferme', band], ['scierie', band], ['carriere', band], ['mine', band], ['maison_chef', Math.min(3, Math.ceil(band / 3))]]) {
      const next = building(id, target);
      if (next) return next;
    }
    return null;
  }
  function allocate(state, cost) {
    const available = roles.filter(([, , id]) => state.buildings[id] > 0);
    if (!available.length) return state;
    const desired = Object.fromEntries(roles.map(([role]) => [role, 0]));
    const priorities = available.map(([role, resource]) => ({ role, resource, need: Math.max(0, (cost[resource] ?? 0) - state.resources[resource]) }));
    // Distribute workers by remaining demand, ensuring continued food supply.
    for (let index = 0; index < state.totalCitizensCount; index++) {
      const selected = index === 0 ? priorities.find((r) => r.role === 'farmers') ?? priorities[0]
        : [...priorities].sort((a, b) => b.need / (desired[b.role] + 1) - a.need / (desired[a.role] + 1))[0];
      desired[selected.role]++;
    }
    for (const [role] of roles) {
      const amount = desired[role] - state.citizens[role];
      if (amount < 0) state = apply(state, { type: 'citizens.allocate', role, amount });
    }
    for (const [role] of roles) {
      const amount = desired[role] - state.citizens[role];
      if (amount > 0) state = apply(state, { type: 'citizens.allocate', role, amount });
    }
    return state;
  }
  function canForge(state, target) {
    return lib.checkBuildingUnlocked('forge', state.buildings, state.highestFloorReached, target);
  }
  function step(source, exploration) {
    let state = source;
    for (let attempt = 0; attempt < 30; attempt++) {
      const next = nextPurchase(state);
      if (!next) break;
      if (next.command.type === 'building.upgrade' && !lib.checkBuildingUnlocked(next.command.buildingId, state.buildings, state.highestFloorReached, state.buildings[next.command.buildingId] + 1)) break;
      if (!affordable(state, next.cost)) {
        for (const [key, value] of Object.entries(next.cost)) if (state.resources[key] < value) ledger.blocked[key] = (ledger.blocked[key] ?? 0) + 1;
        break;
      }
      const before = state.resources.gold;
      state = apply(state, next.command);
      const spent = before - state.resources.gold;
      ledger.goldSpent += spent;
      ledger[next.command.type === 'hero.recruit' ? 'recruitmentGold' : 'buildingGold'] += spent;
      ledger.purchases.push({ exploration, floor: state.highestFloorReached, command: next.command.type, building: next.command.buildingId, gold: spent, serial: serial++ });
      if (next.command.type === 'hero.recruit') {
        state = apply(state, { type: 'hero.activity', heroId: state.heroes.at(-1).id, active: true });
        if (state.heroes.length === 4) ledger.rosterFourExploration ??= exploration;
      }
    }
    const next = nextPurchase(state);
    const forgeCost = state.buildings.forge < 8 && canForge(state, state.buildings.forge + 1) ? lib.getBuildingUpgradeCost('forge', state.buildings.forge) : {};
    const demand = Object.fromEntries(roles.map(([, resource]) => [resource, Math.max(next?.cost[resource] ?? 0, forgeCost[resource] ?? 0)]));
    return allocate(state, demand);
  }
  return { prepare, step, canForge, ledger };
}
