# Handoff — CDI-148, poses de combat Novice

Date de préparation : 15 septembre 2026.

## Objectif confirmé

Produire une pose de combat en garde pour chacun des vingt Novices validés :
dix hommes et dix femmes. La pose de combat conserve exactement le personnage
et son équipement visuel. Elle devient l’attente du héros dans le cinéma pendant
un affrontement.

La séquence cible est :

`combat_idle dès combat.start → action → combat_idle → neutral en fin de combat`

CDI-148 ne produit aucune pose d’attaque, de tir, de sort, de soin, de réaction
ou de KO. La compétence `guard_stance` reste une action distincte de la garde
persistante `combat_idle`.

## État vérifié au démarrage

- CDI-136 est terminé et fournit les vingt bases neutres validées.
- CDI-148 est le seul ticket en `Doing`.
- CDI-113 est `Paused` jusqu’à validation et intégration du pilote CDI-148.
- Aucune pose de combat Novice n’est encore générée ou validée.
- Les changements techniques déjà présents pour CDI-113 ne constituent pas une
  validation de la garde.
- Aucun déploiement n’est inclus ni autorisé.

## Sources autoritaires

Sources validées sur fond chroma :

- `assets/design/hero-sprites/cdi-136/validated-male-v1/novice-male-01-v1.png`
  à `novice-male-10-v1.png` ;
- `assets/design/hero-sprites/cdi-136/validated-female-v1/novice-female-01-v1.png`
  à `novice-female-10-v1.png`.

Exports alpha servant au contrôle des dimensions et des pivots :

- `assets/design/hero-sprites/cdi-136/normalized-alpha-v1/male/` ;
- `assets/design/hero-sprites/cdi-136/normalized-alpha-v1/female/`.

Chaque export final CDI-136 mesure 341 × 692 px. La ligne des pieds validée est
`y = 673`. Les sources et exports CDI-136 ne doivent jamais être écrasés.

## Méthode de génération à reprendre

1. Générer un seul personnage à la fois avec la source neutre correspondante
   comme référence stricte d’identité.
2. Commencer par `novice-male-01-v1.png`. Ne lancer aucune série avant le verdict
   utilisateur sur la garde, la silhouette et la lisibilité en scène.
3. Après validation de cette garde, tester son transfert sur
   `novice-female-01-v1.png`. L’image neutre reste la référence d’identité ; la
   garde masculine validée sert uniquement de référence de posture et de cadrage.
4. Faire valider les deux pilotes dans le cinéma avant de produire les dix-huit
   autres variantes.
5. Produire ensuite chaque identité séparément. Présenter chaque résultat et
   attendre son verdict avant le suivant, comme pour CDI-136.
6. Pour une correction locale, renvoyer uniquement le résultat concerné et
   demander de modifier seulement la propriété visée.
7. Conserver un fond chroma vert uniforme pendant la validation. Détourer et
   normaliser uniquement après validation de l’image.

ImageGen accepte au maximum cinq références. CDI-148 n’a besoin que de deux
références par génération : la base neutre de l’identité et la garde pilote
validée. Ne pas ajouter d’autres personnages qui pourraient contaminer le
visage, la tenue ou l’équipement.

## Définition visuelle de la garde pilote

- posture prête au combat mais non agressive, sans coup déjà armé ;
- appuis légèrement élargis, genoux souples, centre de gravité stable ;
- buste et regard orientés vers la menace selon la direction de scène actuelle ;
- mains prêtes sans inventer d’arme, de bouclier ou d’accessoire ;
- visage, carnation, coiffure, tenue, coutures, palette, sacoche, cape ou châle
  strictement identiques à la source neutre ;
- personnage complet, pieds visibles, aucun membre ou accessoire coupé ;
- mêmes proportions, densité de pixels, contours, lumière, échelle et cadrage
  général que la source CDI-136 ;
- aucune aura, cercle au sol, effet magique, texte, décor ou pose d’impact.

La description exacte de la garde reste soumise au verdict visuel utilisateur.
Un rendu techniquement conforme n’autorise pas la série sans ce verdict.

## Prompt pilote proposé

```text
Image 1 is the strict identity reference. Keep exactly the same young adult
Novice: same face, skin tone, eyes, hairstyle, body proportions, clothing,
colors, fabrics, seams, pouch, cloak or shawl, and every visible accessory.

Change only the body pose from neutral standing to a readable combat-ready idle
guard. Use stable slightly wider footing, softly bent knees, balanced weight,
alert torso and ready hands. This is an idle guard, not an attack wind-up and
not an impact pose. Do not add, remove or redesign any weapon, shield, armor,
clothing or accessory.

Keep the full character visible with the same scale, framing, pixel-art style,
pixel density, outlines and lighting as Image 1. Keep the feet on the same
baseline. Solid uniform chroma-green background. No aura, floor circle, magic
effect, text or scenery.
```

À partir du second pilote, ajouter :

