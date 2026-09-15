# CDI-136 — finalisation des sprites Novice

Date : 15 septembre 2026.

## Décisions utilisateur vérifiées

- La série finale contient dix Novices hommes et dix Novices femmes.
- Les vingt personnages ont été validés individuellement puis en planches.
- Le rendu a été validé dans la pop-up de recrutement avec une échelle visuelle
  augmentée de 15 %.
- Le rendu a été validé dans le harness historique du cinéma sur les zones des
  Égouts, des Contrebandiers, des Citernes, du Bastion et de la Cour.
- Les positions finales demandées dans la scène standard sont : Milo abaissé de
  4 %, Céleste abaissée de 2 % et Abel déplacé de 1 % vers la gauche.
- Pour les Novices déjà enregistrés, l'utilisateur demande une nouvelle
  attribution aléatoire parmi les dix sprites du genre correspondant.

## Sources et exports autoritaires

Les sources finales sur fond chroma sont conservées dans :

- `assets/design/hero-sprites/cdi-136/validated-male-v1/` ;
- `assets/design/hero-sprites/cdi-136/validated-female-v1/`.

Les exports alpha utilisés par l'application sont les vingt PNG individuels de :

- `assets/design/hero-sprites/cdi-136/normalized-alpha-v1/male/` ;
- `assets/design/hero-sprites/cdi-136/normalized-alpha-v1/female/`.

Le script déterministe `scripts/prepare-cdi-136-novice-assets.ps1` produit aussi
les deux planches 5 × 2 et les comparaisons sur fonds clair et sombre. Les
sources validées ne sont jamais modifiées par ce script.

## Mesures des exports

Chaque fichier runtime mesure 341 × 692 px avec un alpha réel. La ligne des
pieds est identique (`y = 673`) pour les vingt sprites. La hauteur visible est
de 623 px pour les hommes et de 596 px pour les femmes. Le contrôle du pipeline
confirme un seul composant visible par fichier, sans faux fond ni résidu chroma
clair détecté.

- poids froid des vingt PNG runtime : 5 259 608 octets (5,016 Mio) ;
- transfert navigateur à froid : 5 265 608 octets, en-têtes compris ;
- transfert au second chargement : 0 octet avec la politique
  `public, max-age=31536000, immutable` des assets hashés ;
- pire groupe de quatre fichiers : 1 181 073 octets ;
- mémoire RGBA théorique : 943 888 octets par sprite, 3 775 552 octets pour
  quatre sprites et 18 877 760 octets si les vingt sont décodés simultanément.

La dernière valeur est une estimation déterministe `largeur × hauteur × 4`, et
non une mesure de mémoire du navigateur. Le budget JavaScript reste respecté :
253 487 octets gzip au total, plus gros chunk à 118 347 octets.

## Intégration

`loadHeroPortraitAsset` charge directement les exports CDI-136 pour la classe
Novice. Ce branchement unique couvre les portraits de recrutement, les écrans
aventuriers, le stockage et le cinéma. Les anciennes planches JPG Novice ont
été retirées du catalogue de planches et ne sont plus émises dans le build.

Le domaine conserve vingt emplacements d'identité pour les classes T1. Les
Novices disposent désormais de dix variantes. Les nouvelles générations tirent
directement un index entre 0 et 9. La migration canonique v6 vers v7 réattribue
chaque Novice existant, candidat d'onboarding ou recrutement en attente à un
index 0–9 pseudo-aléatoire dérivé de son identifiant. Cette attribution est
stable entre les chargements et ne touche pas les héros déjà passés en T1.

## Validation technique

- préparation alpha : 20/20 exports acceptés ;
- tests Vitest ciblés : 45/45 puis 35/35 après retrait des anciennes planches ;
- suite Vitest complète : 1 124/1 124 ;
- Playwright cinéma ciblé : 6/6, dont le chargement CDI-136 via le pipeline de
  production ;
- `npm.cmd run check:dungeon-visuals` : OK, 20 sprites Novice alpha et 400 clés
  héros couvertes ;
- `npm.cmd run typecheck` : OK ;
- `npm.cmd run lint -- --quiet` : OK ;
- `npm.cmd run build` : OK ;
- `npm.cmd run check:bundle` : OK.
- `node scripts/measure-cdi-136-novice-cache.mjs` : OK, 20 ressources à
  froid et à chaud, 0 octet retransféré à chaud.
- `npm.cmd run check:migrations`, `check:secrets` et `check:logs` : OK.

Les tests Vitest et le build ont nécessité une exécution ciblée hors sandbox :
leur première tentative a échoué avant démarrage d'Esbuild avec `spawn EPERM`.
Le script alpha a aussi nécessité une élévation ciblée après un refus d'écriture
sur les exports existants. Ces blocages ne proviennent pas des tests du projet.

## Limites et publication

- Aucune pose d'action propre aux Novices n'est produite par CDI-136.
- Aucun sprite d'une autre classe ou d'un monstre n'est déclaré validé ici.
- La migration des sauvegardes existantes ne prendra effet qu'après publication
  du backend contenant l'état canonique v7. Aucun déploiement n'a été demandé
  ni déclenché pendant cette finalisation.
