# F09 — prompt v1

## Références transmises

1. `assets/design/hero-sprites/cdi-137/validated-female-v1/warrior-female-09-v1.png`
   — autorité exclusive pour l'identité, la tenue, la palette et les
   proportions de F09.
2. `assets/design/hero-sprites/cdi-149/references/f09/morgan-fiore-overhead-guard-m383-12r.jpg`
   — structure de la garde haute à deux mains, appuis et engagement du corps ;
   ne pas copier le visage, le vêtement, la couronne, le texte ou le parchemin.
3. `assets/design/hero-sprites/cdi-149/references/f09/met-two-handed-sword-2023.580.1.jpg`
   — autorité géométrique pour une épée droite à deux tranchants : pointe,
   lame, croix, poignée à deux mains et pommeau ; traduire la corrosion en acier
   fantasy entretenu.
4. `assets/design/hero-sprites/cdi-149/validated-male-v1/warrior-male-06-combat-idle-v1.png`
   — autorité de style CDI-149 pour le rendu peint de l'arme et le cadrage
   large ; ne reprendre ni le personnage, ni la tenue, ni la lame courbe, ni la
   pose exacte.

## Contraintes déterminantes

- recréer depuis zéro l'identité F09 exacte : visage, peau, très longs cheveux
  noirs, tenue vert sauge, plaques d'acier, pantalon et bottes inchangés ;
- expression sérieuse et concentrée, bouche fermée, regard fixé sur
  l'adversaire ;
- exactement une épée à deux mains droite, de taille crédible et maniable :
  longue lame à deux tranchants, pointe nette, croix simple, poignée assez
  longue pour deux mains et pommeau ; pas de lame courbe, pas de buster sword,
  pas d'épée plus large que le torse ;
- garde haute prête au combat, pas une attaque déjà partie : deux mains sur la
  poignée près d'une épaule, poignets neutres, coudes fléchis, lame diagonale
  dirigée vers le haut et l'extérieur avec un espace net devant le visage et
  les cheveux ;
- les deux mains suivent le même axe de poignée ; la croix est perpendiculaire
  à la lame ; la lame reste parfaitement droite de la garde à la pointe ;
- pieds décalés, genoux souples, bassin stable, poids équilibré et silhouette
  compacte de combattante aguerrie ;
- rendu de l'épée dans le langage CDI-149 : acier dessiné et facetté, tranchants
  clairs, contours sombres, reflets chauds cohérents avec l'armure ; aucune
  corrosion photographique ;
- cadre suffisamment large pour montrer la pointe, le pommeau, tout le corps et
  les deux bottes sans courber, raccourcir ou replier la lame ;
- fond transparent ; proportions conformes au neutre F09 et aux Mages F06/F08 ;
- exclure arme supplémentaire, bouclier, fourreau tenu en main, couronne,
  sourire, attaque en cours, lame tordue, poignée cassée, mains fusionnées,
  texte, parchemin, décor, sol, logo et filigrane.

## Résultat et contrôle

- Candidat : `exec-4d5ed7f7-5e4c-4d4e-aa20-ee102de0bfa6.png`.
- Dimensions : `1 024 × 1 536 px`.
- Poids : `1 791 538 octets`, `1 791,538 Ko`, `1,791538 Mo`.
- SHA-256 :
  `2994142e7097f324ed90af744f75b4b992161c9cb4f07b8ff3745cc8aef4ff47`.
- Contrôle de proportions : `.tmp/cdi149-f09-v1-proportion-check.png`.
- Contrôle de l'arme et de la jonction :
  `.tmp/cdi149-f09-v1-weapon-reference-check.png`.
- Verdict structurel et technique : recevable ; proportions compatibles, lame
  droite et entière, pointe nette, croix perpendiculaire, deux mains sur le
  même axe de poignée et garde haute stable.
- Fond : halo brun semi-transparent à nettoyer pendant la normalisation ; aucun
  pixel visible sur les quatre bords et aucun équipement rogné.
- Verdict utilisateur : validé le 20 septembre 2026.
- Source validée archivée :
  `validated-female-v1/warrior-female-09-combat-idle-v1.png`.
- L'empreinte de l'archive est identique à celle du candidat ; la normalisation
  du halo reste différée avec celle de la planche complète.
