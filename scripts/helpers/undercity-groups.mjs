// Pure harness-only group state. Canonical encounter rewards stay outside this module.
export const isGroupProfile = p => ['bestiaryUndercityGroups','bestiaryUndercityGroupsSingle'].includes(p)||(p??'').startsWith('bestiaryUndercityJourney');
const alive = group => group.members.filter(m=>m.hp>0);
export { alive as livingEnemies };
export function primaryEnemy(group) { return alive(group).find(m=>m.id===group.selectedId) ?? alive(group)[0] ?? group.members.at(-1); }
export function chooseEnemy(group,estimate){
 const living=alive(group);if(!living.length)return primaryEnemy(group);
 const protectors=living.filter(m=>['protector','guard'].includes(m.__role));
 const pool=protectors.length?protectors:living;
 const target=pool.find(m=>estimate(m)>=m.hp)??pool.find(m=>m.__role==='support')??pool[0];group.selectedId=target.id;return target;
}
function partition(total,count) {
 const n=Math.floor(total),q=Math.floor(n/count);
 return Array.from({length:count},(_,i)=>q+(i<n%count?1:0));
}
export function createEnemyGroup(monster,profile) {
 if(!isGroupProfile(profile)) return null;
 const behavior=monster.__undercity?.behavior;
 const blueprint=monster.__undercity?.members;
 const count=Math.min(monster.maxHp,monster.atk,blueprint?.length??(behavior==='surge'?1:3));
 const hp=partition(monster.maxHp,count),atk=partition(monster.atk,count);
 const names=behavior==='king'?['Garde des exclus gauche','Garde des exclus droite','Le Roi des Rats']:
  behavior==='cover'?['Protecteur des passeurs','Tireur des passeurs','Soutien des passeurs']:Array.from({length:count},(_,i)=>monster.name+' '+(i+1));
 return {profile,original:monster,behavior,members:hp.map((value,i)=>({
  ...monster,id:monster.id+':member:'+i,name:blueprint?.[i].name??names[i],hp:value,maxHp:value,atk:atk[i],
  __undercity:undefined,__base:{atk:atk[i],def:monster.def,magicDef:monster.magicDef},
  __role:blueprint?.[i].role??(behavior==='king'?(i<count-1?'guard':'king'):behavior==='cover'?(i===0?'protector':'ranged'):'ordinary'),
 })),events:[],round:0,healingRemaining:Math.floor(monster.maxHp*.15)};
}
export function prepareEnemyRound(group,round) {
 const eventStart=group.events.length;
 group.round=round;
 const guardAlive=alive(group).some(m=>m.__role==='guard');
 const protectorAlive=alive(group).some(m=>m.__role==='protector');
 for(const m of alive(group)){
  let attack=1,defense=1,phase=group.behavior;
  if(m.__role==='king'){phase=guardAlive?'king-guard':'king-monster';attack=guardAlive?.75:1.1;defense=guardAlive?1.15:.85;}
  else if(group.behavior==='cover'){const covered=protectorAlive||(group.members.length===1&&round<=2);phase=covered?'protected':'exposed';defense=covered?1.15:.85;}
  else if(group.behavior==='surge'){phase=round%3===0?'surge':'charging';attack=round%3===0?1.15:.65;}
  m.atk=Math.max(1,Math.round(m.__base.atk*attack));
  m.def=Math.max(0,Math.round(m.__base.def*defense));
  m.magicDef=Math.max(0,Math.round(m.__base.magicDef*defense));
  group.events.push({type:'enemy.phase',round,enemyId:m.id,enemyName:m.name,phase,attack:m.atk,defense:m.def});
 }
 return group.events.slice(eventStart);
}
export function performEnemySupport(group,member){
 if(member.hp<=0||member.__role!=='support'||group.round%3!==0||group.healingRemaining<=0)return null;
 const target=alive(group).filter(m=>m.hp<m.maxHp).sort((a,b)=>(b.maxHp-b.hp)-(a.maxHp-a.hp)||a.id.localeCompare(b.id))[0];
 if(!target)return null;
 const healing=Math.min(target.maxHp-target.hp,Math.max(1,Math.floor(target.maxHp*.08)),group.healingRemaining);
 target.hp+=healing;group.healingRemaining-=healing;
 const event={type:'enemy.heal',round:group.round,enemyId:member.id,targetId:target.id,healing,hp:target.hp};
 group.events.push(event);return event;
}
export function damageEnemy(group,id,damage){
 if(!Number.isFinite(damage)||damage<0)throw Error('Invalid group damage');
 const target=group.members.find(m=>m.id===id);
 if(!target)throw Error('Unknown enemy target');
 const applied=Math.min(target.hp,damage);
 target.hp=Math.max(0,target.hp-damage);
 if(applied>0)group.events.push({type:'enemy.damage',round:group.round,enemyId:id,damage:applied,hp:target.hp});
 return applied;
}
export function resolveGroupSkill(group,skill,rollDamage){
 const targets=skill.target==='all_enemies'&&group.profile!=='bestiaryUndercityGroupsSingle'?alive(group):[primaryEnemy(group)].filter(m=>m.hp>0);
 const hits=[];
 for(const target of targets){
  for(let hit=1;hit<=(skill.effect.hitCount??1)&&target.hp>0;hit++){
   const result=rollDamage(target,hit);
   const applied=damageEnemy(group,target.id,result.damage);
   hits.push({...result,hit,monsterId:target.id,monsterName:target.name,applied,enemyHp:target.hp,enemyMaxHp:target.maxHp});
  }
 }
 group.events.push({type:'hero.groupSkill',skillId:skill.id,round:group.round,targetMode:skill.target,
  targets:[...new Set(hits.map(h=>h.monsterId))],damage:hits.reduce((s,h)=>s+h.applied,0)});
 return hits;
}
export function summarizeGroup(group){
 return {...group.original,hp:group.members.reduce((s,m)=>s+m.hp,0)};
}
