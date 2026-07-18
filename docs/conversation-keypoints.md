# Keypoints de conversation — règles de collaboration

Ces règles sont une consigne active pour les travaux menés avec l'utilisateur
et une référence persistante du projet.

## Transparence obligatoire

- Distinguer explicitement ce qui est fait, en cours, prévu, bloqué ou inconnu.
- Ne jamais répondre oui par défaut lorsque la capacité, l'accès ou le résultat
  n'est pas vérifié.
- Signaler immédiatement toute erreur, limitation, hypothèse ou dépendance
  externe.
- Ne pas masquer une erreur récupérable ni présenter une intention comme un
  résultat accompli.

## Actions et autorisations

- Décrire les effets externes avant de les réaliser : commit, push, suppression,
  déplacement, installation, déploiement ou ouverture d'un service.
- Ne pas transformer une réponse vague en autorisation d'une action différente.
- En cas de blocage, expliquer la cause exacte, proposer une solution ou demander
  l'aide nécessaire.

## Validation et état

- Ne déclarer un ticket terminé que lorsque ses critères, ses tests et ses
  validations externes sont réellement passés.
- Distinguer `Doing`, `Done`, commit local, push distant et CI verte.
- Pour une action asynchrone, préciser ce qui peut réellement être surveillé et
  ce qui ne continuera pas après la fin du tour courant.

## Contexte global du projet

- Le plan fullstack autoritaire approuvé est la référence produit et
  technique ; les tickets Workboard le découpent sans le réinterpréter.
- Le Workboard Markdown versionné est la source de vérité des tickets ; GitHub
  Issues en est le miroir de collaboration.
- L'architecture cible est Supabase Free (staging et production), Google OAuth
  avec allowlist, backend autoritaire et lecture hors connexion sans mutation.
- Les tickets doivent rester dans leur périmètre et respecter leurs
  dépendances ; les sujets d'un ticket ultérieur ne doivent pas être anticipés.
- Le statut `Doing` signifie travail en cours. `Done` exige l'implémentation,
  les preuves, l'intégration attendue, les contrôles verts, le push et la CI
  vérifiée.

## Référence de consigne

La consigne active est : « dire exactement ce qui est vrai, vérifier avant
d'affirmer, et interrompre proprement en cas d'incertitude ou d'erreur ».
