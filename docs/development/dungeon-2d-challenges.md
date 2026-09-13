# Épreuves 2D du Donjon — socle et lots par écran

> Révision du plan, 13 septembre 2026 : les accessoires et cette première
> intégration sont conservés. Le [plan de production des actions](dungeon-2d-action-production-plan.md)
> précise les interactions attendues et le découpage par épreuve. Une animation
> d’apparition d’accessoire seule ne valide pas le geste du héros ni l’écran.

Propriétaires après recadrage : CDI-115 pour le piège et le socle ;
CDI-129 énigme, CDI-130 embuscade, CDI-131 rituel, CDI-132 obstacle,
CDI-133 négociation. CDI-134 préserve trésor/repos après les retouches héros.
Les preuves historiques ci-dessous ne valident pas ces nouvelles interactions.

## Périmètre

La scène couvre `trap`, `enigma`, `ambush`, `ritual`, `obstacle` et
`negotiation`. Elle réutilise `CurrentEncounterPanel`, le lecteur canonique et
la composition hors combat de CDI-102. La cible actuelle est le mode PC ; le
cadrage mobile reste différé par décision produit.

`ambush` reste une épreuve : aucun ennemi, tour ou résultat de combat n'est
créé. Une issue `defeat` affiche « Épreuve échouée · progression maintenue » et
ne produit jamais l'overlay de wipe du combat.

## Données et projection

| Information | Source autoritaire | Rendu |
|---|---|---|
| héros choisi | `challenge.hero_selected.heroId` | acteur placé au premier slot et mis en avant seulement lorsque l'événement est visible |
| réussite/échec | `challenge.succeeded` / `challenge.failed` | bulle d'issue distincte du résultat de combat |
| pertes de PV | `heroChanges.hpBefore/hpAfter` | jauges et une bulle exacte par héros |
| perte/récupération de PM | `heroChanges.manaBefore/manaAfter` | jauges et bulles PM bleues |
| or perdu/reçu | `goldLost` / `reward.gold` | bulle autonome, sans lecture du message français |
| ancien record incomplet | résumé du pas projeté | fallback neutre, sans valeur ni héros inventé |

`dungeonChallengeScene.ts` prépare tout le modèle de présentation. React ne
décide ni issue, ni cible, ni montant. Les quatre héros restent présents pour
rendre les conséquences collectives ; le héros sélectionné reçoit le slot de
mise en avant. Les autres conservent une composition en arc autour de
l'accessoire.

## Direction visuelle

Les six accessoires partagent le décor de repos existant, chargé une seule
fois, mais possèdent une silhouette et une arrivée CSS propres : détente du
piège, rotation de l'énigme, oscillation de l'alerte d'embuscade, éveil lumineux
du rituel, choc de l'obstacle et pose de la table de négociation. Les animations
sont ponctuelles, ne pilotent aucune commande et sont supprimées par
`prefers-reduced-motion` ou `animationsEnabled=false`.

Les accessoires RGBA 768 × 512 ont été générés sur chroma puis détourés hors de
la boucle de rendu. Leur provenance, leur prompt, leurs identifiants sources et
leurs poids sont consignés dans
`assets/design/dungeon-2d/dungeon-challenges-kit-v1.prompt.md`.

## Budgets et validation

`check-dungeon-visuals` contrôle l'inventaire exact, les dimensions, un fond
réellement transparent, les coins alpha et le plafond de 2 MiB par scène. Les
scènes mesurées vont de 577 508 octets (`ambush`) à 902 858 octets
(`obstacle`), décor compris.

Les tests du modèle couvrent les six types, le héros choisi, les pertes de PV,
la perte/récupération de PM, l'or et l'absence de faux wipe. Le harness
`integrated=1&challenge=<kind>&outcome=<victory|defeat>` passe par le vrai
`CurrentEncounterPanel`. La suite Playwright comporte les douze branches et le
mode mouvements réduits ; son exécution et la validation artistique restent en
attente de l'autorisation navigateur de l'utilisateur.

Validation technique du 12 septembre 2026 : 1 121 tests Vitest dans 134
fichiers, typage, lint strict, build, budget JS, manifeste visuel et workboard
passent. Le bundle complet mesure 252 080 octets gzip, sous le plafond inchangé
de 250 KiB.
