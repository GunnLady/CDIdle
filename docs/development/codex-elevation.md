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
