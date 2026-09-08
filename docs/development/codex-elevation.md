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

Le 8 septembre 2026, le même incident a été reproduit sur une simple commande
`Get-Location`, alors que la configuration utilisait déjà
`[windows] sandbox = "elevated"`. Le journal du jour confirme un échec avant la
création du processus demandé :

```text
deny ACE failed on D:\codex\CDIdle\.codex: SetNamedSecurityInfoW failed: 5
deny ACE failed on D:\codex\CDIdle\.git: SetNamedSecurityInfoW failed: 5
setup error: setup refresh had errors
```

Le volume `D:` est NTFS et les ACL sont valides. Le processus Codex possède un
jeton d'intégrité moyenne ; son groupe Administrateurs est filtré par l'UAC.
Le compte utilisateur dispose de `Modify`, mais pas de `WRITE_DAC`, sur les
dossiers concernés, qui appartiennent aux comptes `CodexSandboxOnline` et
`CodexSandboxOffline`. Microsoft documente que la modification d'une DACL
requiert `WRITE_DAC` : le code 5 est donc cohérent avec le jeton et l'état ACL
observés. Cet état explique l'échec local, mais une réparation manuelle des ACL
n'est pas retenue : des incidents OpenAI similaires persistent après cette
opération et une modification incorrecte peut affaiblir les protections.

Le dépôt officiel OpenAI suit des incidents Windows identiques. L'un d'eux
rapporte que le passage au backend `unelevated` rétablit les commandes normales.
La documentation officielle prescrit également ce mode lorsque le setup
`elevated` échoue. La configuration locale retenue est donc :

```toml
[windows]
sandbox = "unelevated"
```

Validation effectuée le 8 septembre 2026 après redémarrage de Codex avec ce
mode : `Get-Location`, exécuté sans élévation depuis `D:\\codex\\CDIdle`, a
réussi avec le code de sortie 0 et a retourné `D:\\codex\\CDIdle`. Le dernier
journal sandbox, `C:\\Users\\mathr\\.codex\\.sandbox\\sandbox.2026-09-08.log`,
enregistre pour cette exécution un événement `START` à 18:41:49, puis
`SUCCESS` à 18:41:49.851, sans `setup refresh had errors` ni
`SetNamedSecurityInfoW failed: 5`. Ce contrôle confirme le fonctionnement de
`Get-Location` sous le backend `unelevated` ; il ne valide pas toutes les
commandes et ne démontre pas une correction du backend `elevated`.

Conserver ce mode jusqu'à ce qu'une mise à jour Codex annonce ou démontre la
correction du backend `elevated`. Ne pas utiliser `danger-full-access` et ne
pas modifier les ACL du dépôt pour contourner ce bug.

Dans une session déjà ouverte qui utilise encore l'ancien backend, ne tenter
qu'une commande sandboxée. Une fois le motif confirmé dans le dernier journal,
utiliser directement l'élévation ciblée pour le reste du tour.

Références :

- [configuration officielle Codex](https://learn.chatgpt.com/docs/config-file/config-basic) ;
- [incident OpenAI `setup refresh had errors`](https://github.com/openai/codex/issues/39841) ;
- [incident OpenAI `SetNamedSecurityInfoW: 5` et fallback `unelevated`](https://github.com/openai/codex/issues/33388) ;
- [droits de sécurité des fichiers Windows](https://learn.microsoft.com/en-us/windows/win32/fileio/file-security-and-access-rights).

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