```text
Image 2 is only the approved reference for the combat-ready idle posture,
framing and balance. Do not copy its face, body, clothing, colors or accessories.
Identity and equipment must come exclusively from Image 1.
```

## Arborescence prévue

Sources validées, non détourées :

- `assets/design/hero-sprites/cdi-148/validated-male-v1/` ;
- `assets/design/hero-sprites/cdi-148/validated-female-v1/`.

Noms stables :

- `novice-male-01-combat-idle-v1.png` à
  `novice-male-10-combat-idle-v1.png` ;
- `novice-female-01-combat-idle-v1.png` à
  `novice-female-10-combat-idle-v1.png`.

Exports runtime alpha :

- `assets/design/hero-sprites/cdi-148/normalized-alpha-v1/male/` ;
- `assets/design/hero-sprites/cdi-148/normalized-alpha-v1/female/`.

Prévoir un script déterministe distinct, par exemple
`scripts/prepare-cdi-148-novice-combat-assets.ps1`. Il ne modifie jamais les
sources validées et contrôle alpha, franges, composantes isolées, dimensions,
ligne des pieds et pivot.

## Contrat d’intégration

- Ajouter des clés de présentation explicites `neutral` et `combat_idle`.
- Une même classe, un même genre et un même index 0–9 doivent sélectionner la
  même identité dans les deux poses.
- Les écrans de recrutement, catalogue, stockage et hors combat conservent
  `neutral`.
- Le cinéma utilise `combat_idle` pendant l’affrontement.
- Une action remplace temporairement `combat_idle`, puis le héros revient à
  `combat_idle` même s’il n’exécute aucune autre action.
- Une pose d’action absente retombe sur `combat_idle`, jamais sur une autre
  identité. Une ressource de combat absente garde un repli neutre explicite.
- Charger uniquement les identités présentes dans la scène ; mesurer transfert
  froid, cache chaud, mémoire décodée et budget artistique.

## État des pilotes au 16 septembre 2026

- Homme 01 validé visuellement avec une épée courte :
  `assets/design/hero-sprites/cdi-148/validated-male-v1/novice-male-01-combat-idle-v1.png`.
- Femme 01 validée visuellement avec une petite hache de bûcheron :
  `assets/design/hero-sprites/cdi-148/validated-female-v1/novice-female-01-combat-idle-v1.png`.
- La prise à deux mains de la hache du pilote femme est acceptée explicitement par
  l'utilisateur ; l'arme reste classée visuellement comme petite hache à une main.
- Les deux pilotes sont détourés et normalisés par
  `scripts/prepare-cdi-148-novice-combat-assets.ps1` dans
  `assets/design/hero-sprites/cdi-148/normalized-alpha-v1/`.
