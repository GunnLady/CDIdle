// Harness-only Rat King catalogue, thematic loot and crafting experiment.
export const RAT_KING_MARK_ID='rat_king_mark';
export const RAT_KING_SIGNATURE_IDS=['rat_king_fang','outcasts_mantle','tribute_chain'];
export const RAT_KING_PARAMETERS={
 directDropChance:.15,blueprintChance:.20,legendaryDirectChance:4/23,legendaryCraftChance:.04,marksPerVictory:[1,2],
 recipeCosts:[
  {materialId:RAT_KING_MARK_ID,rarity:'epic',count:6},
  {materialId:'metal_scrap',rarity:'common',count:18},
  {materialId:'refined_metal',rarity:'uncommon',count:3},
 ],
};

const base={rarity:'epic',minimumRarity:'epic',requiredLevel:35,levelRange:{min:35,max:35},
 powerModelId:'legacy-fixed-v1',powerReferenceLevel:35,catalogStatus:'active',provenances:['forge'],
 blueprintAvailable:true,blueprintDiscovery:{kind:'random-drop',sources:['boss'],floorMin:50,floorMax:50,weight:1,bossIds:['undercity:boss:50']}};
export const RAT_KING_SIGNATURE_ITEMS=[
 {...base,id:'rat_king_fang',name:'Croc du Roi',itemType:'weapon',weaponTypeId:'dagger',
  description:'M\u00eame arrach\u00e9 \u00e0 sa m\u00e2choire, le croc cherche encore la gorge des vivants.',
  scaling:{category:'finesse',stat:'agi'},attackProfile:{baseStrikes:1,powerPerStrike:1,maxStrikes:3},
  damageRange:{min:30,max:55},attackSpeed:1.35,damageTypes:['physical'],
  modifiers:[{stat:'physicalDamage',type:'percent',value:16},{stat:'criticalChance',type:'flat',value:3.75},{stat:'speed',type:'percent',value:8},{stat:'holyResistance',type:'flat',value:-3.75}]},
 {...base,id:'outcasts_mantle',name:'Manteau des Exclus',itemType:'armor',armorTypeId:'leather_armor',
  description:'Chaque pi\u00e8ce de cuir porte la marque des Exclus auxquels le Roi avait offert refuge.',
  modifiers:[{stat:'physicalDefense',type:'percent',value:40},{stat:'magicDefense',type:'percent',value:24},{stat:'maxHp',type:'percent',value:18},{stat:'fireResistance',type:'flat',value:-3.75}]},
 {...base,id:'tribute_chain',name:'Cha\u00eene des tributs',itemType:'accessory',accessoryTypeId:'amulet',
  description:'Chaque maillon avait achet\u00e9 le droit de traverser son royaume.',
  modifiers:[{stat:'maxHp',type:'percent',value:20},{stat:'speed',type:'percent',value:8},{stat:'dodgeChance',type:'flat',value:2.5},{stat:'poisonResistance',type:'flat',value:7.5},{stat:'maxMana',type:'percent',value:-4}]},
];

export const SIGNATURE_FINAL_MODIFIERS={epic:{
 rat_king_fang:[{stat:'physicalDamage',type:'percent',value:40},{stat:'criticalChance',type:'flat',value:15},{stat:'speed',type:'percent',value:20},{stat:'holyResistance',type:'flat',value:-15}],
 outcasts_mantle:[{stat:'physicalDefense',type:'percent',value:100},{stat:'magicDefense',type:'percent',value:60},{stat:'maxHp',type:'percent',value:45},{stat:'fireResistance',type:'flat',value:-15}],
 tribute_chain:[{stat:'maxHp',type:'percent',value:50},{stat:'speed',type:'percent',value:20},{stat:'dodgeChance',type:'flat',value:10},{stat:'poisonResistance',type:'flat',value:30},{stat:'maxMana',type:'percent',value:-10}],
},legendary:{
 rat_king_fang:[{stat:'physicalDamage',type:'percent',value:55},{stat:'criticalChance',type:'flat',value:22},{stat:'speed',type:'percent',value:30}],
 outcasts_mantle:[{stat:'physicalDefense',type:'percent',value:260},{stat:'magicDefense',type:'percent',value:160},{stat:'maxHp',type:'percent',value:110}],
 tribute_chain:[{stat:'maxHp',type:'percent',value:70},{stat:'speed',type:'percent',value:28},{stat:'dodgeChance',type:'flat',value:16},{stat:'poisonResistance',type:'flat',value:46}],
}};

