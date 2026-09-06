# Handoff — loot, forge et reprise CLI — 5 septembre 2026

> DERNIÈRE DÉCISION UTILISATEUR, 6 septembre : toutes les directions et cibles
> arbitraires sont abandonnées, y compris forge 1–2, hausse obligatoire des
> crafts, durée et ralentissement imposés. Les « décisions à conserver » et
> jugements d'excès plus bas sont historiques et remplacés par
> [les essais de rythme idle v4](loot-idle-rhythm-v4.md).
> Les résultats numériques v1–v3 restent des observations, pas des verdicts produit.

Ce fichier est un contexte de reprise, pas une spécification métier validée.
Lire d'abord `AGENTS.md`, puis ce document. Ne pas refaire toute la découverte
du projet, ni redemander les décisions déjà prises ci-dessous.

## Reprise suivante — état actualisé

Correction utilisateur du 6 septembre : **la cible loot 1–3 est abandonnée**.
Elle est remplacée par une boucle idle : récompenses régulières, recyclage,
tentatives de forge finançables et recherche de procs. Aucun nouveau quota
par passage n'est validé. Le [plan idle-flow-v2](loot-idle-flow-v2.md) décrit
la campagne suivante et la discussion sur la durée ; il prime sur le v1.

**V2 terminé le 6 septembre à 10:39:55 : 400/400 campagnes auditées.** Un
incident de lecture Windows/esbuild a arrêté le lot initial à 195 runs ;
la reprise vérifiée a réutilisé ces 195 checkpoints et complété les 205
manquants. Le lanceur compile désormais tous les profils avant les longs
calculs et attend les autres workers si l'un échoue. Cause Windows exacte
non établie ; ne pas présenter le système comme réparé.
Loot régulier : 6,90 h simulées, 398,69 crafts ; avec préservation : 6,72 h,
569,95 crafts. Le ralentissement entre niveaux reste visible pour 100/100
seeds ; la forge fournit encore trop d'améliorations. Voir la
[suite budget/procs v3](loot-idle-budget-v3.md) : **20/20 pilotes longs
terminés et audités à 10:42:35**, témoins reproduits exactement. Le manque
de scraps est confirmé. La variante de procs rares donne 66 essais et 1,75
amélioration équipée en moyenne en 36–40, mais les quatre valeurs sont
0/2/3/2 et le milieu de progression reste trop généreux. Aucune validation
globale d'équilibrage. Tous les processus des deux lots sont terminés.

Les variantes idle et la télémétrie ont été adaptées dans les scripts seulement.
Tests déterministes réussis, 14 pilotes longs arrivés à quatre héros ≥ 40.
Les pilotes montrent un excès d'améliorations de forge ; équilibrage non validé.

La campagne `idle-study-v1` (100 seeds × sept profils, dix workers) est
**terminée et auditée au 6 septembre 2026 : 700/700 groupes de quatre héros
≥ 40**, aucun écart d'or ou de matériaux, aucun doublon d'équipement forgé.
Les processus du lot sont terminés. Ne pas relancer le même identifiant : ses
sorties sont conservées et protégées contre l'écrasement.
Le [rapport actuel](loot-idle-experiments.md) contient méthodes, résultats et
limites ; il prime sur les mentions historiques « variantes à implémenter »
et « aucun harness en cours » ci-dessous.

`node scripts/audit-loot-idle-results.mjs` a réussi sur les rapports complets.
`analysis.json` contient le détail des comptes, dénominateurs et durées appariées.
Loot v1, mesure historique sans critère de réussite : environ 1,93 objet par
passage complet, 89–90 % dans l'ancienne plage 1–3. Forge :
moyennes de 2,78 à 14,25 améliorations par tranche au lieu de 1–2 ; tentatives
tardives encore en baisse. La combinaison accélère en moyenne de 14,61 %
(comparaison appariée). Les prochains ajustements et critères restent ouverts
dans le rapport actuel : ne pas présenter l'équilibrage comme validé.

## Situation immédiate

- Workspace : `D:\codex\CDIdle`, PowerShell, branche `main`.
- HEAD lors de la sauvegarde : `e3f88b0de6bcf9625fff096ffdf575d3523f87b7`.
- Le lot `idle-rhythm-v4` est terminé et audité : 400/400 campagnes. Le
  comportement loot commun aux trois profils idle est intégré dans le domaine
  partagé ; probabilités de forge, recyclage renforcé et préservation restent
  expérimentaux.
