# Handoff — nouveau modèle de progression XP des héros

> Document historique figé : ses identifiants de modèle, son économie de
> récompenses et ses chiffres de simulation décrivent l'étape du 2 septembre,
> pas le runtime courant. Les références à jour sont
> `docs/architecture/dungeon-xp-economy.md` et
> `docs/development/hero-xp-progression-simulation.md`.

Date : 2026-09-02
État : implémentation locale non publiée
Objectif de reprise : réaliser un audit fonctionnel et technique complet, corriger tout écart réel, puis demander la confirmation explicite immédiatement avant le commit et le push.

## Résultat obtenu

Le modèle XP actif a été harmonisé pour couvrir T0 et T1 sans introduire prématurément T2, T3 ou les quêtes de transition :

- niveau maximal global : 99 ;
- courbe T0 : base 100, croissance 1,3 ;
- courbe T1 : première destination niveau 11, base 1061, croissance 1,2 ;
- fin de T1 visée par le game design autour des niveaux 30 à 35, sans plafond technique au niveau 35 ;
- aucune bande T2/T3 et aucune quête de transition ajoutée ;
- la projection proche de 13,5 heures reste un outil directionnel du harness pour le futur contenu, pas une règle active du jeu.

Le choix produit retenu est de conserver une progression propre à l'idle RPG : les futurs écarts de gains devront principalement venir du contenu, des récompenses et des paliers de difficulté, pas d'un multiplicateur de tier invisible appliqué aux héros.

## Architecture mise en place

### Modèle et calculs partagés

- `shared/data/hero-progression-models.ts` contient les modèles versionnés, les paramètres actifs et `HERO_MAX_LEVEL`.
- `shared/domain/hero-xp.ts` centralise le calcul du seuil, le rafraîchissement du seuil et la conversion proportionnelle d'une progression existante.
- Le modèle actif est `harmonized-t0-t1-v1` ; l'ancien modèle est conservé sous `legacy-global-v1` pour les sauvegardes.
- Les statistiques de combat et le seuil XP sont désormais recalculés par des responsabilités distinctes.

### Récompenses et gain de niveaux

- `shared/domain/dungeon-xp-rewards.ts` centralise les récompenses actuellement utilisées par le donjon autoritaire.
- Les combats, élites/boss, premiers clears et rencontres non-combat sont pris en compte.
- Les rencontres non-combat sont réparties équitablement dans le groupe ; trésors, repos et défis conservent leur plancher XP.
- Les valeurs de récompense existantes n'ont pas été rééquilibrées dans ce sous-lot : la modification porte sur la courbe requise.
- Au niveau 99, l'overflow XP terminal est abandonné et un gain supplémentaire ne consomme plus de RNG.

### Sauvegardes et migrations

- L'état canonique passe en version 2 avec `heroProgressionModelId` obligatoire.
- La migration structurelle et le changement de modèle d'équilibrage sont séparés.
- Les états v0 et v1 sont d'abord reconnus comme utilisant le modèle historique, puis les héros sont convertis explicitement vers le modèle actif.
- La conversion couvre les héros possédés, les candidats d'onboarding et la recrue en attente.
- La progression dans le niveau courant est conservée proportionnellement.
- Une sauvegarde historique incohérente est rejetée avant conversion au lieu d'être réparée silencieusement avec un éventuel tirage aléatoire.

### Présentation et création des héros

- Les fabriques de novices dérivent désormais leur seuil XP depuis le domaine partagé.
- Les vues héros et donjon reconnaissent le niveau maximal et affichent « Niveau maximum » avec une barre pleine.
- Les composants restent limités à la présentation ; les modèles de présentation portent la dérivation de l'état maximal.

### Harness et documentation

- Les fixtures du harness réutilisent le modèle actif au lieu de dupliquer la courbe.
- Trois commandes couvrent la simulation générale, T1 et la projection économique future.
- La documentation d'architecture, de migration canonique et de simulation XP a été mise à jour.

## Preuves déjà obtenues sur le worktree actuel

- `npm.cmd run typecheck` : réussi.
- `npm.cmd run lint` : réussi.
- `npm.cmd test -- --run` : 115 fichiers et 813 tests réussis.
- Tests ciblés modèle XP, migrations et récompenses : 3 fichiers et 15 tests réussis après la dernière correction.
- `npm.cmd run test:xp-tier1` : réussi avec 4 héros niveau 35 après 4622 explorations.
- Résultat T1 observé : 2741 combats, 1881 rencontres non-combat, 99 élites, 14 boss majeurs, 95 premiers clears, 114 objets et 62 changements d'équipement.
- `git diff --check` : réussi ; seuls des avertissements de conversion LF vers CRLF ont été observés.
- Aucun fichier temporaire `.codex-*.patch` ne subsistait lors du dernier contrôle.

Ces preuves devront être rejouées demain après l'audit et toute correction. Elles ne valent pas validation du futur commit tant que son contenu exact n'a pas été contrôlé.

## Audit complet à réaliser à la reprise

### 1. Reprendre le périmètre exact

1. Relire `AGENTS.md`, ce handoff et les documents XP concernés.
2. Exécuter `git status --short`, examiner le diff complet et distinguer les changements du sous-lot de tout changement utilisateur éventuel.
3. Vérifier l'absence de fichier temporaire ou de modification collatérale.
4. Contrôler que la documentation décrit le code réellement présent, sans promesse sur T2, T3 ou les quêtes.

### 2. Auditer les critères fonctionnels

