export function patchJourney(source){
 const replace=(a,b)=>{if(source.split(a).length!==2)throw Error('Journey anchor changed: '+a);source=source.replace(a,b);};
 replace('  const scaledMonster = scaleMonster(floor, room, rng, xpRewardPolicy);',
  '  globalThis.__journeyBegin(source, encounterId, floor, room);\n  const scaledMonster = scaleMonster(floor, room, rng, xpRewardPolicy);');
 replace('    if (firstClear) {\n      const firstClearGold', '    if (firstClear && !globalThis.__journeyEnabled) {\n      const firstClearGold');
 replace('    if (firstClear) {\n      const xpPool', '    if (firstClear && !globalThis.__journeyEnabled) {\n      const xpPool');
 replace('    if (firstClear && !globalThis.__journeyEnabled) {\n      const xpPool', `    for (const personal of globalThis.__journeyAwards(monster.xpYield)) {
      const index = heroes.findIndex(hero => hero.id === personal.heroId);
      if (index < 0) throw new Error("PERSONAL_REWARD_HERO_MISSING");
      const original = heroes[index];
      const award = awardExperience(original, personal.xp, rng, source.buildings ?? {}, storedItems, xpCurve);
      storedItems = award.storedItems;
      appendPendingTransition(pendingClassTransitions, award);
      logExperienceAward((type, message, category, data) => log(type === "reward.xp" ? "reward.personal_first_xp" : type, message, category, data), original, personal.xp, award, {source:"personal_first", floor});
      heroes[index] = award.hero;
      const material = {materialId:personal.materialId,rarity:personal.rarity,count:personal.count,name:personal.materialId};
      forgeMaterials = appendMaterial(forgeMaterials, material);
      if (personal.item) {
        if (storedItems.some(item => item.instanceId === personal.item.instanceId)) throw new Error('PERSONAL_REWARD_ITEM_DUPLICATE');
        storedItems.push(personal.item);
        loot.push({type:'item',...personal.item,count:1,source:'personal_first'});
        log('reward.personal_first_item', 'Equipement personnel', 'loot', {heroId:personal.heroId,fixed:personal.fixed,...personal.item});
      }
      loot.push({type:"material",...material});
      log("reward.personal_first", "Prime personnelle", "loot", {...personal});
    }
    if (firstClear && !globalThis.__journeyEnabled) {\n      const xpPool`);
 return source;
}
