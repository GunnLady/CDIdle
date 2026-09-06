import assert from 'node:assert/strict';
import { experimentMonster, regionAt, createBestiaryLedger, observeBestiary } from './helpers/bestiary-experiments.mjs';
const base = { id:'fixture', name:'Fixture', hp:160, maxHp:160, atk:10, def:5, magicDef:3, damageType:'ice', resistances:{fire:25,ice:-10}, isBoss:false, xpYield:20, goldYield:5 };
assert.deepEqual(experimentMonster(base,1,1,.5,'idleRhythm').monster,base,'Other loot profiles stay untouched in mixed experiments');
assert.equal(regionAt(10).region.id,'sewers');
assert.equal(regionAt(11).region.id,'roots');
assert.equal(regionAt(50).region.id,'core');
assert.equal(regionAt(51).region.id,'sewers');
assert.equal(regionAt(51).cycle,1);
assert.throws(() => regionAt(0));
const ids = new Set();
let rareCount = 0, transitionCount = 0;
for (let floor=1; floor<=100; floor++) for (let n=0;n<200;n++) {
  const entropy=(n+.5)/200;
  const original=structuredClone(base);
  const control=experimentMonster(base,floor,1,entropy,'baseline');
  assert.deepEqual(control.monster,base);
  const names=experimentMonster(base,floor,1,entropy,'bestiaryRegions');
  const {name, ...a}=names.monster;
  const {name:old, ...b}=base;
  assert.deepEqual(a,b,'Names-only variant must preserve all combat/reward values');
  const roles=experimentMonster(base,floor,1,entropy,'bestiaryRoles');
  const stats=experimentMonster(base,floor,1,entropy,'bestiaryStats').monster;
  const elements=experimentMonster(base,floor,1,entropy,'bestiaryElements').monster;
  assert.equal(stats.damageType,base.damageType);
  assert.deepEqual(stats.resistances,base.resistances);
  for(const key of ['hp','maxHp','atk','def','magicDef']) {
    assert.equal(elements[key],base[key],'Elements preserve canonical stats');
    assert.equal(stats[key],roles.monster[key],'Combined retains stat treatment');
  }
  assert.equal(elements.damageType,roles.monster.damageType);
  assert.deepEqual(elements.resistances,roles.monster.resistances);
  for(const variant of ['bestiaryStats','bestiaryElements']) {
    assert.equal(experimentMonster(base,floor,1,entropy,variant).monster.goldYield,base.goldYield);
    assert.equal(experimentMonster(base,floor,1,entropy,variant).monster.xpYield,base.xpYield);
    if(floor%10===0) assert.deepEqual(experimentMonster({...base,isBoss:true},floor,50,entropy,variant).monster,{...base,isBoss:true});
  }
  const rares=experimentMonster(base,floor,1,entropy,'bestiaryRares');
  assert.deepEqual(roles,experimentMonster(base,floor,1,entropy,'bestiaryRoles'),'determinism');
  assert.deepEqual(base,original,'no input mutation');
  assert.equal(roles.monster.xpYield,base.xpYield);
  assert.equal(roles.monster.goldYield,base.goldYield);
  const {name:rName,...r}=rares.monster;
  const {name:pName,...p}=roles.monster;
  assert.deepEqual(r,p,'Rare must not introduce a combat spike');
  assert(roles.monster.atk <= Math.ceil(base.atk*1.15));
  assert(roles.monster.maxHp <= Math.ceil(base.maxHp*1.15));
  ids.add(names.metadata.speciesId);
  rareCount+=Number(rares.metadata.rare);
  transitionCount+=Number(rares.metadata.transition);
  if (floor%10===0) {
    const boss={...base,isBoss:true};
    assert.deepEqual(experimentMonster(boss,floor,50,entropy,'bestiaryRares').monster,boss);
  }
}
assert(ids.size>=30,'All ordinary species must be reachable');
assert(rareCount>0 && transitionCount>0);
const ledger=createBestiaryLedger();
const event={floor:1,kind:'fight',outcome:'victory',roundCount:3,rewards:{gold:5,loot:[]}};
const meta={speciesId:'rare',role:'common',rare:true,transition:false,signature:'test'};
for(let i=0;i<5;i++) observeBestiary(ledger,event,meta);
assert.equal(ledger.discoveries.rare.knownLoot,true);
assert.equal(ledger.signatureOpportunities.test,5);
assert.equal(ledger.regions['sewers:cycle0'].fights,5);
console.log(JSON.stringify({checks:'passed',floorEntropyCases:20000,species:ids.size,rareCount,transitionCount}));
