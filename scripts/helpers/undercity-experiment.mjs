// Harness-only catalogue. Five zones, explicit solo/duo/trio encounters.
const solo=(name,behavior='surge')=>({name,behavior,members:[{name,role:'ordinary'}]});
const pack=(name,names,behavior='swarm')=>({name,behavior,members:names.map(name=>({name,role:'ordinary'}))});
const escort=(name,names)=>({name,behavior:'cover',members:names.map((name,i)=>({name,role:['protector','ranged','support'][i]}))});
export const UNDERCITY_ZONES = [
 {id:'sewers',name:'Égouts infestés',encounters:[
  pack('Meute de rats',['Rat des canaux','Rat affamé','Rat de gouttière']),
  pack('Nuée de scarabées',['Scarabée des déchets','Scarabée des boues','Scarabée de canalisation']),
  solo('Limon des conduits'),solo('Rat colossal','swarm')],
  boss:solo('La Mère des nuisibles')},
 {id:'smugglers',name:'Galeries des contrebandiers',encounters:[
  escort('Escorte des passeurs',['Protecteur des passeurs','Tireur des passeurs','Soigneur des passeurs']),
  pack('Récupérateurs gobelins',['Gobelin ferrailleur','Gobelin guetteur']),
  pack('Dresseur et molosse',['Molosse des tunnels','Dresseur des tunnels'],'cover'),
  solo('Coupe-jarret du tribut','cover')],
  boss:escort('Le Collecteur du tribut',['Garde du tribut','Le Collecteur du tribut','Apothicaire du tribut'])},
 {id:'cisterns',name:'Citernes oubliées',encounters:[
  pack('Colonie de parasites',['Parasite des eaux','Parasite des vannes','Parasite des profondeurs']),
  solo('Limon des réservoirs'),solo('Gardien des refuges'),
  pack('Sangsues des citernes',['Sangsue pâle','Sangsue des grilles'])],
  boss:solo('Le Gardien des eaux mortes')},
 {id:'bastion',name:'Bastion des Exclus',encounters:[
  solo('Sentinelle bannie','cover'),
  pack('Patrouille des exilés',['Veilleur des barricades','Arbalétrier exilé']),
  escort('Défenseurs du bastion',['Porte-bouclier exilé','Frondeur des remparts','Guérisseur des bannis']),
  solo('Colosse des barricades')],
  boss:escort('Le Porte-étendard des Exclus',['Garde des remparts','Le Porte-étendard des Exclus','Guérisseur du bastion'])},
 {id:'court',name:'Cour du Roi des Rats',encounters:[
  escort('Garde des exclus',['Bouclier de la Cour','Arbalétrier de la Cour','Soigneur de la Cour']),
  pack('Vermine de la Cour',['Rat couronné','Rat des festins','Rat des oubliettes']),
  escort('Escorte du chambellan',['Garde du chambellan','Chambellan des profondeurs','Apothicaire de la Cour']),
  solo('Champion de la Cour')],
  boss:{name:'Le Roi des Rats',behavior:'king',members:[
   {name:'Garde des exclus gauche',role:'guard'},{name:'Garde des exclus droite',role:'guard'},{name:'Le Roi des Rats',role:'king'}]}},
];
export const isUndercity=p=>['bestiaryUndercityNames','bestiaryUndercityCombat','bestiaryUndercityGroups','bestiaryUndercityGroupsSingle'].includes(p)||(p??'').startsWith('bestiaryUndercityJourney');
export function undercityLocation(floor){
 if(!Number.isInteger(floor)||floor<1||floor>50)throw Error('Undercity floor must be between 1 and 50');
 const index=Math.floor((floor-1)/10);
 return {region:UNDERCITY_ZONES[index],cycle:0,area:index};
}
export function undercityMonster(monster,floor,entropy,profile){
 const loc=undercityLocation(floor),major=monster.isBoss&&floor%10===0;
 const index=Math.min(loc.region.encounters.length-1,Math.floor(entropy*loc.region.encounters.length));
 const fixedElite=monster.isBoss&&!major&&floor%5===0;
 const fixedNames=['Gardien des conduits','Capitaine des passeurs','Sentinelle des vannes','Gardien des barricades','Heraut du Roi'];
 const entry=major?loc.region.boss:fixedElite?{...loc.region.encounters[0],name:fixedNames[loc.area]}:loc.region.encounters[index];
 const name=entry.name+(monster.isBoss&&!major?' d’élite':'');
 return {monster:{...monster,name,__canonicalName:monster.name,
 ...(profile!=='bestiaryUndercityNames'?{__undercity:{behavior:entry.behavior,members:entry.members,atk:monster.atk,def:monster.def,magicDef:monster.magicDef}}:{})},
 metadata:{region:loc.region.id,speciesRegion:loc.region.id,area:loc.area,cycle:0,
 speciesId:loc.region.id+':'+(major?'boss':fixedElite?'elite':index),role:entry.behavior,rare:false,transition:false,signature:null}};
}
export function undercityRound(monster,round){
 const spec=monster.__undercity;if(!spec)return {monster,phase:null};
 let attack=1,defense=1,phase=spec.behavior;
 switch(spec.behavior){
 case 'swarm':attack=.7+.3*monster.hp/monster.maxHp;break;
 case 'cover':defense=round<=2?1.15:.85;attack=round<=2?.8:1;phase=round<=2?'cover':'exposed';break;
 case 'surge':attack=round%3===0?1.15:.65;phase=round%3===0?'surge':'charging';break;
 case 'king':{const guard=monster.hp>monster.maxHp*.5;defense=guard?1.15:.85;attack=guard?.75:1.1;phase=guard?'king-guard':'king-monster';break;}
 }
 return {monster:{...monster,atk:Math.max(1,Math.round(spec.atk*attack)),def:Math.max(0,Math.round(spec.def*defense)),magicDef:Math.max(0,Math.round(spec.magicDef*defense))},phase};
}