- Le lot post-intégration `canonical-idle-loot-v1` est terminé et audité :
  100/100 campagnes, 5,37 objets par passage et 6,01 minutes de plus long creux
  moyen. Politique `idle-source-flow-v1`, hash
  `b22b91d8c176e2e612de320e4daacc16a6de618c48c1f88d63062babfa166f04`.
  Suite Vitest complète, typecheck, lint ciblé et build passés.
- Aucun contrat, état persisté, frontend ou migration n'est modifié par le loot.
  Pas d'autorisation actuelle de commit/push/déploiement/navigation navigateur.

## Décisions utilisateur à conserver

1. **Rendu idle sans quotas arbitraires** : observer la régularité, les creux,
   les gains et la progression. Les anciennes cibles loot 1–3, forge 1–2,
   hausse obligatoire des crafts et durée imposée sont retirées.
2. **Loot retenu** : un coffre ou une salle finale fournit un objet si aucune
   ligne d'objet n'a réussi ; les combats ordinaires ont 5–12 % selon la tranche
   du héros le moins avancé. Aucun compteur ou plafond par passage.
3. Les probabilités de forge, le recyclage renforcé et la préservation ne sont
   pas validés par le portage loot et doivent rester des sujets séparés.
4. La durée jusqu'au niveau 40 est une mesure d'effet, pas un critère de succès.
5. Le ressenti en session et hors ligne reste une validation produit distincte
   du harness ; aucun résultat de simulation ne doit être présenté comme sa preuve.
6. Simulation proche du jeu réel : domaine autoritaire, RNG déterministe,
   équipes générées variées et bien gérées. 100 seeds distinctes par variante,
   appariées entre variantes, 10 workers (10 seeds chacun).
7. Préserver l'intégration du legacy existante. Les nouvelles tentatives de
   forge utilisent les 48 familles actives ; ne pas réintroduire les recettes
   legacy dans une sonde censée mesurer les recettes actuellement craftables.

## Recherche déjà faite : à traduire en expériences

Les sources servent à proposer des mécanismes, pas à importer des taux
d'équilibrage prétendument universels. Ne pas ajouter d'office de nouveaux
systèmes de maîtrise au jeu.

- Melvor : préservation/efficacité des ressources, donc davantage de tentatives
  pour un budget donné.
  https://wiki.melvoridle.com/w/Preservation_Chance
- Shop Titans : progression de qualité et recherche de procs.
  https://playshoptitans.com/blueprints/weapons/ws/cleaver
- Tap Titans 2 : refaire une base ciblée pour rechercher de meilleurs bonus.
  https://gamehive.com/blog/devupdate-113-remake-the-unrepeatable/
- IdleMMO : accès aux recettes utiles via la progression/donjons.
  https://wiki.idle-mmo.com/items/equipment

Les leviers ont été implémentés et testés dans le v1. Le v2 retire la base
loot à environ deux objets par passage et réévalue les leviers séparément.
Les profils historiques `loot10`, `loot15`, `lootOnly` n'en sont pas des
substituts. Les taux expérimentaux sont des hypothèses locales.

## Blocage technique : contournement vérifié

Les commandes sandbox normales échouent avant le shell :
`helper_unknown_error: setup refresh had errors`.

Le journal local `C:\Users\mathr\.codex\.sandbox\sandbox.2026-09-05.log`
montre un échec `SetNamedSecurityInfoW`, code Windows 5, lors de l'application
des ACL de protection sur les seuls dossiers `.git` et `.codex` du dépôt.
L'origine complète du refus de droits n'a pas été établie.

Les commandes avec `sandbox_permissions: require_escalated` fonctionnent
à nouveau dans cette session, y compris Node, esbuild, sous-processus et Git
en lecture. Ne pas annoncer une réparation du sandbox normal. Aucune ACL,
aucune protection et aucun mode de sandbox n'ont été changés. Ne pas les
désactiver pour contourner le problème.

Node vérifié : `C:\Program Files\nodejs\node.exe`, v24.18.0.
Des demandes d'élévation avaient expiré auparavant ; cette indisponibilité
historique n'est plus le dernier état vérifié. Le fallback Node REPL avait
aussi échoué au démarrage : ne pas y boucler.

