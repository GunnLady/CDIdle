# Checklist du refactor — contrôle générique des proportions `combat_idle`

Date : 20 septembre 2026.

Cette checklist est bloquante : aucune image ne peut être acceptée ou rejetée
sur ses proportions tant que les quatre objectifs, les validations techniques
et trois relectures successives du travail final ne sont pas cochés.

## Objectifs fonctionnels

- [x] **O1 — Aucune hauteur totale comme critère.** La hauteur de la boîte
  corporelle et le nombre de visages dans la hauteur ne sont ni affichés, ni
  retournés, ni employés pour accepter ou rejeter une pose fléchie.
- [x] **O2 — Cadre facial candidat obligatoirement revu.** Le comparatif refuse
  un candidat absent du catalogue, `pending`, modifié après revue, de dimensions
  différentes ou sans preuve de revue.
- [x] **O3 — Contrôles anatomiques séparés.** La sortie mesure et affiche
  séparément la tête, les épaules, le tronc, les bras, les hanches et les jambes,
  à partir de repères anatomiques revus. Un segment masqué est explicitement
  `non vérifiable`, jamais inventé.
- [x] **O4 — Aucun verdict automatique.** L'outil ne contient ni seuil de
  conformité, ni tolérance implicite, ni champ `pass/fail`. Il produit des
  mesures et une planche ; le verdict reste une inspection explicite.

## Contrat technique

- [x] Le candidat, le neutre et les deux gabarits sont chargés par clés de
  catalogue revues ; aucune boîte faciale candidate ne peut être fournie en
  ligne de commande pour contourner la revue.
- [x] Le SHA-256, les dimensions, la boîte corporelle, la boîte faciale, la
  preuve de revue et les repères anatomiques sont validés avant tout calcul.
- [x] Les mesures de segments sont normalisées par le diamètre facial revu.
- [x] La flexion et la perspective restent des limites explicites ; aucune
  distance verticale globale ne remplace les segments anatomiques.
- [x] Le script et la documentation utilisent la même interface et les mêmes
  termes.

## Validation technique

| Objectif | Vérification 1 — statique | Vérification 2 — fixture déterministe | Vérification 3 — assets réels |
| --- | --- | --- | --- |
| O1 | [x] | [x] | [x] |
| O2 | [x] | [x] | [x] |
| O3 | [x] | [x] | [x] |
| O4 | [x] | [x] | [x] |

Les cases ne sont cochées qu'avec la commande et le résultat consignés dans la
section « Preuves » ci-dessous. Ces campagnes testent le comportement de
l'outil ; elles ne remplacent pas les trois relectures demandées.

## Triple relecture du travail final

- [x] **Relecture 1 — logique et contrat.** Lecture ligne par ligne des scripts,
  du catalogue et de la section de workflow. Correction apportée : la checklist
  confondait à tort campagnes de test et relectures.
- [x] **Relecture 2 — chemins d'erreur et cas limites.** Lecture ciblée et tests
  adverses des entrées mal formées, preuves, dimensions, repères `NV`,
  ressources et verdicts implicites. Corrections apportées : plages positives
  pour l'affichage et refus d'un repère situé hors de la boîte corporelle revue.
- [x] **Relecture 3 — cohérence finale.** Relecture après corrections du code,
  de la documentation, de la checklist et des preuves. Correction apportée :
  la planche anatomique refuse désormais un repère obligatoire absent et rend
  visibles les raisons `NV`. La relecture finale post-correction ne trouve plus
  de contradiction résiduelle dans le périmètre.

## Preuves

### Vérification 1 — statique

Commande : parse PowerShell des trois scripts, inspection des paramètres avec
`Get-Command`, recherche des anciens champs avec `rg`/expressions régulières,
validation du schéma JSON, des quatorze repères et des preuves de revue.

Résultat : `Status=OK`, trois scripts valides, aucun paramètre
`CandidatePath`/`CandidateBodyRect`/`CandidateFaceRect`, aucun champ de hauteur
globale ou de verdict, six catégories présentes, documentation alignée et
quatre entrées de catalogue entièrement revues.

### Vérification 2 — fixture déterministe

Commande :

```powershell
& .\scripts\test-combat-idle-proportion-check.ps1
```

Résultat : `Status=OK`, avec douze assertions : six catégories ; entrées
identiques donnant des mesures identiques ; absence de hauteur globale et de
décision ; refus d'un cadre facial `pending` ; refus de repères `pending` ;
refus d'un SHA-256 modifié ; refus de dimensions modifiées ; refus d'une preuve
absente ; refus d'un repère absent sans raison ; sortie `NV` pour un repère
absent avec raison ; refus d'un repère hors de la boîte corporelle revue ; refus
d'une planche anatomique à laquelle manque un repère obligatoire.

### Vérification 3 — assets réels

Commande : exécution du comparatif avec `rogue-male-08-neutral` comme candidat
et neutre, puis `mage-male-06` et `mage-male-08` comme gabarits ; réexécution
vers une seconde sortie et comparaison SHA-256 des deux planches.

Résultat : `Status=OK`, six catégories, mesures candidat/neutre strictement
identiques, aucun champ de hauteur globale ou de décision, planche déterministe
sur deux exécutions. SHA-256 de la planche :
`A3B6C3E64EE316419B417B95DF5AA6F4D60811213BAC6DC69A413BECBAF08A07`.
Les quatre planches de repères et la planche comparative réelle ont aussi été
inspectées visuellement avant de cocher cette matrice.
