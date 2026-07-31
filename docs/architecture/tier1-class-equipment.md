# Recompenses d equipement des classes Tier 1

CDI-068 attribue une arme et un accessoire lors de la vocation Tier 1. Les
objets sont tires dans les pools canoniques de
`src/data/tier1ClassEquipment.ts`. Aucun objet nouveau n est cree.

## Ordre RNG

Une vocation acceptee consomme les rolls dans cet ordre :

1. competences actives et passives selon la classe ;
2. arme de vocation ;
3. accessoire de vocation.

Les deux rolls d equipement sont toujours consommes. Aede et Druide possedent
un pool d arme singleton, mais leur roll d arme reste present afin de conserver
un contrat uniforme entre les neuf classes.

## Pools

| Classe | Armes | Accessoires |
| --- | --- | --- |
| Guerrier | `basic_sword`, `basic_axe`, `basic_mace`, `basic_spear` | `sturdy_travel_belt`, `patched_field_belt`, `knotted_leather_bracelet` |
| Voleur | `basic_dagger`, `basic_saber` | `dusty_travel_cloak`, `ashwood_bracelet`, `cracked_coin_charm` |
| Archer | `basic_shortbow`, `basic_longbow`, `basic_crossbow` | `knotted_leather_bracelet`, `ashwood_bracelet`, `windworn_cloak` |
| Mage | `basic_wand`, `basic_staff`, `basic_spellbook` | `silver_ring`, `copper_focus_ring`, `warm_ember_amulet` |
| Acolyte | `basic_mace`, `basic_staff`, `basic_spellbook` | `silver_ring`, `warm_ember_amulet`, `riverstone_amulet` |
| Aede | `basic_lute` | `silver_ring`, `lucky_charm`, `windworn_cloak` |
| Druide | `basic_staff` | `riverstone_amulet`, `ashwood_bracelet`, `windworn_cloak` |
| Artificier | `basic_gear_cannon`, `basic_rifle`, `basic_crossbow` | `copper_focus_ring`, `warm_ember_amulet`, `cracked_coin_charm` |
| Pugiliste | `basic_knuckles`, `basic_gauntlets`, `basic_bo` | `ashwood_bracelet`, `knotted_leather_bracelet`, `sturdy_travel_belt` |

Tous les objets sont communs et utilisables au niveau 10. Un objet partage
entre plusieurs pools peut etre equipe par l union de ces classes. Toute autre
classe est refusee par le serveur et filtree par l interface.

Les charmes n utilisent pas un pseudo-attribut `luck` distinct de `luk` :
leurs effets portent sur le critique ou l esquive, les sous-statistiques deja
derivees de `luk` par le calcul canonique.

## Attribution et stockage

- Les instances utilisent `item:<heroId>:tier1:weapon` et
  `item:<heroId>:tier1:accessory`.
- L arme et l accessoire sont equipes automatiquement.
- Les objets precedemment equipes dans ces slots retournent au coffre.
- Une arme a deux mains renvoie aussi l objet secondaire au coffre.
- Posseder le meme modele avec un autre `instanceId` ne supprime pas la
  recompense de vocation.
- Une instance de vocation deja presente est reutilisee, jamais dupliquee.
- Le coffre ne possede actuellement aucune capacite maximale ; la vocation ne
  peut donc pas echouer pour cause de coffre plein.

Le replay HTTP ne reexecute pas la vocation. F5 recharge les identifiants et
les choix persistes depuis l etat canonique sans nouveau tirage.
