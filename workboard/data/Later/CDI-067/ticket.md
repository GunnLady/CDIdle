---
id: CDI-067
title: Revue et purge controlee des rapports d erreurs alpha
status: Later
area: observability
priority: P2
size: S
risk: medium
source: Revue operationnelle a partir du 2026-08-29
depends_on: ["CDI-065"]
blocks: []
github_issue: null
related_docs: ["docs/deployment/alpha-error-reports.md", "workboard/data/Done/CDI-065/ticket.md"]
---

# CDI-067 - Revue et purge controlee des rapports d erreurs alpha

## Objectif

A partir du 29 aout 2026, analyser les trente premiers jours de rapports
d erreurs alpha, conserver les enseignements utiles puis purger uniquement les
donnees devenues inutiles.

## Resultat utilisateur

Les erreurs importantes ne disparaissent pas avec la purge : elles sont
transformees en tickets exploitables, tandis que la table reste petite et
respecte une duree de conservation adaptee au volume reel.

## Contexte

CDI-065 introduit une collecte minimale dans Supabase. Une suppression
automatique apres trente jours pourrait effacer une recurrence encore utile.
La premiere purge doit donc etre precedee d une revue humaine.

## Perimetre autorise

- Regrouper les rapports par version, categorie, `requestId` et periode.
- Identifier les erreurs recurrentes ou bloquantes.
- Creer un ticket distinct pour chaque probleme reel a conserver.
- Consigner un resume non sensible des tendances observees.
- Purger les rapports devenus inutiles apres la revue.
- Nettoyer les evenements de limite de debit expires.
- Definir la prochaine duree de conservation selon le volume reel.

## Hors perimetre

- Supprimer les rapports sans analyse prealable.
- Ajouter un dashboard, des analytics ou une plateforme externe.
- Conserver des exports contenant des donnees sensibles.
- Corriger les erreurs fonctionnelles identifiees dans ce meme ticket.

## Contrat d'implementation

- Ne pas executer la revue avant le 29 aout 2026, sauf demande explicite.
- Chaque erreur importante est tracee avant suppression des lignes sources.
- Le resume conserve uniquement version, categorie, frequence et decision.
- La purge est bornee par date et precedee d un comptage des lignes ciblees.
- Aucune table de partie, d authentification ou d allowlist n est modifiee.

## Dependances

- CDI-065 - collecte et stockage des rapports d erreurs alpha.

## Criteres d'acceptation

- [ ] La revue est realisee le 29 aout 2026 ou apres.
- [ ] Les erreurs recurrentes ou bloquantes possedent un ticket dedie.
- [ ] Un resume non sensible des tendances et decisions est conserve.
- [ ] Le nombre de rapports avant et apres purge est consigne.
- [ ] Seuls les rapports explicitement juges inutiles sont supprimes.
- [ ] Les evenements de rate limit expires sont nettoyes.
- [ ] La prochaine politique de retention est documentee.

## Tests

- Requete d analyse documentee dans `docs/deployment/alpha-error-reports.md`.
- Comptage SQL avant et apres purge.
- Verification que les tables de parties et utilisateurs sont inchangees.
- `npm.cmd run board:validate`

## Validation manuelle

Dans l editeur SQL Supabase, analyser les groupes de rapports, creer les
tickets necessaires, compter les lignes eligibles, executer la purge bornee
puis verifier les comptes restants et l absence de modification hors tables
de rapports.

## Preservation

- Preserver les preuves utiles avant suppression.
- Preserver la confidentialite des testeurs et des sauvegardes.
- Preserver toutes les tables hors collecte d erreurs.

## Risques

- Une purge trop large ferait perdre une erreur rare mais importante.
- Un export brut pourrait prolonger inutilement la conservation de donnees.
- Une retention illimitee augmenterait le volume sans gain fonctionnel.

## Handoff

Fournir la periode analysee, les volumes avant et apres, le resume des
tendances, les tickets crees, la requete de purge executee et la nouvelle
decision de retention.
