# Actions Codex susceptibles de nécessiter une élévation

Ce document décrit les cas observés ou prévisibles dans le workspace CDIdle.
Il ne donne aucune autorisation permanente : chaque élévation doit rester
ciblée, annoncée et approuvée.

## Matrice

| Action | Risque de blocage | Cause habituelle | Procédure recommandée |
| --- | --- | --- | --- |
| Déplacer un ticket Workboard (`Doing`, `Later`, `Done`, `Paused`) | élevé | création/déplacement de dossier refusé par le sandbox | vérifier source/cible, annoncer le déplacement, demander une élévation ciblée |
| Créer ou supprimer un dossier Workboard | moyen à élevé | ACL du runner ou dossier cible absent | vérifier le chemin exact ; utiliser `apply_patch` pour le contenu ; élévation ciblée seulement pour l'opération de dossier |
| `board:start`, `board:stop`, arrêt d'un processus | moyen | processus lancé dans une autre session ou contrôle système refusé | identifier le PID et la commande ; préférer le PowerShell utilisateur |
| Inspection CIM des processus (`Get-CimInstance Win32_Process`) | moyen | accès WMI/CIM refusé | utiliser `Get-Process` dans le PowerShell utilisateur ; ne pas élargir les droits par défaut |
| `npm run dev`, `npm test`, `npm run build` | moyen | verrou `node_modules/.vite-temp` par Node/Vite/antivirus | fermer les serveurs, arrêter les PID identifiés, relancer dans le PowerShell utilisateur |
| Suppression du cache `.vite-temp` | moyen | fichier temporaire verrouillé | vérifier qu'aucun Node/Vite ne tourne ; cibler uniquement `node_modules/.vite-temp` |
| Supabase local / Docker / ports | variable | privilèges Docker, port déjà alloué, service hors sandbox | vérifier les conteneurs et ports ; exécuter dans le PowerShell utilisateur |
| Écriture hors `D:\codex\CDIdle` | élevé | racine non autorisée par le sandbox | vérifier le chemin ; demander l'élévation uniquement pour cette cible |
| Git commit/push | faible | hooks, credential manager ou réseau | pas d'élévation par défaut ; l'utilisateur exécute le push selon les règles Git du projet |

## Règles de sécurité

- Ne jamais utiliser une cible récursive non vérifiée.
- Ne jamais arrêter un processus dont le PID et le rôle ne sont pas identifiés.
- Ne jamais demander une élévation globale « par défaut ».
- Ne jamais inclure de secrets dans les commandes, logs ou demandes
  d'approbation.
- Pour les tests interactifs, fournir la commande, le terminal et l'objectif ;
  attendre la sortie utilisateur.

## Référence opérationnelle

Quand une action est bloquée, le compte rendu doit distinguer :

- blocage du sandbox Codex ;
- verrou détenu par un processus utilisateur ;
- permission Windows/ACL ;
- défaut réel du projet.

Un `EPERM` sur `node_modules/.vite-temp` ne suffit pas à conclure à un défaut
du projet : vérifier les processus Node/Vite et retester dans le PowerShell
utilisateur.

## Incident du sandbox Windows : exécution du harness

Le 5 septembre 2026, les commandes normales échouaient avant même le
démarrage du shell : `helper_unknown_error: setup refresh had errors`.
Le journal `C:\Users\mathr\.codex\.sandbox\sandbox.2026-09-05.log`
précise un refus Windows (`SetNamedSecurityInfoW`, code 5) lors de
l'application des ACL de protection sur `D:\codex\CDIdle\.git` et
`D:\codex\CDIdle\.codex`. Cela identifie l'opération refusée, pas
l'origine complète du problème de droits.

L'exécution avec élévation ciblée a de nouveau fonctionné dans cette session.
Preuves : `node scripts/test-loot-town-policy.mjs` réussi, contrôle syntaxique
du harness réussi et quatre campagnes courtes terminées (deux seeds appariées,
deux profils, deux workers), sans écart de conservation de l'or :

```powershell
node scripts/run-loot-economy-harness.mjs --stage=early --seeds=2 --workers=2 --profiles=baseline,loot15 --town=progressive
```

Ce contournement ne répare pas le sandbox normal et n'autorise aucune
élévation générale. Aucune ACL, aucun mode de sécurité et aucun fichier
interne du sandbox n'ont été modifiés. Une réparation durable reste distincte :
identifier pourquoi la configuration ne peut pas appliquer ces ACL, puis
vérifier une commande normale sans élévation. Consulter la
[documentation officielle du sandbox Windows](https://learn.chatgpt.com/docs/windows/windows-sandbox).

## Supabase local : nouveaux imports partagés

Incident observé le 5 septembre 2026 après intégration du nommage : le runtime
Edge montait individuellement les fichiers partagés connus lors de son lancement.
Les nouveaux imports `shared/domain/items/naming.ts` et
`shared/data/item-naming-v1.ts` étaient absents du conteneur, provoquant
`worker boot error` / `Module not found` et le mode hors connexion du frontend.

Relancer uniquement les fonctions depuis la racine du projet pour reconstruire
les montages, sans réinitialiser la base ni arrêter toute la stack :

```powershell
npm.cmd exec --offline -- supabase functions serve game-api --env-file supabase/functions/.env
```

Le lanceur Windows Supabase/Bun peut planter après création du conteneur.
Ne pas en déduire que le runtime est arrêté : vérifier `docker ps`, les montages
du conteneur `supabase_edge_runtime_cdidle-local` et une requête atteignant
réellement `game-api` avant toute nouvelle relance.

Une réponse 401 sans bearer peut venir de la passerelle avant chargement de la
fonction ; le preflight OPTIONS peut également être traité par la passerelle.
Ces réponses seules ne prouvent pas que les imports de la fonction sont valides.
Lors de cet incident, un POST avec la clé anonyme locale, gardée en mémoire,
a atteint l’application : HTTP 401, `error.code: UNAUTHENTICATED` et
`x-request-id`, sans erreur de chargement. Ce contrôle ne valide pas une session
utilisateur authentifiée ; sa reconnexion reste à confirmer dans le navigateur.
