# Handoff — CDI-136, sélection Novice homme V8

Date d'arrêt : 13 septembre 2026.

## État utilisateur vérifié

L'utilisateur a validé visuellement une série de **10 Novices hommes**, un par
un. La série masculine en cours a donc été réduite de 20 à 10 personnages.
Cette décision ne tranche pas encore le nombre de personnages de la future
série féminine. Le ticket CDI-136 décrit toujours 20 hommes et 20 femmes et
devra être mis en cohérence avant l'intégration.

La sélection est terminée et les dix fichiers validés sont copiés dans le
dépôt sous des noms stables. Ils ne sont pas encore détourés, normalisés,
assemblés ni branchés dans l'application. Aucun test applicatif n'a été
exécuté pour cette sélection purement visuelle.

## Référence autoritaire

La référence validée est :

`assets/design/hero-sprites/cdi-136/novice-pilot-six-v8-right-light-no-gloves-chroma.png`

Le personnage 1/10 est directement le premier personnage de cette V8. Pour les
générations suivantes, seul ce premier personnage a été envoyé comme référence
primaire. Le crop de travail mesure 341 × 692 px et correspond à la zone
`x=0, y=0, largeur=341, hauteur=692`; le personnage y est complet.

Ce crop validé est archivé sous :

`assets/design/hero-sprites/cdi-136/validated-male-v1/novice-male-01-v1.png`

V8 reste autoritaire pour les proportions, la taille de tête, la pose, la
densité de pixels, les contours et l'éclairage venant de la droite de l'image.
La mesure visuelle réalisée pendant la session donne environ 6 têtes de haut,
mais la consigne numérique seule n'a pas suffi à empêcher les dérives chibi.

## Méthode qui a fonctionné

1. Ne pas demander une planche complète à ImageGen : les essais en 5 × 4 puis
   5 × 2 ont dérivé vers des personnages plus chibi et trop homogènes.
2. Découper uniquement le premier personnage de V8 et l'utiliser comme
   référence stricte pour générer **un seul personnage à la fois**.
3. Modifier seulement le visage, la carnation, la coupe, la palette cohérente
   de la tenue et les accessoires; conserver anatomie, pose, rendu et lumière.
4. Présenter chaque résultat à l'utilisateur et attendre son verdict avant le
   suivant.
5. À partir de 3/10, fournir les personnages déjà validés comme références
   d'exclusion afin d'éviter de répéter visage, carnation, coupe, palette,
   motifs et accessoires.
6. Employer `clearly different haircut and hair silhouette` plutôt que le seul
   mot `hairstyle`, qui avait surtout changé la couleur des cheveux.
7. Pour une correction locale, renvoyer le résultat concerné et demander de
   changer uniquement la propriété visée. Cette méthode a conservé les traits
   de 9/10 lors de l'assombrissement de sa peau et ceux de 10/10 lors du
   remplacement de sa coupe par une longue tresse.
8. Conserver un fond chroma vert uniforme. Le détourage doit intervenir après
   validation, et hors runtime.

Limite vérifiée : l'outil ImageGen accepte au maximum cinq images de référence.
Pour continuer à exclure tout le corpus, les personnages 2 à 6 ont été réunis
dans la planche temporaire :

`tmp/imagegen/approved-male-novices-02-to-06.png`

Les personnages validés plus récents ont ensuite été ajoutés individuellement,
dans la limite restante.

## Prompt de base efficace

```text
Image 1 is the strict reference for proportions, pose, framing, character scale, pixel-art style and lighting.

The other images contain all already approved characters. Create one new young adult male Novice who is clearly different from every approved character.

Give this character a clearly different face shape, skin tone, haircut, hair silhouette, coherent outfit palette, tunic construction and accessory design. Do not reuse approved faces, haircuts, clothing motifs or accessories.

Keep exactly the style, anatomy and vertical full-character framing of Image 1. Keep the clothing and accessories within the same grounded Novice style, without cultural costume stereotypes.

Bare hands. Solid chroma-green background. No text or scenery.
```

Ajouter seulement la caractéristique ciblée pour le personnage courant. Éviter
de surcharger le prompt avec une description générale déjà portée par V8.

## Sélection validée 1/10 à 10/10

Les dix fichiers stables sont rangés dans :

`assets/design/hero-sprites/cdi-136/validated-male-v1/`

Les neuf copies issues d'ImageGen ont été comparées à leurs sources du cache,
et le crop 1/10 à sa source de travail : les dix SHA-256 correspondent. Les
fichiers sont donc archivés sans transformation ni perte. Ils restent sur fond
vert et ne sont pas encore détourés.