export function patchSignatureCatalog(source){
 const anchor='export const ITEMS_BY_ID: Record<string, ItemInfo> = Object.fromEntries(';
 if(source.split(anchor).length!==2)throw Error('Signature catalogue anchor changed');
 return source.replace(anchor,`ITEM_LIBRARY.push(...${JSON.stringify(RAT_KING_SIGNATURE_ITEMS)} as ItemInfo[]);\n\n${anchor}`);
}
export function makeSignatureInstance(itemId,rarity,instanceId){
 if(!RAT_KING_SIGNATURE_IDS.includes(itemId)||!['epic','legendary'].includes(rarity))throw Error('Invalid Rat King signature');
 return {instanceId,itemId,itemLevel:35,powerModelId:'legacy-fixed-v1',rarity,modifiers:structuredClone(SIGNATURE_FINAL_MODIFIERS[rarity][itemId])};
}

const mix=(seed,value,salt)=>{let x=(seed^Math.imul(value+1,0x9e3779b1)^salt)>>>0;x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);return (x^(x>>>16))>>>0;};
const roll=(seed,value,salt)=>mix(seed,value,salt)/0x100000000;
const addMaterial=(state,materialId,rarity,count)=>{const stack=state.forgeMaterials.find(m=>m.materialId===materialId);if(stack)stack.count+=count;else state.forgeMaterials.push({materialId,rarity,count});};
const addEvent=(encounter,event)=>encounter.transcript.push({sequence:encounter.transcript.length,category:'loot',...event});
const isKingVictory=e=>e.outcome==='victory'&&e.kind==='fight'&&e.floor===50&&e.enemy?.isBoss;

