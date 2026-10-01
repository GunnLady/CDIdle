# CDI-146 — Escorte des passeurs

Génération : outil ImageGen intégré. Validation visuelle utilisateur, personnage
par personnage puis écran intégré. Trois remplacements runtime intégrés et validés.

## Garde — version approuvée le 1er octobre 2026

Fichier : `smuggler-guard-v2-approved.png`.
SHA-256 : `ab00c1cb4ee0997da5a8fb4644881b01517065d945c5869762f0df1e14171c4e`.
Verdict utilisateur : « validé », après réduction du côté chibi du premier candidat.
Les proportions de cette version servent de référence pour la suite de l'Escorte.

Références du premier candidat, sous `public/assets/images/dungeon/undercity/` :

1. `smugglers/smuggler-guard-v1.png` : identité à reprendre.
2. `court/chamberlain-blade-v3.png` : style.
3. `court/deep-chamberlain-v3.png` : style.
4. `court/deep-alchemist-v2.png` : style.
5. `bastion/barricade-blade-v1.png` : style.

Le porte-étendard a aussi été inspecté ; il n'a pas été fourni à la génération,
l'outil limitant les entrées à cinq images. Un appel à six références a été
rejeté avant génération. `transparent_background: true` pour les deux candidats.

Prompt initial exact :

> Retouche de style pour un sprite CDIdle. Image 1 = seul personnage à refaire ; images 2 à 5 = références de style uniquement. Redessiner ce garde des contrebandiers dans leur style fantasy 2D stylisé : contours nets, volumes simples, détails lisibles, proportions et finesse cohérentes avec ces références, sans photoréalisme. Conserver son identité masculine, cheveux bruns attachés, légère barbe, foulard rouge, cuir brun usé, sabre court courbe et petit bouclier rond. Même orientation trois-quarts vers la gauche et posture stable, sans attaque déclenchée. Lumière venant de la gauche. Un seul personnage entier, armes et pieds complets, centré avec marge, fond réellement transparent ; aucun décor, texte ni effet. Un seul candidat.

Prompt de correction exact, avec le premier candidat comme seule entrée :

> Corriger uniquement les proportions de ce garde CDIdle : sa tête est un peu trop grosse et le personnage trop chibi. Réduire la tête, cheveux compris, d'environ 12 à 15 % relativement au corps, et allonger très légèrement le buste. Garder un style fantasy 2D encore un peu chibi, expressif et compact ; ne pas passer à une anatomie réaliste ni à un corps longiligne. Préserver exactement l'identité et les traits du visage, cheveux attachés, barbe, foulard rouge, cuir brun, maille, sabre courbe, petit bouclier rond, pose et orientation vers la gauche, dessin et lumière venant de gauche. Un seul personnage entier avec pieds et armes complets, marge autour, fond réellement transparent. Un seul candidat.

Les pourcentages sont des consignes de génération, pas des mesures du résultat.
Export runtime : `scripts/prepare-dungeon-character-sprite.ps1 -MatchReferenceHeight`,
avec les anciennes images conservées dans `originals/`. Format 384 × 384,
proportions conservées et hauteur/pieds alignés à la référence. Écran validé après
réduction des échelles de 0,05 : garde 1,39 ; arbalétrier 1,47 ; médecin 1,36.

## Arbalétrier — approuvé le 1er octobre 2026

Fichier : `smuggler-crossbowman-v2-approved.png`. Verdict : « validé » après
réduction de la tête et allongement du buste. Pour les suivants : conserver les
proportions des deux sprites approuvés, tête modérée et touche chibi légère.
Outil : ImageGen intégré, fond transparent. Prompt de correction retenu :

> Correction ciblée des proportions de cet arbalétrier CDIdle : la tête est trop grosse, le personnage trop chibi. Réduire la tête, cheveux compris, d'environ 15 % relativement au corps, et allonger légèrement le buste. Garder un style fantasy 2D encore un peu chibi, expressif et compact, pas une anatomie réaliste ou longiligne. Préserver exactement le visage et son identité, cheveux bruns, absence de barbe, écharpe sombre, tunique verte, cuir brun, arbalète et carquois, posture, orientation vers la gauche, couleurs et éclairage venant de gauche. Arme entière et mains cohérentes. Un seul personnage entier, pieds et arme complets avec marge, fond réellement transparent. Un seul candidat.

## Médecin — approuvé le 1er octobre 2026

Fichier : `tunnel-medic-v3-approved.png`. Verdict : « medecin validé ».
ImageGen intégré, fond transparent. Références : médecin runtime v2, garde et
arbalétrier approuvés. Prompt exact :

> Redessiner le médecin des tunnels de l'image 1 pour CDIdle. Image 1 : conserver identité, peau brune, capuche sombre, foulard rouge, bandages beiges sans symbole, manteau usé, sacoche médicale et flacon ambre, orientation trois-quarts vers la gauche et geste de soutien calme. Images 2 et 3 : références approuvées de dessin ET de proportions. Reprendre précisément leur rapport tête/corps : tête modérée, buste suffisamment développé, jambes lisibles, fantasy 2D avec seulement une légère touche chibi. La capuche épouse une tête modérée sans gonfler sa silhouette. Même niveau de détail, contours nets, matières stylisées et lumière depuis la gauche. Un seul personnage entier, mains lisibles, pieds et accessoires complets avec marge. Aucun sort, halo, arme ajoutée, décor ou texte. Fond réellement transparent. Un seul candidat.
