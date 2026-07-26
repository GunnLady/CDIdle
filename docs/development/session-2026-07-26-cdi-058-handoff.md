# Reprise de session - CDI-058 progression des héros

Date de rédaction : 26 juillet 2026.
Dernière mise à jour : 26 juillet 2026, après publication de CDI-058.

Ce document permet de reprendre le travail dans une nouvelle conversation sans
réinterpréter l historique. Charger aussi `AGENTS.md` à la racine du projet,
puis le ticket `workboard/data/Done/CDI-058/ticket.md`.

## Position actuelle

- Branche : `main`.
- Commit CDI-058 publié :
  `a7575ec feat: verrouiller la progression autoritaire des héros`.
- Worktree : propre et aligné avec `origin/main` après publication.
- Ticket CDI-058 : statut `Done`, P1 ; sa clôture débloque sa dépendance dans
  CDI-051.
- CDI-054 reste `Done` et référence la parité donjon historique `640f89f`.
- Commit distant vérifié par Codex. CI distante inconnue au
  `2026-07-26 01:39 +02:00` : aucun statut renvoyé par le connecteur et CLI
  `gh` indisponible localement.

## Décisions produit confirmées

### Croissance

Pour un Novice, les statistiques prioritaires sont les trois `baseStats` les
plus élevées au début de chaque niveau. Equipement, passifs et statistiques
dérivées sont exclus. Les égalités suivent l ordre historique :

`str, agi, end, int, wiz, dex, luk`.

Chaque point consomme deux rolls :

1. choix du groupe prioritaire à 80 % ou secondaire à 20 % ;
2. choix de la statistique dans ce groupe.

Un Novice gagne cinq points, donc dix rolls. Une classe T1 gagne huit points,
donc seize rolls. Le top trois Novice est recalculé avant chaque nouveau
niveau.

### Récupération et recalcul

- Une récompense causant un ou plusieurs niveaux restaure une seule fois
  20 % des PV max et 30 % des PM max, avec plafonnement.
- Une vocation T0 vers T1 restaure ensuite totalement PV et PM.
- Un gain d XP sans level-up conserve les `calculatedStats` persistées.
- Equipement et déséquipement recalculent les statistiques dérivées.
- Level-up et vocation recalculent également les statistiques dérivées.

### Vocation T0 vers T1

- Le passif Novice est conservé.
- L actif Novice est retiré.
- Les cooldowns sont vidés.
- Classe ordinaire : un actif et un passif de classe.
- Mage : deux sorts élémentaires distincts et un passif Mage.
- Acolyte : `minor_heal`, un autre actif et un passif Acolyte.
- Cette attribution de compétences est une décision produit postérieure à
  `640f89f`; la référence historique changeait la classe sans attribuer ces
  compétences.
- Convergence : seuil/écart `55/6` niveau 10, `45/4` niveau 11, `30/2` niveau
  12, puis choix forcé au niveau 13 si une classe admissible existe.

## Implémentation réalisée

- `src/domain/hero.ts`
  - récupération PM 30 % ajoutée au level-up ;
  - récupération PV/PM appliquée une seule fois après la boucle multi-niveaux ;
  - classe inconnue ou T1 sans `mainStats` refusée avant consommation RNG.
- `src/domain/authoritativeHeroValidation.ts`
  - invariant sémantique `xpNeeded` selon niveau et classe ;
  - invariant `xp < xpNeeded` après progression ;
  - migration idempotente du seuil dérivé sans RNG.
- `supabase/functions/game-api/town-authority.ts`
  - migration appliquée aux héros, candidats onboarding et recrutement en
    attente avant validation canonique.
- `src/domain/authoritativeDungeon.ts`
  - message de level-up complété avec la progression de mana.
- `src/components/HeroPanel.tsx`
  - texte UI précisant décision possible au niveau 10 et convergence au plus
    tard au niveau 13 si une vocation est disponible.

La migration corrige uniquement `xpNeeded`. Si le seuil recalculé rend
`xp >= xpNeeded`, l état est refusé : produire le niveau demanderait des rolls
de croissance et ne peut pas être réparé silencieusement.

