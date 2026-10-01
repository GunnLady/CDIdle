# CDI-146 — Coupe-jarret

Source corrigée explicitement par l’utilisateur le 1er octobre 2026 :
`exec-a077b7bc-3c8b-4eac-8101-8b5135fbe0e5.png`, ImageGen intégré.
Copie exacte retenue : `tribute-cutthroat-v4-approved.png`.
SHA-256 source et copie :
`6C0D1D0F5DFCA8DEFB38E7B93F11EF26F598796813C2EA05C1F3FFBB36733C2C`.

Références : ancien Coupe-jarret (sauvegardé dans
`originals/tribute-cutthroat-v2.png`), garde approuvé de l’Escorte,
`court/chamberlain-blade-v3.png`.

Prompt initial retrouvé dans la session précédente :

> Redessiner de zéro le Coupe-jarret du tribut pour CDIdle. Image 1 = identité et équipement uniquement : peau brune, cheveux sombres, masque, capuche anthracite bordée de bordeaux, écharpe bordeaux, cuir sombre, épaulière brune, ceinture et sacoche, deux dagues courbes. Images 2 et 3 = style fantasy 2D et proportions approuvées. Construire une anatomie cohérente dès le départ : tête modérée et capuche ajustée, thorax et bassin distincts, bras de longueur naturelle, cuisses et mollets équilibrés, mains et bottes proportionnées. Silhouette adulte stylisée avec une légère touche chibi ; environ quatre têtes et demie de hauteur si le personnage se redressait. Posture agile légèrement fléchie, appuis stables, genoux anatomiquement placés, trois-quarts vers la gauche, deux dagues en garde au repos. Éviter la grande tête, le buste tassé, les jambes arquées ou raccourcies et les grosses bottes. Contours nets, volumes et matières stylisés, détail similaire aux références, lumière depuis la gauche. Un seul personnage entier, deux mains et deux dagues lisibles, pieds et armes complets avec marge. Fond réellement transparent. Aucun décor, texte ou effet. Un seul candidat.

Correction du bras, prompt exact du fichier finalement retenu :

> Correction anatomique locale de ce sprite CDIdle. Modifier uniquement le bras situé À GAUCHE DE L’IMAGE pour le spectateur, tenant la dague qui pointe vers la gauche : il paraît trop court par rapport au bras côté droit de l’image. Reconstruire son articulation épaule-coude-poignet avec des longueurs anatomiques cohérentes avec l’autre bras, en allongeant modérément l’avant-bras et en rendant le coude lisible. Garder l’épaule au même endroit ; déplacer légèrement main et dague vers l’extérieur et le bas si nécessaire. Conserver une flexion naturelle, sans bras tendu rigide ni raccourci de perspective ambigu. Même taille de main et même dague entière. Préserver strictement tout le reste : tête, capuche, visage, identité, proportions du buste et des jambes, bras côté droit, posture, tenue, couleurs, style fantasy 2D légèrement chibi et éclairage depuis la gauche. Personnage entier, pieds et armes complets avec marge ; fond réellement transparent. Un seul candidat.

Entrée de cette correction : `exec-661ac035-aab1-4e13-9e19-7365a6ab0798.png`.
Ce fichier avait été nommé par erreur à la reprise ; sa copie
`tribute-cutthroat-v3-approved.png` reste un historique remplacé, non utilisé.
Le nouveau candidat `exec-22d0f01b-f005-450d-8568-056997325ec3.png`, généré
par erreur à la reprise, n’est pas utilisé.

Export runtime : `scripts/prepare-dungeon-character-sprite.ps1 -MatchReferenceHeight`,
384 × 384 avec alpha, proportions conservées, hauteur et pieds alignés à l’ancien
sprite. Échelle 1,5 et pivot 0,93 inchangés. Export retenu : 92 400 octets.
Le premier verdict d’écran du 1er octobre portait sur la sélection précédente.
La version corrigée est ensuite explicitement validée en scène (« validés »,
avec le groupe du Capitaine).
