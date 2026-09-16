# Handoff — CDI-113, chronologie et pilote de contact

Date : 16 septembre 2026.

## Résultat

Le pilote Novice fonctionne dans le vrai `CurrentEncounterPanel` avec le vrai
lecteur automatique à pas de 400 ms. Il conserve l'identité et la garde
`combat_idle` produites par CDI-148 pendant le combat, applique un mouvement de
contact court, puis rend l'attente individuelle au pas suivant. La pose neutre
ne revient qu'au résultat, hors combat.

Le pilote n'ajoute aucun bitmap. Il réutilise les vingt gardes Novice validées
et les déplace par transformation CSS ; les familles avancées et leurs gestes
restent la responsabilité de CDI-118 à CDI-128 puis de la recette CDI-135.

## Chronologie commune

| Phase | Repère | Effet de présentation |
| --- | ---: | --- |
| `prepare` | 0 ms | auteur actif, léger recul |
| `release` | 72 ms | départ du geste |
| `contact` | 160 ms | allonge maximale, réaction, nombre et départ du changement visible de PV |
| `recover` | 248 ms | retrait vers le pivot |
| `idle` | 400 ms | transform d'action neutre, garde individuelle toujours active |

Le pas logique autoritaire reste 400 ms. Aucune commande ni progression ne
dépend d'une animation CSS ou de sa fin.

## Arbitrage et nettoyage

- Un nouveau pas remplace la piste de mouvement de l'acteur ; il ne crée pas de
  file d'actions React.
- Les bulles déjà commencées peuvent chevaucher le pas suivant pendant leur vie
  de 1 000 ms. Elles conservent leur identifiant et leur nœud DOM.
- Deux impacts d'une même cible sont espacés de 600 ms. Trajectoires et bulles
  partagent une borne stricte de 16 éléments.
- Une entrée de replay, un résultat ou un nouvel identifiant de rencontre vide
  immédiatement le flux précédent. Un remplacement ne peut donc plus afficher
  un effet de la rencontre quittée.
- Une valeur de jauge différée survit au pas suivant. Une valeur autoritaire
  appliquée plus récemment empêche un ancien timer de la remplacer.
- Désactiver les animations rend les informations statiques sans modifier la
  projection. Masquer l'onglet suspend le lecteur visuel et le retour visible
  rattrape directement le bon curseur, sans rejouer l'intermédiaire.
- Le démontage annule les timers du flux et des jauges.

## Scénario reproductible

Harness :

`/tests/browser/fixtures/dungeon-harness.html?combat-scene=1&integrated=1&contact-pilot=1&novice-review=1`

La lecture automatique couvre, dans l'ordre : mise en place, contact normal,
esquive, critique létal avec autres survivants, KO d'un héros, puis résultat.
Le lecteur expose seulement `Rejouer` ; aucun pas-à-pas n'est nécessaire.

Le test Playwright vérifie à 1024, 1280 et 1440 px que le premier attaquant :

1. est actif avec un mouvement de contact tout en gardant sa pose
   `combat_idle` et son attente individuelle ;
2. redevient inactif au pas suivant sans passer par la pose neutre ;
3. laisse ensuite le résultat remettre les héros en pose neutre et vider les
   effets temporaires.

## Preuves actualisées

- **V02** — `tests/dungeonCombatScene.test.ts` couvre coup normal, critique,
  esquive, cinq impacts ordonnés et létal sur le bon acteur. Le harness continu
  rejoue normal, esquive, critique et KO dans le lecteur réel.
- **V03** — les tests de projection et de scène conservent l'identifiant, les PV
  et la cible létale exacte lorsqu'un autre ennemi survit ; aucun impact n'est
  reporté sur le survivant.
- **V14** — scène focalisable, résumé accessible, mouvements réduits, mode sans
  animation et fallback historique restent couverts.
- **V18** — verdict utilisateur du 16 septembre 2026 : « Tout est bon le cinéma
  est bien ». La pose de victoire évoquée est explicitement différée et ne
  bloque ni CDI-113 ni CDI-148.

Validations exécutées sur l'arbre courant :

- Vitest ciblé élargi : 7 fichiers, 85 tests passés ;
- Playwright ciblé : 9 scénarios passés, dont le pilote aux trois largeurs ;
- `npm.cmd run typecheck` : passé ;
- `npm.cmd run lint -- --quiet` : passé ;
- `npm.cmd run build` : passé ;
- `npm.cmd run check:bundle` : 254 618 octets gzip JS, plus gros chunk
  118 347 octets ;
- `npm.cmd run check:dungeon-visuals` : passé, 20 gardes Novice, quatre plus
  lourdes à 1 204 652 octets ;
- `npm.cmd run board:validate` : 157 tickets, 0 erreur.

## Limites et suite

- Le pilote prouve la mécanique commune de contact, pas la chorégraphie finale
  des contacts légers, lourds, estocs, armes jumelles ou combos.
- Les projectiles, sorts, soins, soutiens, états, protections et réactions
  spécialisées restent dans leurs tickets de famille.
- La pose de victoire reste une idée différée, tracée dans le handoff CDI-148 ;
  aucun asset ni ticket n'est créé ici.
- Aucun commit, push ou déploiement n'a été effectué par ce handoff.
