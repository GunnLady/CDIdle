import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {createEnemyGroup,chooseEnemy,prepareEnemyRound,performEnemySupport,primaryEnemy,livingEnemies,damageEnemy,resolveGroupSkill,summarizeGroup,isGroupProfile} from './helpers/undercity-groups.mjs';
import {patchJourney} from './helpers/undercity-journey-patch.mjs';
import {patchUndercityGroups,patchGroupTactics} from './helpers/undercity-group-patch.mjs';
const base={id:'fixture',name:'Test',hp:99,maxHp:99,atk:120,def:0,magicDef:0,damageType:'physical',isBoss:false,xpYield:10,goldYield:3,__undercity:{behavior:'swarm'}};
const group=()=>createEnemyGroup(structuredClone(base),'bestiaryUndercityGroups');
assert.equal(isGroupProfile('bestiaryUndercityJourneyCourt20'),true);
let g=group();
assert.equal(new Set(g.members.map(m=>m.id)).size,3);
assert.equal(g.members.reduce((s,m)=>s+m.maxHp,0),99);
assert.equal(g.members.reduce((s,m)=>s+m.atk,0),120);
const aoe={id:'area',target:'all_enemies',effect:{hitCount:1}};
let hits=resolveGroupSkill(g,aoe,()=>({damage:10}));
assert.equal(hits.length,3);assert.deepEqual(g.members.map(m=>m.hp),[23,23,23]);
g=group();hits=resolveGroupSkill(g,{id:'double',target:'single_enemy',effect:{hitCount:2}},()=>({damage:20}));
assert.equal(new Set(hits.map(h=>h.monsterId)).size,1);
assert.deepEqual(g.members.map(m=>m.hp),[0,33,33]);assert.equal(primaryEnemy(g).id,g.members[1].id);
hits=resolveGroupSkill(g,aoe,()=>({damage:100}));
assert.equal(hits.length,2);assert.equal(summarizeGroup(g).hp,0);
assert.equal(resolveGroupSkill(g,aoe,()=>{throw Error('Dead target rolled');}).length,0);
assert.throws(()=>damageEnemy(g,'missing',1));assert.throws(()=>damageEnemy(g,g.members[0].id,-1));
g=createEnemyGroup({...base,__undercity:{behavior:'king'}},'bestiaryUndercityGroups');
prepareEnemyRound(g,1);assert(g.events.some(e=>e.phase==='king-guard'));
damageEnemy(g,g.members[0].id,100);prepareEnemyRound(g,2);
assert.equal(g.events.at(-1).phase,'king-guard');
damageEnemy(g,g.members[1].id,100);prepareEnemyRound(g,3);
assert.equal(g.events.at(-1).phase,'king-monster');
assert.equal(g.members[2].hp,33);
const compiled=await build({stdin:{contents:
 'export { expectedEnemyDamageForTarget, listLegalHeroActions } from "./shared/domain/combat-tactics.ts"; export { resolveFight } from "./shared/domain/authoritative-dungeon.ts"; export { makeHero } from "./tests/fixtures/game.ts"; export { initialTownState } from "./supabase/functions/game-api/town-authority.ts"; export { seededRng } from "./shared/domain/random.ts"; export { CANONICAL_DUNGEON_XP_REWARD_POLICY } from "./shared/domain/dungeon-xp-rewards.ts";',resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
 plugins:[{name:'test-group-resolver',setup(b){
 b.onLoad({filter:/combat-tactics\.ts$/},async({path})=>({contents:patchGroupTactics((await readFile(path,'utf8')).replaceAll('\r\n','\n'))+'\nexport { expectedEnemyDamageForTarget };',loader:'ts'}));
 b.onLoad({filter:/authoritative-dungeon\.ts$/},async({path})=>{
 let s=(await readFile(path,'utf8')).replaceAll('\r\n','\n');
 s=patchJourney(patchUndercityGroups(s));
 s=s.replace('    activeEffects = advanceTemporaryCombatEffects(activeEffects);','    globalThis.__testEffects?.(structuredClone(activeEffects)); activeEffects = advanceTemporaryCombatEffects(activeEffects);');
 s=s.replace('import { chooseHeroAction, estimateNormalAttackDamage }','import { chooseHeroAction as canonicalChooseHeroAction, estimateNormalAttackDamage }');
 s+='\nconst chooseHeroAction = context => globalThis.__testAction(context); export { resolveFight };';
 return {contents:s,loader:'ts'};
 });}}]});
const lib=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
let captured;
Object.assign(globalThis,{__journeyEnabled:false,__journeyBegin:()=>{},__journeyAwards:()=>[],__groupChoose:chooseEnemy,__groupCreate:()=>group(),__groupRound:prepareEnemyRound,__groupSupport:performEnemySupport,__groupPrimary:primaryEnemy,__groupLiving:livingEnemies,__groupDamage:damageEnemy,__groupSkill:resolveGroupSkill,__groupSummary:summarizeGroup,__groupFinish:g=>{captured=g;}});
function fight(skill,physicalDamage=100){
 const hero=lib.makeHero({activeSkills:[skill],currentHp:1000,currentMana:100,calculatedStats:{...lib.makeHero().calculatedStats,maxHp:1000,hp:1000,maxMana:100,mana:100,physicalDamage,physicalDefense:0,magicDefense:0,criticalChance:0,dodgeChance:0}});
 globalThis.__testAction=ctx=>ctx.round===1?{kind:'skill',skillId:skill,reason:'fixture'}:{kind:'normal_attack',reason:'fixture'};
 const state={...lib.initialTownState(42),heroes:[hero],activeDungeonFloor:1,activeDungeonRoom:1,highestFloorReached:1,storedItems:[],forgeMaterials:[]};
 return lib.resolveFight(state,1,1,'group-fixture',lib.seededRng(42),undefined,lib.CANONICAL_DUNGEON_XP_REWARD_POLICY);
}
const area=fight('cleaving_strike');
assert.equal(area.encounter.outcome,'victory');
assert.equal(area.encounter.roundCount,1);
assert.equal(area.encounter.enemies.length,3);
assert.equal(area.encounter.enemy.hp,0);
assert.equal(area.encounter.transcript.filter(e=>e.type==='hero.skill.damage').length,3);
assert.equal(area.state.heroes[0].currentMana,76,'one mana cost for entire cast');
assert.equal(area.state.heroes[0].cooldowns.cleaving_strike,3,'one cooldown per cast');
assert.equal(area.encounter.transcript.filter(e=>e.type==='reward.gold').length,1,'one encounter reward');
const single=fight('double_cut',15);
const first=single.encounter.transcript.filter(e=>e.type==='hero.skill.damage'&&e.round===1);
assert.equal(first.length,2);assert.equal(new Set(first.map(e=>e.monsterId)).size,1);
const strikes=single.encounter.transcript.filter(e=>e.type==='monster.hit'||e.type==='monster.hit.dodged');
const enemyEvents=single.encounter.transcript.filter(e=>e.category==='combat-enemy'&&e.type!=='enemy.intent'&&e.round===1);
assert.equal(new Set(enemyEvents.map(e=>e.monsterId)).size,3,'all living enemies act');
assert.equal(single.encounter.enemies.reduce((s,m)=>s+m.hp,0),single.encounter.enemy.hp);
console.log('Group model and real resolver passed: AoE, multi-hit, retarget, mana, cooldown, enemy turns, reward once, guard deaths.');

const tacticalHero=lib.makeHero({activeSkills:['cleaving_strike'],currentHp:1000,currentMana:100,calculatedStats:{...lib.makeHero().calculatedStats,maxHp:1000,maxMana:100,physicalDamage:15,physicalDefense:0,magicDefense:0,dodgeChance:0}});
const tacticalGroup=group();
const context={hero:tacticalHero,heroes:[tacticalHero],monster:primaryEnemy(tacticalGroup),enemies:livingEnemies(tacticalGroup),areaTargets:true,activeEffects:[],floor:1,room:1,finalRoom:5,round:1};
const one=lib.expectedEnemyDamageForTarget({...context,enemies:undefined},tacticalHero,[]);
const all=lib.expectedEnemyDamageForTarget(context,tacticalHero,[]);
assert.equal(all,one*3,'Defensive tactics consider all living attackers');
const actions=lib.listLegalHeroActions(context);
assert(actions.some(a=>a.skillId==='cleaving_strike'),'Tactics recognize area damage value');
console.log('Group tactical estimates passed: summed threat and useful area damage.');

const effectRounds=[];
globalThis.__testEffects=effects=>effectRounds.push(effects);
fight('discordant_chord',15);
const firstEffects=effectRounds[0].filter(e=>e.sourceSkillId==='discordant_chord');
assert.equal(firstEffects.length,3,'Area debuff covers three distinct enemies');
assert.equal(new Set(firstEffects.map(e=>e.targetId)).size,3);
assert(firstEffects.every(e=>e.remainingRounds===2),'Effect duration does not tick between enemy turns');
effectRounds.length=0;
fight('weakening_shout',15);
assert.equal(effectRounds[0].filter(e=>e.sourceSkillId==='weakening_shout').length,1,'Single debuff stays on one enemy');
delete globalThis.__testEffects;
console.log('Group effects passed: target isolation, area debuff, one duration tick per round.');

let support=createEnemyGroup({...base,__undercity:{behavior:'cover',members:[{name:'Shield',role:'protector'},{name:'Archer',role:'ranged'},{name:'Healer',role:'support'}]}},'bestiaryUndercityGroups');
damageEnemy(support,support.members[0].id,20);
prepareEnemyRound(support,2);assert.equal(performEnemySupport(support,support.members[2]),null);
prepareEnemyRound(support,3);const heal=performEnemySupport(support,support.members[2]);
assert(heal.healing>0);assert.equal(support.members[0].hp,13+heal.healing);
damageEnemy(support,support.members[0].id,100);prepareEnemyRound(support,6);
performEnemySupport(support,support.members[2]);assert.equal(support.members[0].hp,0,'No resurrection by support');
damageEnemy(support,support.members[2].id,100);assert.equal(performEnemySupport(support,support.members[2]),null,'Dead support never heals');
const lethalHero={...tacticalHero,calculatedStats:{...tacticalHero.calculatedStats,physicalDamage:100}};
const lethal=lib.listLegalHeroActions({...context,hero:lethalHero,heroes:[lethalHero]});
assert(lethal.find(a=>a.skillId==='cleaving_strike').priority>=lethal.find(a=>a.kind==='normal_attack').priority,'Several kills are not suppressed by one normal kill');
console.log('Support cadence, no resurrection, and multi-kill priorities passed');

globalThis.__groupCreate=()=>createEnemyGroup({...base,hp:300,maxHp:300,__undercity:{behavior:'cover',members:[{name:'Shield',role:'protector'},{name:'Archer',role:'ranged'},{name:'Healer',role:'support'}]}},'bestiaryUndercityGroups');
const supportFight=fight('double_cut',15);
const heals=supportFight.encounter.transcript.filter(e=>e.type==='enemy.heal');
assert(heals.length>0,'Support heal executed in real resolver');
for(const heal of heals) assert(!supportFight.encounter.transcript.some(e=>e.category==='combat-enemy'&&e.damage!==undefined&&e.monsterId===heal.enemyId&&e.round===heal.round),'Healing replaces attack');
assert(heals.reduce((s,e)=>s+e.healing,0)<=45,'Encounter healing budget respected');
assert(supportFight.encounter.transcript.some(e=>e.type==='enemy.intent'),'Intent events exposed');
console.log('Real support turn: healing replaces attacks, capped budget, intentions passed');

const {UNDERCITY_ZONES,undercityMonster}=await import('./helpers/undercity-experiment.mjs');
for(let zoneIndex=0;zoneIndex<5;zoneIndex++){
 const zone=UNDERCITY_ZONES[zoneIndex];
 for(let i=0;i<zone.encounters.length;i++){
  const scaled=undercityMonster({...base,__undercity:undefined},zoneIndex*10+1,(i+.5)/zone.encounters.length,'bestiaryUndercityGroups').monster;
  const actual=createEnemyGroup(scaled,'bestiaryUndercityGroups');
  assert.equal(actual.members.length,zone.encounters[i].members.length);
  assert.deepEqual(actual.members.map(m=>m.name),zone.encounters[i].members.map(m=>m.name));
  prepareEnemyRound(actual,1);assert(actual.members.every(m=>m.hp>0&&m.atk>=1));
  for(const member of [...actual.members])damageEnemy(actual,member.id,member.maxHp);
  assert.equal(summarizeGroup(actual).hp,0);
 }
 const boss=undercityMonster({...base,isBoss:true},(zoneIndex+1)*10,.5,'bestiaryUndercityGroups').monster;
 assert.equal(boss.name,zone.boss.name);
 assert.equal(createEnemyGroup(boss,'bestiaryUndercityGroups').members.length,zone.boss.members.length);
}
console.log('All 20 ordinary compositions and all five bosses instantiated and verified.');

globalThis.__groupCreate=()=>group();
const ids=['personal-a','personal-b','personal-c','personal-d'];
const personalState={...lib.initialTownState(42),activeDungeonFloor:1,activeDungeonRoom:1,highestFloorReached:1,
 heroes:ids.map(id=>lib.makeHero({id,activeSkills:['cleaving_strike'],currentHp:1000,currentMana:100,calculatedStats:{...lib.makeHero().calculatedStats,maxHp:1000,maxMana:100,physicalDamage:100,criticalChance:0}})),storedItems:[],forgeMaterials:[]};
globalThis.__testAction=()=>({kind:'skill',skillId:'cleaving_strike',reason:'fixture'});
globalThis.__journeyEnabled=true;
globalThis.__journeyAwards=()=>ids.map(heroId=>({heroId,fixed:'undercity:boss:10',kind:'boss',xp:40,materialId:'metal_scrap',rarity:'common',count:2,
 item:{instanceId:`personal-item:${heroId}`,itemId:'progression_ring',itemLevel:1,powerModelId:'level-bands-v1',rarity:'rare'}}));
const personal=lib.resolveFight(personalState,1,1,'personal-fixture',lib.seededRng(42),undefined,lib.CANONICAL_DUNGEON_XP_REWARD_POLICY);
assert.equal(personal.encounter.transcript.filter(e=>e.type==='reward.personal_first').length,4);
assert.equal(personal.encounter.transcript.filter(e=>e.type==='reward.personal_first_item').length,4);
assert.equal(personal.encounter.rewards.loot.filter(e=>e.source==='personal_first').length,4);
assert.equal(personal.state.storedItems.filter(e=>e.instanceId.startsWith('personal-item:')).length,4);
assert.equal(personal.encounter.transcript.filter(e=>e.type==='reward.personal_first_xp').reduce((s,e)=>s+e.xp,0),160);
globalThis.__journeyAwards=()=>[];
const repeated=lib.resolveFight(personalState,1,1,'personal-fixture',lib.seededRng(42),undefined,lib.CANONICAL_DUNGEON_XP_REWARD_POLICY);
const scrap=r=>r.state.forgeMaterials.filter(m=>m.materialId==='metal_scrap').reduce((s,m)=>s+m.count,0);
assert.equal(scrap(personal)-scrap(repeated),8,'Four material lots really enter inventory');
assert.equal(repeated.encounter.transcript.filter(e=>e.type==='reward.personal_first').length,0);
assert.equal(personal.encounter.rewards.gold,repeated.encounter.rewards.gold,'Normal reward remains once');
globalThis.__journeyEnabled=false;
console.log('Personal rewards in real resolver: four XP awards, four material lots, unchanged normal loot.');