- Tous les chemins de production doivent utiliser le modèle actif pour les nouveaux héros et les prochains seuils.
- Les changements de classe et d'équipement ne doivent jamais recalculer le seuil avec une courbe implicite ou historique.
- Le niveau 99 doit être terminal, sans dépassement, sans boucle et sans consommation RNG inutile.
- Les récompenses doivent couvrir combats ordinaires, élites/boss, premiers clears, trésors, repos, défis et partage de groupe sans double attribution.
- Les bonus existants, notamment humains, doivent conserver leur comportement prévu.
- Tous les emplacements persistés contenant un héros doivent être migrés.
- Les migrations v0, v1 et v2 doivent être déterministes et idempotentes.
- Un état invalide doit être rejeté ; une migration ne doit pas masquer une corruption.
- L'interface doit présenter correctement le niveau maximal sans embarquer de règle métier dupliquée.
- Aucun plafond niveau 35, aucune pseudo-implémentation T2/T3 et aucune quête factice ne doivent avoir été introduits.
- Le harness doit utiliser les mêmes paramètres de courbe que la production tout en signalant clairement ses hypothèses économiques propres.
- Vérifier les imports, helpers historiques, usages morts, duplications de constantes et tests devenus obsolètes.

Recherche transversale conseillée :

```powershell
rg -n "xpNeeded|calculateXpNeeded|awardExperience|heroProgressionModelId|HERO_MAX_LEVEL|xpCurve" shared src supabase tests
rg --files -g ".codex-*.patch"
```

### 3. Rejouer les validations

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test -- --run
npm.cmd run test:xp-simulation
npm.cmd run test:xp-tier1
npm.cmd run test:xp-tier-projection
git diff --check
```

Les simulations dédiées doivent être conservées dans le compte rendu même si la suite Vitest les couvre déjà, car elles fournissent les métriques produit lisibles.

### 4. Contrôle visuel éventuel

Aucun navigateur n'a été ouvert pendant ce sous-lot. Le changement visuel est limité à l'état « Niveau maximum », difficile à atteindre naturellement. Si une preuve visuelle est jugée nécessaire demain, demander d'abord l'autorisation explicite avant d'utiliser un navigateur, conformément aux règles projet. Sinon, documenter que la validation est structurelle et automatisée uniquement.

### 5. Audit pré-push et publication

Avant toute mutation Git :

1. présenter les écarts trouvés avec priorité et rentabilité ;
2. corriger tout écart réel du sous-lot ou le tracer explicitement s'il est volontairement différé ;
3. refaire les contrôles ciblés après correction ;
4. vérifier une dernière fois le statut, le diff, les fichiers indexés et la branche/upstream ;
5. demander une confirmation explicite immédiatement avant le commit et le push.

Message de commit proposé :

```text
feat: harmonize hero XP progression
```

Ne pas supposer la branche ni l'upstream : les vérifier au moment de publier. Le présent handoff n'autorise ni commit ni push.

Après le push, auditer uniquement le commit publié, l'état Git et la CI. Utiliser le skill projet `cdidle-ci-monitor` pour suivre GitHub Actions jusqu'à son état terminal. Le déploiement frontend est manuel, n'est pas déclenché par le push et nécessiterait une confirmation explicite distincte.

## Limites et décisions à ne pas perdre

- T2, T3 et les quêtes de transition n'existent pas encore : ne pas inventer leurs valeurs dans l'application.
- La cible niveau 30–35 est une cible de fin de contenu T1, pas une contrainte du moteur.
- La durée proche de 13,5 heures provient d'une projection du harness ; elle ne constitue pas encore une preuve autoritaire d'une progression réelle du niveau 1 au niveau 99.
- `xpNeeded` reste persisté comme cache/version de règle, avec un identifiant de modèle explicite.
- L'overflow au niveau maximal est volontairement perdu.
- Aucun contrôle visuel réel n'a encore été effectué.

## Définition de terminé pour demain

Le sous-lot pourra être publié uniquement lorsque :

- le diff complet aura été audité contre les décisions produit et l'architecture projet ;
- aucun écart réel non corrigé ou non tracé ne subsistera ;
- les validations seront vertes sur le contenu exact destiné au commit ;
- le périmètre Git sera propre et explicite ;
- l'utilisateur aura confirmé le commit et le push juste avant leur exécution ;
- le commit et le push auront été vérifiés ;
- l'état terminal de la CI aura été rapporté en distinguant clairement ce qui est vérifié de ce qui reste inconnu.

## Audit de reprise réalisé le 2026-09-02

L'audit fonctionnel, architectural et Git a été exécuté sur le worktree complet.
Quatre écarts ont été corrigés :

- le choix de vocation différé rafraîchit explicitement le seuil XP après la transition ;
- le harness T1 applique le même rafraîchissement lors de ses choix automatiques ;
- les présentations héros et donjon verrouillent désormais l'état niveau 99 par des tests ;
- les imports dispersés, la duplication du type d'identifiant et le nom obsolète de la fixture v2 ont été nettoyés.

Preuves finales après correction :

- `npm.cmd run typecheck` : réussi ;
- `npm.cmd run lint` : réussi ;
- `npm.cmd test -- --run` : 115 fichiers et 816 tests réussis ;
- les trois commandes de simulation XP : réussies ;
- campagne T1 complète : quatre héros niveau 35 après 4 622 explorations ;
- projection progressive : 7 725 explorations et 13,5 heures visibles du niveau 1 au niveau 99 ;
- `git diff --check` : réussi, hors avertissements LF vers CRLF propres à l'environnement Windows.

Aucun écart fonctionnel réel ne reste ouvert dans le périmètre audité. Aucun contrôle visuel avec navigateur n'a été réalisé. Aucun commit, push ou déploiement n'a encore été effectué.
