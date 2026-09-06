// Checked in-memory adaptation of the canonical single-enemy resolver.
// Keep rewards, hero mana/cooldowns, effects, damage formulas and recovery canonical.
export function patchUndercityGroups(source) {
 function replace(a,b){if(source.split(a).length!==2)throw Error('Group anchor changed: '+a);source=source.replace(a,b);}
 replace('import { chooseHeroAction }', 'import { chooseHeroAction, estimateNormalAttackDamage }');
 replace('      let skillUsed = false;', '      if(enemyGroup) monster = globalThis.__groupChoose(enemyGroup, target => estimateNormalAttackDamage(hero, target, activeEffects));\n      let skillUsed = false;');
 replace('  let activeEffects: TemporaryCombatEffect[] = [];',
  '  let activeEffects: TemporaryCombatEffect[] = [];\n  const enemyGroup = globalThis.__groupCreate(monster);');
 replace('    if (round > 100)', '    if (enemyGroup) { for (const intent of globalThis.__groupRound(enemyGroup, round) ?? []) log("enemy.intent", intent.enemyName + ": " + intent.phase, "combat-enemy", {...intent,type:"enemy.intent",monsterId:intent.enemyId,monsterName:intent.enemyName}); monster = globalThis.__groupPrimary(enemyGroup); }\n    if (round > 100)');
 replace('        if (effect.type === "damage") {', `        if (effect.type === "damage" && enemyGroup) {
          const hits = globalThis.__groupSkill(enemyGroup, skill, (target) => {
            const critical = rng.next() < calculatedStats.criticalChance / 100;
            const raw = Math.floor(requiredCalculatedStat(calculatedStats, effect.scalingStat) * effect.power);
            return { critical, damage: applyMonsterDefenseOrResistance(
              critical ? Math.floor(raw * 1.5) : raw, effect.damageType, getEffectiveMonster(target, activeEffects)) };
          });
          for (const hit of hits) log("hero.skill.damage", hero.name + " utilise " + skill.name + " sur " + hit.monsterName,
            "combat-hero", {round, heroId:hero.id, skillId, skillName:skill.name, ...hit, damageType:effect.damageType});
          monster = globalThis.__groupPrimary(enemyGroup);
        } else if (effect.type === "damage") {`);
 replace('? [{ id: monster.id, side: "monster" as const }]',
  '? (enemyGroup && skill.target === "all_enemies" ? globalThis.__groupLiving(enemyGroup) : [monster]).map(target => ({id: target.id, side: "monster" as const}))');
 replace('        monster,\n        activeEffects,', '        monster,\n        enemies: enemyGroup ? globalThis.__groupLiving(enemyGroup) : undefined,\n        areaTargets: enemyGroup?.profile !== \'bestiaryUndercityGroupsSingle\',\n        activeEffects,');
 // Apply each weapon strike immediately, then allow the next strike to acquire a living target.
 replace('        }\n      }\n\n      monster = { ...monster, hp: Math.max(0, monster.hp - totalDamage) };',
 `          if (enemyGroup) {
            globalThis.__groupDamage(enemyGroup, monster.id, damage);
            monster = globalThis.__groupPrimary(enemyGroup);
            totalDamage = 0;
            if (monster.hp === 0) break;
          }
        }
      }

      monster = enemyGroup ? globalThis.__groupPrimary(enemyGroup) : { ...monster, hp: Math.max(0, monster.hp - totalDamage) };`);
 replace('    const strikes = rollMonsterStrikeCount(monsterAttackProfile, () => rng.next());',
  '    for (const attacker of (enemyGroup ? globalThis.__groupLiving(enemyGroup) : [monster])) {\n    monster = attacker;\n    if (enemyGroup) { const heal = globalThis.__groupSupport(enemyGroup, attacker); if (heal) { log("enemy.heal", attacker.name + " soigne un allie", "combat-enemy", heal); continue; } }\n    const strikes = rollMonsterStrikeCount(monsterAttackProfile, () => rng.next());');
 replace('    activeEffects = advanceTemporaryCombatEffects(activeEffects);',
  '    }\n    if (enemyGroup) monster = globalThis.__groupPrimary(enemyGroup);\n    activeEffects = advanceTemporaryCombatEffects(activeEffects);');
 replace('  const victory = monster.hp === 0;',
  '  if (enemyGroup) { globalThis.__groupFinish(enemyGroup); monster = globalThis.__groupSummary(enemyGroup); }\n  const victory = monster.hp === 0;');
 replace('      enemy: {', '      ...(enemyGroup ? { enemies: enemyGroup.members.map(({id,name,hp,maxHp}) => ({id,name,hp,maxHp})) } : {}),\n      enemy: {');
 return source;
}

export function patchGroupTactics(source) {
 function replace(a,b){if(source.split(a).length!==2)throw Error('Group tactic anchor changed: '+a);source=source.replace(a,b);}
 replace('      const usefulDamage = Math.min(damage, context.monster.hp);',
  '      const usefulDamage = skill.target === "all_enemies" && context.enemies && context.areaTargets ? context.enemies.reduce((sum, target) => sum + Math.min(target.hp, estimateSkillDamage(context.hero, target, skill, effects)), 0) : Math.min(damage, context.monster.hp);');
 replace('      const uniquelyLethal = lethal && normalDamage < context.monster.hp;',
  '      const areaKills = skill.target === "all_enemies" && context.enemies && context.areaTargets ? context.enemies.filter(target => estimateSkillDamage(context.hero, target, skill, effects) >= target.hp).length : 0; const uniquelyLethal = (lethal && normalDamage < context.monster.hp) || areaKills > 1;');
 replace('  return estimateNextEnemyDamage(context.monster, target, effects, expectedHits);',
  '  return (context.enemies ?? [context.monster]).reduce((sum, enemy) => sum + estimateNextEnemyDamage(enemy, target, effects, expectedHits), 0);');
 return source;
}