| Index | Fichier stable et provenance | Choix visuels validés |
| --- | --- | --- |
| 1/10 | `novice-male-01-v1.png`; crop du premier personnage V8 | Peau claire, cheveux bruns hérissés, tunique et capuche olive, besace; étalon exact de proportions et de rendu. |
| 2/10 | `novice-male-02-v1.png`; `exec-5c10e9b5-21f9-40cf-b9e8-66ac1c70a7cf.png` | Peau brune chaude, cheveux bruns hérissés, tunique ivoire, cape rouge, broche ronde et besace. |
| 3/10 | `novice-male-03-v1.png`; `exec-38932e27-a0c3-4781-b5d6-83b284a48675.png` | Peau chaude intermédiaire, cheveux bruns longs attachés en queue basse, tunique à capuche olive et sous-tunique claire. |
| 4/10 | `novice-male-04-v1.png`; `exec-d29e24ab-fae2-4001-9eb0-ab098d0ee951.png` | Peau brune foncée, coupe très courte texturée, châle bleu, tunique ivoire à ornements bleus et besace. |
| 5/10 | `novice-male-05-v1.png`; `exec-95b46651-9cf4-408e-b869-58b035a59e96.png` | Apparence nordique, peau claire, cheveux blonds, yeux bleus, tunique à capuche bleu-gris et ornements clairs. Les motifs restent proches de 4/10, écart remarqué mais personnage validé. |
| 6/10 | `novice-male-06-v1.png`; `exec-37558f1d-f5d8-4fc1-93a2-783be75e7763.png` | Apparence est-asiatique, teint clair à moyen, cheveux noirs attachés haut, tunique ivoire plus sobre, fermetures à brandebourgs et châle brun. |
| 7/10 | `novice-male-07-v1.png`; `exec-250b54e4-bf41-4ae7-850e-cb74944c4e3a.png` | Apparence irlandaise, peau claire avec taches de rousseur, cheveux roux, tunique rouille et châle olive. Export paysage 1788 × 880 à recadrer et normaliser. |
| 8/10 | `novice-male-08-v1.png`; `exec-cf6e9220-e040-4f85-9793-ff602ef5bbbd.png` | Apparence nord-africaine/maghrébine, peau olive à mate, cheveux noirs bouclés, tunique ivoire à motifs ocre, châle moutarde et besace. |
| 9/10 | `novice-male-09-v1.png`; `exec-eee79c05-7ff9-4ba5-b131-6ec0048a9959.png` | Apparence indienne/sud-asiatique, peau brune plus foncée au sous-ton chaud rouge, coupe asymétrique rasée sur le côté avec dessus long et ondulé, châle bleu et tunique ivoire. |
| 10/10 | `novice-male-10-v1.png`; `exec-11f3a12c-ddf4-4659-9a3d-b84a2c598359.png` | Apparence chinoise, teint clair à moyen, longs cheveux noirs réunis en une seule longue tresse, châle olive, tunique ivoire/olive, broche spiralée et cordon. |

Tous ces choix ont été explicitement validés visuellement par l'utilisateur.

## Résultats à ne pas substituer aux validations

- 3/10, essai antérieur `exec-55515831-5126-41d8-b800-c0835f3cf7ae.png` :
  trop proche de 2/10; rejeté.
- 9/10, essai `exec-68a08a5f-ef8b-407d-aea8-81948d01c9f1.png` :
  traits appréciés, mais peau jugée trop claire; remplacé par la version validée.
- 10/10, essai `exec-2c4e55c9-15a3-4d78-9439-428d6414ae1c.png` :
  remplacé par la version validée à longue tresse.
- Les anciennes planches complètes et générations par rangée présentes dans
  `assets/design/hero-sprites/cdi-136/` ne constituent pas cette sélection.

## Reprise et critères de clôture

1. Détourer le vert hors runtime, puis vérifier alpha réel, franges vertes,
   ombres, éléments isolés et trous dans le personnage sur fonds clair et
   sombre.
2. Normaliser sans déformer les dix personnages : hauteur alpha visible, ligne
   des pieds et pivot identiques. Le cadrage paysage de 7/10 exige une attention
   particulière.
3. Assembler une planche masculine 5 × 2 seulement après cette normalisation.
4. Clarifier puis tracer la portée féminine et mettre CDI-136 en cohérence avec
   la réduction de la série masculine à dix personnages.
5. Brancher la ressource uniquement après validation utilisateur de la planche
   détourée et de son rendu dans les pages concernées.