## Tests ajoutés ou renforcés

- formule XP T0/T1 à niveau élevé ;
- récupération exacte 20 % PV et 30 % PM ;
- récupération unique sur plusieurs niveaux ;
- dix rolls Novice et seize rolls T1 ;
- recalcul du top trois Novice entre deux niveaux ;
- refus T1 sans `mainStats` avant roll ;
- seuils de convergence réels niveaux 10 à 13 ;
- recalcul équipement/déséquipement ;
- migration `xpNeeded` sur les trois collections de héros ;
- refus d un reliquat XP non traitable sans RNG ;
- golden tests intégrés Guerrier, Mage et Acolyte avec transcript, compétences,
  PV/PM et nombre de rolls ;
- matrice exacte classes T1 / bâtiments.

## Documentation mise à jour

- `docs/architecture/hero-domain.md`
- `docs/architecture/novice-convergence.md`
- `docs/architecture/authoritative-dungeon-parity-audit.md`
- `docs/architecture/api-command-contracts.md`
- `docs/development/cdi-051-authoritative-ui-validation.md`
- CDI-051 et CDI-054 pour les dépendances Workboard.

## Preuves déjà obtenues par Codex

- `npm.cmd run typecheck` : PASS.
- Tests ciblés : 121 PASS.
- Suite complète : 30 fichiers, 218 tests PASS.
- `npm.cmd run check:determinism` : PASS.
- `npm.cmd run lint -- --quiet` : PASS.
- `npm.cmd run board:validate` : 58 tickets, 0 erreur.
- `git diff --check` : aucune erreur ; avertissements Windows LF/CRLF seulement.

## Validation utilisateur obtenue le 26 juillet 2026

- build actualise apres les derniers ajustements de transcript : PASS rapporte
  par l utilisateur ;
- level-up ordinaire : recuperation exacte 20 % PV / 30 % PM, cinq points de
  croissance, recalcul derive et persistance apres `F5` ;
- vocation Mage : competences speciales, passifs, cooldowns, restauration
  complete et persistance confirmes ;
- gain multi-niveaux : `+8584 XP`, neuf niveaux `1 -> 10`, une seule
  recuperation, quarante-cinq points de croissance et etat identique apres
  `F5` ;
- replay exact : `replayed: true`, revision `119`, RNG `draws: 14` et
  `state: 1434733041`, sans duplication apres `F5` ;
- audit visuel du transcript : resume chiffre de progression, distinction des
  critiques, frappe bonus sans compteur et cause chiffree des KO implementees ;
- smoke navigateur final : `[Coup critique]`,
  `[Frappe bonus] [Coup critique]` sans compteur et KO par le Minotaure
  Vagabond avec 223 degats et transition `1 -> 0/233 PV` confirmes.

## Cloture fonctionnelle pre-push

La validation automatisee finale par Codex couvre le typecheck, la suite
complete de 30 fichiers et 220 tests, le determinisme, ESLint `--quiet`, le
Workboard et `git diff --check`. L audit fonctionnel pre-push est PASS ; son
seul ecart, un commentaire de test nommant Dragon au lieu de Minotaure, a ete
corrige. Le build actualise et le smoke navigateur final sont rapportes PASS
par l utilisateur. CDI-058 peut donc passer a `Done` apres confirmation
explicite recue.

Aucune validation fonctionnelle CDI-058 ne reste ouverte. Le commit et le push
ont été effectués par l utilisateur, puis le commit distant a été vérifié par
Codex.

## Attention à la reprise

- Ne pas réintroduire le fallback historique des classes T1 sans `mainStats` :
  la stratégie confirmée est le refus strict avant RNG.
- Ne pas recalculer les statistiques à chaque gain d XP.
- Ne pas appliquer la récupération une fois par niveau.
- Ne pas modifier les races, classes T2, formule XP ou poids 80/20 dans
  CDI-058.
- Le worktree était propre et aligné avec `origin/main` lors de la mise à jour
  post-push de ce handoff.
