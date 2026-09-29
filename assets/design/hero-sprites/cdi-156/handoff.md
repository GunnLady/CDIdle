# CDI-156 — Gardes Artificier, suivi de production

## État final — 29 septembre 2026

Les vingt gardes sont intégrées localement ; le manifeste `manifest.json`
relie les sources, PNG normalisés et WebP runtime. Les échelles finales sont
dans `face-calibration.json` et `src/assets/artificerCdi156CombatPoses.ts`.
Le [ticket CDI-156](../../../../workboard/data/Done/CDI-156/ticket.md)
consigne les validations et la clôture explicite par l’utilisateur, tous
critères cochés. Aucune reconstitution documentaire supplémentaire n’est requise.

Les sections suivantes conservent l’historique de production du 27 septembre,
antérieur à la livraison complète. Leurs mentions « À produire », exports à
préparer et verdict cinéma absent ne décrivent plus l’état actuel ; ne pas
les utiliser pour relancer une génération ou rouvrir le ticket.

## Direction convenue le 27 septembre 2026

20 identités : 8 doubles pistolets, 6 fusils longs, 6 canons compacts (4/3/3 par genre). Armes d'inspiration napoléonienne avec détails mécaniques fantasy. Les doubles pistolets sont uniquement visuels ; aucun changement des armes ou récompenses du domaine. Recherches en langues originales également : jeux vidéo, fantasy, manga et manhwa. Tenues et identités neutres conservées, expressions prêtes au combat.

Avant toute régénération motivée par le fond, inspecter le canal alpha réel et composer le fichier sur fonds clair et sombre. L'aperçu ImageGen seul n'est pas une preuve de fond opaque. Un seul candidat, présenté immédiatement ; attendre son verdict avant les mesures et l'intégration.

## Ordre de production

Le tableau ci-dessous conserve en partie la répartition initiale et n'est pas à jour pour toute la série. Au contrôle du 27 septembre, dix archives hommes M01–M10 et sept archives femmes F01–F07 sont présentes dans les dossiers `validated` ; leur présence seule ne reconstitue pas les verdicts individuels. Ne pas régénérer ces identités sur la base des anciennes mentions « À produire ». F07 est explicitement reconfirmée ci-dessous ; les autres lignes restent à réconcilier avec les preuves de production.

Ordre corrigé à la demande utilisateur : pilote M01 doubles pistolets validé, puis pilote contrasté F05 fusil long. Attendre son verdict avant de reprendre la série à M02, puis M03–M10 et F01–F10 en sautant les identités déjà validées. Les pilotes comptent dans les vingt identités et dans les totaux 4/3/3 par genre.

| Identité | Source neutre autoritaire | Arme | État |
| --- | --- | --- | --- |
| M01 | ../cdi-144/validated-male-v1/artificer-male-01-v1.png | Deux pistolets | Pilote validé, archivé ; export à préparer |
| M02 | ../cdi-144/validated-male-v1/artificer-male-02-v1.png | Deux pistolets | Candidat rejeté ; reprise après validation du pilote F05 |
| M03 | ../cdi-144/validated-male-v1/artificer-male-03-v1.png | Deux pistolets | À produire |
| M04 | ../cdi-144/validated-male-v1/artificer-male-04-v1.png | Deux pistolets | À produire |
| M05 | ../cdi-144/validated-male-v1/artificer-male-05-v1.png | Fusil long | À produire |
| M06 | ../cdi-144/validated-male-v1/artificer-male-06-v1.png | Fusil long | À produire |
| M07 | ../cdi-144/validated-male-v1/artificer-male-07-v1.png | Fusil long | À produire |
| M08 | ../cdi-144/validated-male-v1/artificer-male-08-v1.png | Canon compact | À produire |
| M09 | ../cdi-144/validated-male-v1/artificer-male-09-v1.png | Canon compact | À produire |
| M10 | ../cdi-144/validated-male-v1/artificer-male-10-v1.png | Canon compact | À produire |
| F01 | ../cdi-144/validated-female-v1/artificer-female-01-v1.png | Deux pistolets | À produire |
| F02 | ../cdi-144/validated-female-v1/artificer-female-02-v1.png | Deux pistolets | À produire |
| F03 | ../cdi-144/validated-female-v1/artificer-female-03-v1.png | Deux pistolets | À produire |
| F04 | ../cdi-144/validated-female-v1/artificer-female-04-v1.png | Deux pistolets | À produire |
| F05 | ../cdi-144/validated-female-v1/artificer-female-05-v1.png | Fusil long | Prochain pilote contrasté |
| F06 | ../cdi-144/validated-female-v1/artificer-female-06-v1.png | Fusil long | À produire |
| F07 | ../cdi-144/validated-female-v1/artificer-female-07-v1.png | Deux pistolets | Validée, reconfirmée par l'utilisateur le 27 septembre ; archive exacte vérifiée par SHA-256 ; ne pas régénérer |
| F08 | ../cdi-144/validated-female-v1/artificer-female-08-v1.png | Canon compact | À produire |
| F09 | ../cdi-144/validated-female-v1/artificer-female-09-v1.png | Canon compact | À produire |
| F10 | ../cdi-144/validated-female-v1/artificer-female-10-v1.png | Canon compact | À produire |