Pour les éditions, le helper natif apply_patch était bloqué par le même setup.
Le moteur apply_patch fourni avec Codex a fonctionné via une élévation ciblée :
`C:\Users\mathr\AppData\Roaming\npm\node_modules\@openai\codex\node_modules\@openai\codex-win32-x64\vendor\x86_64-pc-windows-msvc\bin\codex.exe`
avec `--codex-run-as-apply-patch` et le patch passé comme argument.
Vérifier le chemin après toute mise à jour. Utiliser apply_patch, pas une
réécriture shell des fichiers.

Voir [incident et limites](codex-elevation.md#incident-du-sandbox-windows--exécution-du-harness).
Le skill openai-docs a guidé le dépannage et la consultation officielle, sans
changement global de configuration.

## Fichiers et fonctionnement utiles

- [Harness loot](../../scripts/run-loot-economy-harness.mjs) :
  bundle esbuild du vrai moteur avec remplacements vérifiés en mémoire.
  N'écrit pas dans le domaine de production et ne touche pas aux sauvegardes.
- [Politique ville](../../scripts/helpers/loot-town-policy.mjs) :
  mode progressive, vrai onboarding à deux héros, achats et recrutement payés,
  prérequis réels, production et allocation réelles. Politique de dépenses
  expérimentale explicite, pas simulation exhaustive de toutes les dépenses.
  Réserve pour la première Forge avant recrutement des héros 3 et 4.
- [Tests ciblés](../../scripts/test-loot-town-policy.mjs).
- [Rapport existant](loot-economy-harness.md) : premières mesures et objectifs
  actualisés en fin de document. Les anciennes conclusions sur les surplus
  ne remplacent pas les objectifs récents.
- `tests/helpers/heroXpTier1Campaign.ts` : combat, XP, récupération, passage
  T1 et optimiseur d'équipement réels.
- `tests/helpers/forgeProgressionCandidate.ts` : pilote de forge existant.
- `shared/domain/forge-economy.ts`, `shared/domain/items/items.ts`,
  `supabase/functions/game-api/forge-authority.ts` : règles métier.

Les profils prepared commencent avec quatre héros et des bâtiments gratuits :
utiles pour comparaison contrôlée, insuffisants pour conclure sur l'économie
complète de ville. Le mode progressive paie ces coûts mais atteint parfois
l'étage 8 avec seulement deux ou trois héros ; ne pas présenter ces groupes
comme quatre héros dès le départ.

Les résultats sont dans `test-results/loot-economy/<stage>/<profils>[-city]/`.
Ils sont locaux/ignorés, non commités. Une même combinaison réécrit ses sorties :
archiver ou distinguer les nouvelles expériences avant relance.
Les workers écrivent leurs résultats à leur fin : un dossier partiel n'est
pas une campagne validée.

## Défauts et adaptations restant à traiter AVANT les nouveaux gros lots

- Le choix de recette évalue actuellement un objet **rare** au niveau médian
  de la tranche. Il peut abandonner alors qu'un épique/légendaire accessible
  serait utile. Adapter le pilote aux procs réellement possibles et à leur
  coût ; ne pas garantir ou inventer un proc pour faciliter la simulation.
- Le harness remplace en mémoire le plafond de 8 crafts/tranche par 32 et
  retire l'arrêt après une amélioration. Cela ne suffit pas à modéliser la
  croissance des tentatives souhaitée. Mesurer si plafond/cooldown limitent
  artificiellement le joueur.
- `usefulCrafts` inclut une utilité projetée ; `equippedCrafts` ne couvre que
  l'équipement immédiat. Tracer les objets forgés réellement équipés, y compris
  plus tard, sans compter deux fois le même objet transféré.
- Mesurer loot par étage/passage, repeats, temps sans loot, crafts et améliorations
  par tranche de cinq niveaux de héros. Expliciter le dénominateur et ne pas
  mélanger étage et niveau de héros.
- Garder les comptes d'or et matériaux : coûts initiaux, acceptations/refus de
  procs, recyclage, dépenses ville/Forge. Vérifier l'absence de boucle gratuite
  craft/recyclage si préservation expérimentale.
- Le sondage de plans doit filtrer :
  `catalogStatus === 'active'`, `powerModelId === 'level-bands-v1'`,
  `blueprintAvailable`, provenance `forge`. Exactement 48 familles.
  Le filtre corrigé porte le marqueur `active-level-bands-v2`.
- Les anciennes sondes incluant le legacy sont INVALIDES pour conclure à un
  manque de plans. La précédente affirmation « 85/100 groupes manquent de plans
  niveau 30 » a été retirée : ne pas la reprendre.
- Une campagne longue réussie exige quatre héros niveau >= 40.
  Le bilan et la raison d'arrêt incomplet ont été corrigés, mais vérifier aussi
  que les futures variantes ne quittent pas prématurément la boucle moteur.

## Résultats disponibles : ne pas les confondre

Historique conservé dans les artefacts et les échanges, pas recalculé pour
rédiger ce handoff :

- 700 premières campagnes : 400 courtes, 300 longues ; rapports documentés.
  Dossiers early/baseline-steady-generous-balanced,
  full/baseline-balanced et full/lootOnly.
- 300 comparaisons longues supplémentaires :
  `full/loot10-loot15-lootOnly`, 100 seeds par taux.
  Les mesures loot/stock/durée restent utilisables ; les anciennes
  `recipeAudits` y incluent le legacy et ne sont pas utilisables.
- `full/baseline-loot10-loot15-lootOnly-city` : ancien lot interrompu,
  ne pas annoncer 400 campagnes terminées.
- `full/baseline-loot15-city` : uniquement un pilote d'une seed par profil,
  pas une preuve statistique de ville progressive.
- La recommandation historique d'un taux fixe à 15 % est dépassée par la
  nouvelle cible 1–3 objets par étage et la recherche de procs.

Dernière validation réellement exécutée :

```powershell
node scripts/test-loot-town-policy.mjs
node --check scripts/run-loot-economy-harness.mjs
node scripts/run-loot-economy-harness.mjs --stage=early --seeds=2 --workers=2 --profiles=baseline,loot15 --town=progressive
```

Tests réussis : onboarding, production, prérequis, achats/recrutement, allocation,
déterminisme, conservation d'or ; 48 recettes actives acceptées, legacy rejeté
même explicitement déverrouillé. Assertion corrigée pour tester le code réel
`BLUEPRINT_LOCKED` plutôt que le mot `recipe`.

Quatre pilotes terminés, 142 à 151 explorations, étage 8, deux ou trois héros,
zéro écart de conservation de l'or. Sortie :
`test-results/loot-economy/early/baseline-loot15-city/summary.json`.
Ce sont des preuves de fonctionnement, PAS de validation du nouvel équilibrage.
`git diff --check` sans erreur de whitespace (avertissements LF/CRLF présents) ;
ce contrôle Git ne couvre pas les fichiers non suivis.

## Préserver le travail déjà présent

Le worktree est largement sale : UI Forge, nommage des objets, présentation,
domaine/autorités et tests associés. Ne rien reset, ne rien mélanger dans un
commit automatique, ne pas attribuer tous ces changements au loot.

Le sous-lot loot possède les scripts et le rapport cités plus haut (non suivis),
ainsi que la note d'incident ajoutée à `codex-elevation.md`, déjà modifié avant.
Les documents de contexte voisins existent : `item-naming-plan.md`,
`item-naming-harness.md`, `forge-workshop-ui.md`,
`forge-item-evolution-plan.md`, `architecture/item-naming.md`.
Les visuels restent à l'utilisateur sauf autorisation explicite contraire.
Ne pas relancer de déploiement ni arrêter ses serveurs dans ce travail.

## Reprise attendue

1. Lire AGENTS, ce handoff et les scripts ciblés ; vérifier statut Git.
2. Utiliser le chemin d'exécution disponible, sans refaire une boucle de
   dépannage globale tant que les élévations ciblées fonctionnent.
3. Adapter les variantes idle et la télémétrie ci-dessus dans le harness seulement.
4. Valider les règles expérimentales par tests déterministes et petits pilotes.
5. Lancer 100 seeds appariées par variante, dix workers, avec sorties distinctes
   et contrôle de complétude. Ne pas lancer 100 fois les anciennes variantes
   en les présentant comme les nouvelles.
6. Présenter les écarts aux objectifs, ajuster, documenter les résultats et limites.
   Ne pas annoncer le loot/craft validé tant que les nouveaux tests manquent.
