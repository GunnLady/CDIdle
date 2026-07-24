---
id: CDI-053
title: Restaurer la creation autoritaire complete des novices
status: Done
area: integration
priority: P1
size: L
risk: high
source: Regression observee pendant la validation navigateur CDI-051 du 2026-07-24
depends_on: ["CDI-026", "CDI-027", "CDI-052"]
blocks: ["CDI-051"]
github_issue: null
related_docs: ["docs/development/cdi-051-authoritative-ui-validation.md", "docs/architecture/hero-domain.md", "docs/architecture/inventory-domain.md", "shared/domain/hero-stats.ts", "supabase/functions/game-api/town-authority.ts", "supabase/functions/game-api/novice-authority.ts", "supabase/functions/game-api/idle-authority.ts", "src/utils/gameCalculations.ts"]
---

# CDI-053 — Restaurer la creation autoritaire complete des novices

## Objectif

Restaurer toute la generation des novices lors de l onboarding et du
recrutement : candidats, identite, statistiques derivees, statut elite,
competences et equipement, sans reintroduire une autorite RNG cote client.

## Resultat utilisateur

Les cinq candidats affiches sont generes et persistes par le serveur. Les deux
novices choisis conservent exactement leurs statistiques, competences et
equipement apres validation et rechargement.

## Contexte

La migration vers `onboarding.start` reconstruisait deux heros plats cote
serveur apres avoir affiche cinq candidats generes localement. La validation
navigateur CDI-051 a confirme la perte de l equipement ; l audit pre-push a
aussi identifie la perte des statistiques, du statut elite et des competences.

## Perimetre autorise

- Generer et persister l offre complete de cinq novices dans l autorite serveur.
- Confirmer deux candidats uniquement par leurs identifiants et noms.
- Conserver statistiques, statut elite, competences et equipement affiches.
- Utiliser le meme generateur autoritaire complet pour `hero.recruit_offer` et
  `hero.recruit`.
- Persister les statistiques derivees necessaires aux autorites serveur.
- Utiliser exclusivement le catalogue canonique.
- Garantir une generation deterministe et rejouable sans choix RNG client.
- Persister atomiquement heros, equipement et eventuels objets associes.
- Ajouter les tests d autorite et de non-regression.

## Hors perimetre

- Modifier les probabilites, statistiques ou couts du gameplay.
- Refaire le systeme general de progression RNG de CDI-050.
- Ajouter une mutation locale de secours.
- Reconcevoir visuellement l interface d onboarding.

## Contrat d'implementation

- Le client ne fournit aucun objet, rarete, modificateur, statistique,
  competence ou statut elite faisant autorite.
- `onboarding.start` ne peut promouvoir que deux identifiants issus de la
  derniere offre serveur persistee.
- Les identifiants d objets proviennent du catalogue canonique.
- Un replay de la meme commande ne cree aucun doublon.
- L equipement fait partie de l etat canonique retourne et mis en cache.
- Une erreur serveur ne cree aucun equipement local.

## Dependances

- CDI-026 pour l autorite heros.
- CDI-027 pour l autorite inventaire et equipement.
- CDI-052 pour les contrats partages.

## Ecarts fonctionnels identifies et corriges

- [x] `hero.recruit_offer` utilise le generateur novice complet au lieu du
      candidat simplifie sans competences ni statut elite.
- [x] `hero.recruit` utilise aussi le generateur complet au lieu de creer un
      novice sans statistiques, mana, competences ni statut elite avec un PV.
- [x] `generateAuthoritativeNovice` persiste `calculatedStats`, avec des PV/PM
      maximaux utilisables par l autorite idle.
- [x] `xpNeeded` est persiste a `100`, valeur finale du generateur historique
      pour un novice de niveau 1.
- [x] Les tests couvrent la parite client/serveur de 256 profils, tous les
      equipements novices, les passifs, le bouclier, la recuperation idle et les
      deux parcours de recrutement.
- [x] La selection des deux statistiques fortes d un novice elite reutilise
      l algorithme historique `sort(() => rng.next() - 0.5)` afin de ne pas
      modifier sa distribution.
- [x] Une graine elite connue couvre explicitement le statut elite, les deux
      statistiques fortes, les bornes du total et le replay deterministe.
