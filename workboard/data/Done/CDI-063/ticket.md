---
id: CDI-063
title: Verrouiller l authentification alpha sur Google
status: Done
area: security
priority: P1
size: S
risk: high
source: Audit de preparation alpha du 2026-07-30
depends_on: []
blocks: ["CDI-066"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/google-oauth-audit.md", "src/components/LoginPage.tsx", "src/components/AccountPanel.tsx", "src/lib/supabase.ts"]
---

# CDI-063 — Verrouiller l authentification alpha sur Google

## Objectif

Faire respecter le contrat produit Google OAuth uniquement avant l ouverture de
l alpha hébergée, sans conserver de chemin email/mot de passe exploitable côté
client ou `game-api`.

## Resultat utilisateur

Un alpha-testeur autorisé se connecte uniquement avec Google. Toute adresse
absente ou désactivée dans l allowlist est refusée clairement et aucun formulaire
email/mot de passe trompeur n est présenté.

## Contexte

Le plan autoritaire verrouille Google OAuth avec allowlist exacte. Le frontend
expose encore `signInWithPassword` et `signUp`, ainsi que deux formulaires
email/mot de passe. Le fournisseur email distant doit également être contrôlé
pour que retirer l interface ne constitue pas la seule protection.

## Perimetre autorise

- Retirer les formulaires et états email/mot de passe de `LoginPage` et
  `AccountPanel`.
- Retirer les helpers Supabase email devenus inutiles et adapter leurs tests.
- Refuser tout fournisseur non Google dans le hook de création et à chaque
  authentification runtime de `game-api`.
- Conserver Google OAuth, l allowlist exacte et la suppression définitive du
  compte.
- Valider l acceptation, le refus et la révocation avec des comptes contrôlés.

## Hors perimetre

- Construire un panneau d administration des testeurs.
- Ajouter un autre fournisseur OAuth.
- Ouvrir les inscriptions publiques ou retirer l allowlist.
- Modifier les données de jeu ou les règles de gameplay.

## Contrat d'implementation

- Aucun appel `signInWithPassword` ou `signUp` ne reste accessible dans le
  bundle alpha.
- Google est le seul fournisseur présenté et accepté par `game-api` pour les
  testeurs, indépendamment de la configuration administrative du provider email.
- Le hook `Before User Created` et la vérification runtime de l allowlist
  restent actifs.
- Les erreurs d accès ne divulguent ni la composition de l allowlist ni un
  secret OAuth.
- La suppression de compte conserve son comportement validé, y compris le
  retrait de l allowlist.

## Dependances

Aucune dépendance d implémentation. Le ticket bloque la validation backend
CDI-066.

## Criteres d'acceptation

- [x] Les deux surfaces de connexion ne proposent plus email/mot de passe.
- [x] Les helpers et tests email Supabase inutiles sont retirés.
- [x] Un provider non Google est refusé par le hook et par `game-api`, même avec
  une adresse allowlistée.
- [x] Un compte Google allowlisté peut se connecter et conserver sa session
  après F5.
- [x] Un compte Google absent ou désactivé est refusé sans création exploitable.
- [x] La révocation empêche un nouveau bootstrap et la reconnexion.
- [x] Reset, déconnexion et suppression définitive restent fonctionnels.

## Tests

- Tests unitaires du client Supabase et des écrans de connexion.
- Recherche statique de `signInWithPassword`, `signUpWithEmail` et formulaires
  mot de passe dans le bundle alpha.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run check:secrets`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Avec Supabase alpha, connecter un compte Google allowlisté, faire F5 puis se
déconnecter. Tenter ensuite un compte non autorisé, révoquer le compte de test
et confirmer que son accès suivant est refusé. Vérifier qu aucun formulaire
email/mot de passe n apparaît.

## Preservation

- Préserver Google OAuth, l allowlist et le compte distant existants.
- Préserver les parcours F5, déconnexion, reset et suppression de compte.
- Ne jamais consigner email, JWT, secret Google ou clé `service_role`.

## Risques

- Retirer seulement l interface laisserait le fournisseur email actif.
- Une mauvaise configuration OAuth peut bloquer tous les testeurs.
- Une révocation incomplète peut laisser une session déjà ouverte exploitable.

## Handoff

Fournir les fichiers retirés ou simplifiés, la configuration distante modifiée
sans ses valeurs, les preuves allowlist/refus/révocation, les validations F5 et
suppression ainsi que le résultat du contrôle de secrets.

## Validation du 2026-07-30

- Preuve utilisateur : écran Google-only, connexion allowlistée, F5,
  déconnexion et reset validés dans le navigateur.
- Preuve utilisateur : build Vite réussi et intégration temporelle locale
  réussie sans Bearer personnel.
- Preuve utilisateur : 94 tests pgTAP passent, dont hook Google, allowlist et
  révocation.
- Preuve Codex : provider `google` exigé dans `game-api`; providers `email`,
  vide et absent refusés même avec une adresse allowlistée.
- Preuve Codex : 319 tests applicatifs passent après la dernière preuve UI;
  le typage, le lint ciblé, les secrets et le board passent.
- La désactivation administrative du provider email n est plus bloquante :
  aucun chemin client ne l expose et les deux frontières serveur refusent tout
  provider non Google.
- Le redéploiement de `game-api` et la vérification finale du projet Supabase
  distant sont explicitement couverts par CDI-066.