export const ZONE_LOOT_THEMES=[
 {id:'sewers',modifiers:[
  {stat:'maxHp',type:'percent',value:5},{stat:'physicalDefense',type:'percent',value:8},
  {stat:'poisonResistance',type:'flat',value:8},{stat:'dodgeChance',type:'flat',value:2},
 ]},
 {id:'smugglers',modifiers:[
  {stat:'speed',type:'percent',value:5},{stat:'criticalChance',type:'flat',value:2},
  {stat:'dodgeChance',type:'flat',value:2},{stat:'physicalDamage',type:'percent',value:8,requiresDamageType:'physical'},
 ]},
 {id:'cisterns',modifiers:[
  {stat:'maxHp',type:'percent',value:5},{stat:'physicalDefense',type:'percent',value:8},
  {stat:'waterResistance',type:'flat',value:8},{stat:'poisonResistance',type:'flat',value:8},
 ]},
 {id:'bastion',modifiers:[
  {stat:'physicalDefense',type:'percent',value:8},{stat:'magicDefense',type:'percent',value:8},
  {stat:'darkResistance',type:'flat',value:8},{stat:'maxHp',type:'percent',value:5},
 ]},
 {id:'court',modifiers:[
  {stat:'criticalChance',type:'flat',value:2},{stat:'speed',type:'percent',value:5},
  {stat:'physicalDamage',type:'percent',value:8,requiresDamageType:'physical'},
  {stat:'magicDamage',type:'percent',value:8,requiresDamageType:'magic'},
  {stat:'maxMana',type:'percent',value:5},
 ]},
];
const themeHash=value=>{let hash=2166136261;for(const char of value){hash^=char.codePointAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;};
const compatibleThemeModifiers=(theme,item)=>{
 const damageTypes=item.itemType==='weapon'?(item.damageTypes??[]):[];
 return theme.modifiers.filter(modifier=>!modifier.requiresDamageType||damageTypes.includes(modifier.requiresDamageType));
};
export function applyThemedLoot(lib,state,encounter){
 if(encounter.outcome!=='victory'||encounter.floor<1||encounter.floor>50)return 0;
 const theme=ZONE_LOOT_THEMES[Math.floor((encounter.floor-1)/10)];let changed=0;
 for(const reward of encounter.rewards.loot){
  if(reward.type!=='item'||String(reward.instanceId).startsWith('personal-item:')||RAT_KING_SIGNATURE_IDS.includes(reward.itemId))continue;
  const stored=state.storedItems.find(i=>i.instanceId===reward.instanceId);const model=stored&&lib.getItemById(stored.itemId);
  if(!stored||!model)continue;
  const resolved=lib.resolveItemInstance(model,stored);
  const pool=compatibleThemeModifiers(theme,model);
  const selected=pool[themeHash(`${theme.id}:${stored.instanceId}`)%pool.length];
  const {requiresDamageType:_,...themedModifier}=selected;
  const modifiers=[...(resolved.modifiers??[]).map(m=>({...m})),themedModifier];
  stored.modifiers=modifiers;reward.modifiers=structuredClone(modifiers);reward.theme=theme.id;changed++;
  reward.themeModifier=structuredClone(themedModifier);
 }
 return changed;
}

export function applyRatKingLoot(state,encounter,{seed,exploration,metrics,forced={}}){
 if(!isKingVictory(encounter))return state;
 metrics.kingVictories=(metrics.kingVictories??0)+1;
 const markRoll=forced.markRoll??roll(seed,exploration,0x4d41524b);
 const markCount=RAT_KING_PARAMETERS.marksPerVictory[0]+Math.floor(markRoll*(RAT_KING_PARAMETERS.marksPerVictory[1]-RAT_KING_PARAMETERS.marksPerVictory[0]+1));
 addMaterial(state,RAT_KING_MARK_ID,'epic',markCount);
 encounter.rewards.loot.push({type:'material',materialId:RAT_KING_MARK_ID,rarity:'epic',count:markCount,name:'Marque du Roi'});
 addEvent(encounter,{type:'reward.rat_king_mark',message:'Marque du Roi',materialId:RAT_KING_MARK_ID,rarity:'epic',count:markCount});metrics.marksEarned+=markCount;
 const known=new Set((state.itemBlueprints??[]).filter(p=>p.unlocked).map(p=>p.itemId));
 const missing=RAT_KING_SIGNATURE_IDS.filter(id=>!known.has(id));
 if(missing.length&&(forced.blueprintRoll??roll(seed,exploration,0x504c414e))<RAT_KING_PARAMETERS.blueprintChance){
  const choiceRoll=forced.blueprintChoiceRoll??roll(seed,exploration,0x43484f49);
  const itemId=missing[Math.min(missing.length-1,Math.floor(choiceRoll*missing.length))];
  state.itemBlueprints=[...(state.itemBlueprints??[]).filter(p=>p.itemId!==itemId),{itemId,unlocked:true}];
  metrics.blueprints++;addEvent(encounter,{type:'reward.rat_king_blueprint',message:'Blueprint signature du Roi',itemId});
 }
 if((forced.signatureRoll??roll(seed,exploration,0x44524f50))<RAT_KING_PARAMETERS.directDropChance){
  const choiceRoll=forced.signatureChoiceRoll??roll(seed,exploration,0x4954454d);
  const itemId=RAT_KING_SIGNATURE_IDS[Math.min(2,Math.floor(choiceRoll*3))];
  const rarity=(forced.legendaryRoll??roll(seed,exploration,0x52415245))<RAT_KING_PARAMETERS.legendaryDirectChance?'legendary':'epic';
  const item=makeSignatureInstance(itemId,rarity,`rat-king-drop:${seed}:${exploration}`);
  state.storedItems.push(item);encounter.rewards.loot.push({type:'item',...item,count:1,source:'rat_king_signature'});
  metrics.directDrops++;metrics[rarity]++;
  addEvent(encounter,{type:'reward.rat_king_signature',message:'Signature du Roi',itemId,instanceId:item.instanceId,rarity});
 }
 return state;
}

const countMaterial=(state,id)=>state.forgeMaterials.find(m=>m.materialId===id)?.count??0;
export function craftRatKingSignature(state,itemId,{seed=0,craftIndex=0,forcedLegendary}={}){
 if(!RAT_KING_SIGNATURE_IDS.includes(itemId))throw Error('Unknown Rat King recipe');
 if(!(state.itemBlueprints??[]).some(p=>p.itemId===itemId&&p.unlocked))return {state,crafted:null,reason:'blueprint'};
 if((state.buildings?.forge??0)<7)return {state,crafted:null,reason:'forge'};
 if(RAT_KING_PARAMETERS.recipeCosts.some(c=>countMaterial(state,c.materialId)<c.count))return {state,crafted:null,reason:'materials'};
 for(const cost of RAT_KING_PARAMETERS.recipeCosts){
  const stack=state.forgeMaterials.find(m=>m.materialId===cost.materialId);stack.count-=cost.count;
 }
 state.forgeMaterials=state.forgeMaterials.filter(m=>m.count>0);
 const rarity=(forcedLegendary??(roll(seed,craftIndex,0x43524146)<RAT_KING_PARAMETERS.legendaryCraftChance))?'legendary':'epic';
 const crafted=makeSignatureInstance(itemId,rarity,`rat-king-craft:${seed}:${craftIndex}`);
 state.storedItems.push(crafted);
 return {state,crafted,costs:structuredClone(RAT_KING_PARAMETERS.recipeCosts)};
}