- Les deux sorties mesurent `341x692`, ont une ligne de pieds à `y=673` et un
  pivot horizontal centré (`170` pour l'homme, `170,5` pour la femme).
- Un second passage produit les six mêmes fichiers, avec des SHA-256 strictement
  identiques. Les aperçus clair et sombre ne montrent aucune composante détachée
  ni zone fuchsia franche.
- Les deux pilotes sont intégrés dans le cinéma avec des clés de pose explicites,
  une garde active dès `combat.start`, un repli neutre par identité et un retour
  à `neutral` au résultat final.
- L'utilisateur a validé visuellement les deux pilotes dans le vrai cinéma le
  16 septembre 2026.

## Série complète validée le 16 septembre 2026

Les vingt poses ont été produites une par une avec le mode intégré ImageGen
`identity-preserve`, chaque base neutre CDI-136 correspondante servant de seule
référence d'identité. L'utilisateur a validé individuellement les vingt images
sur fond chroma avant leur copie dans le projet.

Le prompt commun final est volontairement peu directif : conserver exactement
le même personnage, sa tenue, ses couleurs, son style pixel art, son cadrage en
pied et son fond chroma ; lui donner une garde de combat basique et naturelle
avec l'arme demandée, légèrement hésitante et inexpérimentée, l'arme placée
devant le corps ; ne créer ni bouclier, ni effet, ni texte, ni trou de couleur
chroma dans le personnage. Seuls le type d'arme et sa taille changent : épée
courte, petite hache pratique de bûcheron ou dague à lame plus courte que
l'avant-bras. Une prise à deux mains reste acceptée pour l'épée ou la hache.

La répartition visuelle validée est indépendante de l'équipement métier et du
portrait tiré :

| Identité | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Homme | épée | épée | hache | dague | épée | hache | dague | épée | hache | dague |
| Femme | hache | dague | épée | hache | dague | épée | hache | dague | épée | hache |

Le total est donc de sept épées, sept haches et six dagues. L'homme 02 est
compté selon son rendu réel, qui lit comme une épée malgré une intention de
dague lors de la génération.

Les reprises notables sont tracées :

- femme 02 : suppression de trous fuchsia dans la cape avant validation ;
- homme 07 : nouvelle génération avec la main libre rapprochée du torse, afin
  de respecter le cadre sans réduction d'échelle ;
- femme 08 : deux variantes de garde rejetées, puis nouvelle génération depuis
  la base neutre avec une consigne simplifiée ;
- femme 09 : première épée trop longue et garde trop assurée rejetées, puis
  nouvelle génération depuis la base neutre.

Les sources validées sont conservées sous :

- `assets/design/hero-sprites/cdi-148/validated-male-v1/` ;
- `assets/design/hero-sprites/cdi-148/validated-female-v1/`.

Les vingt exports alpha et leurs quarante aperçus clair/sombre sont produits
par `scripts/prepare-cdi-148-novice-combat-assets.ps1`. Chaque export mesure
341 × 692 px, reste centré, possède un seul composant visible et partage la
ligne de pieds `y = 673` de sa référence neutre. Le vérificateur refuse les
coins opaques, les résidus chroma clairs, les dimensions inattendues et les
dépassements du cadre.

## Mesures et validations techniques finales

Mesures du build de production, obtenues avec
`node scripts/measure-cdi-136-novice-cache.mjs --combat-idle` :

- poids des vingt PNG runtime : 5 274 533 octets ;
- transfert navigateur à froid : 5 280 533 octets, en-têtes compris ;
- transfert au second chargement : 0 octet avec la politique
  `public, max-age=31536000, immutable` ;
- pire groupe de quatre poses : 1 204 652 octets, sous le budget artistique de
  2 Mio par scène ;
- mémoire RGBA théorique : 943 888 octets par sprite, 3 775 552 octets pour
  quatre héros et 18 877 760 octets pour les vingt sprites.

Le chargement reste paresseux au niveau réseau : le catalogue contient les URL
des vingt poses, mais `DungeonCombatScene` ne monte que les acteurs présents.
Le cache asynchrone reste borné à seize entrées et déduplique les chargements
concurrents ; le cache HTTP évite tout nouveau transfert au rechargement.

Validations exécutées après intégration de la série :

- `npm.cmd run check:dungeon-visuals` : succès, vingt poses CDI-148 vérifiées ;
- quatre suites Vitest ciblées : 65 tests réussis ;
- `npm.cmd run typecheck` : succès ;
- `npm.cmd run lint -- --quiet` : succès ;
- test Playwright ciblé du vrai lecteur : 7 tests réussis ;
- `npm.cmd run build` : succès ;
- `npm.cmd run check:bundle` : succès, 254 546 octets JS gzip au total et
  plus gros chunk à 118 347 octets.

L'utilisateur a validé les vingt sprites individuellement, puis la composition
représentative du cinéma avec la série complète le 16 septembre 2026 : gardes,
échelles, pieds, placements et transitions sont acceptés. Aucun commit, push ou
déploiement n'a été effectué.

## Sujet différé — pose de victoire

Une pose de victoire pourrait enrichir le résultat positif du cinéma, mais elle
ne bloque pas CDI-148 et reste hors de son périmètre. Sa reprise devra définir
une clé de présentation explicite `victory`, son déclenchement uniquement sur
un résultat victorieux et son repli sans casser `combat_idle` ou `neutral`.
Elle dépend de la convention d'identité et de pose stabilisée par CDI-148. La
clôture de ce futur sujet exigera une couverture d'identités explicitement
choisie, une validation visuelle dans le cinéma, les mêmes contrôles de pivot,
alpha, chargement et budget, ainsi que l'absence d'effet sur le résultat métier.

## État des validations

1. [x] Verdict utilisateur sur le pilote homme.
2. [x] Verdict utilisateur sur le pilote femme.
3. [x] Validation des deux pilotes dans les écrans historiques du cinéma.
4. [x] Validation individuelle des dix-huit autres gardes.
5. [x] Détourage, normalisation et comparaisons clair/sombre des vingt poses.
6. [x] Intégration dans le vrai lecteur avec la séquence
   neutral/combat/action.
7. [x] Validation visuelle utilisateur du cinéma sur une composition
   représentative avec la série complète.
8. [x] Ticket enrichi, Workboard validé à 157 tickets sans erreur, puis CDI-148
   déplacé de `Doing` vers `Done` ; les contrôles techniques ciblés,
   `check:dungeon-visuals`, typecheck, lint, build et bundle sont réussis.

Les tests complets et la documentation de livraison viennent après la validation
visuelle. Un alpha cassé ou un fichier invalide reste contrôlé immédiatement.

## Critères d’arrêt et de reprise

- Ne pas poursuivre la série si le visage, l’équipement ou les proportions
  dérivent sur un pilote.
- Ne pas accepter une garde qui ressemble à une attaque déjà engagée.
- Ne pas intégrer avant validation des deux pilotes dans le cinéma.
- Si une image nécessite plus d’une correction locale, repartir de la base
  neutre autoritaire plutôt que d’accumuler les dérives.
- À la reprise, commencer par le pilote `novice-male-01-v1.png` et présenter le
  résultat à l’utilisateur avant toute autre génération.