## M01 validé

- Source exacte : `exec-a4b0117f-1dfd-42b5-8572-9ed4d0426eeb.png`, conservée sans modification dans `validated-male-v1/artificer-male-01-combat-idle-v1.png`.
- SHA-256 source et archive identiques : `5fc8f734f0751a2305cb58a3f9b67a9819aea48bfeea71321d6e23aed943ca00`.
- Verdict utilisateur : « validé », puis confirmation que ce fichier possède déjà des pixels alpha à 0. Le candidat magenta suivant était inutile et n'est pas retenu.
- Alpha vérifié : 1024 × 1536 ; 1 053 995 pixels alpha 0, 518 869 pixels alpha 1–254, aucun alpha 255. Coins alpha 0. Aucun halo visible dans les compositions sur blanc et gris sombre réellement examinées.
- Comparaison visuelle avec neutre M01 et gabarits Mage M06/M08 : silhouette cohérente à l'inspection, sous réserve de l'échelle et du pivot à contrôler dans l'export puis le cinéma. Aucun verdict cinéma acquis.
- Garde : un pistolet diagonal devant le buste, l'autre bas à l'extérieur de la hanche, pieds écartés, visage concentré sans sourire.
- Références exactes : neutre M01 ; Izo `https://onepieceheight.com/wp-content/uploads/izo-1.png` (pose seulement) ; pistolet `https://www.thearmoury.shop/_uploads/img/products/giant/G1011.jpg` (arme). Images externes locales dans `.tmp/cdi156-references`, hors runtime et livraison ; droits de redistribution non établis.
- Prompt exact :

```text
Generate ONE isolated full-body fantasy RPG combat_idle character sprite as a PNG with a genuinely transparent alpha background. All pixels outside the character and his two weapons must be fully transparent, including gaps between limbs. No background color, black backdrop, gradient, halo, aura, glow, vignette, ground or cast shadow. Image 1 is the exact identity and rendering authority: preserve his youthful face, brown hair, body proportions, green coat, all clothing details and colors, boots, belt and tool pouch. Image 2 guides ONLY the asymmetric dual-pistol guard: one pistol diagonally upward before the chest, clear of the face, the other held low outside the opposite hip. Feet firmly apart, knees slightly bent, body facing three-quarter screen right. Battle-ready expression: focused eyes, slightly furrowed brows, closed firm mouth, absolutely no smile. Image 3 defines both matching Napoleonic flintlock pistols: curved wood grips, steel barrels, restrained brass mechanical fittings. Keep hands naturally gripping the pistols. Entire character, both boots and both weapons visible with generous transparent margins. Same illustrated style as image 1. No firing, smoke, effects, scenery, text or extra costume.
```

## F07 validée — confirmation du 27 septembre 2026

- Source exacte désignée par l'utilisateur comme déjà validée : `C:\Users\mathr\.codex\generated_images\01a0e1be-8160-74c3-8def-bd8cf2ec78bf\exec-c885a502-fd42-4636-a94c-8f6b848313ff.png`.
- Archive existante conservée sans modification : `validated-female-v1/artificer-female-07-combat-idle-v1.png`.
- SHA-256 source et archive identiques, vérifié dans cette reprise : `FCB578BBEF793DC91120740BE2BD85DB551134716D581B2C312A6D13D45E7FB9`.
- Inspection du fichier exact : deux pistolets, l'un relevé près de la tête, l'autre tendu vers la droite. L'ancienne affectation « fusil long » ne décrit pas le visuel approuvé.
- Le candidat au fusil `exec-0eeb7702-f2fe-4506-9bdc-136dd97098ff.png`, généré pendant la reprise, ne remplace pas cette archive ; aucune validation utilisateur de ce nouveau candidat n'est acquise.
- Prompt et références exacts du fichier validé non reconstitués dans cette reprise. Aucun nouveau contrôle alpha, proportions, export ou cinéma n'est revendiqué.

## Reste à faire historique — remplacé par l’état final ci-dessus

M02 `exec-8f4b7dd9-f467-44ca-9493-215b5127ff9c.png` : rejet explicite utilisateur, génération prématurée avant le second pilote ; aucune intégration. Ne pas réutiliser ce candidat comme référence.

Réconcilier le registre historique avec les dix-sept archives et leurs verdicts sans régénérer les identités déjà approuvées. F08–F10 n'ont pas d'archive dans ce dossier au contrôle du 27 septembre. Préparer les exports sans altération artistique, contrôler proportions, alpha, pieds, pivot et échelle ; compléter les validations manquantes, intégrer les exports, obtenir le verdict cinéma, puis effectuer les validations du ticket. CDI-156 reste incomplet.