- [x] Les tests comparent champ par champ le profil affiche et le profil cree
      pour l onboarding, l offre de guilde et le recrutement direct.
- [x] Le test navigateur a revele que `hero.equip` et `hero.unequip`
      changeaient l equipement sans recalculer les statistiques secondaires
      persistees. Le client masquait cet ecart avec un recalcul local.
- [x] La formule historique globale de `getHeroStats` est extraite dans
      `shared/domain/hero-stats.ts`. Le client et les autorites serveur
      consomment desormais le meme noyau pur au lieu de maintenir deux formules.
- [x] Les mutations d equipement novice recalculent `calculatedStats` et
      bornent les PV/PM courants aux nouveaux maxima.

## Decision produit

- Le feedback de log specifique apres recrutement normal ou elite n est pas
  restaure. Cet ecart d interface est accepte et ne bloque pas CDI-053.

## Criteres d'acceptation

- [x] Les cinq candidats affiches proviennent de l etat serveur persiste.
- [x] Chaque heros initial conserve le profil complet du candidat choisi.
- [x] Chaque heros initial recoit l equipement novice attendu.
- [x] Les recrutements par offre et par commande directe utilisent le meme
      profil novice complet que l onboarding.
- [x] `calculatedStats` est persiste et coherent avec statistiques, competences
      et equipement.
- [x] Un novice de niveau 1 possede `xpNeeded: 100`.
- [x] Les objets proviennent du catalogue canonique.
- [x] Aucun choix RNG, statistique, competence ou objet canonique n est accepte
      depuis le client.
- [x] Le replay est idempotent et ne duplique aucun objet.
- [x] L equipement persiste apres `F5` et nouveau bootstrap.
- [x] Le parcours inventaire/equipement redevient testable.
- [x] Les tests serveur couvrent creation, persistance, replay et rejet des
      donnees client non autorisees.
- [x] Les tests couvrent onboarding, offre de recrutement, recrutement direct,
      PV/PM derives, `calculatedStats` et `xpNeeded`.

## Tests

- `npm.cmd run typecheck`
- `npm.cmd test -- --run tests/townAuthority.test.ts tests/authoritativeContracts.test.ts`
- `npm.cmd test -- --run`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Reinitialiser une partie ou utiliser un nouveau compte, noter les cinq
candidats, en choisir deux, verifier que statistiques, elite, competences et
equipement sont identiques apres creation puis `F5`, puis tester une commande
d equipement.

Preuve du 2026-07-24 :

- `onboarding.offer` 200, revision 14, cinq candidats complets ;
- Ragnor et Beatrix promus par `onboarding.start` 200, revision 15, profils
  serveur identiques champ par champ aux candidats ;
- apres `F5`, `bootstrap` 200 revision 15 et profils visuels inchanges ;
- `hero.unequip` 200 revision 16, arme retiree du heros et ajoutee au coffre ;
- apres redemarrage de la fonction locale corrigee, `hero.equip` a remis la
  dague sur Ragnor en revision 17 ;
- le bootstrap revision 17 conserve `quick_dagger`, retire la dague du coffre
  et persiste `calculatedStats.criticalChance: 4.9`.

## Preservation

Conserver le parcours visuel d onboarding, les noms et identites selectionnes,
les regles d equipement novice et les contrats de commande existants.

## Risques

Une generation partiellement locale recreerait deux sources d autorite. Une
persistance non atomique pourrait dupliquer ou perdre des objets au replay.

## Handoff

Fournir la matrice candidats affiches vers heros crees, les fichiers modifies,
les tests automatises et la preuve navigateur apres rechargement.

Audit pre-push du 2026-07-24 :

- aucun critere CDI-053 restant ;
- typecheck, Workboard et diff check valides par Codex ;
- 71 tests cibles valides par Codex ;
- suite complete et build verts, preuve rapportee par l utilisateur apres la
  correction du calcul partage ;
- parcours navigateur complet valide jusqu au bootstrap revision 17 ;
- la generalisation du recalcul aux classes, raretes et modificateurs futurs
  doit etre portee par un ticket P1 distinct et ne change pas la preservation
  fonctionnelle des novices couverte ici.
