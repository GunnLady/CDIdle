import assert from 'node:assert/strict';
import {UNDERCITY_ZONES,undercityMonster,undercityRound,undercityLocation} from './helpers/undercity-experiment.mjs';
const base={name:'Canonical boss',hp:100,maxHp:100,atk:100,def:100,magicDef:100,isBoss:false,goldYield:42,xpYield:80,damageType:'physical',resistances:{fire:10}};
const phases=new Set(),species=new Set();
for(let floor=1;floor<=50;floor++)for(let n=0;n<100;n++){
 const original=structuredClone(base);
 const names=undercityMonster(base,floor,n/100,'bestiaryUndercityNames');
 const combat=undercityMonster(base,floor,n/100,'bestiaryUndercityCombat');
 species.add(names.metadata.speciesId);
 for(const key of Object.keys(base).filter(k=>k!=='name'))assert.deepEqual(names.monster[key],base[key]);
 for(let round=1;round<=8;round++){
  const input={...combat.monster,hp:100-round*10};
  const result=undercityRound(input,round);phases.add(result.phase);
  assert.equal(result.monster.hp,input.hp);
  assert.equal(result.monster.maxHp,base.maxHp);
  assert.equal(result.monster.goldYield,base.goldYield);
  assert.equal(result.monster.xpYield,base.xpYield);
  assert.deepEqual(result.monster.resistances,base.resistances);
  assert(result.monster.atk<=115&&result.monster.def<=115);
  assert.deepEqual(undercityRound(result.monster,round),result,'no cumulative multiplier');
 }
 assert.deepEqual(base,original);
}
const king=undercityMonster({...base,isBoss:true},50,.5,'bestiaryUndercityCombat').monster;
assert.equal(king.name,'Le Roi des Rats');
assert.equal(king.__canonicalName,base.name);
assert.equal(undercityRound(king,1).phase,'king-guard');
assert.equal(undercityRound({...king,hp:50},2).phase,'king-monster');
assert.equal(undercityRound({...king,hp:0},3).monster.hp,0,'no resurrection');
assert.deepEqual(undercityRound(base,1),{monster:base,phase:null});
assert.equal(undercityLocation(31).region.id,'bastion');
assert.equal(undercityLocation(41).region.id,'court');
assert.equal(undercityLocation(50).cycle,0);
assert.throws(()=>undercityLocation(51));
assert.throws(()=>undercityLocation(0));
assert.equal(species.size,20);
for(const p of ['swarm','cover','exposed','charging','surge'])assert(phases.has(p));
console.log('Undercity: 5000 floor/entropy cases, 40000 round checks and two king phases passed');

assert.equal(UNDERCITY_ZONES.length,5);
for(const zone of UNDERCITY_ZONES){
 assert(zone.encounters.some(e=>e.members.length===1),'Solo in every zone');
 assert(zone.encounters.some(e=>e.members.length>1),'Group in every zone');
 for(const entry of [...zone.encounters,zone.boss]) for(const name of [entry.name,...entry.members.map(m=>m.name)]) assert(!/[?\ufffd]/.test(name),'Intact UTF-8 catalogue');
}
console.log('Five zones: solo/group mix and valid names passed');
